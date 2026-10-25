-- ==============================================================================
-- 00013_production_hardening.sql
--
-- Closes the remaining tenant-takeover path, adds the storage the API routes
-- need for real (non-fake) behaviour, and makes the security-sensitive
-- operations atomic:
--   * removes "Members insertable during onboarding"
--   * separates staff PIN hashes from the member row
--   * scopes customers to a tenant and makes guest ids unique per tenant
--   * replaces the global pairing-code uniqueness with an active-code index
--   * adds print_jobs, vouchers, rate_limit_buckets
--   * adds consume_rate_limit, pair_screen, increment_qr_scan, register_visit
--   * adds capture_guest_memory (visit + memory + consent atomically)
--   * adds redeem_customer_reward_service for PIN-authenticated staff
--   * allows platform-issued wallet passes (connector_id NULL)
-- ==============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tenant takeover: a signed-in user could insert themselves into any
--    organization with any role. Only organization admins may write members.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members insertable during onboarding" ON public.organization_members;
DROP POLICY IF EXISTS "Members manageable by org admins" ON public.organization_members;
CREATE POLICY "Members manageable by org admins" ON public.organization_members
  FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- ---------------------------------------------------------------------------
-- 2. Staff identity. PIN hashes live in a table that no browser role can read.
-- ---------------------------------------------------------------------------
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS staff_code text,
  ADD COLUMN IF NOT EXISTS display_name text;

CREATE UNIQUE INDEX IF NOT EXISTS organization_members_staff_code_unique
  ON public.organization_members(organization_id, staff_code)
  WHERE staff_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.staff_pin_credentials (
  member_id uuid PRIMARY KEY REFERENCES public.organization_members(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_pin_hash_format
    CHECK (pin_hash ~ '^pbkdf2-sha256\$[0-9]{6}\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$')
);
ALTER TABLE public.staff_pin_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_pin_credentials FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_pin_credentials TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Customers belong to a tenant. A phone number is contact data, never an
--    identity key; `persona` replaces the old fake-email role storage.
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS persona text;

WITH first_visit AS (
  SELECT DISTINCT ON (customer_id) customer_id, organization_id
  FROM public.visits
  ORDER BY customer_id, created_at ASC
)
UPDATE public.customers c
SET organization_id = f.organization_id
FROM first_visit f
WHERE c.id = f.customer_id AND c.organization_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.customers
    WHERE organization_id IS NOT NULL AND anonymous_id IS NOT NULL
    GROUP BY organization_id, anonymous_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Duplicate (organization_id, anonymous_id) customers exist. Deduplicate customers before applying 00013.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS customers_org_anonymous_unique
  ON public.customers(organization_id, anonymous_id)
  WHERE organization_id IS NOT NULL AND anonymous_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS customers_org_last_seen_idx
  ON public.customers(organization_id, last_seen_at DESC);

-- ---------------------------------------------------------------------------
-- 4. Pairing codes: a code is unique only while it is active. Old consumed
--    codes must not block a six-digit code forever.
-- ---------------------------------------------------------------------------
UPDATE public.screen_pairing_codes
SET is_used = true
WHERE is_used = false AND expires_at < now();

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY code ORDER BY created_at DESC) AS rn
  FROM public.screen_pairing_codes
  WHERE is_used = false
)
UPDATE public.screen_pairing_codes p
SET is_used = true
FROM ranked r
WHERE p.id = r.id AND r.rn > 1;

DROP INDEX IF EXISTS public.screen_pairing_code_unique;
CREATE UNIQUE INDEX IF NOT EXISTS screen_pairing_code_active_unique
  ON public.screen_pairing_codes(code)
  WHERE NOT is_used;

CREATE INDEX IF NOT EXISTS screen_pairing_code_expiry_idx
  ON public.screen_pairing_codes(expires_at)
  WHERE NOT is_used;

