-- 00003_wallet_pass_links.sql
-- Registry of issued Wallet passes: the walletwallet.dev serial per
-- customer+cafe, so later stamp changes can push updates to installed
-- passes (PUT /api/passes/<serial> → APNs → Wallet refresh in place).

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

CREATE INDEX IF NOT EXISTS idx_wallet_pass_links_customer
    ON wallet_pass_links(customer_id, cafe_slug);

ALTER TABLE wallet_pass_links ENABLE ROW LEVEL SECURITY;
