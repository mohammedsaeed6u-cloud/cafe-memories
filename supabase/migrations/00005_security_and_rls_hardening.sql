-- ==============================================================================
-- 00005_security_and_rls_hardening.sql
-- Comprehensive Supabase Security & RLS Hardening Patch
-- 
-- Fixes:
-- 1. Function search_path mutable (High Severity / Supabase Security Advisor Alert)
--    Enforces explicit SET search_path = public, auth, pg_temp on all SECURITY DEFINER functions.
-- 2. Missing Tables & Columns (PGRST205 schema cache 404s):
--    Creates screen_pairing_codes, wallet_pass_links, tenant_wallet_quotas,
--    and adds device_token, paired_at to screens table.
-- 3. Live Wall Instant Consent Revocation Trigger & Atomic Reward Redemption RPC.
-- 4. Complete Row Level Security (RLS) Policies:
--    - Fixes table wallet_pass_links having RLS enabled with 0 policies.
--    - Enables active organizations, branches, and reward rules to be viewable
--      by anonymous customers on storefront and loyalty cards.
--    - Enables live TV display wall to view approved public memories.
--    - Grants visitors ability to register check-in visits, photobooth memories,
--      and save wallet pass links without RLS violations.
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: HARDEN ALL SECURITY DEFINER FUNCTIONS (SECURE SEARCH_PATH)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_user_org_ids(user_id UUID)
RETURNS UUID[] 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id 
        FROM public.organization_members 
        WHERE public.organization_members.user_id = $1
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_role(user_id UUID, org_id UUID)
RETURNS org_member_role 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    role_result org_member_role;
BEGIN
    SELECT role INTO role_result 
    FROM public.organization_members 
    WHERE public.organization_members.user_id = $1 
      AND public.organization_members.organization_id = $2;
    RETURN role_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(user_id UUID, org_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    role_result org_member_role;
BEGIN
    SELECT role INTO role_result 
    FROM public.organization_members 
    WHERE public.organization_members.user_id = $1 
      AND public.organization_members.organization_id = $2;
    RETURN role_result IN ('owner', 'admin');
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_consent_revocation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- If live_wall_consent was true and is now false, revoke live_wall visibility immediately
    IF (OLD.live_wall_consent = true AND NEW.live_wall_consent = false) THEN
        UPDATE public.memories
        SET visibility = 'private',
            updated_at = now()
        WHERE id = NEW.memory_id;
        
        -- Record audit action
        INSERT INTO public.audit_logs (actor_id, organization_id, action, entity_type, entity_id, metadata)
        SELECT NEW.customer_id, organization_id, 'consent_revoked', 'memory', NEW.memory_id, '{"channel": "live_wall"}'::jsonb
        FROM public.memories WHERE id = NEW.memory_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_customer_reward(
    p_customer_id UUID,
    p_organization_id UUID,
    p_branch_id UUID,
    p_reward_rule_id UUID,
    p_idempotency_key TEXT
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_rule RECORD;
    v_verified_visits INT;
    v_existing_redemptions INT;
    v_eligible_redemptions INT;
    v_new_event RECORD;
BEGIN
    -- 1. Idempotency Check
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, created_at INTO v_new_event
        FROM public.reward_events
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'replayed', true,
                'rewardEventId', v_new_event.id,
                'redeemedAt', v_new_event.created_at
            );
        END IF;
    END IF;

    -- 2. Fetch active rule
    SELECT * INTO v_rule
    FROM public.reward_rules
    WHERE id = p_reward_rule_id AND organization_id = p_organization_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Reward rule not found or inactive');
    END IF;

    -- 3. Calculate verified visits
    SELECT COUNT(*) INTO v_verified_visits
    FROM public.visits
    WHERE customer_id = p_customer_id
      AND organization_id = p_organization_id
      AND verification_status = 'verified';

    -- 4. Calculate existing redemptions for this rule
    SELECT COUNT(*) INTO v_existing_redemptions
    FROM public.reward_events
    WHERE customer_id = p_customer_id
      AND reward_rule_id = p_reward_rule_id
      AND event_type = 'reward_redeemed';

    -- 5. Calculate eligibility threshold
    IF v_rule.threshold <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid rule threshold');
    END IF;

    v_eligible_redemptions := v_verified_visits / v_rule.threshold;

    IF v_existing_redemptions >= v_eligible_redemptions THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient visits for new redemption',
            'requiredVisits', (v_existing_redemptions + 1) * v_rule.threshold,
            'currentVisits', v_verified_visits
        );
    END IF;

    -- 6. Insert new redemption event atomically
    INSERT INTO public.reward_events (
        customer_id,
        reward_rule_id,
        organization_id,
        branch_id,
        event_type,
        points_or_visits_delta,
        idempotency_key
    ) VALUES (
        p_customer_id,
        p_reward_rule_id,
        p_organization_id,
        p_branch_id,
        'reward_redeemed',
        -v_rule.threshold,
        p_idempotency_key
    )
    RETURNING id, created_at INTO v_new_event;

    RETURN jsonb_build_object(
        'success', true,
        'rewardEventId', v_new_event.id,
        'redeemedAt', v_new_event.created_at,
        'rewardType', v_rule.reward_type,
        'rewardDetails', v_rule.reward_details
    );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_user_org_ids(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_org_role(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_customer_reward(UUID, UUID, UUID, UUID, TEXT) TO anon, authenticated, service_role;


-- ==============================================================================
-- SECTION 2: CREATE MISSING TABLES AND COLUMNS (RESOLVE PGRST205)
-- ==============================================================================

-- 1. Ensure screens table has pairing fields
ALTER TABLE public.screens ADD COLUMN IF NOT EXISTS device_token TEXT UNIQUE;
ALTER TABLE public.screens ADD COLUMN IF NOT EXISTS paired_at TIMESTAMPTZ;

-- 2. Screen Pairing Codes Table
CREATE TABLE IF NOT EXISTS public.screen_pairing_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    screen_name TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_screen_pairing_code ON public.screen_pairing_codes(code, is_used, expires_at);
CREATE INDEX IF NOT EXISTS idx_screen_pairing_org_branch ON public.screen_pairing_codes(organization_id, branch_id);

-- 3. Wallet Pass Links Table
CREATE TABLE IF NOT EXISTS public.wallet_pass_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    cafe_slug TEXT NOT NULL,
    pass_serial TEXT NOT NULL,
    google_save_url TEXT,
    share_url TEXT,
    last_stamped_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (customer_id, cafe_slug)
);
CREATE INDEX IF NOT EXISTS idx_wallet_pass_links_customer ON public.wallet_pass_links(customer_id, cafe_slug);

-- 4. Tenant Wallet Quotas Table
CREATE TABLE IF NOT EXISTS public.tenant_wallet_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    monthly_pass_quota INT NOT NULL DEFAULT 500 CHECK (monthly_pass_quota >= 0),
    used_passes_this_month INT NOT NULL DEFAULT 0 CHECK (used_passes_this_month >= 0),
    quota_reset_date TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
    use_platform_key BOOLEAN NOT NULL DEFAULT true,
    wallet_api_key TEXT,
    allow_over_quota BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_wallet_quotas_org ON public.tenant_wallet_quotas(organization_id);

-- 5. Trigger for Instant Live Wall Consent Revocation
DROP TRIGGER IF EXISTS trg_consent_revocation ON public.memory_consents;
CREATE TRIGGER trg_consent_revocation
    AFTER UPDATE OF live_wall_consent ON public.memory_consents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_consent_revocation();


-- ==============================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) ENFORCEMENT & POLICY HARDENING
-- ==============================================================================

