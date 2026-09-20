-- Enums
CREATE TYPE org_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE branch_status AS ENUM ('active', 'inactive', 'deleted');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE org_member_role AS ENUM ('owner', 'admin', 'manager', 'staff');
CREATE TYPE provider_type AS ENUM ('anonymous', 'google', 'apple', 'magic_link');
CREATE TYPE qr_source AS ENUM ('table', 'counter', 'entrance', 'poster', 'receipt', 'instagram', 'campaign', 'staff', 'other');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspicious');
CREATE TYPE memory_status AS ENUM ('pending', 'approved', 'rejected', 'hidden', 'deleted');
CREATE TYPE memory_visibility AS ENUM ('private', 'shared', 'live_wall');
CREATE TYPE trigger_type AS ENUM ('visit_count', 'memory_count', 'social_share', 'campaign_completion', 'streak');
CREATE TYPE reward_type AS ENUM ('free_item', 'discount_percentage', 'fixed_discount', 'free_print', 'bonus_visit', 'custom');
CREATE TYPE reward_event_type AS ENUM ('visit_earned', 'reward_unlocked', 'reward_redeemed', 'bonus_awarded', 'share_bonus');
CREATE TYPE screen_status AS ENUM ('pending', 'online', 'offline', 'paused');
CREATE TYPE screen_orientation AS ENUM ('landscape', 'portrait');
CREATE TYPE playlist_item_type AS ENUM ('customer_memory', 'offer', 'announcement', 'product', 'logo', 'campaign');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'ended');
CREATE TYPE reporter_type AS ENUM ('customer', 'merchant', 'admin');
CREATE TYPE report_entity_type AS ENUM ('memory', 'customer');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE actor_type AS ENUM ('merchant', 'admin', 'system');
CREATE TYPE moderation_entity_type AS ENUM ('memory', 'customer', 'report');
CREATE TYPE moderation_action AS ENUM ('approve', 'reject', 'hide', 'delete', 'restore', 'ban', 'unban');
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'growth', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
CREATE TYPE platform_type AS ENUM ('instagram', 'whatsapp', 'twitter', 'facebook', 'download', 'other');

-- 1. organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    cover_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    country TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status org_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. branches
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    status branch_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, slug)
);
CREATE INDEX idx_branches_organization_id ON branches(organization_id);

-- 3. users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_provider TEXT,
    provider_user_id TEXT,
    email TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. organization_members
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role org_member_role NOT NULL DEFAULT 'staff',
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_organization_id ON organization_members(organization_id);

-- 5. customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    anonymous_id TEXT,
    display_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_customer_identity CHECK (auth_user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);
CREATE INDEX idx_customers_auth_user_id ON customers(auth_user_id);

-- 6. customer_identities
CREATE TABLE customer_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    provider provider_type NOT NULL,
    provider_subject TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider, provider_subject)
);
CREATE INDEX idx_customer_identities_customer_id ON customer_identities(customer_id);

-- 7. qr_codes
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    source qr_source NOT NULL,
    label TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    scan_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qr_codes_org_branch ON qr_codes(organization_id, branch_id);

-- 16. campaigns (needs to be created before visits because of FK)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status campaign_status NOT NULL DEFAULT 'draft',
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaigns_organization_id ON campaigns(organization_id);

-- 8. visits
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    source qr_source,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    device_fingerprint TEXT,
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_visits_fraud_check ON visits(customer_id, branch_id, created_at);
CREATE INDEX idx_visits_organization_id ON visits(organization_id);

-- 9. memories
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    optimized_url TEXT,
    thumbnail_url TEXT,
    caption TEXT,
    status memory_status NOT NULL DEFAULT 'pending',
    visibility memory_visibility NOT NULL DEFAULT 'private',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_memories_customer_id ON memories(customer_id);
CREATE INDEX idx_memories_organization_id ON memories(organization_id);

