-- Security and domain invariants. Run AFTER 00001 and 00002; do not replace applied migrations.
-- Existing unverified browser-local stamps must not be imported as verified visits.

-- Own profile updates may never grant platform privileges.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND coalesce(auth.role(), current_user) NOT IN ('service_role', 'postgres') THEN
    RAISE EXCEPTION 'Platform roles cannot be changed by users' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS prevent_profile_role_change ON public.users;
CREATE TRIGGER prevent_profile_role_change BEFORE UPDATE OF role ON public.users
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

-- Old SECURITY DEFINER helpers accepted arbitrary user IDs from RPC callers.
CREATE OR REPLACE FUNCTION public.get_user_org_ids(user_id uuid)
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN user_id = auth.uid() OR auth.role() = 'service_role'
    THEN ARRAY(SELECT organization_id FROM public.organization_members WHERE organization_members.user_id = $1)
    ELSE ARRAY[]::uuid[] END;
$$;
CREATE OR REPLACE FUNCTION public.get_user_org_role(user_id uuid, org_id uuid)
RETURNS public.org_member_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN user_id = auth.uid() OR auth.role() = 'service_role'
    THEN (SELECT role FROM public.organization_members WHERE organization_members.user_id = $1 AND organization_id = $2)
    ELSE NULL::public.org_member_role END;
$$;
CREATE OR REPLACE FUNCTION public.is_org_admin(user_id uuid, org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.organization_members WHERE organization_members.user_id = $1
    AND organization_id = $2 AND branch_id IS NULL AND role IN ('owner', 'admin')
  );
