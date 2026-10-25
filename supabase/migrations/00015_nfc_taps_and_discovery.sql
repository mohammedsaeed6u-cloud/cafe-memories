-- ===========================================================================
-- 00015 — NFC readers, verified taps, merchant insights, and discovery.
--
-- A passive NFC tag cannot sign a request. The security model is therefore:
--
--   * the tag URL carries an unguessable reader id plus a secret that only the
--     printed tag knows; the server stores a SHA-256 hash, never the secret;
--   * the tap still needs a signed customer session (minted on first tap);
--   * the server enforces a per-customer cooldown, per-customer/per-IP
--     velocity, and an active reader + branch + organization;
--   * rotating a reader invalidates every old tag instantly.
--
-- A screenshot of a wallet pass has no reader URL. A shared reader URL is the
-- residual risk; rotation plus velocity limits contain it. This is documented
-- in the dashboard and is the honest limit of a battery-free tag.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Discovery. Branches already carry latitude/longitude; this adds the
--    fields a public directory needs and an explicit opt-in.
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS category text
    CHECK (category IS NULL OR length(category) BETWEEN 2 AND 40),
  ADD COLUMN IF NOT EXISTS is_discoverable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS head_start_stamps integer NOT NULL DEFAULT 0
    CHECK (head_start_stamps BETWEEN 0 AND 10);

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS is_discoverable boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS description text
    CHECK (description IS NULL OR length(description) <= 240),
  ADD COLUMN IF NOT EXISTS phone text
    CHECK (phone IS NULL OR length(phone) <= 24),
  ADD COLUMN IF NOT EXISTS opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(opening_hours) = 'object'),
  ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS branches_geo_idx
  ON public.branches(latitude, longitude)
  WHERE status = 'active' AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Readers. `secret_hash` is sha256(secret) as lowercase hex. The secret is
--    returned exactly once, when the reader is created or rotated.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nfc_readers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (length(label) BETWEEN 2 AND 60),
  public_id text NOT NULL UNIQUE CHECK (public_id ~ '^[a-z0-9]{12,32}$'),
  secret_hash text NOT NULL CHECK (secret_hash ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'retired')),
  last_tap_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nfc_readers_org_idx
  ON public.nfc_readers(organization_id, branch_id, status);