-- 10. memory_consents
CREATE TABLE memory_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL UNIQUE REFERENCES memories(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    save_consent BOOLEAN NOT NULL DEFAULT true,
    social_share_consent BOOLEAN NOT NULL DEFAULT false,
    live_wall_consent BOOLEAN NOT NULL DEFAULT false,
    marketing_consent BOOLEAN NOT NULL DEFAULT false,
    consent_version INT NOT NULL DEFAULT 1,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_memory_consents_customer_id ON memory_consents(customer_id);

-- 11. reward_rules
CREATE TABLE reward_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type trigger_type NOT NULL,
    threshold INT NOT NULL,
    reward_type reward_type NOT NULL,
    reward_value TEXT,
    reward_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reward_rules_organization_id ON reward_rules(organization_id);

-- 12. reward_events
CREATE TABLE reward_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    type reward_event_type NOT NULL,
    value INT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reward_events_customer_org ON reward_events(customer_id, organization_id);

-- 14. playlists (needs to be created before screens)
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_playlists_organization_id ON playlists(organization_id);

-- 13. screens
CREATE TABLE screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pairing_code TEXT,
    device_token TEXT,
    status screen_status NOT NULL DEFAULT 'pending',
    last_heartbeat_at TIMESTAMPTZ,
    orientation screen_orientation NOT NULL DEFAULT 'landscape',
    resolution TEXT,
    playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_screens_organization_id ON screens(organization_id);

-- 15. playlist_items
CREATE TABLE playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    type playlist_item_type NOT NULL,
    content_id UUID,
    content_data JSONB,
    duration_seconds INT NOT NULL DEFAULT 10,
    priority INT NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);

-- 17. reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_type reporter_type NOT NULL,
    reporter_id UUID NOT NULL,
    entity_type report_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID
);
CREATE INDEX idx_reports_entity ON reports(entity_type, entity_id);

-- 18. moderation_actions
CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    actor_type actor_type NOT NULL,
    entity_type moderation_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action moderation_action NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_moderation_actions_entity ON moderation_actions(entity_type, entity_id);

-- 19. audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);

-- 20. subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    plan subscription_plan NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. feature_flags
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, key)
);
CREATE INDEX idx_feature_flags_org ON feature_flags(organization_id);

-- 22. share_events
CREATE TABLE share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    platform platform_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_share_events_memory_id ON share_events(memory_id);

-- 23. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON notifications(organization_id, customer_id);

-- HELPER FUNCTIONS

CREATE OR REPLACE FUNCTION get_user_org_ids(user_id UUID)
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id FROM organization_members WHERE organization_members.user_id = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_org_role(user_id UUID, org_id UUID)
RETURNS org_member_role AS $$
DECLARE
    role_result org_member_role;
