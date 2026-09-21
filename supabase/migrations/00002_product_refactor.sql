-- 00002_product_refactor.sql
-- Product Realignment: Screen Pairing Codes, Atomic Reward Redemption, Consent Revocation Trigger

-- 1. Screen Pairing Codes Table
CREATE TABLE IF NOT EXISTS screen_pairing_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    screen_name TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_screen_pairing_code ON screen_pairing_codes(code, is_used, expires_at);
CREATE INDEX IF NOT EXISTS idx_screen_pairing_org_branch ON screen_pairing_codes(organization_id, branch_id);

ALTER TABLE screen_pairing_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pairing codes manageable by org admins" ON screen_pairing_codes
    FOR ALL USING (is_org_admin(auth.uid(), organization_id));

-- 2. Add device_token & pairing fields to screens if not present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='screens' AND column_name='device_token') THEN
        ALTER TABLE screens ADD COLUMN device_token TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='screens' AND column_name='paired_at') THEN
        ALTER TABLE screens ADD COLUMN paired_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Trigger for Instant Live Wall Consent Revocation
CREATE OR REPLACE FUNCTION handle_consent_revocation()
RETURNS TRIGGER AS $$
BEGIN
    -- If live_wall_consent was true and is now false, revoke live_wall visibility immediately
    IF (OLD.live_wall_consent = true AND NEW.live_wall_consent = false) THEN
        UPDATE memories
        SET visibility = 'private',
            updated_at = now()
        WHERE id = NEW.memory_id;
        
        -- Record audit action
        INSERT INTO audit_logs (actor_id, organization_id, action, entity_type, entity_id, metadata)
        SELECT NEW.customer_id, organization_id, 'consent_revoked', 'memory', NEW.memory_id, '{"channel": "live_wall"}'::jsonb
        FROM memories WHERE id = NEW.memory_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_consent_revocation ON memory_consents;
CREATE TRIGGER trg_consent_revocation
    AFTER UPDATE OF live_wall_consent ON memory_consents
    FOR EACH ROW
    EXECUTE FUNCTION handle_consent_revocation();

-- 4. Atomic Reward Redemption Function
CREATE OR REPLACE FUNCTION redeem_customer_reward(
    p_customer_id UUID,
    p_organization_id UUID,
    p_branch_id UUID,
    p_reward_rule_id UUID,
    p_idempotency_key TEXT
)
RETURNS JSONB AS $$
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
        FROM reward_events
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
    FROM reward_rules
    WHERE id = p_reward_rule_id AND organization_id = p_organization_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Reward rule not found or inactive');
    END IF;

    -- 3. Calculate verified visits
    SELECT COUNT(*) INTO v_verified_visits
    FROM visits
    WHERE customer_id = p_customer_id
      AND organization_id = p_organization_id
      AND verification_status = 'verified';

    -- 4. Calculate past redemptions for this rule
    SELECT COUNT(*) INTO v_existing_redemptions
    FROM reward_events
    WHERE customer_id = p_customer_id
      AND organization_id = p_organization_id
      AND reference_type = 'reward_rules'
      AND reference_id = p_reward_rule_id
      AND type = 'reward_redeemed';

    -- 5. Calculate eligibility threshold
    v_eligible_redemptions := FLOOR(v_verified_visits / v_rule.threshold);

    IF v_existing_redemptions >= v_eligible_redemptions THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient visits for reward redemption',
            'requiredVisits', v_rule.threshold,
            'currentVisits', v_verified_visits,
            'redeemedCount', v_existing_redemptions
        );
    END IF;

    -- 6. Atomically insert redemption event
    INSERT INTO reward_events (
        customer_id,
        organization_id,
        branch_id,
        type,
        value,
        reference_type,
        reference_id,
        idempotency_key
    )
    VALUES (
        p_customer_id,
        p_organization_id,
        p_branch_id,
        'reward_redeemed',
        1,
        'reward_rules',
        v_rule.id,
        p_idempotency_key
    )
    RETURNING * INTO v_new_event;

    RETURN jsonb_build_object(
        'success', true,
        'replayed', false,
        'rewardEventId', v_new_event.id,
        'rewardName', v_rule.name,
        'rewardValue', v_rule.reward_value,
        'redeemedAt', v_new_event.created_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
