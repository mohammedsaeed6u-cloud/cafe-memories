-- Private photos must never leak into the merchant CRM, moderation queue or
-- direct PostgREST queries unless their owner explicitly submitted them to
-- this venue's wall. A public screen still additionally needs approval.
CREATE OR REPLACE FUNCTION public.can_view_customer(p_customer uuid, p_auth_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_auth_user = auth.uid() OR EXISTS (
    SELECT 1 FROM public.visits v WHERE v.customer_id = p_customer
      AND v.verification_status = 'verified'
      AND public.can_access_branch(v.organization_id, v.branch_id));
$$;

DROP POLICY IF EXISTS "Visits scoped to branch" ON public.visits;
CREATE POLICY "Verified visits scoped to branch" ON public.visits FOR SELECT TO authenticated
  USING (verification_status = 'verified' AND public.can_access_branch(organization_id, branch_id));

CREATE FUNCTION public.can_review_wall_submission(p_memory uuid, p_org uuid, p_branch uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.can_access_branch(p_org, p_branch) AND EXISTS (
    SELECT 1 FROM public.memory_consents c WHERE c.memory_id = p_memory
      AND c.live_wall_consent = true AND c.revoked_at IS NULL);
$$;
REVOKE ALL ON FUNCTION public.can_review_wall_submission(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_review_wall_submission(uuid,uuid,uuid) TO authenticated;

DROP POLICY IF EXISTS "Memories scoped to branch" ON public.memories;
DROP POLICY IF EXISTS "Memories moderate by manager" ON public.memories;
CREATE POLICY "Only submitted memories visible to merchants" ON public.memories FOR SELECT TO authenticated
  USING (visibility = 'live_wall' AND deleted_at IS NULL AND status <> 'deleted'
    AND public.can_review_wall_submission(id, organization_id, branch_id));
CREATE POLICY "Only submitted memories moderate by manager" ON public.memories FOR UPDATE TO authenticated
  USING (visibility = 'live_wall' AND deleted_at IS NULL
    AND public.can_moderate_branch(organization_id, branch_id)
    AND public.can_review_wall_submission(id, organization_id, branch_id))
  WITH CHECK (visibility = 'live_wall' AND deleted_at IS NULL
    AND public.can_moderate_branch(organization_id, branch_id)
    AND public.can_review_wall_submission(id, organization_id, branch_id));
DROP POLICY IF EXISTS "Consent scoped to branch" ON public.memory_consents;
CREATE POLICY "Only wall submission consent visible to merchants" ON public.memory_consents FOR SELECT TO authenticated
  USING (live_wall_consent = true AND revoked_at IS NULL AND EXISTS (
    SELECT 1 FROM public.memories m WHERE m.id = memory_id AND m.visibility = 'live_wall'
      AND public.can_access_branch(m.organization_id, m.branch_id)));

-- Keep existing organization logo/color columns, with safe per-tenant visual
-- preferences and public links. The server validates all URLs and file bytes.
ALTER TABLE public.organizations
  ADD COLUMN social_links jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(social_links) = 'object'),
  ADD COLUMN brand_tagline text,
  ADD COLUMN frame_style text NOT NULL DEFAULT 'film' CHECK (frame_style IN ('film','polaroid','editorial')),
  ADD COLUMN wallet_color_preset text NOT NULL DEFAULT 'green'
    CHECK (wallet_color_preset IN ('dark','blue','green','red','purple','orange')),
  ADD COLUMN wallet_connector_id uuid;
ALTER TABLE public.branches ADD COLUMN google_maps_url text;
-- Organization settings are written through validated, role-gated server APIs,
-- not arbitrary direct PostgREST updates (which could mutate status or URLs).
REVOKE UPDATE ON public.organizations FROM authenticated;
REVOKE UPDATE ON public.branches FROM authenticated;
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('brand-logos','brand-logos',false,2097152,ARRAY['image/png'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
CREATE POLICY "Private brand logo objects require server" ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (bucket_id <> 'brand-logos') WITH CHECK (bucket_id <> 'brand-logos');

-- Provider keys never appear in RLS-visible tables or a browser response.
-- Only sealed AES-GCM blobs reside here; the encryption key stays in server env.
CREATE TABLE public.wallet_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'walletwallet' CHECK (provider = 'walletwallet'),
  label text NOT NULL CHECK (length(label) BETWEEN 2 AND 60),
  sealed_key text NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','business')),
  enabled boolean NOT NULL DEFAULT true,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_connectors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wallet_connectors FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_connectors TO service_role;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_wallet_connector_id_fkey
  FOREIGN KEY (wallet_connector_id) REFERENCES public.wallet_connectors(id) ON DELETE SET NULL;

CREATE TABLE public.customer_wallet_preferences (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  wallet_opt_in boolean NOT NULL DEFAULT false,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  nearby_opt_in boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id,customer_id),
  CONSTRAINT wallet_optional_permissions CHECK (wallet_opt_in OR (NOT marketing_opt_in AND NOT nearby_opt_in))
);
ALTER TABLE public.customer_wallet_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer reads own wallet preferences" ON public.customer_wallet_preferences
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.customers c
    WHERE c.id = customer_id AND c.auth_user_id = auth.uid() AND c.deleted_at IS NULL));
REVOKE ALL ON public.customer_wallet_preferences FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.customer_wallet_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_wallet_preferences TO service_role;

CREATE TABLE public.wallet_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  connector_id uuid NOT NULL REFERENCES public.wallet_connectors(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','issued','needs_review','revoked')),
  issued_plan text NOT NULL DEFAULT 'free' CHECK (issued_plan IN ('free','pro','business')),
  serial_number text,
  share_url text,
  last_campaign_message text NOT NULL DEFAULT ' ',
  last_campaign_at timestamptz,
  last_synced_at timestamptz,
  sync_error text,
  sync_revision bigint NOT NULL DEFAULT 0,
  synced_revision bigint NOT NULL DEFAULT 0,
  sync_token uuid,
  sync_claimed_at timestamptz,
  sync_retry_at timestamptz,
  sync_attempts integer NOT NULL DEFAULT 0 CHECK (sync_attempts BETWEEN 0 AND 12),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id,customer_id),
  UNIQUE (connector_id,serial_number),
  CONSTRAINT wallet_sync_order CHECK (sync_revision >= synced_revision AND synced_revision >= 0),
  CONSTRAINT issued_pass_has_serial CHECK (status <> 'issued' OR (serial_number IS NOT NULL AND share_url IS NOT NULL))
);
CREATE INDEX wallet_passes_customer_idx ON public.wallet_passes(customer_id);
ALTER TABLE public.wallet_passes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wallet_passes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_passes TO service_role;