BEGIN
    SELECT role INTO role_result FROM organization_members 
    WHERE organization_members.user_id = $1 AND organization_members.organization_id = $2;
    RETURN role_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_org_admin(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    role_result org_member_role;
BEGIN
    SELECT role INTO role_result FROM organization_members 
    WHERE organization_members.user_id = $1 AND organization_members.organization_id = $2;
    RETURN role_result IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. organizations
CREATE POLICY "Organizations are viewable by members" ON organizations FOR SELECT USING (id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Organizations are updatable by admins" ON organizations FOR UPDATE USING (is_org_admin(auth.uid(), id));

-- 2. branches
CREATE POLICY "Branches are viewable by members" ON branches FOR SELECT USING (organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Branches are manageable by admins" ON branches FOR ALL USING (is_org_admin(auth.uid(), organization_id));

-- 3. users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- 4. organization_members
CREATE POLICY "Members viewable by org members" ON organization_members FOR SELECT USING (organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Members manageable by admins" ON organization_members FOR ALL USING (is_org_admin(auth.uid(), organization_id));

-- 5. customers
CREATE POLICY "Customers viewable by org members (visits)" ON customers FOR SELECT USING (
    EXISTS (SELECT 1 FROM visits WHERE visits.customer_id = customers.id AND visits.organization_id = ANY(get_user_org_ids(auth.uid())))
    OR auth.uid() = auth_user_id
);
CREATE POLICY "Customers viewable by themselves" ON customers FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Customers updatable by themselves" ON customers FOR UPDATE USING (auth.uid() = auth_user_id);

-- 6. customer_identities
CREATE POLICY "Customer identities viewable by self" ON customer_identities FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers WHERE customers.id = customer_identities.customer_id AND customers.auth_user_id = auth.uid())
);

-- 7. qr_codes
CREATE POLICY "QR codes viewable by members" ON qr_codes FOR SELECT USING (organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "QR codes manageable by admins" ON qr_codes FOR ALL USING (is_org_admin(auth.uid(), organization_id));

-- 8. visits
CREATE POLICY "Visits viewable by org members" ON visits FOR SELECT USING (organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Visits viewable by customer" ON visits FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers WHERE customers.id = visits.customer_id AND customers.auth_user_id = auth.uid())
);

-- 9. memories
CREATE POLICY "Memories viewable by org members" ON memories FOR SELECT USING (organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Memories viewable by customer" ON memories FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers WHERE customers.id = memories.customer_id AND customers.auth_user_id = auth.uid())
);
CREATE POLICY "Memories manageable by customer" ON memories FOR UPDATE USING (
    EXISTS (SELECT 1 FROM customers WHERE customers.id = memories.customer_id AND customers.auth_user_id = auth.uid())
);
CREATE POLICY "Memories manageable by members" ON memories FOR ALL USING (organization_id = ANY(get_user_org_ids(auth.uid())));

-- 10. memory_consents
CREATE POLICY "Consents viewable by org members" ON memory_consents FOR SELECT USING (
    EXISTS (SELECT 1 FROM memories WHERE memories.id = memory_consents.memory_id AND memories.organization_id = ANY(get_user_org_ids(auth.uid())))
);
CREATE POLICY "Consents viewable by customer" ON memory_consents FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers WHERE customers.id = memory_consents.customer_id AND customers.auth_user_id = auth.uid())
);
CREATE POLICY "Consents manageable by customer" ON memory_consents FOR UPDATE USING (
    EXISTS (SELECT 1 FROM customers WHERE customers.id = memory_consents.customer_id AND customers.auth_user_id = auth.uid())
);

-- 11. reward_rules
CREATE POLICY "Reward rules viewable by members" ON reward_rules FOR SELECT USING (organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Reward rules manageable by admins" ON reward_rules FOR ALL USING (is_org_admin(auth.uid(), organization_id));

-- 12. reward_events
CREATE POLICY "Reward events viewable by org members" ON reward_events FOR SELECT USING (organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Reward events viewable by customer" ON reward_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers WHERE customers.id = reward_events.customer_id AND customers.auth_user_id = auth.uid())
);

-- 13. screens
CREATE POLICY "Screens viewable by members" ON screens FOR SELECT USING (organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Screens manageable by members" ON screens FOR ALL USING (organization_id = ANY(get_user_org_ids(auth.uid())));

-- 14. playlists
CREATE POLICY "Playlists viewable by members" ON playlists FOR SELECT USING (organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Playlists manageable by members" ON playlists FOR ALL USING (organization_id = ANY(get_user_org_ids(auth.uid())));

-- 15. playlist_items
CREATE POLICY "Playlist items viewable by members" ON playlist_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_items.playlist_id AND playlists.organization_id = ANY(get_user_org_ids(auth.uid())))
);
CREATE POLICY "Playlist items manageable by members" ON playlist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_items.playlist_id AND playlists.organization_id = ANY(get_user_org_ids(auth.uid())))
);

-- 16. campaigns
CREATE POLICY "Campaigns viewable by members" ON campaigns FOR SELECT USING (organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Campaigns manageable by members" ON campaigns FOR ALL USING (organization_id = ANY(get_user_org_ids(auth.uid())));

-- 17. reports
CREATE POLICY "Reports manageable by admins" ON reports FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- 18. moderation_actions
CREATE POLICY "Moderation viewable by admins" ON moderation_actions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- 19. audit_logs
CREATE POLICY "Audit logs viewable by org admins" ON audit_logs FOR SELECT USING (is_org_admin(auth.uid(), organization_id));

-- 20. subscriptions
CREATE POLICY "Subscriptions viewable by org admins" ON subscriptions FOR SELECT USING (is_org_admin(auth.uid(), organization_id));

-- 21. feature_flags
CREATE POLICY "Feature flags viewable by org members" ON feature_flags FOR SELECT USING (organization_id IS NULL OR organization_id = ANY(get_user_org_ids(auth.uid())));
CREATE POLICY "Feature flags manageable by org admins" ON feature_flags FOR ALL USING (is_org_admin(auth.uid(), organization_id));

-- 22. share_events
CREATE POLICY "Share events viewable by org members" ON share_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM memories WHERE memories.id = share_events.memory_id AND memories.organization_id = ANY(get_user_org_ids(auth.uid())))
);

-- 23. notifications
CREATE POLICY "Notifications viewable by recipient" ON notifications FOR SELECT USING (
    organization_id = ANY(get_user_org_ids(auth.uid())) OR 
    EXISTS (SELECT 1 FROM customers WHERE customers.id = notifications.customer_id AND customers.auth_user_id = auth.uid())
);
CREATE POLICY "Notifications updatable by recipient" ON notifications FOR UPDATE USING (
    organization_id = ANY(get_user_org_ids(auth.uid())) OR 
    EXISTS (SELECT 1 FROM customers WHERE customers.id = notifications.customer_id AND customers.auth_user_id = auth.uid())
);
