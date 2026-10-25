-- ===========================================================================
-- 00014 — Stamp ledger, stamp promotions, and reward ladders.
--
-- The first loyalty model treated one verified visit as one stamp and stored
-- the visits directly on `keepsake_cards.visit_ids`. That cannot express a ×2
-- promotion, a head start, or several rewards on one card without lying about
-- how many visits happened. This migration introduces an append-only stamp
-- ledger:
--
--   verified visit ──▶ stamp_ledger rows ──▶ keepsake_cards (one per cycle)
--
-- Each ledger row is exactly one stamp. A promotion writes extra rows, a head
-- start writes opening rows, and a card consumes `threshold` rows atomically.
-- Visits stay the audit trail of what happened at the counter; stamps are the
-- loyalty currency. The two are related but no longer the same number.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Stamp promotions. A merchant can double or triple stamps for a window,
--    optionally limited to certain weekdays and hours in the venue timezone.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stamp_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 80),
  description text CHECK (description IS NULL OR length(description) <= 240),
  multiplier integer NOT NULL CHECK (multiplier BETWEEN 2 AND 5),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  days_of_week smallint[] CHECK (
    days_of_week IS NULL OR (
      array_length(days_of_week, 1) BETWEEN 1 AND 7
      AND days_of_week <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[]
    )
  ),
  start_hour smallint CHECK (start_hour IS NULL OR start_hour BETWEEN 0 AND 23),
  end_hour smallint CHECK (end_hour IS NULL OR end_hour BETWEEN 0 AND 24),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stamp_promotion_window CHECK (ends_at > starts_at),
  CONSTRAINT stamp_promotion_hours CHECK (
    start_hour IS NULL OR end_hour IS NULL OR start_hour <> end_hour
  )
);
CREATE INDEX IF NOT EXISTS stamp_promotions_active_idx
  ON public.stamp_promotions(organization_id, branch_id, starts_at, ends_at)
  WHERE is_active;
ALTER TABLE public.stamp_promotions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stamp_promotions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stamp_promotions TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Reward ladder. Several rewards on one card. Exactly one tier is the card
--    reward (the cycle target); every lower tier is a voucher that can be
--    claimed without resetting the card.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_ladder_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  threshold integer NOT NULL CHECK (threshold BETWEEN 2 AND 30),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 120),
  description text CHECK (description IS NULL OR length(description) <= 240),
  reward_kind text NOT NULL DEFAULT 'voucher'
    CHECK (reward_kind IN ('voucher', 'card')),
  voucher_valid_days integer NOT NULL DEFAULT 30
    CHECK (voucher_valid_days BETWEEN 1 AND 365),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, threshold)
);
CREATE UNIQUE INDEX IF NOT EXISTS reward_ladder_one_card_tier
  ON public.reward_ladder_tiers(organization_id)
  WHERE reward_kind = 'card';
ALTER TABLE public.reward_ladder_tiers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reward_ladder_tiers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reward_ladder_tiers TO service_role;

-- Vouchers become the artefact for ladder milestones. `source_ref` points at
-- the tier; `cycle` makes the grant idempotent for the current card.
ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'ladder', 'promotion', 'winback', 'referral')),
  ADD COLUMN IF NOT EXISTS source_ref uuid,
  ADD COLUMN IF NOT EXISTS cycle integer CHECK (cycle IS NULL OR cycle > 0),
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(metadata) = 'object');