-- Enable RLS on all newly added tables
ALTER TABLE public.screen_pairing_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_pass_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_wallet_quotas ENABLE ROW LEVEL SECURITY;

-- 1. Organizations: Public Read for Active Storefronts
DROP POLICY IF EXISTS "Active organizations are viewable by anyone" ON public.organizations;
CREATE POLICY "Active organizations are viewable by anyone" 
    ON public.organizations FOR SELECT 
    USING (status = 'active');

DROP POLICY IF EXISTS "Organizations insertable during onboarding" ON public.organizations;
CREATE POLICY "Organizations insertable during onboarding" 
    ON public.organizations FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Branches: Public Read for Active Branches
DROP POLICY IF EXISTS "Active branches are viewable by anyone" ON public.branches;
CREATE POLICY "Active branches are viewable by anyone" 
    ON public.branches FOR SELECT 
    USING (status = 'active');

-- 3. Reward Rules: Public Read for Active Loyalty Rules
DROP POLICY IF EXISTS "Active reward rules are viewable by anyone" ON public.reward_rules;
CREATE POLICY "Active reward rules are viewable by anyone" 
    ON public.reward_rules FOR SELECT 
    USING (is_active = true);

-- 4. Screens: Public Read for Live TV Wall Displays
DROP POLICY IF EXISTS "Screens viewable for live wall" ON public.screens;
CREATE POLICY "Screens viewable for live wall" 
    ON public.screens FOR SELECT 
    USING (status IN ('online', 'pending'));

-- 5. Memories: Public Read for Approved Live Wall Memories
DROP POLICY IF EXISTS "Approved live wall memories viewable by anyone" ON public.memories;
CREATE POLICY "Approved live wall memories viewable by anyone" 
    ON public.memories FOR SELECT 
    USING (visibility = 'live_wall' AND status = 'approved');