ALTER TABLE public.nfc_readers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.nfc_readers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfc_readers TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Tap events. One row per tap, including rejected ones, so the dashboard
--    can show attempts without pretending they were stamps.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tap_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  reader_id uuid NOT NULL REFERENCES public.nfc_readers(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  visit_id uuid REFERENCES public.visits(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('earn', 'redeem', 'noop', 'rejected')),
  status text NOT NULL CHECK (status IN ('ok', 'cooldown', 'velocity', 'invalid', 'nothing_to_redeem')),
  stamps_awarded integer NOT NULL DEFAULT 0 CHECK (stamps_awarded BETWEEN 0 AND 50),
  multiplier integer NOT NULL DEFAULT 1 CHECK (multiplier BETWEEN 1 AND 5),
  promotion_id uuid REFERENCES public.stamp_promotions(id) ON DELETE SET NULL,
  reward_kind text CHECK (reward_kind IS NULL OR reward_kind IN ('card', 'voucher')),
  reward_id uuid,
  idempotency_key text NOT NULL,
  ip_hash text,
  user_agent_hash text,
  result jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(result) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reader_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS tap_events_org_created_idx
  ON public.tap_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tap_events_customer_created_idx
  ON public.tap_events(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tap_events_receipt_idx
  ON public.tap_events(id, customer_id);
ALTER TABLE public.tap_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tap_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tap_events TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Record a tap: verify the reader, apply cooldown/velocity, write the visit,
--    the stamps (including head start and promotion), and the receipt.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_nfc_tap(
  p_reader_public_id text,
  p_reader_secret_hash text,
  p_customer_id uuid,
  p_idempotency_key text,
  p_ip_hash text DEFAULT NULL,
  p_user_agent_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reader public.nfc_readers%ROWTYPE;
  v_branch public.branches%ROWTYPE;
  v_org public.organizations%ROWTYPE;
  v_customer public.customers%ROWTYPE;
  v_tap public.tap_events%ROWTYPE;
  v_visit public.visits%ROWTYPE;
  v_last timestamptz;
  v_recent integer;
  v_ip_recent integer;
  v_promotion jsonb;
  v_multiplier integer := 1;
  v_head_start integer := 0;
  v_ordinal integer;
  v_result jsonb;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Tap recording is server-only' USING ERRCODE = '42501';
  END IF;
  IF p_reader_public_id IS NULL OR p_reader_secret_hash IS NULL
    OR p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 THEN
    RAISE EXCEPTION 'Invalid tap request' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_reader FROM public.nfc_readers
  WHERE public_id = p_reader_public_id;
  IF v_reader.id IS NULL OR v_reader.status <> 'active'
    OR v_reader.secret_hash <> p_reader_secret_hash THEN
    RAISE EXCEPTION 'Reader not available' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_branch FROM public.branches
  WHERE id = v_reader.branch_id AND organization_id = v_reader.organization_id
    AND status = 'active';
  SELECT * INTO v_org FROM public.organizations
  WHERE id = v_reader.organization_id AND status = 'active';
  IF v_branch.id IS NULL OR v_org.id IS NULL THEN
    RAISE EXCEPTION 'Reader not available' USING ERRCODE = '42501';
  END IF;

  -- Replay: return the original receipt, never award twice.
  SELECT * INTO v_tap FROM public.tap_events
  WHERE reader_id = v_reader.id AND idempotency_key = p_idempotency_key;
  IF v_tap.id IS NOT NULL THEN
    RETURN v_tap.result || pg_catalog.jsonb_build_object(
      'replayed', true, 'tapId', v_tap.id, 'status', v_tap.status
    );
  END IF;

  SELECT * INTO v_customer FROM public.customers
  WHERE id = p_customer_id AND deleted_at IS NULL;
  IF v_customer.id IS NULL
    OR (v_customer.organization_id IS NOT NULL
        AND v_customer.organization_id <> v_org.id) THEN
    RAISE EXCEPTION 'Customer not available' USING ERRCODE = '22023';
  END IF;

  UPDATE public.customers
  SET organization_id = v_org.id, last_seen_at = now()
  WHERE id = v_customer.id AND organization_id IS NULL;

  -- Serialize all tap writes for this customer across branches.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_customer.id::text || v_org.id::text || 'tap', 0)
  );

  SELECT max(created_at) INTO v_last
  FROM public.visits
  WHERE customer_id = v_customer.id AND branch_id = v_branch.id
    AND verification_status = 'verified';

  IF v_last IS NOT NULL AND v_last > now() - interval '60 minutes' THEN
    v_result := pg_catalog.jsonb_build_object(
      'status', 'cooldown',
      'stampsAwarded', 0,
      'multiplier', 1,
      'nextTapAt', v_last + interval '60 minutes',
      'message', 'A stamp was already collected here in the last hour'
    );
    INSERT INTO public.tap_events(
      organization_id, branch_id, reader_id, customer_id, kind, status,
      idempotency_key, ip_hash, user_agent_hash, result
    ) VALUES (
      v_org.id, v_branch.id, v_reader.id, v_customer.id, 'noop', 'cooldown',
      p_idempotency_key, p_ip_hash, p_user_agent_hash, v_result
    ) RETURNING * INTO v_tap;
    RETURN v_result || pg_catalog.jsonb_build_object('tapId', v_tap.id);
  END IF;

  -- Per-customer and per-IP velocity. A queue is not fraud.
  SELECT count(*) INTO v_recent
  FROM public.tap_events
  WHERE customer_id = v_customer.id AND kind = 'earn' AND status = 'ok'
    AND created_at > now() - interval '10 minutes';
  SELECT count(*) INTO v_ip_recent
  FROM public.tap_events
  WHERE ip_hash IS NOT NULL AND ip_hash = p_ip_hash
    AND kind = 'earn' AND status = 'ok'
    AND created_at > now() - interval '10 minutes';

  IF v_recent >= 3 OR v_ip_recent >= 15 THEN
    v_result := pg_catalog.jsonb_build_object(
      'status', 'velocity',
      'stampsAwarded', 0,
      'multiplier', 1,
      'message', 'Too many taps in a short window'
    );
    INSERT INTO public.tap_events(
      organization_id, branch_id, reader_id, customer_id, kind, status,
      idempotency_key, ip_hash, user_agent_hash, result
    ) VALUES (
      v_org.id, v_branch.id, v_reader.id, v_customer.id, 'rejected', 'velocity',
      p_idempotency_key, p_ip_hash, p_user_agent_hash, v_result
    ) RETURNING * INTO v_tap;
    RETURN v_result || pg_catalog.jsonb_build_object('tapId', v_tap.id);
  END IF;

  v_promotion := public.active_stamp_multiplier(v_org.id, v_branch.id, now());
  IF v_promotion IS NOT NULL THEN
    v_multiplier := greatest(1, least(5, (v_promotion->>'multiplier')::integer));
  END IF;

  PERFORM pg_catalog.set_config('stampy.defer_stamp_allocation', 'on', true);

  -- Head start is a one-time opening balance for a customer's first tap here.
  IF v_org.head_start_stamps > 0 AND NOT EXISTS (
    SELECT 1 FROM public.stamp_ledger
    WHERE customer_id = v_customer.id AND organization_id = v_org.id
  ) THEN
    v_head_start := v_org.head_start_stamps;
    FOR v_ordinal IN 1..v_head_start LOOP
      INSERT INTO public.stamp_ledger(
        customer_id, organization_id, branch_id, kind, ordinal, created_at
      ) VALUES (
        v_customer.id, v_org.id, v_branch.id, 'head_start', v_ordinal, now()
      );
    END LOOP;
  END IF;

  INSERT INTO public.visits(
    customer_id, organization_id, branch_id, source, verification_status,
    verified_at, ip_hash, idempotency_key
  ) VALUES (
    v_customer.id, v_org.id, v_branch.id, 'counter', 'verified',
    now(), p_ip_hash, p_idempotency_key::uuid
  )
  RETURNING * INTO v_visit;

  FOR v_ordinal IN 1..v_multiplier LOOP
    INSERT INTO public.stamp_ledger(
      customer_id, organization_id, branch_id, visit_id, promotion_id,
      kind, ordinal, created_at
    ) VALUES (
      v_customer.id, v_org.id, v_branch.id, v_visit.id,
      CASE WHEN v_ordinal = 1 THEN NULL ELSE (v_promotion->>'id')::uuid END,
      CASE WHEN v_ordinal = 1 THEN 'visit' ELSE 'promotion_bonus' END,
      v_ordinal, v_visit.verified_at
    );
  END LOOP;

  PERFORM pg_catalog.set_config('stampy.defer_stamp_allocation', 'off', true);
  PERFORM public.ensure_keepsake_cards(v_customer.id, v_org.id);
  PERFORM public.grant_ladder_milestones(v_customer.id, v_org.id, v_branch.id);

  v_result := pg_catalog.jsonb_build_object(
    'status', 'ok',
    'visitId', v_visit.id,
    'stampsAwarded', v_multiplier,
    'multiplier', v_multiplier,
    'headStart', v_head_start,
    'promotion', v_promotion,
    'venue', pg_catalog.jsonb_build_object(
      'slug', v_org.slug, 'name', v_org.name,
      'branchSlug', v_branch.slug, 'branchName', v_branch.name
    ),
    'tappedAt', now()
  );

  INSERT INTO public.tap_events(
    organization_id, branch_id, reader_id, customer_id, visit_id, kind, status,
    stamps_awarded, multiplier, promotion_id, idempotency_key,
    ip_hash, user_agent_hash, result
  ) VALUES (
    v_org.id, v_branch.id, v_reader.id, v_customer.id, v_visit.id, 'earn', 'ok',
    v_multiplier, v_multiplier, (v_promotion->>'id')::uuid, p_idempotency_key,
    p_ip_hash, p_user_agent_hash, v_result
  ) RETURNING * INTO v_tap;

  UPDATE public.nfc_readers
  SET last_tap_at = now(), updated_at = now()
  WHERE id = v_reader.id;

  RETURN v_result || pg_catalog.jsonb_build_object('tapId', v_tap.id, 'replayed', false);
END;
$$;
REVOKE ALL ON FUNCTION public.record_nfc_tap(text, text, uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_nfc_tap(text, text, uuid, text, text, text)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Redeem at the reader: no staff PIN, no code. The reader secret and the
--    signed customer session are the proof; the reward row is locked.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_at_reader(
  p_reader_public_id text,
  p_reader_secret_hash text,
  p_customer_id uuid,
  p_reward_kind text,
  p_reward_id uuid,
  p_idempotency_key text,
  p_ip_hash text DEFAULT NULL,
  p_user_agent_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reader public.nfc_readers%ROWTYPE;
  v_org public.organizations%ROWTYPE;
  v_branch public.branches%ROWTYPE;
  v_tap public.tap_events%ROWTYPE;
  v_card public.keepsake_cards%ROWTYPE;
  v_voucher public.vouchers%ROWTYPE;
  v_rule public.reward_rules%ROWTYPE;
  v_event public.reward_events%ROWTYPE;
  v_result jsonb;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Redemption is server-only' USING ERRCODE = '42501';
  END IF;
  IF p_reward_kind NOT IN ('card', 'voucher') OR p_reward_id IS NULL
    OR p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 THEN
    RAISE EXCEPTION 'Invalid redemption request' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_reader FROM public.nfc_readers
  WHERE public_id = p_reader_public_id;
  IF v_reader.id IS NULL OR v_reader.status <> 'active'
    OR v_reader.secret_hash <> p_reader_secret_hash THEN
    RAISE EXCEPTION 'Reader not available' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_org FROM public.organizations
  WHERE id = v_reader.organization_id AND status = 'active';
  SELECT * INTO v_branch FROM public.branches
  WHERE id = v_reader.branch_id AND organization_id = v_org.id AND status = 'active';
  IF v_org.id IS NULL OR v_branch.id IS NULL THEN
    RAISE EXCEPTION 'Reader not available' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_tap FROM public.tap_events
  WHERE reader_id = v_reader.id AND idempotency_key = p_idempotency_key;
  IF v_tap.id IS NOT NULL THEN
    RETURN v_tap.result || pg_catalog.jsonb_build_object(
      'replayed', true, 'tapId', v_tap.id, 'status', v_tap.status
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = p_customer_id AND organization_id = v_org.id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Customer not available' USING ERRCODE = '22023';
  END IF;

  IF p_reward_kind = 'card' THEN
    SELECT * INTO v_card FROM public.keepsake_cards
    WHERE id = p_reward_id AND customer_id = p_customer_id
      AND organization_id = v_org.id
    FOR UPDATE;
    IF v_card.id IS NULL OR v_card.redeemed_at IS NOT NULL THEN
      v_result := pg_catalog.jsonb_build_object(
        'status', 'nothing_to_redeem', 'message', 'This reward is not available'
      );
      INSERT INTO public.tap_events(
        organization_id, branch_id, reader_id, customer_id, kind, status,
        reward_kind, reward_id, idempotency_key, ip_hash, user_agent_hash, result
      ) VALUES (
        v_org.id, v_branch.id, v_reader.id, p_customer_id, 'rejected',
        'nothing_to_redeem', p_reward_kind, p_reward_id, p_idempotency_key,
        p_ip_hash, p_user_agent_hash, v_result
      ) RETURNING * INTO v_tap;
      RETURN v_result || pg_catalog.jsonb_build_object('tapId', v_tap.id);
    END IF;

    SELECT * INTO v_rule FROM public.reward_rules
    WHERE id = v_card.reward_rule_id;
    IF v_rule.id IS NULL THEN
      SELECT * INTO v_rule FROM public.reward_rules
      WHERE organization_id = v_org.id AND trigger_type = 'visit_count' AND is_active
      ORDER BY created_at LIMIT 1;
    END IF;

    INSERT INTO public.reward_events(
      customer_id, organization_id, branch_id, type, value,
      reference_type, reference_id, idempotency_key
    ) VALUES (
      p_customer_id, v_org.id, v_branch.id, 'reward_redeemed', 1,
      'reward_rules', v_rule.id, p_idempotency_key
    ) RETURNING * INTO v_event;

    UPDATE public.keepsake_cards
    SET redeemed_at = v_event.created_at, redemption_event_id = v_event.id
    WHERE id = v_card.id;

    v_result := pg_catalog.jsonb_build_object(
      'status', 'ok',
      'rewardKind', 'card',
      'rewardId', v_card.id,
      'rewardName', v_card.reward_name,
      'rewardEventId', v_event.id,
      'redeemedAt', v_event.created_at,
      'venue', pg_catalog.jsonb_build_object(
        'slug', v_org.slug, 'name', v_org.name,
        'branchName', v_branch.name
      )
    );
  ELSE
    SELECT * INTO v_voucher FROM public.vouchers
    WHERE id = p_reward_id AND customer_id = p_customer_id
      AND organization_id = v_org.id
    FOR UPDATE;
    IF v_voucher.id IS NULL OR v_voucher.status <> 'issued'
      OR (v_voucher.expires_at IS NOT NULL AND v_voucher.expires_at <= now()) THEN
      v_result := pg_catalog.jsonb_build_object(
        'status', 'nothing_to_redeem', 'message', 'This voucher is not available'
      );
      INSERT INTO public.tap_events(
        organization_id, branch_id, reader_id, customer_id, kind, status,
        reward_kind, reward_id, idempotency_key, ip_hash, user_agent_hash, result
      ) VALUES (
        v_org.id, v_branch.id, v_reader.id, p_customer_id, 'rejected',
        'nothing_to_redeem', p_reward_kind, p_reward_id, p_idempotency_key,
        p_ip_hash, p_user_agent_hash, v_result
      ) RETURNING * INTO v_tap;
      RETURN v_result || pg_catalog.jsonb_build_object('tapId', v_tap.id);
    END IF;

    UPDATE public.vouchers
    SET status = 'redeemed', redeemed_at = now()
    WHERE id = v_voucher.id
    RETURNING * INTO v_voucher;

    v_result := pg_catalog.jsonb_build_object(
      'status', 'ok',
      'rewardKind', 'voucher',
      'rewardId', v_voucher.id,
      'rewardName', v_voucher.title,
      'code', v_voucher.code,
      'redeemedAt', v_voucher.redeemed_at,
      'venue', pg_catalog.jsonb_build_object(
        'slug', v_org.slug, 'name', v_org.name,
        'branchName', v_branch.name
      )
    );
  END IF;

  INSERT INTO public.tap_events(
    organization_id, branch_id, reader_id, customer_id, kind, status,
    reward_kind, reward_id, idempotency_key, ip_hash, user_agent_hash, result
  ) VALUES (
    v_org.id, v_branch.id, v_reader.id, p_customer_id, 'redeem', 'ok',
    p_reward_kind, p_reward_id, p_idempotency_key,
    p_ip_hash, p_user_agent_hash, v_result
  ) RETURNING * INTO v_tap;

  UPDATE public.nfc_readers
  SET last_tap_at = now(), updated_at = now()
  WHERE id = v_reader.id;

  RETURN v_result || pg_catalog.jsonb_build_object('tapId', v_tap.id, 'replayed', false);
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_at_reader(text, text, uuid, text, uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_at_reader(text, text, uuid, text, uuid, text, text, text)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Merchant insights: one round trip for the whole dashboard.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merchant_insights(
  p_organization_id uuid,
  p_branch_id uuid DEFAULT NULL,
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_days integer := greatest(1, least(365, coalesce(p_days, 30)));
  v_timezone text;
  v_now timestamptz := now();
  v_start timestamptz;
  v_prev_start timestamptz;
  v_current jsonb;
  v_previous jsonb;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501';
  END IF;

  SELECT timezone INTO v_timezone
  FROM public.organizations
  WHERE id = p_organization_id AND status = 'active';
  IF v_timezone IS NULL THEN
    RAISE EXCEPTION 'Organization not available' USING ERRCODE = '22023';
  END IF;
  IF p_branch_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.branches
    WHERE id = p_branch_id AND organization_id = p_organization_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Branch not available' USING ERRCODE = '22023';
  END IF;

  v_start := v_now - pg_catalog.make_interval(days => v_days);
  v_prev_start := v_now - pg_catalog.make_interval(days => v_days * 2);

  WITH scoped AS (
    SELECT v.* FROM public.visits v
    WHERE v.organization_id = p_organization_id
      AND (p_branch_id IS NULL OR v.branch_id = p_branch_id)
      AND v.verification_status = 'verified'
      AND v.verified_at >= v_start
  ), metrics AS (
    SELECT
      (SELECT count(*) FROM public.tap_events t
       WHERE t.organization_id = p_organization_id
         AND (p_branch_id IS NULL OR t.branch_id = p_branch_id)
         AND t.kind = 'earn' AND t.status = 'ok'
         AND t.created_at >= v_start) AS taps,
      (SELECT count(*) FROM scoped) AS visits,
      (SELECT count(*) FROM public.stamp_ledger l
       WHERE l.organization_id = p_organization_id
         AND (p_branch_id IS NULL OR l.branch_id = p_branch_id)
         AND l.created_at >= v_start) AS stamps,
      (SELECT count(DISTINCT customer_id) FROM scoped) AS customers,
      (SELECT count(*) FROM public.keepsake_cards c
       WHERE c.organization_id = p_organization_id
         AND (p_branch_id IS NULL OR EXISTS (
           SELECT 1 FROM public.visits v WHERE v.id = ANY(c.visit_ids)
             AND v.branch_id = p_branch_id))
         AND c.redeemed_at >= v_start) AS rewards_claimed,
      (SELECT count(*) FROM public.vouchers vc
       WHERE vc.organization_id = p_organization_id
         AND (p_branch_id IS NULL OR vc.branch_id = p_branch_id)
         AND vc.redeemed_at >= v_start) AS vouchers_redeemed
  )
  SELECT pg_catalog.jsonb_build_object(
    'taps', taps,
    'visits', visits,
    'stamps', stamps,
    'customers', customers,
    'newCustomers', (
      SELECT count(DISTINCT s.customer_id) FROM scoped s
      WHERE NOT EXISTS (
        SELECT 1 FROM public.visits earlier
        WHERE earlier.customer_id = s.customer_id
          AND earlier.organization_id = p_organization_id
          AND earlier.verification_status = 'verified'
          AND earlier.verified_at < v_start
      )
    ),
    'returningCustomers', (
      SELECT count(*) FROM (
        SELECT s.customer_id FROM scoped s
        GROUP BY s.customer_id
        HAVING count(*) >= 2
      ) r
    ),
    'rewardsClaimed', rewards_claimed + vouchers_redeemed,
    'returnRate', CASE WHEN customers = 0 THEN 0 ELSE
      pg_catalog.round(100.0 * (
        SELECT count(*) FROM (
          SELECT s.customer_id FROM scoped s GROUP BY s.customer_id HAVING count(*) >= 2
        ) rr
      ) / customers, 1) END
  ) INTO v_current FROM metrics;

  WITH scoped AS (
    SELECT v.* FROM public.visits v
    WHERE v.organization_id = p_organization_id
      AND (p_branch_id IS NULL OR v.branch_id = p_branch_id)
      AND v.verification_status = 'verified'
      AND v.verified_at >= v_prev_start AND v.verified_at < v_start
  ), metrics AS (
    SELECT
      (SELECT count(*) FROM public.tap_events t
       WHERE t.organization_id = p_organization_id
         AND (p_branch_id IS NULL OR t.branch_id = p_branch_id)
         AND t.kind = 'earn' AND t.status = 'ok'
         AND t.created_at >= v_prev_start AND t.created_at < v_start) AS taps,
      (SELECT count(*) FROM scoped) AS visits,
      (SELECT count(*) FROM public.stamp_ledger l
       WHERE l.organization_id = p_organization_id
         AND (p_branch_id IS NULL OR l.branch_id = p_branch_id)
         AND l.created_at >= v_prev_start AND l.created_at < v_start) AS stamps,
      (SELECT count(DISTINCT customer_id) FROM scoped) AS customers,
      (SELECT count(*) FROM public.keepsake_cards c
       WHERE c.organization_id = p_organization_id
         AND c.redeemed_at >= v_prev_start AND c.redeemed_at < v_start) AS rewards_claimed,
      (SELECT count(*) FROM public.vouchers vc
       WHERE vc.organization_id = p_organization_id
         AND (p_branch_id IS NULL OR vc.branch_id = p_branch_id)
         AND vc.redeemed_at >= v_prev_start AND vc.redeemed_at < v_start) AS vouchers_redeemed
  )
  SELECT pg_catalog.jsonb_build_object(
    'taps', taps,
    'visits', visits,
    'stamps', stamps,
    'customers', customers,
    'newCustomers', (
      SELECT count(DISTINCT s.customer_id) FROM scoped s
      WHERE NOT EXISTS (
        SELECT 1 FROM public.visits earlier
        WHERE earlier.customer_id = s.customer_id
          AND earlier.organization_id = p_organization_id
          AND earlier.verification_status = 'verified'
          AND earlier.verified_at < v_prev_start
      )
    ),
    'returningCustomers', (
      SELECT count(*) FROM (
        SELECT s.customer_id FROM scoped s GROUP BY s.customer_id HAVING count(*) >= 2
      ) r
    ),
    'rewardsClaimed', rewards_claimed + vouchers_redeemed,
    'returnRate', CASE WHEN customers = 0 THEN 0 ELSE
      pg_catalog.round(100.0 * (
        SELECT count(*) FROM (
          SELECT s.customer_id FROM scoped s GROUP BY s.customer_id HAVING count(*) >= 2
        ) rr
      ) / customers, 1) END
  ) INTO v_previous FROM metrics;

  RETURN pg_catalog.jsonb_build_object(
    'periodDays', v_days,
    'timezone', v_timezone,
    'current', v_current,
    'previous', v_previous,
    'series', (
      WITH days AS (
        SELECT pg_catalog.generate_series(0, v_days - 1) AS n
      ), buckets AS (
        SELECT
          pg_catalog.date_trunc('day', (v_now AT TIME ZONE v_timezone))::date
            - d.n::integer AS day
        FROM days d
      )
      SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'date', b.day,
        'taps', (
          SELECT count(*) FROM public.tap_events t
          WHERE t.organization_id = p_organization_id
            AND (p_branch_id IS NULL OR t.branch_id = p_branch_id)
            AND t.kind = 'earn' AND t.status = 'ok'
            AND (t.created_at AT TIME ZONE v_timezone)::date = b.day
        ),
        'visits', (
          SELECT count(*) FROM public.visits v
          WHERE v.organization_id = p_organization_id
            AND (p_branch_id IS NULL OR v.branch_id = p_branch_id)
            AND v.verification_status = 'verified'
            AND (v.verified_at AT TIME ZONE v_timezone)::date = b.day
        ),
        'customers', (
          SELECT count(DISTINCT v.customer_id) FROM public.visits v
          WHERE v.organization_id = p_organization_id
            AND (p_branch_id IS NULL OR v.branch_id = p_branch_id)
            AND v.verification_status = 'verified'
            AND (v.verified_at AT TIME ZONE v_timezone)::date = b.day
        )
      ) ORDER BY b.day) FROM buckets b
    ),
    'peakHours', (
      WITH grid AS (
        SELECT d.dow, h.hr
        FROM pg_catalog.generate_series(0, 6) AS d(dow)
        CROSS JOIN pg_catalog.generate_series(0, 23) AS h(hr)
      )
      SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'dow', g.dow,
        'hour', g.hr,
        'count', (
          SELECT count(*) FROM public.visits v
          WHERE v.organization_id = p_organization_id
            AND (p_branch_id IS NULL OR v.branch_id = p_branch_id)
            AND v.verification_status = 'verified'
            AND v.verified_at >= v_start
            AND pg_catalog.date_part('dow', v.verified_at AT TIME ZONE v_timezone)::integer = g.dow
            AND pg_catalog.date_part('hour', v.verified_at AT TIME ZONE v_timezone)::integer = g.hr
        )
      ) ORDER BY g.dow, g.hr) FROM grid g
    ),
    'branches', (
      SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'taps', (
          SELECT count(*) FROM public.tap_events t
          WHERE t.branch_id = b.id AND t.kind = 'earn' AND t.status = 'ok'
            AND t.created_at >= v_start
        ),
        'visits', (
          SELECT count(*) FROM public.visits v
          WHERE v.branch_id = b.id AND v.verification_status = 'verified'
            AND v.verified_at >= v_start
        ),
        'customers', (
          SELECT count(DISTINCT v.customer_id) FROM public.visits v
          WHERE v.branch_id = b.id AND v.verification_status = 'verified'
            AND v.verified_at >= v_start
        ),
        'rewardsClaimed', (
          SELECT count(*) FROM public.reward_events e
          WHERE e.branch_id = b.id AND e.type = 'reward_redeemed'
            AND e.created_at >= v_start
        )
      ) ORDER BY b.created_at) FROM public.branches b
      WHERE b.organization_id = p_organization_id AND b.status = 'active'
    ),
    'topCustomers', (
      SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'id', c.id,
        'name', coalesce(nullif(c.display_name, ''), 'ضيف'),
        'phone', c.phone,
        'stamps', stats.stamps,
        'visits', stats.visits,
        'rewardsClaimed', stats.rewards,
        'lastVisitAt', stats.last_visit
      ) ORDER BY stats.stamps DESC, stats.last_visit DESC)
      FROM (
        SELECT v.customer_id,
          count(*) AS visits,
          (SELECT count(*) FROM public.stamp_ledger l
           WHERE l.customer_id = v.customer_id
             AND l.organization_id = p_organization_id
             AND l.created_at >= v_start) AS stamps,
          (SELECT count(*) FROM public.reward_events e
           WHERE e.customer_id = v.customer_id
             AND e.organization_id = p_organization_id
             AND e.type = 'reward_redeemed'
             AND e.created_at >= v_start) AS rewards,
          max(v.verified_at) AS last_visit
        FROM public.visits v
        WHERE v.organization_id = p_organization_id
          AND (p_branch_id IS NULL OR v.branch_id = p_branch_id)
          AND v.verification_status = 'verified'
          AND v.verified_at >= v_start
        GROUP BY v.customer_id
        ORDER BY count(*) DESC
        LIMIT 10
      ) stats
      JOIN public.customers c ON c.id = stats.customer_id
    )
  );