-- One campaign can deliver at most one wallet notification per pass. A timeout
-- is explicitly unknown, never reported as delivered and never auto-retried.
CREATE TABLE public.wallet_campaign_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  wallet_pass_id uuid NOT NULL REFERENCES public.wallet_passes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','sent','unknown')),
  attempted_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  sync_token uuid NOT NULL,
  UNIQUE (campaign_id,wallet_pass_id)
);
ALTER TABLE public.wallet_campaign_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wallet_campaign_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_campaign_deliveries TO service_role;

-- A merchant only sees the number of guest photos explicitly offered to their
-- wall. Private uploads aren't counted or revealed by the dashboard either.
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
      WHERE id = p_branch_id AND organization_id = p_organization_id AND status = 'active';
    IF v_timezone IS NULL THEN RAISE EXCEPTION 'Branch not found' USING ERRCODE = '22023'; END IF;
  END IF;
  v_today := date_trunc('day', now() AT TIME ZONE v_timezone) AT TIME ZONE v_timezone;
  SELECT count(*), count(DISTINCT customer_id) INTO v_visits, v_unique FROM public.visits
    WHERE organization_id = p_organization_id AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND verification_status = 'verified' AND verified_at >= v_today;
  SELECT count(*) FILTER (WHERE m.created_at >= v_today), count(*) FILTER (WHERE m.status = 'pending')
    INTO v_memories, v_pending FROM public.memories m
    JOIN public.memory_consents c ON c.memory_id = m.id AND c.live_wall_consent = true AND c.revoked_at IS NULL
    WHERE m.organization_id = p_organization_id AND (p_branch_id IS NULL OR m.branch_id = p_branch_id)
      AND m.visibility = 'live_wall' AND m.deleted_at IS NULL AND m.status <> 'deleted';
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
CREATE INDEX visits_org_verified_customer_idx ON public.visits(organization_id,customer_id,verified_at DESC)
  WHERE verification_status = 'verified';

