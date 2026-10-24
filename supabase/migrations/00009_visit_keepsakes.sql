-- A confirmed stamp can have one optional customer-phone photo. Earned keepsakes
-- snapshot their verified visits and the promised reward, so changing a rule later
-- never rearranges a customer's printed or digital cards. No image is made public.
CREATE TABLE public.keepsake_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reward_rule_id uuid REFERENCES public.reward_rules(id) ON DELETE SET NULL,
  reward_name text NOT NULL,
  sequence_number integer NOT NULL CHECK (sequence_number > 0),
  threshold integer NOT NULL CHECK (threshold BETWEEN 2 AND 30),
  visit_ids uuid[] NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  redeemed_at timestamptz,
  redemption_event_id uuid UNIQUE REFERENCES public.reward_events(id) ON DELETE SET NULL,
  CONSTRAINT keepsake_visit_count CHECK (cardinality(visit_ids) = threshold),
  CONSTRAINT keepsake_sequence_unique UNIQUE (customer_id, organization_id, sequence_number)
);
CREATE INDEX memories_visit_lookup_index ON public.memories(visit_id, created_at DESC)
  WHERE deleted_at IS NULL AND status <> 'deleted';
ALTER TABLE public.keepsake_cards ENABLE ROW LEVEL SECURITY;
-- No authenticated or merchant-facing SELECT policy. The customer-only API first
-- resolves the JWT's customer ID, then reads with a server-side service client.
REVOKE ALL ON public.keepsake_cards FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.keepsake_cards TO service_role;

-- Serialize card allocation on the customer row across *all* branches. Visits
-- already have to be verified by staff; a pending photo never earns a card.
CREATE FUNCTION public.ensure_keepsake_cards(p_customer_id uuid, p_organization_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_rule public.reward_rules%ROWTYPE; v_visits uuid[]; v_sequence integer;
BEGIN
  PERFORM 1 FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO v_rule FROM public.reward_rules
    WHERE organization_id = p_organization_id AND is_active AND trigger_type = 'visit_count'
      AND threshold BETWEEN 2 AND 30 AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now())
    ORDER BY created_at, id LIMIT 1;
  IF v_rule.id IS NULL THEN RETURN; END IF;
  LOOP
    SELECT array_agg(v.id ORDER BY v.verified_at, v.id) INTO v_visits FROM (
      SELECT visit.id, visit.verified_at FROM public.visits visit
        WHERE visit.customer_id = p_customer_id AND visit.organization_id = p_organization_id
          AND visit.verification_status = 'verified' AND visit.verified_at IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.keepsake_cards card
            WHERE card.customer_id = p_customer_id AND card.organization_id = p_organization_id
              AND visit.id = ANY(card.visit_ids))
        ORDER BY visit.verified_at, visit.id LIMIT v_rule.threshold
    ) v;
    EXIT WHEN coalesce(cardinality(v_visits), 0) <> v_rule.threshold;
    SELECT coalesce(max(sequence_number), 0) + 1 INTO v_sequence FROM public.keepsake_cards
      WHERE customer_id = p_customer_id AND organization_id = p_organization_id;
    INSERT INTO public.keepsake_cards(customer_id, organization_id, reward_rule_id,
      reward_name, sequence_number, threshold, visit_ids, unlocked_at)
      VALUES (p_customer_id, p_organization_id, v_rule.id, v_rule.name, v_sequence,
        v_rule.threshold, v_visits,
        (SELECT max(verified_at) FROM public.visits WHERE id = ANY(v_visits)));
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_keepsake_cards(uuid,uuid) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.snapshot_verified_visit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.verification_status = 'verified'
    AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'verified') THEN
    PERFORM public.ensure_keepsake_cards(NEW.customer_id, NEW.organization_id);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.snapshot_verified_visit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER snapshot_keepsake_after_stamp
  AFTER INSERT OR UPDATE OF verification_status ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_verified_visit();