END;
$$;
REVOKE ALL ON FUNCTION public.merchant_insights(uuid, uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merchant_insights(uuid, uuid, integer) TO service_role;

-- ---------------------------------------------------------------------------
-- 7. Public discovery. Haversine without PostGIS keeps the free plan simple.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_nearby_venues(
  p_lat double precision DEFAULT NULL,
  p_lng double precision DEFAULT NULL,
  p_radius_km double precision DEFAULT 50,
  p_limit integer DEFAULT 50,
  p_category text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_radius double precision := greatest(1, least(200, coalesce(p_radius_km, 50)));
  v_limit integer := greatest(1, least(100, coalesce(p_limit, 50)));
  v_has_location boolean := p_lat IS NOT NULL AND p_lng IS NOT NULL
    AND p_lat BETWEEN -90 AND 90 AND p_lng BETWEEN -180 AND 180;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'venues', (
      SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'organizationId', x.organization_id,
        'organizationSlug', x.organization_slug,
        'organizationName', x.organization_name,
        'category', x.category,
        'logoUrl', x.logo_url,
        'primaryColor', x.primary_color,
        'tagline', x.tagline,
        'branchId', x.branch_id,
        'branchSlug', x.branch_slug,
        'branchName', x.branch_name,
        'address', x.address,
        'description', x.description,
        'phone', x.phone,
        'latitude', x.latitude,
        'longitude', x.longitude,
        'openingHours', x.opening_hours,
        'amenities', x.amenities,
        'googleMapsUrl', x.google_maps_url,
        'distanceKm', x.distance_km
      ) ORDER BY x.distance_km NULLS LAST, x.organization_name, x.branch_name)
      FROM (
        SELECT
          o.id AS organization_id, o.slug AS organization_slug, o.name AS organization_name,
          o.category, o.logo_url, o.primary_color, o.brand_tagline AS tagline,
          b.id AS branch_id, b.slug AS branch_slug, b.name AS branch_name,
          b.address, b.description, b.phone, b.latitude, b.longitude,
          b.opening_hours, b.amenities, b.google_maps_url,
          CASE WHEN v_has_location AND b.latitude IS NOT NULL AND b.longitude IS NOT NULL
            THEN pg_catalog.round((
              6371.0 * pg_catalog.acos(greatest(-1.0, least(1.0,
                pg_catalog.sin(pg_catalog.radians(p_lat)) * pg_catalog.sin(pg_catalog.radians(b.latitude))
                + pg_catalog.cos(pg_catalog.radians(p_lat)) * pg_catalog.cos(pg_catalog.radians(b.latitude))
                * pg_catalog.cos(pg_catalog.radians(b.longitude - p_lng))
              )))
            )::numeric, 2)
            ELSE NULL END AS distance_km
        FROM public.organizations o
        JOIN public.branches b ON b.organization_id = o.id
        WHERE o.status = 'active' AND o.is_discoverable
          AND b.status = 'active' AND b.is_discoverable
          AND (p_category IS NULL OR o.category = p_category)
      ) x
      WHERE x.distance_km IS NULL OR x.distance_km <= v_radius
      LIMIT v_limit
    ),
    'radiusKm', v_radius,
    'hasLocation', v_has_location
  );