-- An outbox lease serializes provider PUTs per pass even across Node instances.
-- If a worker crashes, the next cron run reclaims after one minute. The body
-- on PUT is deterministic, so a retry is safe: identical content is a no-op.
CREATE FUNCTION public.queue_wallet_sync(p_org uuid, p_customer uuid DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501'; END IF;
  UPDATE public.wallet_passes SET sync_revision = sync_revision + 1, updated_at = now()
    WHERE organization_id = p_org AND (p_customer IS NULL OR customer_id = p_customer)
      AND status = 'issued';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_wallet_sync(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_wallet_sync(uuid,uuid) TO service_role;

CREATE FUNCTION public.claim_wallet_sync(p_pass_id uuid DEFAULT NULL)
RETURNS TABLE(pass_id uuid, revision bigint, token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501'; END IF;
  RETURN QUERY WITH claim AS (
    SELECT w.id FROM public.wallet_passes w
    WHERE (p_pass_id IS NULL OR w.id = p_pass_id) AND w.status = 'issued'
      AND w.sync_revision > w.synced_revision
      AND (w.sync_retry_at IS NULL OR w.sync_retry_at <= now())
      AND (w.sync_token IS NULL OR w.sync_claimed_at < now() - interval '1 minute')
    ORDER BY w.updated_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED
  )
  UPDATE public.wallet_passes w SET sync_token = pg_catalog.gen_random_uuid(),
    sync_claimed_at = now(), updated_at = now()
    FROM claim WHERE w.id = claim.id
    RETURNING w.id, w.sync_revision, w.sync_token;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_wallet_sync(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_wallet_sync(uuid) TO service_role;

CREATE FUNCTION public.finish_wallet_sync(p_pass_id uuid, p_token uuid, p_revision bigint,
  p_success boolean, p_error text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' OR p_pass_id IS NULL OR p_token IS NULL OR p_success IS NULL THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501'; END IF;
  UPDATE public.wallet_passes SET synced_revision = CASE WHEN p_success THEN
      greatest(synced_revision, p_revision) ELSE synced_revision END,
    last_synced_at = CASE WHEN p_success THEN now() ELSE last_synced_at END,
    sync_error = CASE WHEN p_success THEN NULL ELSE left(coalesce(p_error,'Provider unavailable'),160) END,
    sync_attempts = CASE WHEN p_success THEN 0 ELSE least(sync_attempts + 1, 12) END,
    sync_retry_at = CASE WHEN p_success THEN NULL ELSE now() +
      pg_catalog.make_interval(secs => least(3600, (pg_catalog.power(2, least(sync_attempts, 8)) * 30)::integer)) END,
    sync_token = NULL, sync_claimed_at = NULL, updated_at = now()
    WHERE id = p_pass_id AND sync_token = p_token AND sync_revision >= p_revision;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.finish_wallet_sync(uuid,uuid,bigint,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finish_wallet_sync(uuid,uuid,bigint,boolean,text) TO service_role;

CREATE FUNCTION public.queue_wallet_visit_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.verification_status <> 'verified' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.verification_status = 'verified' THEN RETURN NEW; END IF;
  END IF;
  UPDATE public.wallet_passes SET sync_revision = sync_revision + 1, updated_at = now()
    WHERE organization_id = NEW.organization_id AND customer_id = NEW.customer_id AND status = 'issued';
  RETURN NEW;
END;
$$;
CREATE TRIGGER wallet_visit_dirty AFTER INSERT OR UPDATE OF verification_status ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.queue_wallet_visit_change();
CREATE FUNCTION public.queue_wallet_redemption_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.type = 'reward_redeemed' THEN
    UPDATE public.wallet_passes SET sync_revision = sync_revision + 1, updated_at = now()
      WHERE organization_id = NEW.organization_id AND customer_id = NEW.customer_id AND status = 'issued';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER wallet_redeemed_dirty AFTER INSERT ON public.reward_events
  FOR EACH ROW EXECUTE FUNCTION public.queue_wallet_redemption_change();
CREATE INDEX wallet_passes_pending_sync_idx ON public.wallet_passes(sync_retry_at,updated_at)
  WHERE status = 'issued' AND sync_revision > synced_revision;

-- The legacy campaign table is not a direct-send primitive. Creation/edits go
-- through a validated, role-checked route; even staff cannot forge content.
DROP POLICY IF EXISTS "Campaigns manageable by members" ON public.campaigns;
DROP POLICY IF EXISTS "Campaigns viewable by members" ON public.campaigns;
CREATE POLICY "Campaigns viewable by venue managers" ON public.campaigns FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = campaigns.organization_id AND m.user_id = auth.uid()
      AND m.branch_id IS NULL AND m.role IN ('owner','admin','manager')));
REVOKE INSERT, UPDATE, DELETE ON public.campaigns FROM authenticated;

CREATE FUNCTION public.queue_wallet_preference_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.wallet_opt_in IS NOT DISTINCT FROM NEW.wallet_opt_in
       AND OLD.marketing_opt_in IS NOT DISTINCT FROM NEW.marketing_opt_in
       AND OLD.nearby_opt_in IS NOT DISTINCT FROM NEW.nearby_opt_in THEN RETURN NEW; END IF;
  END IF;
  UPDATE public.wallet_passes SET sync_revision = sync_revision + 1, updated_at = now()
    WHERE organization_id = NEW.organization_id AND customer_id = NEW.customer_id AND status = 'issued';
  RETURN NEW;
END;
$$;
CREATE TRIGGER wallet_preferences_dirty AFTER INSERT OR UPDATE ON public.customer_wallet_preferences
  FOR EACH ROW EXECUTE FUNCTION public.queue_wallet_preference_change();

-- CRM is based on verified customer visits only. It never scans private photo
-- content, pending uploads, contact phone/email or unconfirmed presences.
CREATE FUNCTION public.merchant_crm_customers(p_org uuid, p_branch uuid DEFAULT NULL,
  p_limit integer DEFAULT 30, p_before timestamptz DEFAULT NULL,
  p_before_customer uuid DEFAULT NULL, p_search text DEFAULT NULL)
RETURNS TABLE(customer_id uuid, display_name text, last_visit_at timestamptz,
  verified_visits bigint, rewards_redeemed bigint, wallet_issued boolean,
  wallet_marketing_opt_in boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR
     (p_before IS NULL) <> (p_before_customer IS NULL) OR
     (p_search IS NOT NULL AND length(p_search) > 80) OR
     NOT EXISTS (SELECT 1 FROM public.organization_members m
       JOIN public.organizations o ON o.id=m.organization_id AND o.status='active'
       WHERE m.user_id=auth.uid() AND m.organization_id=p_org
         AND m.role IN ('owner','admin','manager')
         AND (m.branch_id IS NULL OR (p_branch IS NOT NULL AND m.branch_id=p_branch))) OR
     (p_branch IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.branches b
       WHERE b.id=p_branch AND b.organization_id=p_org AND b.status='active')) THEN
    RAISE EXCEPTION 'CRM membership required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY WITH activity AS (
    SELECT v.customer_id, max(v.verified_at) last_seen, count(*) visit_count
    FROM public.visits v
    WHERE v.organization_id=p_org AND (p_branch IS NULL OR v.branch_id=p_branch)
      AND v.verification_status='verified'
    GROUP BY v.customer_id
  ), redemptions AS (
    SELECT e.customer_id, count(*) redeemed
    FROM public.reward_events e WHERE e.organization_id=p_org
      AND (p_branch IS NULL OR e.branch_id=p_branch) AND e.type='reward_redeemed'
    GROUP BY e.customer_id
  )
  SELECT a.customer_id, coalesce(c.display_name,'ضيف') AS display_name,
    a.last_seen, a.visit_count, coalesce(r.redeemed,0)::bigint,
    (w.id IS NOT NULL) AS wallet_issued,
    (coalesce(p.wallet_opt_in,false) AND coalesce(p.marketing_opt_in,false)) AS wallet_marketing_opt_in
  FROM activity a JOIN public.customers c ON c.id=a.customer_id AND c.deleted_at IS NULL
    LEFT JOIN redemptions r ON r.customer_id=a.customer_id
    LEFT JOIN public.wallet_passes w ON w.organization_id=p_org AND w.customer_id=a.customer_id AND w.status='issued'
    LEFT JOIN public.customer_wallet_preferences p ON p.organization_id=p_org AND p.customer_id=a.customer_id
  WHERE (p_search IS NULL OR pg_catalog.strpos(pg_catalog.lower(coalesce(c.display_name,'')),pg_catalog.lower(p_search)) > 0)
    AND (p_before IS NULL OR (a.last_seen,a.customer_id) < (p_before,p_before_customer))
  ORDER BY a.last_seen DESC, a.customer_id DESC LIMIT p_limit + 1;
END;
$$;
REVOKE ALL ON FUNCTION public.merchant_crm_customers(uuid,uuid,integer,timestamptz,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merchant_crm_customers(uuid,uuid,integer,timestamptz,uuid,text) TO authenticated;

-- Campaign updates use the SAME per-pass lease as stamp sync. One delivery row
-- per campaign/pass is reserved before the network request; an unknown timeout
-- is not retried automatically, so a guest cannot get duplicate blasts.
CREATE FUNCTION public.claim_wallet_campaign_delivery(p_campaign uuid, p_limit integer DEFAULT 5)
RETURNS TABLE(delivery_id uuid, pass_id uuid, token uuid, revision bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_campaign public.campaigns%ROWTYPE; v_row record; v_token uuid; v_delivery uuid;
BEGIN
  IF auth.role() <> 'service_role' OR p_campaign IS NULL OR p_limit NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_campaign FROM public.campaigns WHERE id=p_campaign AND status='active';
  IF NOT FOUND OR v_campaign.config->>'channel' IS DISTINCT FROM 'wallet' OR
     v_campaign.config->>'audience' NOT IN ('all','returning','inactive30') OR
     length(v_campaign.config->>'message') NOT BETWEEN 3 AND 110 OR
     NOT EXISTS (SELECT 1 FROM public.organizations o
       WHERE o.id=v_campaign.organization_id AND o.status='active') THEN
    RAISE EXCEPTION 'Campaign not available' USING ERRCODE = '23514'; END IF;
  FOR v_row IN
    SELECT w.id, w.sync_revision FROM public.wallet_passes w
      JOIN public.customer_wallet_preferences p ON p.organization_id=w.organization_id AND p.customer_id=w.customer_id
      JOIN public.wallet_connectors wc ON wc.id=w.connector_id
      JOIN public.customers customer ON customer.id=w.customer_id AND customer.deleted_at IS NULL
    WHERE w.organization_id=v_campaign.organization_id AND w.status='issued'
      -- Pro notification anchor must have been present when originally issued.
      AND w.issued_plan IN ('pro','business')
      AND p.wallet_opt_in AND p.marketing_opt_in AND wc.enabled AND wc.plan IN ('pro','business')
      AND wc.verified_at > now() - interval '24 hours'
      AND (w.sync_token IS NULL OR w.sync_claimed_at < now() - interval '1 minute')
      AND NOT EXISTS (SELECT 1 FROM public.wallet_campaign_deliveries d
        WHERE d.campaign_id=p_campaign AND d.wallet_pass_id=w.id)
      -- One marketing attempt per guest per 24 hours, across ALL campaigns.
      -- Unknown/timeouts count too; never retry a potentially delivered blast.
      AND NOT EXISTS (SELECT 1 FROM public.wallet_campaign_deliveries recent
        WHERE recent.wallet_pass_id=w.id AND recent.attempted_at > now() - interval '24 hours')
      AND (v_campaign.config->>'audience'='all' OR
        (v_campaign.config->>'audience'='returning' AND (SELECT count(*) FROM public.visits v
          WHERE v.organization_id=w.organization_id AND v.customer_id=w.customer_id
            AND v.verification_status='verified') >= 3) OR
        (v_campaign.config->>'audience'='inactive30' AND EXISTS (SELECT 1 FROM public.visits v
          WHERE v.organization_id=w.organization_id AND v.customer_id=w.customer_id
            AND v.verification_status='verified' GROUP BY v.customer_id
            HAVING max(v.verified_at) < now() - interval '30 days')))
    ORDER BY w.id LIMIT p_limit FOR UPDATE OF w SKIP LOCKED
  LOOP
    v_token := pg_catalog.gen_random_uuid();
    UPDATE public.wallet_passes SET sync_token=v_token, sync_claimed_at=now(), updated_at=now()
      WHERE id=v_row.id;
    INSERT INTO public.wallet_campaign_deliveries(campaign_id,wallet_pass_id,status,sync_token)
      VALUES(p_campaign,v_row.id,'processing',v_token)
      ON CONFLICT DO NOTHING RETURNING id INTO v_delivery;
    IF v_delivery IS NOT NULL THEN
      delivery_id := v_delivery; pass_id := v_row.id; token := v_token;
      revision := v_row.sync_revision; RETURN NEXT;
    ELSE
      UPDATE public.wallet_passes SET sync_token=NULL, sync_claimed_at=NULL WHERE id=v_row.id;
    END IF;
    v_delivery := NULL;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_wallet_campaign_delivery(uuid,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_wallet_campaign_delivery(uuid,integer) TO service_role;

CREATE FUNCTION public.finish_wallet_campaign_delivery(p_delivery uuid, p_token uuid,
  p_revision bigint, p_success boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_row record; v_consent boolean; v_message text;
BEGIN
  IF auth.role() <> 'service_role' OR p_delivery IS NULL OR p_token IS NULL OR p_success IS NULL THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501'; END IF;
  SELECT w.id pass_id, w.organization_id, w.customer_id, w.sync_revision, c.config->>'message' message
    INTO v_row FROM public.wallet_campaign_deliveries d
      JOIN public.wallet_passes w ON w.id=d.wallet_pass_id
      JOIN public.campaigns c ON c.id=d.campaign_id
    WHERE d.id=p_delivery AND d.status='processing' AND d.sync_token=p_token
      AND w.sync_token=p_token AND w.sync_revision >= p_revision
    FOR UPDATE OF d,w;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT (wallet_opt_in AND marketing_opt_in) INTO v_consent
    FROM public.customer_wallet_preferences WHERE organization_id=v_row.organization_id AND customer_id=v_row.customer_id;
  v_message := CASE WHEN v_consent IS TRUE THEN left(v_row.message,110) ELSE ' ' END;
  UPDATE public.wallet_campaign_deliveries SET status=CASE WHEN p_success THEN 'sent' ELSE 'unknown' END,
    sent_at=CASE WHEN p_success THEN now() ELSE NULL END WHERE id=p_delivery;
  UPDATE public.wallet_passes w SET
    synced_revision=CASE WHEN p_success THEN greatest(w.synced_revision,p_revision) ELSE w.synced_revision END,
    last_synced_at=CASE WHEN p_success THEN now() ELSE w.last_synced_at END,
    last_campaign_message=CASE WHEN p_success OR v_consent IS NOT TRUE THEN v_message ELSE w.last_campaign_message END,
    last_campaign_at=CASE WHEN p_success THEN now() ELSE w.last_campaign_at END,
    sync_error=CASE WHEN p_success THEN NULL ELSE 'Unknown Wallet campaign outcome; no automatic resend' END,
    sync_attempts=CASE WHEN p_success THEN 0 ELSE w.sync_attempts END,
    sync_retry_at=CASE WHEN p_success THEN NULL ELSE w.sync_retry_at END,
    sync_token=NULL, sync_claimed_at=NULL, updated_at=now()
    WHERE w.id=v_row.pass_id AND w.sync_token=p_token;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.finish_wallet_campaign_delivery(uuid,uuid,bigint,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finish_wallet_campaign_delivery(uuid,uuid,bigint,boolean) TO service_role;
CREATE INDEX wallet_campaign_delivery_status_idx ON public.wallet_campaign_deliveries(campaign_id,status);
CREATE INDEX wallet_campaign_guest_cooldown_idx ON public.wallet_campaign_deliveries(wallet_pass_id,attempted_at DESC);
CREATE INDEX verified_visits_campaign_idx ON public.visits(organization_id,customer_id,verified_at)
  WHERE verification_status='verified';

CREATE FUNCTION public.wallet_campaign_delivery_counts(p_org uuid)
RETURNS TABLE(campaign_id uuid, accepted bigint, unknown bigint, processing bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT c.id,
    count(d.id) FILTER (WHERE d.status='sent'),
    count(d.id) FILTER (WHERE d.status='unknown'),
    count(d.id) FILTER (WHERE d.status='processing')
  FROM public.campaigns c LEFT JOIN public.wallet_campaign_deliveries d ON d.campaign_id=c.id
  WHERE c.organization_id=p_org AND c.config->>'channel'='wallet'
  GROUP BY c.id;
END;
$$;
REVOKE ALL ON FUNCTION public.wallet_campaign_delivery_counts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_campaign_delivery_counts(uuid) TO service_role;

CREATE FUNCTION public.wallet_health_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Server-only operation' USING ERRCODE = '42501'; END IF;
  RETURN pg_catalog.jsonb_build_object(
    'pendingUpdates', (SELECT count(*) FROM public.wallet_passes w
      WHERE w.status='issued' AND w.sync_revision>w.synced_revision),
    'manualReviews', (SELECT count(*) FROM public.wallet_passes w WHERE w.status='needs_review'),
    'unknownCampaigns', (SELECT count(*) FROM public.wallet_campaign_deliveries d WHERE d.status='unknown'),
    'staleProcessing', (SELECT count(*) FROM public.wallet_campaign_deliveries d
      WHERE d.status='processing' AND d.attempted_at < now()-interval '5 minutes')
  );
END;
$$;
REVOKE ALL ON FUNCTION public.wallet_health_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_health_stats() TO service_role;