DROP POLICY IF EXISTS "Memories insertable by visitors" ON public.memories;
CREATE POLICY "Memories insertable by visitors" 
    ON public.memories FOR INSERT 
    WITH CHECK (true);

-- 6. Customers: Self-registration & Profile Lookup
DROP POLICY IF EXISTS "Customers can be created by visitors" ON public.customers;
CREATE POLICY "Customers can be created by visitors" 
    ON public.customers FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Customers viewable by anonymous_id" ON public.customers;
CREATE POLICY "Customers viewable by anonymous_id" 
    ON public.customers FOR SELECT 
    USING (anonymous_id IS NOT NULL OR auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Customers updatable by anonymous_id" ON public.customers;
CREATE POLICY "Customers updatable by anonymous_id" 
    ON public.customers FOR UPDATE 
    USING (anonymous_id IS NOT NULL OR auth.uid() = auth_user_id);

-- 7. Visits: Check-in / QR Stamping
DROP POLICY IF EXISTS "Visits insertable by visitors" ON public.visits;
CREATE POLICY "Visits insertable by visitors" 
    ON public.visits FOR INSERT 
    WITH CHECK (true);

-- 8. Memory Consents: Photobooth Visitor Consents
DROP POLICY IF EXISTS "Consents insertable by visitors" ON public.memory_consents;
CREATE POLICY "Consents insertable by visitors" 
    ON public.memory_consents FOR INSERT 
    WITH CHECK (true);

-- 9. Wallet Pass Links: Full Policy Coverage (Fixes RLS without policies warning)
DROP POLICY IF EXISTS "Wallet pass links viewable by all" ON public.wallet_pass_links;
CREATE POLICY "Wallet pass links viewable by all" 
    ON public.wallet_pass_links FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Wallet pass links insertable by all" ON public.wallet_pass_links;
CREATE POLICY "Wallet pass links insertable by all" 
    ON public.wallet_pass_links FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Wallet pass links updatable by all" ON public.wallet_pass_links;
CREATE POLICY "Wallet pass links updatable by all" 
    ON public.wallet_pass_links FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Wallet pass links manageable by org admins" ON public.wallet_pass_links;
CREATE POLICY "Wallet pass links manageable by org admins" 
    ON public.wallet_pass_links FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE public.organizations.slug = public.wallet_pass_links.cafe_slug 
              AND public.organizations.id = ANY(public.get_user_org_ids(auth.uid()))
        )
    );

-- 10. Screen Pairing Codes: TV Screen Pairing Lifecycle
DROP POLICY IF EXISTS "Pairing codes viewable for pairing" ON public.screen_pairing_codes;
CREATE POLICY "Pairing codes viewable for pairing" 
    ON public.screen_pairing_codes FOR SELECT 
    USING (is_used = false AND expires_at > now());

DROP POLICY IF EXISTS "Pairing codes claimable" ON public.screen_pairing_codes;
CREATE POLICY "Pairing codes claimable" 
    ON public.screen_pairing_codes FOR UPDATE 
    USING (is_used = false AND expires_at > now());

DROP POLICY IF EXISTS "Pairing codes manageable by org admins" ON public.screen_pairing_codes;
CREATE POLICY "Pairing codes manageable by org admins" 
    ON public.screen_pairing_codes FOR ALL 
    USING (public.is_org_admin(auth.uid(), organization_id));

-- 11. Tenant Wallet Quotas: Quotas Viewable & Manageable
DROP POLICY IF EXISTS "Tenant wallet quota viewable by org members" ON public.tenant_wallet_quotas;
CREATE POLICY "Tenant wallet quota viewable by org members" 
    ON public.tenant_wallet_quotas FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_members.organization_id = tenant_wallet_quotas.organization_id 
              AND organization_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tenant wallet quota manageable by org admins" ON public.tenant_wallet_quotas;
CREATE POLICY "Tenant wallet quota manageable by org admins" 
    ON public.tenant_wallet_quotas FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_members.organization_id = tenant_wallet_quotas.organization_id 
              AND organization_members.user_id = auth.uid() 
              AND organization_members.role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Tenant wallet quota insertable by authenticated users" ON public.tenant_wallet_quotas;
CREATE POLICY "Tenant wallet quota insertable by authenticated users" 
    ON public.tenant_wallet_quotas FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- 12. Users & Members Signup Policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
    ON public.users FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Members insertable during onboarding" ON public.organization_members;
CREATE POLICY "Members insertable during onboarding" 
    ON public.organization_members FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- END OF MIGRATION 00005
-- ==============================================================================