CREATE UNIQUE INDEX IF NOT EXISTS vouchers_ladder_cycle_unique
  ON public.vouchers(organization_id, customer_id, source_ref, cycle)
  WHERE source = 'ladder' AND source_ref IS NOT NULL AND customer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. The ledger. One row = one stamp.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stamp_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  visit_id uuid REFERENCES public.visits(id) ON DELETE CASCADE,
  promotion_id uuid REFERENCES public.stamp_promotions(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'visit'
    CHECK (kind IN ('visit', 'promotion_bonus', 'head_start', 'bonus', 'adjustment')),
  ordinal smallint NOT NULL DEFAULT 1 CHECK (ordinal BETWEEN 1 AND 10),
  card_id uuid REFERENCES public.keepsake_cards(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (visit_id, ordinal)
);
CREATE INDEX IF NOT EXISTS stamp_ledger_open_idx
  ON public.stamp_ledger(customer_id, organization_id, created_at, id)
  WHERE card_id IS NULL;
CREATE INDEX IF NOT EXISTS stamp_ledger_org_created_idx
  ON public.stamp_ledger(organization_id, created_at);
ALTER TABLE public.stamp_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stamp_ledger FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stamp_ledger TO service_role;

-- One stamp per historical verified visit. `verified_at` is the moment the
-- stamp was earned, not when the row was migrated.
INSERT INTO public.stamp_ledger(customer_id, organization_id, branch_id, visit_id, kind, created_at)
SELECT v.customer_id, v.organization_id, v.branch_id, v.id, 'visit', v.verified_at
FROM public.visits v
WHERE v.verification_status = 'verified' AND v.verified_at IS NOT NULL
ON CONFLICT (visit_id, ordinal) DO NOTHING;

-- Existing cards already consumed visits. Mark the same number of oldest open
-- stamps as consumed, card by card, so the opening balance is unchanged.
DO $$
DECLARE v_card public.keepsake_cards%ROWTYPE;
BEGIN
  FOR v_card IN
    SELECT * FROM public.keepsake_cards
    ORDER BY customer_id, organization_id, sequence_number
  LOOP
    UPDATE public.stamp_ledger
    SET card_id = v_card.id
    WHERE id IN (
      SELECT id FROM public.stamp_ledger
      WHERE customer_id = v_card.customer_id
        AND organization_id = v_card.organization_id
        AND card_id IS NULL
      ORDER BY created_at, id
      LIMIT v_card.threshold
    );
  END LOOP;
END $$;

-- A card can now be filled by fewer than `threshold` visits (a ×3 promotion
-- contributes three stamps from one visit), or by a head start with no visit.
ALTER TABLE public.keepsake_cards DROP CONSTRAINT IF EXISTS keepsake_visit_count;
ALTER TABLE public.keepsake_cards
  ADD CONSTRAINT keepsake_visit_count CHECK (cardinality(visit_ids) <= threshold);

-- ---------------------------------------------------------------------------
-- 4. The active multiplier for a branch at a moment. Pure read; safe to call
--    from both the tap and the staff-visit path.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.active_stamp_multiplier(
  p_organization_id uuid,
  p_branch_id uuid,
  p_at timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_timezone text;
  v_local timestamp;
  v_dow smallint;
  v_hour smallint;
  v_row public.stamp_promotions%ROWTYPE;
BEGIN
  SELECT timezone INTO v_timezone
  FROM public.organizations
  WHERE id = p_organization_id AND status = 'active';
  IF v_timezone IS NULL THEN RETURN NULL; END IF;

  v_local := p_at AT TIME ZONE v_timezone;
  v_dow := pg_catalog.date_part('dow', v_local)::smallint;
  v_hour := pg_catalog.date_part('hour', v_local)::smallint;

  SELECT * INTO v_row
  FROM public.stamp_promotions p
  WHERE p.organization_id = p_organization_id
    AND (p.branch_id IS NULL OR p.branch_id = p_branch_id)
    AND p.is_active
    AND p.starts_at <= p_at
    AND p.ends_at > p_at
    AND (p.days_of_week IS NULL OR v_dow = ANY(p.days_of_week))
    AND (
      p.start_hour IS NULL OR p.end_hour IS NULL
      OR (p.start_hour < p.end_hour AND v_hour >= p.start_hour AND v_hour < p.end_hour)
      OR (p.start_hour > p.end_hour AND (v_hour >= p.start_hour OR v_hour < p.end_hour))
    )
  ORDER BY p.multiplier DESC, p.created_at DESC
  LIMIT 1;

  IF v_row.id IS NULL THEN RETURN NULL; END IF;

  RETURN pg_catalog.jsonb_build_object(
    'id', v_row.id,
    'title', v_row.title,
    'description', v_row.description,
    'multiplier', v_row.multiplier,
    'endsAt', v_row.ends_at
  );
END;
$$;
REVOKE ALL ON FUNCTION public.active_stamp_multiplier(uuid, uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.active_stamp_multiplier(uuid, uuid, timestamptz) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Grant ladder vouchers for the customer's current card cycle.
--
--    `cycle` is the number of already-completed cards plus one. A voucher is
--    granted once per (customer, tier, cycle). The top "card" tier is not a
--    voucher: it is the keepsake card itself.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_ladder_milestones(
  p_customer_id uuid,
  p_organization_id uuid,
  p_branch_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cycle integer;
  v_open integer;
  v_tier public.reward_ladder_tiers%ROWTYPE;
  v_code text;
  v_granted jsonb := '[]'::jsonb;
  v_voucher public.vouchers%ROWTYPE;
BEGIN
  SELECT count(*) + 1 INTO v_cycle
  FROM public.keepsake_cards
  WHERE customer_id = p_customer_id AND organization_id = p_organization_id;

  SELECT count(*) INTO v_open
  FROM public.stamp_ledger
  WHERE customer_id = p_customer_id
    AND organization_id = p_organization_id
    AND card_id IS NULL;

  FOR v_tier IN
    SELECT * FROM public.reward_ladder_tiers
    WHERE organization_id = p_organization_id
      AND is_active
      AND reward_kind = 'voucher'
      AND threshold <= v_open
    ORDER BY threshold
  LOOP
    v_code := 'LD-' || pg_catalog.upper(pg_catalog.substr(
      pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 10));

    INSERT INTO public.vouchers(
      organization_id, branch_id, customer_id, code, title, description,
      status, expires_at, source, source_ref, cycle, metadata
    ) VALUES (
      p_organization_id, p_branch_id, p_customer_id, v_code, v_tier.title,
      v_tier.description, 'issued',
      now() + pg_catalog.make_interval(days => v_tier.voucher_valid_days),
      'ladder', v_tier.id, v_cycle,
      pg_catalog.jsonb_build_object('threshold', v_tier.threshold)
    )
    ON CONFLICT DO NOTHING
    RETURNING * INTO v_voucher;

    IF v_voucher.id IS NOT NULL THEN
      v_granted := v_granted || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'voucherId', v_voucher.id,
          'code', v_voucher.code,
          'title', v_voucher.title,
          'tierId', v_tier.id,
          'threshold', v_tier.threshold,
          'expiresAt', v_voucher.expires_at
        )
      );
    END IF;
    v_voucher := NULL;
  END LOOP;

  RETURN v_granted;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_ladder_milestones(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_ladder_milestones(uuid, uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Card allocation now consumes ledger rows instead of visits.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_keepsake_cards(
  p_customer_id uuid,
  p_organization_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rule public.reward_rules%ROWTYPE;
  v_stamp_ids uuid[];
  v_visit_ids uuid[];
  v_sequence integer;
  v_card_id uuid;
  v_unlocked_at timestamptz;
BEGIN
  PERFORM 1 FROM public.customers
  WHERE id = p_customer_id AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT * INTO v_rule FROM public.reward_rules
  WHERE organization_id = p_organization_id
    AND is_active
    AND trigger_type = 'visit_count'
    AND threshold BETWEEN 2 AND 30
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  ORDER BY created_at, id
  LIMIT 1;
  IF v_rule.id IS NULL THEN RETURN; END IF;

  LOOP
    SELECT array_agg(id ORDER BY created_at, id) INTO v_stamp_ids
    FROM (
      SELECT id, created_at FROM public.stamp_ledger
      WHERE customer_id = p_customer_id
        AND organization_id = p_organization_id
        AND card_id IS NULL
      ORDER BY created_at, id
      LIMIT v_rule.threshold
    ) open_stamps;

    EXIT WHEN coalesce(cardinality(v_stamp_ids), 0) <> v_rule.threshold;

    SELECT array_agg(DISTINCT visit_id), max(created_at)
    INTO v_visit_ids, v_unlocked_at
    FROM public.stamp_ledger
    WHERE id = ANY(v_stamp_ids) AND visit_id IS NOT NULL;

    v_visit_ids := coalesce(v_visit_ids, ARRAY[]::uuid[]);

    SELECT coalesce(max(sequence_number), 0) + 1 INTO v_sequence
    FROM public.keepsake_cards
    WHERE customer_id = p_customer_id AND organization_id = p_organization_id;

    INSERT INTO public.keepsake_cards(
      customer_id, organization_id, reward_rule_id, reward_name,
      sequence_number, threshold, visit_ids, unlocked_at
    ) VALUES (
      p_customer_id, p_organization_id, v_rule.id, v_rule.name,
      v_sequence, v_rule.threshold, v_visit_ids, coalesce(v_unlocked_at, now())
    )
    RETURNING id INTO v_card_id;

    UPDATE public.stamp_ledger
    SET card_id = v_card_id
    WHERE id = ANY(v_stamp_ids);
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_keepsake_cards(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_keepsake_cards(uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 7. The visit trigger writes one ledger row, then allocates and grants.
--
--    `stampy.defer_stamp_allocation` lets the tap/staff path insert extra
--    promotion rows in the same transaction before a card is built. Without it
--    a ×3 tap at 4/6 would complete the card with one stamp and lose two.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.snapshot_verified_visit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.verification_status = 'verified'
    AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'verified') THEN
    IF coalesce(current_setting('stampy.defer_stamp_allocation', true), 'off') = 'on' THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.stamp_ledger(
      customer_id, organization_id, branch_id, visit_id, kind, created_at
    ) VALUES (
      NEW.customer_id, NEW.organization_id, NEW.branch_id, NEW.id, 'visit',
      coalesce(NEW.verified_at, now())
    )
    ON CONFLICT (visit_id, ordinal) DO NOTHING;

    PERFORM public.ensure_keepsake_cards(NEW.customer_id, NEW.organization_id);
    PERFORM public.grant_ladder_milestones(
      NEW.customer_id, NEW.organization_id, NEW.branch_id
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.snapshot_verified_visit() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. register_visit: apply the active promotion and use per-customer velocity.
--
--    The old velocity check counted every visit in the organization during the
--    last ten minutes, so a busy Saturday marked ordinary guests as suspicious.
--    Fraud is a property of one customer/device, not of a queue.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_visit(
  p_customer_id uuid,
  p_organization_id uuid,
  p_branch_id uuid,
  p_qr_code_id uuid,
  p_source public.qr_source,
  p_device_fingerprint text,
  p_ip_hash text,
  p_idempotency_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_visit public.visits%ROWTYPE;
  v_last timestamptz;
  v_recent integer;
  v_status public.verification_status;
  v_promotion jsonb;
  v_multiplier integer := 1;
  v_ordinal integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Visit registration is server-only' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.branches
    WHERE id = p_branch_id AND organization_id = p_organization_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Branch not available' USING ERRCODE = '22023';
  END IF;

  UPDATE public.customers
  SET organization_id = p_organization_id
  WHERE id = p_customer_id AND organization_id IS NULL;

  IF NOT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = p_customer_id
      AND (organization_id IS NULL OR organization_id = p_organization_id)
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Customer not available' USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_visit
    FROM public.visits
    WHERE organization_id = p_organization_id AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN pg_catalog.jsonb_build_object(
        'status', 'ok', 'duplicate', true, 'visit', pg_catalog.to_jsonb(v_visit),
        'stampsAwarded', 0, 'multiplier', 1
      );
    END IF;
  END IF;

  SELECT max(created_at) INTO v_last
  FROM public.visits
  WHERE customer_id = p_customer_id AND branch_id = p_branch_id
    AND verification_status = 'verified';

  IF v_last IS NOT NULL AND v_last > now() - interval '60 minutes' THEN
    RETURN pg_catalog.jsonb_build_object(
      'status', 'cooldown',
      'duplicate', false,
      'cooldownMinutes', pg_catalog.ceil(
        pg_catalog.date_part('epoch', v_last + interval '60 minutes' - now()) / 60
      )
    );
  END IF;

  -- Per-customer velocity, not per-venue footfall.
  SELECT count(*) INTO v_recent
  FROM public.visits
  WHERE customer_id = p_customer_id
    AND organization_id = p_organization_id
    AND created_at > now() - interval '10 minutes';

  v_status := CASE WHEN v_recent >= 3
    THEN 'suspicious'::public.verification_status
    ELSE 'verified'::public.verification_status
  END;

  v_promotion := public.active_stamp_multiplier(
    p_organization_id, p_branch_id, now()
  );
  IF v_promotion IS NOT NULL AND v_status = 'verified' THEN
    v_multiplier := greatest(1, least(5, (v_promotion->>'multiplier')::integer));
  END IF;

  PERFORM pg_catalog.set_config('stampy.defer_stamp_allocation', 'on', true);

  INSERT INTO public.visits (
    customer_id, organization_id, branch_id, qr_code_id, source,
    verification_status, verified_at, device_fingerprint, ip_hash, idempotency_key
  ) VALUES (
    p_customer_id, p_organization_id, p_branch_id, p_qr_code_id, p_source,
    v_status, CASE WHEN v_status = 'verified' THEN now() ELSE NULL END,
    p_device_fingerprint, p_ip_hash, p_idempotency_key
  )
  RETURNING * INTO v_visit;

  IF v_status = 'verified' THEN
    FOR v_ordinal IN 1..v_multiplier LOOP
      INSERT INTO public.stamp_ledger(
        customer_id, organization_id, branch_id, visit_id, promotion_id,
        kind, ordinal, created_at
      ) VALUES (
        p_customer_id, p_organization_id, p_branch_id, v_visit.id,
        CASE WHEN v_ordinal = 1 THEN NULL ELSE (v_promotion->>'id')::uuid END,
        CASE WHEN v_ordinal = 1 THEN 'visit' ELSE 'promotion_bonus' END,
        v_ordinal,
        v_visit.verified_at
      );
    END LOOP;
  END IF;

  PERFORM pg_catalog.set_config('stampy.defer_stamp_allocation', 'off', true);
  PERFORM public.ensure_keepsake_cards(p_customer_id, p_organization_id);
  PERFORM public.grant_ladder_milestones(p_customer_id, p_organization_id, p_branch_id);

  RETURN pg_catalog.jsonb_build_object(
    'status', 'ok',
    'duplicate', false,
    'visit', pg_catalog.to_jsonb(v_visit),
    'stampsAwarded', CASE WHEN v_status = 'verified' THEN v_multiplier ELSE 0 END,
    'multiplier', v_multiplier,
    'promotion', v_promotion
  );
END;
$$;
REVOKE ALL ON FUNCTION public.register_visit(uuid, uuid, uuid, uuid, public.qr_source, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_visit(uuid, uuid, uuid, uuid, public.qr_source, text, text, uuid)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 9. Replace the ladder atomically and keep the single base reward rule in
--    sync with its top "card" tier, so card allocation and the ladder never
--    disagree about the cycle target.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.replace_reward_ladder(
  p_organization_id uuid,
  p_tiers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tier jsonb;
  v_count integer;
  v_card_count integer := 0;
  v_max_threshold integer := 0;
  v_card_title text;
  v_card_description text;
  v_rule public.reward_rules%ROWTYPE;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations WHERE id = p_organization_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Organization not available' USING ERRCODE = '22023';
  END IF;
  IF p_tiers IS NULL OR pg_catalog.jsonb_typeof(p_tiers) <> 'array' THEN
    RAISE EXCEPTION 'Tiers must be an array' USING ERRCODE = '22023';
  END IF;

  v_count := pg_catalog.jsonb_array_length(p_tiers);
  IF v_count < 1 OR v_count > 5 THEN
    RAISE EXCEPTION 'A ladder needs between 1 and 5 tiers' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.reward_ladder_tiers WHERE organization_id = p_organization_id;

  FOR v_tier IN SELECT * FROM pg_catalog.jsonb_array_elements(p_tiers) LOOP
    IF (v_tier->>'threshold') IS NULL
      OR (v_tier->>'threshold')::integer NOT BETWEEN 2 AND 30
      OR length(coalesce(v_tier->>'title', '')) NOT BETWEEN 2 AND 120
      OR coalesce(v_tier->>'rewardKind', 'voucher') NOT IN ('voucher', 'card') THEN
      RAISE EXCEPTION 'Invalid ladder tier' USING ERRCODE = '22023';
    END IF;

    IF (v_tier->>'rewardKind') = 'card' THEN
      v_card_count := v_card_count + 1;
      v_card_title := v_tier->>'title';
      v_card_description := v_tier->>'description';
    END IF;
    v_max_threshold := greatest(v_max_threshold, (v_tier->>'threshold')::integer);

    INSERT INTO public.reward_ladder_tiers(
      organization_id, threshold, title, description, reward_kind,
      voucher_valid_days, is_active
    ) VALUES (
      p_organization_id,
      (v_tier->>'threshold')::integer,
      v_tier->>'title',
      nullif(v_tier->>'description', ''),
      coalesce(v_tier->>'rewardKind', 'voucher'),
      coalesce((v_tier->>'voucherValidDays')::integer, 30),
      coalesce((v_tier->>'isActive')::boolean, true)
    );
  END LOOP;

  IF v_card_count <> 1 THEN
    RAISE EXCEPTION 'Exactly one tier must be the card reward' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.reward_ladder_tiers
    WHERE organization_id = p_organization_id
      AND reward_kind = 'card' AND threshold = v_max_threshold
  ) THEN
    RAISE EXCEPTION 'The card tier must have the highest threshold' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_rule FROM public.reward_rules
  WHERE organization_id = p_organization_id AND trigger_type = 'visit_count'
  ORDER BY is_active DESC, created_at, id
  LIMIT 1;

  IF v_rule.id IS NULL THEN
    INSERT INTO public.reward_rules(
      organization_id, name, description, trigger_type, threshold,
      reward_type, is_active
    ) VALUES (
      p_organization_id, v_card_title, v_card_description, 'visit_count',
      v_max_threshold, 'free_item', true
    );
  ELSE
    UPDATE public.reward_rules
    SET name = v_card_title,
        description = v_card_description,
        threshold = v_max_threshold,
        is_active = true,
        updated_at = now()
    WHERE id = v_rule.id;
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'tiers', (
      SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.threshold)
      FROM public.reward_ladder_tiers t
      WHERE t.organization_id = p_organization_id
    ),
    'cycleThreshold', v_max_threshold
  );
END;
$$;
REVOKE ALL ON FUNCTION public.replace_reward_ladder(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_reward_ladder(uuid, jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- 10. Balance now counts stamps, not visits. `usedVisits` is kept for older
--     callers; new code should read `openStamps`.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_keepsake_balance(
  p_customer_id uuid,
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_result jsonb;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501';
  END IF;
  SELECT pg_catalog.jsonb_build_object(
    'openStamps', count(*) FILTER (WHERE card_id IS NULL)::int,
    'usedStamps', count(*) FILTER (WHERE card_id IS NOT NULL)::int,
    'usedVisits', count(*) FILTER (WHERE card_id IS NOT NULL)::int,
    'availableRewards', (
      SELECT count(*) FROM public.keepsake_cards c
      WHERE c.customer_id = p_customer_id
        AND c.organization_id = p_organization_id
        AND c.redeemed_at IS NULL
    )::int,
    'oldestRewardName', (
      SELECT pending.reward_name FROM public.keepsake_cards pending
      WHERE pending.customer_id = p_customer_id
        AND pending.organization_id = p_organization_id
        AND pending.redeemed_at IS NULL
      ORDER BY pending.sequence_number
      LIMIT 1
    )
  ) INTO v_result
  FROM public.stamp_ledger
  WHERE customer_id = p_customer_id AND organization_id = p_organization_id;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_keepsake_balance(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_keepsake_balance(uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 11. Backfill ladder vouchers for stamps that are already on an open card.
--     Runs after tiers exist; on a fresh install this is a no-op.
-- ---------------------------------------------------------------------------
DO $$
DECLARE v_pair record;
BEGIN
  FOR v_pair IN
    SELECT DISTINCT l.customer_id, l.organization_id,
      (SELECT b.id FROM public.branches b
       WHERE b.organization_id = l.organization_id AND b.status = 'active'
       ORDER BY b.created_at LIMIT 1) AS branch_id
    FROM public.stamp_ledger l
    WHERE l.card_id IS NULL
  LOOP
    IF v_pair.branch_id IS NOT NULL THEN
      PERFORM public.grant_ladder_milestones(
        v_pair.customer_id, v_pair.organization_id, v_pair.branch_id
      );
    END IF;
  END LOOP;
END $$;
