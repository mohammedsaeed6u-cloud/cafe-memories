-- 00011_remediate_legacy_policies.sql
-- Remediate loose legacy RLS policies and harden verified visit/redemption RPCs for staff sessions.

-- 1. Drop loose legacy visits policies
DROP POLICY IF EXISTS "Visits insertable by visitors" ON public.visits;
DROP POLICY IF EXISTS "Customers can register checkins" ON public.visits;

-- 2. Drop loose legacy memories policies
DROP POLICY IF EXISTS "Memories insertable by visitors" ON public.memories;
DROP POLICY IF EXISTS "Customers can upload memories" ON public.memories;
DROP POLICY IF EXISTS "Approved memories viewable on wall" ON public.memories;

-- 3. Drop loose legacy customers policies
DROP POLICY IF EXISTS "Customers can be created by visitors" ON public.customers;
DROP POLICY IF EXISTS "Customers viewable by anonymous_id" ON public.customers;
DROP POLICY IF EXISTS "Customers updatable by anonymous_id" ON public.customers;

-- 4. Drop loose legacy wallet_pass_links policies
DROP POLICY IF EXISTS "Wallet pass links viewable by all" ON public.wallet_pass_links;
DROP POLICY IF EXISTS "Wallet pass links insertable by all" ON public.wallet_pass_links;
DROP POLICY IF EXISTS "Wallet pass links updatable by all" ON public.wallet_pass_links;
DROP POLICY IF EXISTS "Wallet links readable and writable" ON public.wallet_pass_links;

-- 5. Drop loose legacy organizations and branches policies
DROP POLICY IF EXISTS "Active organizations are viewable by anyone" ON public.organizations;
DROP POLICY IF EXISTS "Public organizations are readable" ON public.organizations;
DROP POLICY IF EXISTS "Organizations insertable during onboarding" ON public.organizations;
DROP POLICY IF EXISTS "Active branches are viewable by anyone" ON public.branches;
DROP POLICY IF EXISTS "Public branches are readable" ON public.branches;

-- 6. Hardened record_verified_visit function supporting both authenticated merchants and verified staff terminal sessions
CREATE OR REPLACE FUNCTION public.record_verified_visit(p_customer_id uuid, p_branch_id uuid, p_idempotency_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_org uuid; v_visit public.visits%ROWTYPE; v_member public.organization_members%ROWTYPE;
BEGIN
  -- Authenticated user OR service_role (authorized server route verifying HMAC staff session)
  IF (auth.uid() IS NULL AND coalesce(auth.role(), '') <> 'service_role') OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Authentication and idempotency key required' USING ERRCODE = '42501';
  END IF;

  SELECT b.organization_id INTO v_org FROM public.branches b
    JOIN public.organizations o ON o.id = b.organization_id AND o.status = 'active'
    WHERE b.id = p_branch_id AND b.status = 'active';

  IF auth.uid() IS NOT NULL THEN
    SELECT * INTO v_member FROM public.organization_members
      WHERE user_id = auth.uid() AND organization_id = v_org LIMIT 1;
    IF v_org IS NULL OR v_member.id IS NULL OR (v_member.branch_id IS NOT NULL AND v_member.branch_id <> p_branch_id) THEN
      RAISE EXCEPTION 'Not authorized for this branch' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF v_org IS NULL THEN
      RAISE EXCEPTION 'Branch not found or inactive' USING ERRCODE = '42501';
    END IF;
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
GRANT EXECUTE ON FUNCTION public.record_verified_visit(uuid,uuid,uuid) TO authenticated, service_role;

-- 7. Keepsakes-aware redeem_customer_reward function supporting both merchants and service_role
CREATE OR REPLACE FUNCTION public.redeem_customer_reward(
  p_customer_id uuid, p_branch_id uuid, p_reward_rule_id uuid, p_idempotency_key uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_org uuid; v_rule public.reward_rules%ROWTYPE; v_member public.organization_members%ROWTYPE;
        v_event public.reward_events%ROWTYPE; v_card public.keepsake_cards%ROWTYPE;
BEGIN
  IF (auth.uid() IS NULL AND coalesce(auth.role(), '') <> 'service_role') OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Authentication and idempotency key required' USING ERRCODE = '42501';
  END IF;

  SELECT b.organization_id INTO v_org FROM public.branches b
    JOIN public.organizations o ON o.id = b.organization_id AND o.status = 'active'
    WHERE b.id = p_branch_id AND b.status = 'active';

  IF auth.uid() IS NOT NULL THEN
    SELECT * INTO v_member FROM public.organization_members
      WHERE user_id = auth.uid() AND organization_id = v_org LIMIT 1;
    IF v_org IS NULL OR v_member.id IS NULL OR (v_member.branch_id IS NOT NULL AND v_member.branch_id <> p_branch_id) THEN
      RAISE EXCEPTION 'Not authorized for this branch' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF v_org IS NULL THEN
      RAISE EXCEPTION 'Branch not found or inactive' USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT * INTO v_rule FROM public.reward_rules WHERE id = p_reward_rule_id AND organization_id = v_org
    AND is_active AND trigger_type = 'visit_count' AND threshold > 0
    AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()) FOR SHARE;
  IF v_rule.id IS NULL THEN RAISE EXCEPTION 'Reward rule not active' USING ERRCODE = '22023'; END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_customer_id::text || v_org::text || v_rule.id::text, 0));

  SELECT * INTO v_event FROM public.reward_events WHERE idempotency_key = p_idempotency_key::text;
  IF v_event.id IS NOT NULL THEN
    IF v_event.customer_id <> p_customer_id OR v_event.organization_id <> v_org
       OR v_event.reference_id <> v_rule.id OR v_event.type <> 'reward_redeemed' THEN
      RAISE EXCEPTION 'Idempotency key belongs to another redemption' USING ERRCODE = '22023';
    END IF;
    RETURN pg_catalog.jsonb_build_object('rewardEventId', v_event.id, 'replayed', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.customer_checkins c WHERE c.customer_id = p_customer_id
    AND c.organization_id = v_org AND c.branch_id = p_branch_id
    AND c.checked_in_at > now() - interval '2 hours') THEN
    RAISE EXCEPTION 'Guest check-in required for this branch' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_card FROM public.keepsake_cards
    WHERE customer_id = p_customer_id AND organization_id = v_org AND redeemed_at IS NULL
    ORDER BY sequence_number LIMIT 1 FOR UPDATE;
  IF v_card.id IS NULL THEN
    RAISE EXCEPTION 'Insufficient verified visits' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.reward_events(customer_id, organization_id, branch_id, type, value,
      reference_type, reference_id, idempotency_key)
    VALUES (p_customer_id, v_org, p_branch_id, 'reward_redeemed', 1,
      'reward_rules', v_rule.id, p_idempotency_key::text)
    RETURNING * INTO v_event;

  RETURN pg_catalog.jsonb_build_object('rewardEventId', v_event.id, 'keepsakeCardId', v_card.id,
    'replayed', false, 'rewardName', v_card.reward_name, 'redeemedAt', v_event.created_at);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_customer_reward(uuid,uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_customer_reward(uuid,uuid,uuid,uuid) TO authenticated, service_role;
