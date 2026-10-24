-- 00004_tenant_wallet_quotas.sql
-- SaaS SuperAdmin Wallet Pass Quota & BYOK Management
-- Enables multi-tenant control over walletwallet.dev pass limits and custom API keys.

CREATE TABLE IF NOT EXISTS tenant_wallet_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    monthly_pass_quota INT NOT NULL DEFAULT 500 CHECK (monthly_pass_quota >= 0),
    used_passes_this_month INT NOT NULL DEFAULT 0 CHECK (used_passes_this_month >= 0),
    quota_reset_date TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
    use_platform_key BOOLEAN NOT NULL DEFAULT true,
    wallet_api_key TEXT,
    allow_over_quota BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_wallet_quotas_org
    ON tenant_wallet_quotas(organization_id);

ALTER TABLE tenant_wallet_quotas ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated organization members and service role
CREATE POLICY "Tenant wallet quota viewable by org members" ON tenant_wallet_quotas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = tenant_wallet_quotas.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- Allow update access only for organization owners/admins and platform service role
CREATE POLICY "Tenant wallet quota manageable by org admins" ON tenant_wallet_quotas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = tenant_wallet_quotas.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );
