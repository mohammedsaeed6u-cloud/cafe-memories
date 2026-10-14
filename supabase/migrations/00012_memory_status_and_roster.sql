-- Migration 00012: Add pending_consent to memory_status enum and seed deterministic staff roster members

-- 1. Extend memory_status enum
ALTER TYPE memory_status ADD VALUE IF NOT EXISTS 'pending_consent';

-- 2. Atomic Memory + Consent Creation RPC
-- Guarantees that memory and consent records are inserted in a single atomic transaction.
-- If consent insertion fails, the entire transaction rolls back automatically (no orphaned records).
CREATE OR REPLACE FUNCTION public.create_memory_with_consent(
  p_customer_id uuid,
  p_organization_id uuid,
  p_branch_id uuid,
  p_visit_id uuid,
  p_original_url text,
  p_optimized_url text,
  p_thumbnail_url text,
  p_caption text,
  p_visibility memory_visibility,
  p_save_consent boolean,
  p_social_share_consent boolean,
  p_live_wall_consent boolean,
  p_marketing_consent boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_memory public.memories;
  v_consent public.memory_consents;
BEGIN
  -- Insert memory record in single transaction
  INSERT INTO public.memories (
    customer_id,
    organization_id,
    branch_id,
    visit_id,
    original_url,
    optimized_url,
    thumbnail_url,
    caption,
    status,
    visibility
  ) VALUES (
    p_customer_id,
    p_organization_id,
    p_branch_id,
    p_visit_id,
    p_original_url,
    p_optimized_url,
    p_thumbnail_url,
    p_caption,
    'pending',
    p_visibility
  ) RETURNING * INTO v_memory;

  -- Insert consent record within the exact same transaction
  INSERT INTO public.memory_consents (
    memory_id,
    customer_id,
    save_consent,
    social_share_consent,
    live_wall_consent,
    marketing_consent
  ) VALUES (
    v_memory.id,
    p_customer_id,
    p_save_consent,
    p_social_share_consent,
    p_live_wall_consent,
    p_marketing_consent
  ) RETURNING * INTO v_consent;

  RETURN jsonb_build_object(
    'id', v_memory.id,
    'customer_id', v_memory.customer_id,
    'organization_id', v_memory.organization_id,
    'branch_id', v_memory.branch_id,
    'visit_id', v_memory.visit_id,
    'original_url', v_memory.original_url,
    'optimized_url', v_memory.optimized_url,
    'thumbnail_url', v_memory.thumbnail_url,
    'caption', v_memory.caption,
    'status', v_memory.status,
    'visibility', v_memory.visibility,
    'created_at', v_memory.created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_memory_with_consent(uuid,uuid,uuid,uuid,text,text,text,text,memory_visibility,boolean,boolean,boolean,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_memory_with_consent(uuid,uuid,uuid,uuid,text,text,text,text,memory_visibility,boolean,boolean,boolean,boolean) TO authenticated, service_role;