END;
$$;
REVOKE ALL ON FUNCTION public.public_nearby_venues(double precision, double precision, double precision, integer, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_nearby_venues(double precision, double precision, double precision, integer, text)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 8. Wallet nudges: reward ready, almost there, and a monthly win-back.
--    Replaces the claim function to widen the audience allow-list without
--    changing its return shape.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_wallet_campaign_delivery(
  p_campaign uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE(delivery_id uuid, pass_id uuid, token uuid, revision bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_campaign public.campaigns%ROWTYPE;
  v_row record;
  v_token uuid;
  v_delivery uuid;
  v_audience text;
BEGIN
  IF auth.role() <> 'service_role' OR p_campaign IS NULL OR p_limit NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_campaign FROM public.campaigns WHERE id = p_campaign AND status = 'active';
  IF NOT FOUND OR v_campaign.config->>'channel' IS DISTINCT FROM 'wallet'
    OR v_campaign.config->>'audience' NOT IN (
      'all', 'returning', 'inactive30', 'reward_ready', 'almost_there', 'winback'
    )
    OR length(v_campaign.config->>'message') NOT BETWEEN 3 AND 110
    OR NOT EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = v_campaign.organization_id AND o.status = 'active'
    ) THEN
    RAISE EXCEPTION 'Campaign not available' USING ERRCODE = '23514';
  END IF;

  v_audience := v_campaign.config->>'audience';

  FOR v_row IN
    SELECT w.id, w.sync_revision FROM public.wallet_passes w
      JOIN public.customer_wallet_preferences p
        ON p.organization_id = w.organization_id AND p.customer_id = w.customer_id
      JOIN public.wallet_connectors wc ON wc.id = w.connector_id
      JOIN public.customers customer
        ON customer.id = w.customer_id AND customer.deleted_at IS NULL
    WHERE w.organization_id = v_campaign.organization_id AND w.status = 'issued'
      AND w.issued_plan IN ('pro', 'business')
      AND p.wallet_opt_in AND p.marketing_opt_in AND wc.enabled
      AND wc.plan IN ('pro', 'business')
      AND wc.verified_at > now() - interval '24 hours'
      AND (w.sync_token IS NULL OR w.sync_claimed_at < now() - interval '1 minute')
      AND NOT EXISTS (
        SELECT 1 FROM public.wallet_campaign_deliveries d
        WHERE d.campaign_id = p_campaign AND d.wallet_pass_id = w.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.wallet_campaign_deliveries recent
        WHERE recent.wallet_pass_id = w.id
          AND recent.attempted_at > now() - interval '24 hours'
      )
      AND (
        v_audience = 'all'
        OR (v_audience = 'returning' AND (
          SELECT count(*) FROM public.visits v
          WHERE v.organization_id = w.organization_id AND v.customer_id = w.customer_id
            AND v.verification_status = 'verified'
        ) >= 3)
        OR (v_audience = 'inactive30' AND EXISTS (
          SELECT 1 FROM public.visits v
          WHERE v.organization_id = w.organization_id AND v.customer_id = w.customer_id
            AND v.verification_status = 'verified'
          GROUP BY v.customer_id
          HAVING max(v.verified_at) < now() - interval '30 days'
        ))
        OR (v_audience = 'winback' AND EXISTS (
          SELECT 1 FROM public.visits v
          WHERE v.organization_id = w.organization_id AND v.customer_id = w.customer_id
            AND v.verification_status = 'verified'
          GROUP BY v.customer_id
          HAVING max(v.verified_at) BETWEEN now() - interval '60 days'
            AND now() - interval '30 days'
        ))
        OR (v_audience = 'reward_ready' AND EXISTS (
          SELECT 1 FROM public.keepsake_cards c
          WHERE c.organization_id = w.organization_id AND c.customer_id = w.customer_id
            AND c.redeemed_at IS NULL
        ))
        OR (v_audience = 'almost_there' AND (
          SELECT count(*) FROM public.stamp_ledger l
          WHERE l.organization_id = w.organization_id AND l.customer_id = w.customer_id
            AND l.card_id IS NULL
        ) >= (
          SELECT greatest(1, r.threshold - 1) FROM public.reward_rules r
          WHERE r.organization_id = w.organization_id AND r.is_active
            AND r.trigger_type = 'visit_count'
          ORDER BY r.created_at LIMIT 1
        ) AND (
          SELECT count(*) FROM public.stamp_ledger l
          WHERE l.organization_id = w.organization_id AND l.customer_id = w.customer_id
            AND l.card_id IS NULL
        ) < (
          SELECT r.threshold FROM public.reward_rules r
          WHERE r.organization_id = w.organization_id AND r.is_active
            AND r.trigger_type = 'visit_count'
          ORDER BY r.created_at LIMIT 1
        ))
      )
    ORDER BY w.id
    LIMIT p_limit
    FOR UPDATE OF w SKIP LOCKED
  LOOP
    v_token := pg_catalog.gen_random_uuid();
    UPDATE public.wallet_passes
    SET sync_token = v_token, sync_claimed_at = now(), updated_at = now()
    WHERE id = v_row.id;
    INSERT INTO public.wallet_campaign_deliveries(campaign_id, wallet_pass_id, status, sync_token)
    VALUES (p_campaign, v_row.id, 'processing', v_token)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_delivery;
    IF v_delivery IS NOT NULL THEN
      delivery_id := v_delivery; pass_id := v_row.id; token := v_token;
      revision := v_row.sync_revision; RETURN NEXT;
    ELSE
      UPDATE public.wallet_passes
      SET sync_token = NULL, sync_claimed_at = NULL
      WHERE id = v_row.id;
    END IF;
    v_delivery := NULL;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_wallet_campaign_delivery(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_wallet_campaign_delivery(uuid, integer)
  TO service_role;