$$;
REVOKE ALL ON FUNCTION public.get_user_org_ids(uuid), public.get_user_org_role(uuid,uuid), public.is_org_admin(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_org_ids(uuid), public.get_user_org_role(uuid,uuid), public.is_org_admin(uuid,uuid) TO authenticated;

-- The original anonymous RPC could redeem somebody else's visits. Remove it.
DROP FUNCTION IF EXISTS public.redeem_customer_reward(uuid, uuid, uuid, uuid, text);

CREATE UNIQUE INDEX IF NOT EXISTS customers_auth_user_unique ON public.customers(auth_user_id) WHERE auth_user_id IS NOT NULL;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS idempotency_key uuid;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS verified_at timestamptz;
-- Pre-remediation API clients could mark visits verified without staff proof. Keep
-- the historical rows for investigation, but never reward them automatically.
-- An operator may set verified_at on audited rows BEFORE this migration to preserve
-- those visits as verified; see the migration runbook.
UPDATE public.visits SET verification_status = 'suspicious'
  WHERE verification_status = 'verified' AND verified_at IS NULL;
ALTER TABLE public.visits ADD CONSTRAINT verified_visit_has_timestamp
  CHECK (verification_status <> 'verified' OR verified_at IS NOT NULL) NOT VALID;
CREATE UNIQUE INDEX IF NOT EXISTS visits_org_idempotency_unique ON public.visits(organization_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
ALTER TABLE public.reward_rules ADD CONSTRAINT reward_rule_positive_threshold CHECK (threshold > 0) NOT VALID;

-- Composite references stop an org A row pointing to a branch/visit in org B.
ALTER TABLE public.branches ADD CONSTRAINT branches_id_org_unique UNIQUE (id, organization_id);
ALTER TABLE public.visits ADD CONSTRAINT visits_identity_unique UNIQUE (id, customer_id, organization_id, branch_id);
ALTER TABLE public.visits ADD CONSTRAINT visits_branch_org_fk FOREIGN KEY (branch_id, organization_id)
  REFERENCES public.branches(id, organization_id) NOT VALID;
ALTER TABLE public.memories ADD CONSTRAINT memories_visit_identity_fk
  FOREIGN KEY (visit_id, customer_id, organization_id, branch_id)
  REFERENCES public.visits(id, customer_id, organization_id, branch_id) NOT VALID;
ALTER TABLE public.qr_codes ADD CONSTRAINT qr_branch_org_fk FOREIGN KEY (branch_id, organization_id)
  REFERENCES public.branches(id, organization_id) NOT VALID;
ALTER TABLE public.screens ADD CONSTRAINT screens_branch_org_fk FOREIGN KEY (branch_id, organization_id)
  REFERENCES public.branches(id, organization_id) NOT VALID;

-- The 00002 consent trigger used unqualified tables and inherited the caller's search_path.
CREATE OR REPLACE FUNCTION public.handle_consent_revocation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD.live_wall_consent AND NOT NEW.live_wall_consent THEN
    UPDATE public.memories SET visibility = 'private', updated_at = now() WHERE id = NEW.memory_id;
    INSERT INTO public.audit_logs(actor_id, organization_id, action, entity_type, entity_id, metadata)
      SELECT NEW.customer_id, organization_id, 'consent_revoked', 'memory', NEW.memory_id,
        '{"channel":"live_wall"}'::jsonb FROM public.memories WHERE id = NEW.memory_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Historical consent/visibility was writable through insecure client flows. Do not
-- broadcast old photos based on those flags; reapproval and fresh consent are needed.
UPDATE public.memories SET visibility = 'private', updated_at = now() WHERE visibility <> 'private';
UPDATE public.memory_consents SET live_wall_consent = false, revoked_at = now()
  WHERE live_wall_consent = true;

-- Close broad legacy RLS paths. Client sessions can SELECT only authorized rows;
-- writes to visits, consent, pairing and media remain exclusively transactional RPC/server operations.
ALTER TABLE public.organization_members ADD CONSTRAINT members_branch_org_fk
  FOREIGN KEY (branch_id, organization_id) REFERENCES public.branches(id, organization_id) NOT VALID;
ALTER TABLE public.memories ADD CONSTRAINT memories_id_customer_unique UNIQUE (id, customer_id);
ALTER TABLE public.memory_consents ADD CONSTRAINT consents_memory_customer_fk
  FOREIGN KEY (memory_id, customer_id) REFERENCES public.memories(id, customer_id) NOT VALID;
ALTER TABLE public.screen_pairing_codes ADD CONSTRAINT pairing_branch_org_fk
  FOREIGN KEY (branch_id, organization_id) REFERENCES public.branches(id, organization_id) NOT VALID;

CREATE OR REPLACE FUNCTION public.can_access_branch(p_org uuid, p_branch uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m
    WHERE m.user_id = auth.uid() AND m.organization_id = p_org
      AND (m.branch_id IS NULL OR m.branch_id = p_branch));
$$;
CREATE OR REPLACE FUNCTION public.can_moderate_branch(p_org uuid, p_branch uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m
    WHERE m.user_id = auth.uid() AND m.organization_id = p_org
      AND m.role IN ('owner', 'admin', 'manager')
      AND (m.branch_id IS NULL OR m.branch_id = p_branch));
$$;
REVOKE ALL ON FUNCTION public.can_access_branch(uuid,uuid), public.can_moderate_branch(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_branch(uuid,uuid), public.can_moderate_branch(uuid,uuid) TO authenticated;

-- Tenant owners cannot undo a platform suspension with a direct table update.
DROP POLICY IF EXISTS "Organizations are updatable by admins" ON public.organizations;

DROP POLICY IF EXISTS "Branches are viewable by members" ON public.branches;
DROP POLICY IF EXISTS "Branches are manageable by admins" ON public.branches;
CREATE POLICY "Branches scoped to membership" ON public.branches FOR SELECT TO authenticated
  USING (public.can_access_branch(organization_id, id));
CREATE POLICY "Branches controlled by admins" ON public.branches FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Members viewable by org members" ON public.organization_members;
DROP POLICY IF EXISTS "Members manageable by admins" ON public.organization_members;
CREATE POLICY "Membership self or admin" ON public.organization_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_admin(auth.uid(), organization_id));
CREATE POLICY "Membership controlled by admins" ON public.organization_members FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Customers viewable by org members (visits)" ON public.customers;
DROP POLICY IF EXISTS "Customers viewable by themselves" ON public.customers;
DROP POLICY IF EXISTS "Customers updatable by themselves" ON public.customers;
CREATE OR REPLACE FUNCTION public.can_view_customer(p_customer uuid, p_auth_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_auth_user = auth.uid() OR EXISTS (
    SELECT 1 FROM public.visits v WHERE v.customer_id = p_customer
      AND public.can_access_branch(v.organization_id, v.branch_id));
$$;
REVOKE ALL ON FUNCTION public.can_view_customer(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_customer(uuid,uuid) TO authenticated;
CREATE POLICY "Customer self or visited branch member" ON public.customers FOR SELECT TO authenticated
  USING (public.can_view_customer(id, auth_user_id));
-- No direct customer profile UPDATE: it could change auth_user_id, taking over another identity.

DROP POLICY IF EXISTS "Visits viewable by org members" ON public.visits;
CREATE POLICY "Visits scoped to branch" ON public.visits FOR SELECT TO authenticated
  USING (public.can_access_branch(organization_id, branch_id));

DROP POLICY IF EXISTS "Memories viewable by org members" ON public.memories;
DROP POLICY IF EXISTS "Memories manageable by customer" ON public.memories;
DROP POLICY IF EXISTS "Memories manageable by members" ON public.memories;
CREATE POLICY "Memories scoped to branch" ON public.memories FOR SELECT TO authenticated
  USING (public.can_access_branch(organization_id, branch_id));
CREATE POLICY "Memories moderate by manager" ON public.memories FOR UPDATE TO authenticated
  USING (public.can_moderate_branch(organization_id, branch_id))
  WITH CHECK (public.can_moderate_branch(organization_id, branch_id));
REVOKE UPDATE ON public.memories FROM authenticated;
GRANT UPDATE(status) ON public.memories TO authenticated;

DROP POLICY IF EXISTS "Consents viewable by org members" ON public.memory_consents;
DROP POLICY IF EXISTS "Consents manageable by customer" ON public.memory_consents;
CREATE POLICY "Consent scoped to branch" ON public.memory_consents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.memories m WHERE m.id = memory_id
    AND public.can_access_branch(m.organization_id, m.branch_id)));

DROP POLICY IF EXISTS "Reward events viewable by org members" ON public.reward_events;
CREATE POLICY "Reward events scoped to branch" ON public.reward_events FOR SELECT TO authenticated
  USING (public.can_access_branch(organization_id, branch_id));
DROP POLICY IF EXISTS "QR codes viewable by members" ON public.qr_codes;
DROP POLICY IF EXISTS "QR codes manageable by admins" ON public.qr_codes;
DROP POLICY IF EXISTS "Reward rules manageable by admins" ON public.reward_rules;
CREATE POLICY "QR codes scoped to branch" ON public.qr_codes FOR SELECT TO authenticated
  USING (public.can_access_branch(organization_id, branch_id));
DROP POLICY IF EXISTS "Screens viewable by members" ON public.screens;
DROP POLICY IF EXISTS "Screens manageable by members" ON public.screens;
CREATE POLICY "Screens scoped to branch" ON public.screens FOR SELECT TO authenticated
  USING (public.can_access_branch(organization_id, branch_id));
DROP POLICY IF EXISTS "Pairing codes manageable by org admins" ON public.screen_pairing_codes;

-- Even if older Storage policies granted access, deny direct anonymous/authenticated access
-- to this bucket. Server-side service_role access bypasses these RLS policies.
CREATE POLICY "Private memory objects require server" ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (bucket_id <> 'memories') WITH CHECK (bucket_id <> 'memories');

-- A guest explicitly opens a venue before staff may inspect their identity or
-- issue/redeem visits there. This is a short-lived branch-scoped presence signal,
-- NOT purchase verification; staff still confirms the real-world transaction.
CREATE TABLE public.customer_checkins (
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, branch_id),
  FOREIGN KEY (branch_id, organization_id) REFERENCES public.branches(id, organization_id)
);
CREATE INDEX customer_checkins_recent_index ON public.customer_checkins(branch_id, checked_in_at DESC);
ALTER TABLE public.customer_checkins ENABLE ROW LEVEL SECURITY;
-- No direct client table policies; the definer resolves the caller's identity.
CREATE OR REPLACE FUNCTION public.check_in_customer(p_branch_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_customer uuid; v_org uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Guest authentication required' USING ERRCODE = '42501'; END IF;
  SELECT id INTO v_customer FROM public.customers WHERE auth_user_id = auth.uid() AND deleted_at IS NULL;
  SELECT b.organization_id INTO v_org FROM public.branches b
    JOIN public.organizations o ON o.id = b.organization_id AND o.status = 'active'
    WHERE b.id = p_branch_id AND b.status = 'active';
  IF v_customer IS NULL OR v_org IS NULL THEN
    RAISE EXCEPTION 'Guest or venue not found' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.customer_checkins(customer_id, organization_id, branch_id)
    VALUES (v_customer, v_org, p_branch_id)
    ON CONFLICT (customer_id, branch_id) DO UPDATE SET checked_in_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.check_in_customer(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_in_customer(uuid) TO authenticated;

-- A newly verified merchant may provision ONE organization, in a single transaction.
CREATE OR REPLACE FUNCTION public.provision_merchant(p_name text, p_slug text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := auth.uid(); v_org uuid;
BEGIN
  IF v_user IS NULL OR auth.role() <> 'authenticated'
     OR coalesce(auth.jwt()->>'is_anonymous', 'false') = 'true'
     OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_user AND u.email_confirmed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Verified merchant identity required' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  SELECT organization_id INTO v_org FROM public.organization_members WHERE user_id = v_user ORDER BY created_at LIMIT 1;
  IF v_org IS NOT NULL THEN RETURN v_org; END IF;
  IF length(trim(p_name)) NOT BETWEEN 2 AND 100 OR p_slug !~ '^[a-z0-9][a-z0-9-]{2,39}$' THEN
    RAISE EXCEPTION 'Invalid organization name or slug' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.users(id, email, name, role) VALUES (v_user, auth.jwt()->>'email', trim(p_name), 'user')
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.organizations(name, slug, country, currency, timezone)
    VALUES (trim(p_name), p_slug, 'EG', 'EGP', 'Africa/Cairo') RETURNING id INTO v_org;
  INSERT INTO public.branches(organization_id, name, slug, timezone)
    VALUES (v_org, trim(p_name), 'main', 'Africa/Cairo');
  INSERT INTO public.organization_members(organization_id, user_id, role)
    VALUES (v_org, v_user, 'owner');
  RETURN v_org;
END;
$$;
REVOKE ALL ON FUNCTION public.provision_merchant(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_merchant(text,text) TO authenticated;

-- Only a merchant with membership in the branch can issue a verified visit.
-- Lock on customer+branch serializes parallel requests, not just identical retry keys.
CREATE OR REPLACE FUNCTION public.record_verified_visit(p_customer_id uuid, p_branch_id uuid, p_idempotency_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_org uuid; v_visit public.visits%ROWTYPE; v_member public.organization_members%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Authentication and idempotency key required' USING ERRCODE = '42501';
  END IF;
  SELECT b.organization_id INTO v_org FROM public.branches b
    JOIN public.organizations o ON o.id = b.organization_id AND o.status = 'active'
    WHERE b.id = p_branch_id AND b.status = 'active';
  SELECT * INTO v_member FROM public.organization_members
    WHERE user_id = auth.uid() AND organization_id = v_org LIMIT 1;
  IF v_org IS NULL OR v_member.id IS NULL OR (v_member.branch_id IS NOT NULL AND v_member.branch_id <> p_branch_id) THEN
    RAISE EXCEPTION 'Not authorized for this branch' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Customer not found' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_customer_id::text || p_branch_id::text, 0));
  SELECT * INTO v_visit FROM public.visits WHERE organization_id = v_org AND idempotency_key = p_idempotency_key;
  IF v_visit.id IS NOT NULL THEN
    IF v_visit.customer_id <> p_customer_id OR v_visit.branch_id <> p_branch_id THEN
      RAISE EXCEPTION 'Idempotency key belongs to a different visit' USING ERRCODE = '22023';
    END IF;
    RETURN pg_catalog.jsonb_build_object('visitId', v_visit.id, 'replayed', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.customer_checkins c WHERE c.customer_id = p_customer_id
    AND c.organization_id = v_org AND c.branch_id = p_branch_id
    AND c.checked_in_at > now() - interval '2 hours') THEN
    RAISE EXCEPTION 'Guest check-in required for this branch' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.visits WHERE customer_id = p_customer_id AND branch_id = p_branch_id
    AND verification_status = 'verified' AND verified_at > now() - interval '1 hour') THEN
    RAISE EXCEPTION 'Visit cooldown active' USING ERRCODE = '23514';
  END IF;
  -- Attach a customer's most recent pending photo to this authorized purchase.
  SELECT * INTO v_visit FROM public.visits WHERE customer_id = p_customer_id AND branch_id = p_branch_id
    AND verification_status = 'pending' AND created_at > now() - interval '24 hours'
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF v_visit.id IS NOT NULL THEN
    UPDATE public.visits SET verification_status = 'verified', source = 'staff', verified_at = now(),
      idempotency_key = p_idempotency_key WHERE id = v_visit.id RETURNING * INTO v_visit;
  ELSE
    INSERT INTO public.visits(customer_id, organization_id, branch_id, source, verification_status, verified_at, idempotency_key)
      VALUES (p_customer_id, v_org, p_branch_id, 'staff', 'verified', now(), p_idempotency_key)
      RETURNING * INTO v_visit;
  END IF;
  RETURN pg_catalog.jsonb_build_object('visitId', v_visit.id, 'replayed', false);
END;
$$;
REVOKE ALL ON FUNCTION public.record_verified_visit(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_verified_visit(uuid,uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_customer_reward(
  p_customer_id uuid, p_branch_id uuid, p_reward_rule_id uuid, p_idempotency_key uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_org uuid; v_rule public.reward_rules%ROWTYPE; v_member public.organization_members%ROWTYPE;
        v_event public.reward_events%ROWTYPE; v_visits int; v_redeemed int;
BEGIN
  IF auth.uid() IS NULL OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Authentication and idempotency key required' USING ERRCODE = '42501';
  END IF;
  SELECT b.organization_id INTO v_org FROM public.branches b
    JOIN public.organizations o ON o.id = b.organization_id AND o.status = 'active'
    WHERE b.id = p_branch_id AND b.status = 'active';
  SELECT * INTO v_member FROM public.organization_members
    WHERE user_id = auth.uid() AND organization_id = v_org LIMIT 1;
  IF v_org IS NULL OR v_member.id IS NULL OR (v_member.branch_id IS NOT NULL AND v_member.branch_id <> p_branch_id) THEN
    RAISE EXCEPTION 'Not authorized for this branch' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_rule FROM public.reward_rules WHERE id = p_reward_rule_id AND organization_id = v_org
    AND is_active AND trigger_type = 'visit_count' AND threshold > 0
    AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()) FOR SHARE;
  IF v_rule.id IS NULL THEN RAISE EXCEPTION 'Reward rule not active' USING ERRCODE = '22023'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_customer_id::text || v_org::text || v_rule.id::text, 0));
  SELECT * INTO v_event FROM public.reward_events WHERE idempotency_key = p_idempotency_key::text;
  IF v_event.id IS NOT NULL THEN
    IF v_event.customer_id <> p_customer_id OR v_event.organization_id <> v_org OR v_event.reference_id <> v_rule.id OR v_event.type <> 'reward_redeemed' THEN
      RAISE EXCEPTION 'Idempotency key belongs to another redemption' USING ERRCODE = '22023';
    END IF;
    RETURN pg_catalog.jsonb_build_object('rewardEventId', v_event.id, 'replayed', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.customer_checkins c WHERE c.customer_id = p_customer_id
    AND c.organization_id = v_org AND c.branch_id = p_branch_id
    AND c.checked_in_at > now() - interval '2 hours') THEN
    RAISE EXCEPTION 'Guest check-in required for this branch' USING ERRCODE = '42501';
  END IF;
  SELECT count(*) INTO v_visits FROM public.visits WHERE customer_id = p_customer_id
    AND organization_id = v_org AND verification_status = 'verified';
  SELECT count(*) INTO v_redeemed FROM public.reward_events WHERE customer_id = p_customer_id
    AND organization_id = v_org AND type = 'reward_redeemed' AND reference_id = v_rule.id;
  IF v_redeemed >= v_visits / v_rule.threshold THEN
    RAISE EXCEPTION 'Insufficient verified visits' USING ERRCODE = '23514';
  END IF;
  INSERT INTO public.reward_events(customer_id, organization_id, branch_id, type, value, reference_type, reference_id, idempotency_key)
    VALUES (p_customer_id, v_org, p_branch_id, 'reward_redeemed', 1, 'reward_rules', v_rule.id, p_idempotency_key::text)
    RETURNING * INTO v_event;
  RETURN pg_catalog.jsonb_build_object('rewardEventId', v_event.id, 'replayed', false, 'rewardName', v_rule.name, 'redeemedAt', v_event.created_at);
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_customer_reward(uuid,uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_customer_reward(uuid,uuid,uuid,uuid) TO authenticated;

-- The guest may submit a memory, but this only creates a PENDING visit (not a stamp).
-- The uploaded object keys are scoped to the guest, and DB rows + consent are atomic.
CREATE OR REPLACE FUNCTION public.create_customer_memory(
  p_customer_id uuid, p_branch_id uuid, p_original_key text, p_optimized_key text, p_thumbnail_key text,
  p_caption text, p_live_wall_consent boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_customer uuid; v_org uuid; v_visit uuid; v_memory uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501'; END IF;
  SELECT id INTO v_customer FROM public.customers WHERE id = p_customer_id AND auth_user_id IS NOT NULL AND deleted_at IS NULL;
  SELECT b.organization_id INTO v_org FROM public.branches b
    JOIN public.organizations o ON o.id = b.organization_id AND o.status = 'active'
    WHERE b.id = p_branch_id AND b.status = 'active';
  IF v_customer IS NULL OR v_org IS NULL OR length(coalesce(p_caption, '')) > 280
    OR p_original_key NOT LIKE v_org::text || '/' || v_customer::text || '/%'
    OR p_optimized_key NOT LIKE v_org::text || '/' || v_customer::text || '/%'
    OR p_thumbnail_key NOT LIKE v_org::text || '/' || v_customer::text || '/%' THEN
    RAISE EXCEPTION 'Invalid memory or venue' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_customer::text || 'memory', 0));
  IF (SELECT count(*) FROM public.memories WHERE customer_id = v_customer
      AND created_at > now() - interval '24 hours') >= 20 THEN
    RAISE EXCEPTION 'Daily memory limit reached' USING ERRCODE = '23514';
  END IF;
  INSERT INTO public.visits(customer_id, organization_id, branch_id, source, verification_status)
    VALUES (v_customer, v_org, p_branch_id, 'table', 'pending') RETURNING id INTO v_visit;
  INSERT INTO public.memories(customer_id, organization_id, branch_id, visit_id, original_url, optimized_url,
    thumbnail_url, caption, status, visibility)
    VALUES (v_customer, v_org, p_branch_id, v_visit, p_original_key, p_optimized_key,
    p_thumbnail_key, p_caption, 'pending', (CASE WHEN p_live_wall_consent THEN 'live_wall' ELSE 'private' END)::public.memory_visibility)
    RETURNING id INTO v_memory;
  INSERT INTO public.memory_consents(memory_id, customer_id, save_consent, live_wall_consent)
    VALUES (v_memory, v_customer, true, coalesce(p_live_wall_consent, false));
  RETURN v_memory;
END;
$$;
REVOKE ALL ON FUNCTION public.create_customer_memory(uuid,uuid,text,text,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_customer_memory(uuid,uuid,text,text,text,text,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.set_customer_wall_consent(p_memory_id uuid, p_consent boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_customer uuid;
BEGIN
  SELECT id INTO v_customer FROM public.customers WHERE auth_user_id = auth.uid() AND deleted_at IS NULL;
  IF v_customer IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  UPDATE public.memory_consents SET live_wall_consent = p_consent,
    revoked_at = CASE WHEN p_consent THEN NULL ELSE now() END
    WHERE memory_id = p_memory_id AND customer_id = v_customer;
  IF NOT FOUND THEN RAISE EXCEPTION 'Memory not owned by customer' USING ERRCODE = '42501'; END IF;
  UPDATE public.memories SET visibility = (CASE WHEN p_consent THEN 'live_wall' ELSE 'private' END)::public.memory_visibility,
    updated_at = now() WHERE id = p_memory_id AND customer_id = v_customer;
END;
$$;
REVOKE ALL ON FUNCTION public.set_customer_wall_consent(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_customer_wall_consent(uuid,boolean) TO authenticated;

-- Only server-validated QR redirects should increment; this RPC does not expose other rows.
CREATE OR REPLACE FUNCTION public.record_qr_scan(p_slug text)
RETURNS TABLE(qr_id uuid, org_slug text, branch_slug text, qr_source public.qr_source)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN QUERY UPDATE public.qr_codes q SET scan_count = scan_count + 1, updated_at = now()
    FROM public.branches b, public.organizations o
    WHERE q.slug = p_slug AND q.is_active AND q.branch_id = b.id AND q.organization_id = b.organization_id
      AND b.organization_id = o.id AND b.status = 'active' AND o.status = 'active'
    RETURNING q.id, o.slug, b.slug, q.source;
END;
$$;
REVOKE ALL ON FUNCTION public.record_qr_scan(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_qr_scan(text) TO service_role;

-- A screen token is issued once to the display; only its hash is stored.
ALTER TABLE public.screen_pairing_codes ALTER COLUMN code TYPE varchar(8);
DELETE FROM public.screen_pairing_codes p USING public.screen_pairing_codes older
  WHERE p.code = older.code AND p.id > older.id;
CREATE UNIQUE INDEX IF NOT EXISTS screen_pairing_code_unique ON public.screen_pairing_codes(code);
CREATE TABLE IF NOT EXISTS public.screen_pairing_attempts (
  ip_hash text PRIMARY KEY, attempts integer NOT NULL DEFAULT 0, reset_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.screen_pairing_attempts ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS screens_token_unique ON public.screens(device_token) WHERE device_token IS NOT NULL;
CREATE OR REPLACE FUNCTION public.consume_screen_pairing(p_code text, p_token_hash text, p_ip_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_attempts int; v_code public.screen_pairing_codes%ROWTYPE; v_screen uuid;
BEGIN
  IF auth.role() <> 'service_role' OR length(p_code) <> 8 OR length(p_ip_hash) <> 64 OR length(p_token_hash) <> 64 THEN
    RAISE EXCEPTION 'Invalid pairing request' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.screen_pairing_attempts(ip_hash, attempts, reset_at)
    VALUES (p_ip_hash, 0, now() + interval '10 minutes') ON CONFLICT (ip_hash) DO NOTHING;
  SELECT attempts INTO v_attempts FROM public.screen_pairing_attempts WHERE ip_hash = p_ip_hash FOR UPDATE;
  UPDATE public.screen_pairing_attempts SET attempts = CASE WHEN reset_at < now() THEN 1 ELSE attempts + 1 END,
    reset_at = CASE WHEN reset_at < now() THEN now() + interval '10 minutes' ELSE reset_at END
    WHERE ip_hash = p_ip_hash RETURNING attempts INTO v_attempts;
  -- Return normally so the failed-attempt counter COMMITs; raising would roll it back.
  IF v_attempts > 5 THEN RETURN NULL; END IF;
  SELECT p.* INTO v_code FROM public.screen_pairing_codes p
    JOIN public.branches b ON b.id = p.branch_id AND b.organization_id = p.organization_id AND b.status = 'active'
    JOIN public.organizations o ON o.id = p.organization_id AND o.status = 'active'
    WHERE p.code = p_code AND NOT p.is_used AND p.expires_at > now() FOR UPDATE OF p;
  IF v_code.id IS NULL THEN RETURN NULL; END IF;
  UPDATE public.screen_pairing_codes SET is_used = true WHERE id = v_code.id;
  INSERT INTO public.screens(organization_id, branch_id, name, device_token, status, last_heartbeat_at)
    VALUES (v_code.organization_id, v_code.branch_id, coalesce(v_code.screen_name, 'Live Wall'), p_token_hash, 'online', now())
    RETURNING id INTO v_screen;
  RETURN v_screen;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_screen_pairing(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_screen_pairing(text,text,text) TO service_role;

-- Keep original media private. Migrating previously public objects and CDN caches requires an ops runbook.
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('memories', 'memories', false, 10485760, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE INDEX IF NOT EXISTS visits_org_created_index ON public.visits(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS memories_org_status_created_index ON public.memories(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS reward_events_org_created_index ON public.reward_events(organization_id, created_at DESC);

-- Summary is calculated in PostgreSQL, never by loading every tenant's rows into Node.
CREATE OR REPLACE FUNCTION public.merchant_overview(p_organization_id uuid, p_branch_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_today timestamptz; v_timezone text;
        v_visits int; v_unique int; v_memories int; v_pending int; v_rewards int; v_screens int; v_online int;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.organization_members m
      JOIN public.organizations o ON o.id = m.organization_id AND o.status = 'active'
      WHERE m.user_id = auth.uid() AND m.organization_id = p_organization_id
      AND (m.branch_id IS NULL OR (p_branch_id IS NOT NULL AND m.branch_id = p_branch_id))
  ) THEN RAISE EXCEPTION 'Organization membership required' USING ERRCODE = '42501'; END IF;
  SELECT timezone INTO v_timezone FROM public.organizations WHERE id = p_organization_id;
  IF p_branch_id IS NOT NULL THEN
    SELECT timezone INTO v_timezone FROM public.branches
      WHERE id = p_branch_id AND organization_id = p_organization_id;
    IF v_timezone IS NULL THEN RAISE EXCEPTION 'Branch not found' USING ERRCODE = '22023'; END IF;
  END IF;
  v_today := date_trunc('day', now() AT TIME ZONE v_timezone) AT TIME ZONE v_timezone;
  SELECT count(*), count(DISTINCT customer_id) INTO v_visits, v_unique FROM public.visits
    WHERE organization_id = p_organization_id AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND verification_status = 'verified' AND verified_at >= v_today;
  SELECT count(*) FILTER (WHERE created_at >= v_today), count(*) FILTER (WHERE status = 'pending')
    INTO v_memories, v_pending FROM public.memories WHERE organization_id = p_organization_id
      AND (p_branch_id IS NULL OR branch_id = p_branch_id);
  SELECT count(*) INTO v_rewards FROM public.reward_events WHERE organization_id = p_organization_id
    AND (p_branch_id IS NULL OR branch_id = p_branch_id) AND type = 'reward_redeemed' AND created_at >= v_today;
  SELECT count(*), count(*) FILTER (WHERE last_heartbeat_at > now() - interval '2 minutes' AND status = 'online')
    INTO v_screens, v_online FROM public.screens WHERE organization_id = p_organization_id
      AND (p_branch_id IS NULL OR branch_id = p_branch_id);
  RETURN pg_catalog.jsonb_build_object(
    'today', pg_catalog.jsonb_build_object('visits', v_visits, 'uniqueCustomers', v_unique,
      'additionalVisits', greatest(0, v_visits - v_unique), 'newMemories', v_memories, 'rewardsRedeemed', v_rewards),
    'attentionCenter', pg_catalog.jsonb_build_object('pendingMemories', v_pending, 'offlineScreens', v_screens - v_online),
    'liveWall', pg_catalog.jsonb_build_object('totalScreens', v_screens, 'onlineScreens', v_online)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.merchant_overview(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merchant_overview(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.configure_visit_reward(p_organization_id uuid, p_name text, p_threshold int)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_rule uuid;
BEGIN
  IF auth.uid() IS NULL OR p_threshold NOT BETWEEN 2 AND 30 OR length(trim(p_name)) NOT BETWEEN 2 AND 100
     OR NOT EXISTS (SELECT 1 FROM public.organization_members m
       JOIN public.organizations o ON o.id = m.organization_id AND o.status = 'active'
       WHERE m.user_id = auth.uid() AND m.organization_id = p_organization_id
       AND m.branch_id IS NULL AND m.role IN ('owner', 'admin', 'manager')) THEN
    RAISE EXCEPTION 'Not authorized or invalid reward' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text, 0));
  SELECT id INTO v_rule FROM public.reward_rules WHERE organization_id = p_organization_id
    AND trigger_type = 'visit_count' AND is_active ORDER BY created_at LIMIT 1 FOR UPDATE;
  IF v_rule IS NULL THEN
    INSERT INTO public.reward_rules(organization_id, name, threshold, trigger_type, reward_type)
      VALUES (p_organization_id, trim(p_name), p_threshold, 'visit_count', 'free_item') RETURNING id INTO v_rule;
  ELSE
    UPDATE public.reward_rules SET name = trim(p_name), threshold = p_threshold,
      starts_at = now(), ends_at = NULL, updated_at = now() WHERE id = v_rule;
  END IF;
  RETURN v_rule;
END;
$$;
REVOKE ALL ON FUNCTION public.configure_visit_reward(uuid,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.configure_visit_reward(uuid,text,integer) TO authenticated;