-- ---------------------------------------------------------------------------
-- 5. Print queue. Replaces the per-isolate Map that disappeared on eviction.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  memory_id uuid REFERENCES public.memories(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'printing', 'printed', 'failed', 'dismissed')),
  format text NOT NULL DEFAULT '4x6',
  copies integer NOT NULL DEFAULT 1 CHECK (copies BETWEEN 1 AND 20),
  photo_url text NOT NULL,
  requested_by uuid,
  claimed_at timestamptz,
  printed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS print_jobs_queue_idx
  ON public.print_jobs(organization_id, branch_id, status, created_at);
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.print_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.print_jobs TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Vouchers. A code is generated server-side, stored, and redeemable once.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  code text NOT NULL CHECK (code ~ '^[A-Z0-9-]{6,32}$'),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 120),
  description text,
  status text NOT NULL DEFAULT 'issued'
    CHECK (status IN ('issued', 'redeemed', 'expired', 'void')),
  issued_by uuid,
  redeemed_at timestamptz,
  redeemed_by uuid,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);
CREATE INDEX IF NOT EXISTS vouchers_customer_idx
  ON public.vouchers(organization_id, customer_id, status);
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vouchers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vouchers TO service_role;

-- ---------------------------------------------------------------------------
-- 7. Distributed rate limiting (sliding counter with a fixed window).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  reset_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limit_buckets FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limit_buckets TO service_role;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE(allowed boolean, remaining integer, "limit" integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
  v_reset timestamptz;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Rate limiting is server-only' USING ERRCODE = '42501';
  END IF;
  IF p_key IS NULL OR length(p_key) NOT BETWEEN 1 AND 200
     OR p_limit < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.rate_limit_buckets AS b (key, count, reset_at)
  VALUES (p_key, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE SET
    count = CASE WHEN b.reset_at <= now() THEN 1 ELSE b.count + 1 END,
    reset_at = CASE
      WHEN b.reset_at <= now() THEN now() + make_interval(secs => p_window_seconds)
      ELSE b.reset_at
    END,
    updated_at = now()
  RETURNING b.count, b.reset_at INTO v_count, v_reset;

  DELETE FROM public.rate_limit_buckets
  WHERE reset_at < now() - interval '1 day';

  RETURN QUERY
    SELECT v_count <= p_limit,
           greatest(0, p_limit - v_count),
           p_limit,
           v_reset;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;

-- ---------------------------------------------------------------------------
-- 8. Pair a screen atomically: consume the code and create the screen in one
--    transaction. A failed insert can no longer burn the code.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pair_screen(
  p_code text,
  p_device_token text,
  p_screen_name text DEFAULT NULL,
  p_resolution text DEFAULT '1920x1080',
  p_orientation public.screen_orientation DEFAULT 'landscape'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code public.screen_pairing_codes;
  v_screen public.screens;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Screen pairing is server-only' USING ERRCODE = '42501';
  END IF;
  IF p_code !~ '^[0-9]{6}$' OR p_device_token IS NULL OR length(p_device_token) < 32 THEN
    RAISE EXCEPTION 'Invalid pairing request' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_code
  FROM public.screen_pairing_codes
  WHERE code = p_code AND NOT is_used AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    UPDATE public.screen_pairing_codes
    SET attempts = attempts + 1
    WHERE code = p_code AND NOT is_used;
    RETURN NULL;
  END IF;

  UPDATE public.screen_pairing_codes
  SET is_used = true, attempts = attempts + 1
  WHERE id = v_code.id;

  INSERT INTO public.screens (
    organization_id, branch_id, name, status, device_token,
    orientation, resolution, last_heartbeat_at
  ) VALUES (
    v_code.organization_id,
    v_code.branch_id,
    coalesce(nullif(trim(p_screen_name), ''), v_code.screen_name, 'Screen'),
    'online',
    p_device_token,
    p_orientation,
    coalesce(nullif(trim(p_resolution), ''), '1920x1080'),
    now()
  )
  RETURNING * INTO v_screen;

  RETURN jsonb_build_object(
    'screen', to_jsonb(v_screen),
    'organization_id', v_screen.organization_id,
    'branch_id', v_screen.branch_id
  );
END;
$$;
REVOKE ALL ON FUNCTION public.pair_screen(text, text, text, text, public.screen_orientation) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pair_screen(text, text, text, text, public.screen_orientation) TO service_role;

-- ---------------------------------------------------------------------------
-- 9. QR scans increment in SQL, never read-modify-write from the Worker.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_qr_scan(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_qr public.qr_codes;
  v_branch_slug text;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'QR scans are server-only' USING ERRCODE = '42501';
  END IF;

  UPDATE public.qr_codes
  SET scan_count = scan_count + 1, updated_at = now()
  WHERE slug = p_slug AND is_active
  RETURNING * INTO v_qr;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT slug INTO v_branch_slug FROM public.branches WHERE id = v_qr.branch_id;

  RETURN jsonb_build_object(
    'qr_id', v_qr.id,
    'branch_id', v_qr.branch_id,
    'branch_slug', v_branch_slug,
    'source', v_qr.source,
    'scan_count', v_qr.scan_count
  );
END;
$$;
REVOKE ALL ON FUNCTION public.increment_qr_scan(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_qr_scan(text) TO service_role;

-- ---------------------------------------------------------------------------
-- 10. Visit registration: idempotent, cooldown-aware, and atomic.
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
  v_visit public.visits;
  v_last timestamptz;
  v_recent integer;
  v_status public.verification_status;
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
      RETURN jsonb_build_object('status', 'ok', 'duplicate', true, 'visit', to_jsonb(v_visit));
    END IF;
  END IF;

  SELECT max(created_at) INTO v_last
  FROM public.visits
  WHERE customer_id = p_customer_id AND branch_id = p_branch_id
    AND verification_status = 'verified';

  IF v_last IS NOT NULL AND v_last > now() - interval '60 minutes' THEN
    RETURN jsonb_build_object(
      'status', 'cooldown',
      'duplicate', false,
      'cooldownMinutes', ceil(extract(epoch FROM (v_last + interval '60 minutes' - now())) / 60)
    );
  END IF;

  SELECT count(*) INTO v_recent
  FROM public.visits
  WHERE organization_id = p_organization_id AND created_at > now() - interval '10 minutes';

  v_status := CASE WHEN v_recent >= 5 THEN 'suspicious'::public.verification_status
                   ELSE 'verified'::public.verification_status END;

  INSERT INTO public.visits (
    customer_id, organization_id, branch_id, qr_code_id, source,
    verification_status, verified_at, device_fingerprint, ip_hash, idempotency_key
  ) VALUES (
    p_customer_id, p_organization_id, p_branch_id, p_qr_code_id, p_source,
    v_status, CASE WHEN v_status = 'verified' THEN now() ELSE NULL END,
    p_device_fingerprint, p_ip_hash, p_idempotency_key
  )
  RETURNING * INTO v_visit;

  RETURN jsonb_build_object('status', 'ok', 'duplicate', false, 'visit', to_jsonb(v_visit));
END;
$$;
REVOKE ALL ON FUNCTION public.register_visit(uuid, uuid, uuid, uuid, public.qr_source, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_visit(uuid, uuid, uuid, uuid, public.qr_source, text, text, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 11. Wallet passes can be issued with the platform key (connector_id NULL).
-- ---------------------------------------------------------------------------
ALTER TABLE public.wallet_passes ALTER COLUMN connector_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS wallet_passes_org_status_idx
  ON public.wallet_passes(organization_id, status);

COMMENT ON COLUMN public.wallet_passes.connector_id IS
  'NULL means the deployment-level WALLETWALLET_API_KEY issued this pass.';

-- ---------------------------------------------------------------------------
-- 12. Per-tenant photobooth settings. Stored as validated JSON on the
--     organization so the customer app and the dashboard read one source of
--     truth instead of localStorage.
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(settings) = 'object');

COMMENT ON COLUMN public.organizations.settings IS
  'Photobooth configuration: shotCount, loyaltyMaxVisits, frame, colors, gift copy.';

-- ---------------------------------------------------------------------------
-- 13. Customer contact number. `anonymous_id` is a server-generated identity;
--     the phone is optional contact data scoped to a tenant and never used as
--     an authentication factor.
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone text;

UPDATE public.customers
SET phone = anonymous_id
WHERE phone IS NULL
  AND anonymous_id ~ '^[+]?[0-9]{8,15}$'
  AND organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.customers other
    WHERE other.organization_id = public.customers.organization_id
      AND other.id <> public.customers.id
      AND other.phone = public.customers.anonymous_id
  );

CREATE UNIQUE INDEX IF NOT EXISTS customers_org_phone_unique
  ON public.customers(organization_id, phone)
  WHERE phone IS NOT NULL AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 14. Guest capture: one verified visit + one memory + consent in a single
--     transaction, with the same cooldown/velocity rules as register_visit.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.capture_guest_memory(
  p_customer_id uuid,
  p_organization_id uuid,
  p_branch_id uuid,
  p_original_url text,
  p_optimized_url text,
  p_thumbnail_url text,
  p_caption text,
  p_live_wall_consent boolean,
  p_social_share_consent boolean,
  p_marketing_consent boolean,
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
  v_visit public.visits;
  v_memory public.memories;
  v_last timestamptz;
  v_recent integer;
  v_status public.verification_status;
  v_existing public.memories;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Capture is server-only' USING ERRCODE = '42501';
  END IF;

  -- Images are uploaded to the private `memories` bucket and referenced by
  -- storage key. Rows created before the hardening migration may still hold an
  -- absolute https URL, so both shapes are accepted. Anything else (data URLs,
  -- javascript:, traversal) is rejected.
  IF p_original_url IS NULL
     OR length(p_original_url) > 400
     OR (
       p_original_url !~ '^https://'
       AND p_original_url !~ '^[A-Za-z0-9][A-Za-z0-9/_.-]*$'
     )
     OR (
       p_optimized_url IS NOT NULL
       AND (
         length(p_optimized_url) > 400
         OR (
           p_optimized_url !~ '^https://'
           AND p_optimized_url !~ '^[A-Za-z0-9][A-Za-z0-9/_.-]*$'
         )
       )
     )
     OR (
       p_thumbnail_url IS NOT NULL
       AND (
         length(p_thumbnail_url) > 400
         OR (
           p_thumbnail_url !~ '^https://'
           AND p_thumbnail_url !~ '^[A-Za-z0-9][A-Za-z0-9/_.-]*$'
         )
       )
     )
     OR length(coalesce(p_caption, '')) > 280 THEN
    RAISE EXCEPTION 'Invalid memory payload' USING ERRCODE = '22023';
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
      AND organization_id = p_organization_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Customer not available' USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT m.* INTO v_existing
    FROM public.memories m
    JOIN public.visits v ON v.id = m.visit_id
    WHERE v.organization_id = p_organization_id
      AND v.idempotency_key = p_idempotency_key
      AND m.deleted_at IS NULL;
    IF FOUND THEN
      RETURN jsonb_build_object('status', 'duplicate', 'duplicate', true,
        'memory', to_jsonb(v_existing));
    END IF;
  END IF;

  SELECT max(created_at) INTO v_last
  FROM public.visits
  WHERE customer_id = p_customer_id AND branch_id = p_branch_id
    AND verification_status = 'verified';

  IF v_last IS NOT NULL AND v_last > now() - interval '60 minutes' THEN
    RETURN jsonb_build_object(
      'status', 'cooldown',
      'duplicate', false,
      'cooldownMinutes', ceil(extract(epoch FROM (v_last + interval '60 minutes' - now())) / 60)
    );
  END IF;

  SELECT count(*) INTO v_recent
  FROM public.visits
  WHERE organization_id = p_organization_id AND created_at > now() - interval '10 minutes';

  v_status := CASE WHEN v_recent >= 5 THEN 'suspicious'::public.verification_status
                   ELSE 'verified'::public.verification_status END;

  INSERT INTO public.visits (
    customer_id, organization_id, branch_id, source,
    verification_status, verified_at, device_fingerprint, ip_hash, idempotency_key
  ) VALUES (
    p_customer_id, p_organization_id, p_branch_id, 'table',
    v_status, CASE WHEN v_status = 'verified' THEN now() ELSE NULL END,
    p_device_fingerprint, p_ip_hash, p_idempotency_key
  )
  RETURNING * INTO v_visit;

  INSERT INTO public.memories (
    customer_id, organization_id, branch_id, visit_id,
    original_url, optimized_url, thumbnail_url, caption, status, visibility
  ) VALUES (
    p_customer_id, p_organization_id, p_branch_id, v_visit.id,
    p_original_url, coalesce(p_optimized_url, p_original_url),
    coalesce(p_thumbnail_url, p_original_url), nullif(trim(p_caption), ''),
    CASE WHEN p_live_wall_consent THEN 'pending'::public.memory_status
         ELSE 'approved'::public.memory_status END,
    CASE WHEN p_live_wall_consent THEN 'live_wall'::public.memory_visibility
         ELSE 'private'::public.memory_visibility END
  )
  RETURNING * INTO v_memory;

  INSERT INTO public.memory_consents (
    memory_id, customer_id, save_consent,
    social_share_consent, live_wall_consent, marketing_consent
  ) VALUES (
    v_memory.id, p_customer_id, true,
    coalesce(p_social_share_consent, false),
    coalesce(p_live_wall_consent, false),
    coalesce(p_marketing_consent, false)
  );

  RETURN jsonb_build_object(
    'status', CASE WHEN v_status = 'verified' THEN 'ok' ELSE 'suspicious' END,
    'duplicate', false,
    'visit', to_jsonb(v_visit),
    'memory', to_jsonb(v_memory),
    'balance', public.get_keepsake_balance(p_customer_id, p_organization_id)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.capture_guest_memory(
  uuid, uuid, uuid, text, text, text, text, boolean, boolean, boolean, text, text, uuid
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_guest_memory(
  uuid, uuid, uuid, text, text, text, text, boolean, boolean, boolean, text, text, uuid
) TO service_role;

-- ---------------------------------------------------------------------------
-- 15. Redemption for a PIN-authenticated staff tablet. The route has already
--     verified the signed staff cookie; this function re-proves that the
--     member belongs to the branch and consumes the oldest earned card.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_customer_reward_service(
  p_customer_id uuid,
  p_branch_id uuid,
  p_reward_rule_id uuid,
  p_idempotency_key uuid,
  p_staff_member_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org uuid;
  v_rule public.reward_rules%ROWTYPE;
  v_member public.organization_members%ROWTYPE;
  v_event public.reward_events%ROWTYPE;
  v_card public.keepsake_cards%ROWTYPE;
BEGIN
  IF auth.role() <> 'service_role' OR p_idempotency_key IS NULL OR p_staff_member_id IS NULL THEN
    RAISE EXCEPTION 'Authentication and idempotency key required' USING ERRCODE = '42501';
  END IF;

  SELECT b.organization_id INTO v_org FROM public.branches b
    JOIN public.organizations o ON o.id = b.organization_id AND o.status = 'active'
    WHERE b.id = p_branch_id AND b.status = 'active';

  SELECT * INTO v_member FROM public.organization_members
    WHERE id = p_staff_member_id AND organization_id = v_org
      AND (branch_id IS NULL OR branch_id = p_branch_id)
    LIMIT 1;

  IF v_org IS NULL OR v_member.id IS NULL THEN
    RAISE EXCEPTION 'Not authorized for this branch' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_rule FROM public.reward_rules
    WHERE id = p_reward_rule_id AND organization_id = v_org
      AND is_active AND trigger_type = 'visit_count' AND threshold > 0
      AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now())
    FOR SHARE;
  IF v_rule.id IS NULL THEN
    RAISE EXCEPTION 'Reward rule not active' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_customer_id::text || v_org::text || v_rule.id::text, 0)
  );

  SELECT * INTO v_event FROM public.reward_events WHERE idempotency_key = p_idempotency_key::text;
  IF v_event.id IS NOT NULL THEN
    IF v_event.customer_id <> p_customer_id OR v_event.organization_id <> v_org
       OR v_event.reference_id <> v_rule.id OR v_event.type <> 'reward_redeemed' THEN
      RAISE EXCEPTION 'Idempotency key belongs to another redemption' USING ERRCODE = '22023';
    END IF;
    RETURN pg_catalog.jsonb_build_object('rewardEventId', v_event.id, 'replayed', true);
  END IF;

  SELECT * INTO v_card FROM public.keepsake_cards
    WHERE customer_id = p_customer_id AND organization_id = v_org AND redeemed_at IS NULL
    ORDER BY sequence_number LIMIT 1 FOR UPDATE;
  IF v_card.id IS NULL THEN
    RAISE EXCEPTION 'Insufficient verified visits' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.reward_events(
    customer_id, organization_id, branch_id, type, value,
    reference_type, reference_id, idempotency_key
  ) VALUES (
    p_customer_id, v_org, p_branch_id, 'reward_redeemed', 1,
    'reward_rules', v_rule.id, p_idempotency_key::text
  )
  RETURNING * INTO v_event;

  -- Consume the earned card in the same transaction. Without this the balance
  -- never moves and the same reward can be redeemed forever.
  UPDATE public.keepsake_cards
  SET redeemed_at = v_event.created_at,
      redemption_event_id = v_event.id
  WHERE id = v_card.id;

  RETURN pg_catalog.jsonb_build_object(
    'rewardEventId', v_event.id,
    'keepsakeCardId', v_card.id,
    'replayed', false,
    'rewardName', v_card.reward_name,
    'redeemedAt', v_event.created_at
  );
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_customer_reward_service(uuid, uuid, uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_customer_reward_service(uuid, uuid, uuid, uuid, uuid)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 16. Merchant aggregates. The Worker reaches these with the service role after
--     `requireOperator` has already proved membership, so the functions accept
--     `service_role` in addition to an authenticated member. Browser roles can
--     never call them with the service role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merchant_overview(
  p_organization_id uuid,
  p_branch_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today timestamptz;
  v_timezone text;
  v_visits int;
  v_unique int;
  v_memories int;
  v_pending int;
  v_rewards int;
  v_screens int;
  v_online int;
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF auth.uid() IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.organization_members m
        JOIN public.organizations o ON o.id = m.organization_id AND o.status = 'active'
        WHERE m.user_id = auth.uid() AND m.organization_id = p_organization_id
        AND (m.branch_id IS NULL OR (p_branch_id IS NOT NULL AND m.branch_id = p_branch_id))
    ) THEN
      RAISE EXCEPTION 'Organization membership required' USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT timezone INTO v_timezone
  FROM public.organizations
  WHERE id = p_organization_id AND status = 'active';
  IF v_timezone IS NULL THEN
    RAISE EXCEPTION 'Organization not found' USING ERRCODE = '22023';
  END IF;

  IF p_branch_id IS NOT NULL THEN
    SELECT timezone INTO v_timezone FROM public.branches
      WHERE id = p_branch_id AND organization_id = p_organization_id AND status = 'active';
    IF v_timezone IS NULL THEN
      RAISE EXCEPTION 'Branch not found' USING ERRCODE = '22023';
    END IF;
  END IF;

  v_today := date_trunc('day', now() AT TIME ZONE v_timezone) AT TIME ZONE v_timezone;

  SELECT count(*), count(DISTINCT customer_id) INTO v_visits, v_unique
  FROM public.visits
  WHERE organization_id = p_organization_id
    AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND verification_status = 'verified' AND verified_at >= v_today;

  SELECT count(*) FILTER (WHERE m.created_at >= v_today),
         count(*) FILTER (WHERE m.status = 'pending')
  INTO v_memories, v_pending
  FROM public.memories m
  JOIN public.memory_consents c
    ON c.memory_id = m.id AND c.live_wall_consent = true AND c.revoked_at IS NULL
  WHERE m.organization_id = p_organization_id
    AND (p_branch_id IS NULL OR m.branch_id = p_branch_id)
    AND m.visibility = 'live_wall' AND m.deleted_at IS NULL AND m.status <> 'deleted';

  SELECT count(*) INTO v_rewards FROM public.reward_events
  WHERE organization_id = p_organization_id
    AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND type = 'reward_redeemed' AND created_at >= v_today;

  SELECT count(*), count(*) FILTER (
    WHERE last_heartbeat_at > now() - interval '2 minutes' AND status = 'online'
  )
  INTO v_screens, v_online FROM public.screens
  WHERE organization_id = p_organization_id
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);

  RETURN pg_catalog.jsonb_build_object(
    'today', pg_catalog.jsonb_build_object(
      'visits', v_visits,
      'uniqueCustomers', v_unique,
      'returningCustomers', greatest(0, v_visits - v_unique),
      'additionalVisits', greatest(0, v_visits - v_unique),
      'newMemories', v_memories,
      'rewardsRedeemed', v_rewards
    ),
    'attentionCenter', pg_catalog.jsonb_build_object(
      'pendingMemories', v_pending,
      'offlineScreens', greatest(0, v_screens - v_online)
    ),
    'liveWall', pg_catalog.jsonb_build_object(
      'totalScreens', v_screens,
      'onlineScreens', v_online
    )
  );
END;
$$;
REVOKE ALL ON FUNCTION public.merchant_overview(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merchant_overview(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.merchant_crm_customers(
  p_org uuid,
  p_branch uuid DEFAULT NULL,
  p_limit integer DEFAULT 30,
  p_before timestamptz DEFAULT NULL,
  p_before_customer uuid DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE(
  customer_id uuid,
  display_name text,
  last_visit_at timestamptz,
  verified_visits bigint,
  rewards_redeemed bigint,
  wallet_issued boolean,
  wallet_marketing_opt_in boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF auth.uid() IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR
       (p_before IS NULL) <> (p_before_customer IS NULL) OR
       (p_search IS NOT NULL AND length(p_search) > 80) OR
       NOT EXISTS (
         SELECT 1 FROM public.organization_members m
           JOIN public.organizations o ON o.id = m.organization_id AND o.status = 'active'
           WHERE m.user_id = auth.uid() AND m.organization_id = p_org
             AND m.role IN ('owner', 'admin', 'manager')
             AND (m.branch_id IS NULL OR (p_branch IS NOT NULL AND m.branch_id = p_branch))
       ) OR
       (p_branch IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM public.branches b
         WHERE b.id = p_branch AND b.organization_id = p_org AND b.status = 'active'
       ))
    THEN
      RAISE EXCEPTION 'CRM membership required' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN QUERY
  WITH activity AS (
    SELECT v.customer_id, max(v.verified_at) AS last_seen, count(*) AS visit_count
    FROM public.visits v
    WHERE v.organization_id = p_org
      AND (p_branch IS NULL OR v.branch_id = p_branch)
      AND v.verification_status = 'verified'
    GROUP BY v.customer_id
  ), redemptions AS (
    SELECT e.customer_id, count(*) AS redeemed
    FROM public.reward_events e
    WHERE e.organization_id = p_org
      AND (p_branch IS NULL OR e.branch_id = p_branch)
      AND e.type = 'reward_redeemed'
    GROUP BY e.customer_id
  )
  SELECT a.customer_id,
         coalesce(c.display_name, 'ضيف') AS display_name,
         a.last_seen,
         a.visit_count,
         coalesce(r.redeemed, 0)::bigint,
         (w.id IS NOT NULL) AS wallet_issued,
         (coalesce(p.wallet_opt_in, false) AND coalesce(p.marketing_opt_in, false))
           AS wallet_marketing_opt_in
  FROM activity a
  JOIN public.customers c ON c.id = a.customer_id AND c.deleted_at IS NULL
  LEFT JOIN redemptions r ON r.customer_id = a.customer_id
  LEFT JOIN public.wallet_passes w
    ON w.organization_id = p_org AND w.customer_id = a.customer_id AND w.status = 'issued'
  LEFT JOIN public.customer_wallet_preferences p
    ON p.organization_id = p_org AND p.customer_id = a.customer_id
  WHERE (
      p_search IS NULL
      OR pg_catalog.strpos(
        pg_catalog.lower(coalesce(c.display_name, '')),
        pg_catalog.lower(p_search)
      ) > 0
    )
    AND (p_before IS NULL OR (a.last_seen, a.customer_id) < (p_before, p_before_customer))
  ORDER BY a.last_seen DESC, a.customer_id DESC
  LIMIT p_limit + 1;
END;
$$;
REVOKE ALL ON FUNCTION public.merchant_crm_customers(uuid, uuid, integer, timestamptz, uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merchant_crm_customers(uuid, uuid, integer, timestamptz, uuid, text)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 17. Platform tenant overview for the super-admin allow-list. Service role
--     only: the route verifies SUPER_ADMIN_EMAILS before calling it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.platform_tenant_overview()
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  status public.org_status,
  created_at timestamptz,
  customers bigint,
  memories bigint,
  visits bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Platform overview is server-only' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.slug,
    o.status,
    o.created_at,
    (SELECT count(*) FROM public.customers c
      WHERE c.organization_id = o.id AND c.deleted_at IS NULL),
    (SELECT count(*) FROM public.memories m
      WHERE m.organization_id = o.id AND m.deleted_at IS NULL AND m.status <> 'deleted'),
    (SELECT count(*) FROM public.visits v WHERE v.organization_id = o.id)
  FROM public.organizations o
  ORDER BY o.created_at DESC
  LIMIT 200;
END;
$$;
REVOKE ALL ON FUNCTION public.platform_tenant_overview() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_tenant_overview() TO service_role;
