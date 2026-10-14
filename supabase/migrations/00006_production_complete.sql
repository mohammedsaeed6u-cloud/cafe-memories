-- ==============================================================================
-- 00006_production_complete.sql
-- Complete Supabase Production Schema & Security Script for Stampy SaaS
-- 
-- Run this once in the Supabase Dashboard -> SQL Editor
-- It safely creates all tables, indexes, and RLS policies idempotently.
-- ==============================================================================

-- 1. Ensure extensions
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#5B2D9E',
    subscription_tier TEXT DEFAULT 'pro',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Branches
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, slug)
);

-- 4. Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_id TEXT NOT NULL UNIQUE,
    display_name TEXT DEFAULT 'ضيف مميز',
    avatar_url TEXT,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Memories (Photobooth 4-Cuts & Cards)
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    original_url TEXT NOT NULL,
    optimized_url TEXT,
    thumbnail_url TEXT,
    caption TEXT,
    status TEXT NOT NULL DEFAULT 'approved',
    visibility TEXT NOT NULL DEFAULT 'public',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Visits & Stamps
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    verification_status TEXT DEFAULT 'verified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Wallet Pass Links (Maps customers to their WalletWallet pass serial)
CREATE TABLE IF NOT EXISTS wallet_pass_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    cafe_slug TEXT NOT NULL,
    pass_serial TEXT NOT NULL,
    google_save_url TEXT,
    share_url TEXT,
    last_stamped_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (customer_id, cafe_slug)
);

-- 8. Tenant Wallet Quotas & BYOK
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

-- 9. Screen Pairing Codes (for Live TV Displays)
CREATE TABLE IF NOT EXISTS screen_pairing_codes (
    code TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    screen_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for ultra-high throughput
CREATE INDEX IF NOT EXISTS idx_customers_anon ON customers(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_memories_org_status ON memories(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_visits_cust_org ON visits(customer_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_wallet_links_cust ON wallet_pass_links(customer_id, cafe_slug);
CREATE INDEX IF NOT EXISTS idx_tenant_quotas_org ON tenant_wallet_quotas(organization_id);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_pass_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_wallet_quotas ENABLE ROW LEVEL SECURITY;

-- Anonymous Customer & Storefront Policies handled authoritatively by 00007-00011

-- Ensure required columns exist on organizations if created by earlier migrations
ALTER TABLE organizations ALTER COLUMN country SET DEFAULT 'SA';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'pro';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#5B2D9E';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Seed Default Stampy Organization if not exists
INSERT INTO organizations (name, slug, country, subscription_tier)
VALUES ('Stampy Specialty Coffee', 'stampy', 'SA', 'enterprise')
ON CONFLICT (slug) DO NOTHING;