-- If a reward is configured after genuine visits, allocate their earned cards;
-- for later threshold edits, only *unallocated* visits use the new threshold.
CREATE FUNCTION public.snapshot_visits_after_reward_config() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_customer record;
BEGIN
  IF NEW.is_active AND NEW.trigger_type = 'visit_count' THEN
    FOR v_customer IN SELECT DISTINCT customer_id FROM public.visits
      WHERE organization_id = NEW.organization_id AND verification_status = 'verified'
    LOOP
      PERFORM public.ensure_keepsake_cards(v_customer.customer_id, NEW.organization_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.snapshot_visits_after_reward_config() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER snapshot_keepsake_after_reward_config
  AFTER INSERT OR UPDATE OF threshold, name, is_active, starts_at, ends_at ON public.reward_rules
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_visits_after_reward_config();

-- Backfill only audited verified visits from earlier migrations. Suspicious or
-- pending rows are never upgraded or awarded a photobooth card.
DO $$ DECLARE v_pair record;
BEGIN
  FOR v_pair IN SELECT DISTINCT customer_id, organization_id FROM public.visits
    WHERE verification_status = 'verified' AND verified_at IS NOT NULL
  LOOP
    PERFORM public.ensure_keepsake_cards(v_pair.customer_id, v_pair.organization_id);
  END LOOP;
END $$;

CREATE FUNCTION public.mark_keepsake_redeemed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_card uuid;
BEGIN
  IF NEW.type <> 'reward_redeemed' OR NEW.reference_type IS DISTINCT FROM 'reward_rules'
    OR NOT EXISTS (SELECT 1 FROM public.reward_rules rule
      WHERE rule.id = NEW.reference_id AND rule.organization_id = NEW.organization_id
        AND rule.trigger_type = 'visit_count') THEN RETURN NEW; END IF;
  SELECT id INTO v_card FROM public.keepsake_cards
    WHERE customer_id = NEW.customer_id AND organization_id = NEW.organization_id
      AND redeemed_at IS NULL ORDER BY sequence_number LIMIT 1 FOR UPDATE;
  IF v_card IS NULL THEN
    RAISE EXCEPTION 'Insufficient verified visits' USING ERRCODE = '23514';
  END IF;
  UPDATE public.keepsake_cards SET redeemed_at = NEW.created_at, redemption_event_id = NEW.id
    WHERE id = v_card;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_keepsake_redeemed() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER redeem_keepsake_after_reward
  AFTER INSERT ON public.reward_events FOR EACH ROW
  EXECUTE FUNCTION public.mark_keepsake_redeemed();

-- Match prior genuine redemptions to earned cards in chronological order. An
-- anomalous historical event without a verified card is left for audit, not
-- used to forge a card.
DO $$ DECLARE v_event record; v_card uuid;
BEGIN
  FOR v_event IN SELECT event.id, event.customer_id, event.organization_id, event.created_at
    FROM public.reward_events event JOIN public.reward_rules rule
      ON rule.id = event.reference_id AND rule.organization_id = event.organization_id
      AND rule.trigger_type = 'visit_count'
    WHERE event.type = 'reward_redeemed' AND event.reference_type = 'reward_rules'
    ORDER BY event.created_at, event.id
  LOOP
    SELECT card.id INTO v_card FROM public.keepsake_cards card
      WHERE card.customer_id = v_event.customer_id AND card.organization_id = v_event.organization_id
        AND card.redeemed_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM public.visits visit
          WHERE visit.id = ANY(card.visit_ids) AND visit.verified_at > v_event.created_at)
      ORDER BY card.sequence_number LIMIT 1;
    IF v_card IS NOT NULL THEN
      UPDATE public.keepsake_cards SET redeemed_at = v_event.created_at,
        redemption_event_id = v_event.id WHERE id = v_card;
    END IF;
  END LOOP;
END $$;

-- The service-role route has already checked the caller's Supabase user and
-- venue. This function independently proves the visit belongs to that customer,
-- is staff-verified, and does not already have an active photo. The row lock
-- prevents two parallel uploads from claiming the same stamp.
CREATE FUNCTION public.attach_verified_visit_memory(
  p_customer_id uuid, p_visit_id uuid, p_original_key text, p_optimized_key text,
  p_thumbnail_key text, p_caption text, p_live_wall_consent boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_visit public.visits%ROWTYPE; v_memory uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_customer_id::text || 'memory', 0));
  SELECT v.* INTO v_visit FROM public.visits v
    JOIN public.customers c ON c.id = v.customer_id AND c.auth_user_id IS NOT NULL AND c.deleted_at IS NULL
    JOIN public.organizations o ON o.id = v.organization_id AND o.status = 'active'
    WHERE v.id = p_visit_id AND v.customer_id = p_customer_id
      AND v.verification_status = 'verified' AND v.verified_at IS NOT NULL
    FOR UPDATE OF v;
  IF v_visit.id IS NULL THEN
    RAISE EXCEPTION 'Verified visit not found for customer' USING ERRCODE = '42501';
  END IF;
  IF length(coalesce(p_caption, '')) > 280
    OR p_original_key NOT LIKE v_visit.organization_id::text || '/' || p_customer_id::text || '/%'
    OR p_optimized_key NOT LIKE v_visit.organization_id::text || '/' || p_customer_id::text || '/%'
    OR p_thumbnail_key NOT LIKE v_visit.organization_id::text || '/' || p_customer_id::text || '/%' THEN
    RAISE EXCEPTION 'Invalid photo or venue' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.memories WHERE visit_id = v_visit.id
    AND deleted_at IS NULL AND status <> 'deleted') THEN
    RAISE EXCEPTION 'Visit already has a photo' USING ERRCODE = '23505';
  END IF;
  IF (SELECT count(*) FROM public.memories WHERE customer_id = p_customer_id
    AND created_at > now() - interval '24 hours') >= 20 THEN
    RAISE EXCEPTION 'Daily memory limit reached' USING ERRCODE = '23514';
  END IF;
  INSERT INTO public.memories(customer_id, organization_id, branch_id, visit_id,
      original_url, optimized_url, thumbnail_url, caption, status, visibility)
    VALUES (p_customer_id, v_visit.organization_id, v_visit.branch_id, v_visit.id,
      p_original_key, p_optimized_key, p_thumbnail_key, p_caption, 'pending',
      (CASE WHEN p_live_wall_consent THEN 'live_wall' ELSE 'private' END)::public.memory_visibility)
    RETURNING id INTO v_memory;
  INSERT INTO public.memory_consents(memory_id, customer_id, save_consent, live_wall_consent)
    VALUES (v_memory, p_customer_id, true, coalesce(p_live_wall_consent, false));
  RETURN v_memory;
END;
$$;
REVOKE ALL ON FUNCTION public.attach_verified_visit_memory(uuid,uuid,text,text,text,text,boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_verified_visit_memory(uuid,uuid,text,text,text,text,boolean)
  TO service_role;

-- Balance is based on immutable earned cards, not re-dividing all historical
-- visits by a rule that a merchant might have changed since the reward was won.
CREATE FUNCTION public.get_keepsake_balance(p_customer_id uuid, p_organization_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_result jsonb;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501';
  END IF;
  SELECT pg_catalog.jsonb_build_object(
    'usedVisits', coalesce(sum(threshold), 0)::int,
    'availableRewards', count(*) FILTER (WHERE redeemed_at IS NULL)::int,
    'oldestRewardName', (SELECT pending.reward_name FROM public.keepsake_cards pending
      WHERE pending.customer_id = p_customer_id AND pending.organization_id = p_organization_id
        AND pending.redeemed_at IS NULL ORDER BY pending.sequence_number LIMIT 1))
    INTO v_result FROM public.keepsake_cards
    WHERE customer_id = p_customer_id AND organization_id = p_organization_id;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_keepsake_balance(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_keepsake_balance(uuid,uuid) TO service_role;

-- Show the customer's newest stamps without an active photo, regardless of
-- how many newer photographed visits exist. Never rely on a recent-N scan of
-- all visits to decide whether the customer can still add an older memory.
CREATE FUNCTION public.list_unpictured_verified_visits(
  p_customer_id uuid, p_organization_id uuid, p_limit integer
) RETURNS TABLE(visit_id uuid, branch_id uuid, verified_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 60 THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT v.id, v.branch_id, v.verified_at FROM public.visits v
    WHERE v.customer_id = p_customer_id AND v.organization_id = p_organization_id
      AND v.verification_status = 'verified' AND v.verified_at IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.memories m WHERE m.visit_id = v.id
        AND m.deleted_at IS NULL AND m.status <> 'deleted')
    ORDER BY v.verified_at DESC, v.id DESC LIMIT p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.list_unpictured_verified_visits(uuid,uuid,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_unpictured_verified_visits(uuid,uuid,integer)
  TO service_role;

-- Keep staff authorization, short-lived check-in and idempotency from 00003;
-- consume the oldest completed card instead of a mutable visit/threshold ratio.
CREATE OR REPLACE FUNCTION public.redeem_customer_reward(
  p_customer_id uuid, p_branch_id uuid, p_reward_rule_id uuid, p_idempotency_key uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_org uuid; v_rule public.reward_rules%ROWTYPE; v_member public.organization_members%ROWTYPE;
        v_event public.reward_events%ROWTYPE; v_card public.keepsake_cards%ROWTYPE;
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
  -- The AFTER INSERT trigger associates this event with that same oldest card.
  RETURN pg_catalog.jsonb_build_object('rewardEventId', v_event.id, 'keepsakeCardId', v_card.id,
    'replayed', false, 'rewardName', v_card.reward_name, 'redeemedAt', v_event.created_at);
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_customer_reward(uuid,uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_customer_reward(uuid,uuid,uuid,uuid) TO authenticated;
