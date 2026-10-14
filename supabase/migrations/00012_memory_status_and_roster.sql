-- Migration 00012: Add pending_consent to memory_status enum and seed deterministic staff roster members

-- 1. Extend memory_status enum
ALTER TYPE memory_status ADD VALUE IF NOT EXISTS 'pending_consent';

-- 2. Seed default organization 'memories' and deterministic staff roster members
DO $$
DECLARE
  v_org_id uuid;
  v_branch_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'memories' LIMIT 1;
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug, country, currency, timezone, status)
    VALUES ('Memories Studio', 'memories', 'EG', 'EGP', 'Africa/Cairo', 'active')
    RETURNING id INTO v_org_id;

    INSERT INTO public.branches (organization_id, name, slug, timezone, status)
    VALUES (v_org_id, 'Main Branch', 'main', 'Africa/Cairo', 'active')
    RETURNING id INTO v_branch_id;
  ELSE
    SELECT id INTO v_branch_id FROM public.branches WHERE organization_id = v_org_id LIMIT 1;
    IF v_branch_id IS NULL THEN
      INSERT INTO public.branches (organization_id, name, slug, timezone, status)
      VALUES (v_org_id, 'Main Branch', 'main', 'Africa/Cairo', 'active')
      RETURNING id INTO v_branch_id;
    END IF;
  END IF;

  -- Seed the 4 deterministic staff members in auth.users
  INSERT INTO auth.users (id, email_confirmed_at) VALUES
    ('a0000000-0000-0000-0000-000000000001'::uuid, now()),
    ('a0000000-0000-0000-0000-000000000002'::uuid, now()),
    ('a0000000-0000-0000-0000-000000000003'::uuid, now()),
    ('a0000000-0000-0000-0000-000000000004'::uuid, now())
  ON CONFLICT (id) DO NOTHING;

  -- Seed the 4 deterministic staff members in public.users
  INSERT INTO public.users (id, email, name, role) VALUES
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'layla@memories.studio', 'Layla Haddad', 'user'),
    ('a0000000-0000-0000-0000-000000000002'::uuid, 'omar@memories.studio', 'Omar Nasser', 'user'),
    ('a0000000-0000-0000-0000-000000000003'::uuid, 'sara@memories.studio', 'Sara Khaled', 'user'),
    ('a0000000-0000-0000-0000-000000000004'::uuid, 'yousef@memories.studio', 'Yousef Amin', 'user')
  ON CONFLICT (id) DO NOTHING;

  -- Seed the organization memberships
  INSERT INTO public.organization_members (organization_id, branch_id, user_id, role) VALUES
    (v_org_id, v_branch_id, 'a0000000-0000-0000-0000-000000000001'::uuid, 'staff'),
    (v_org_id, v_branch_id, 'a0000000-0000-0000-0000-000000000002'::uuid, 'staff'),
    (v_org_id, v_branch_id, 'a0000000-0000-0000-0000-000000000003'::uuid, 'staff'),
    (v_org_id, v_branch_id, 'a0000000-0000-0000-0000-000000000004'::uuid, 'manager')
  ON CONFLICT (organization_id, user_id) DO NOTHING;
END;
$$;
