import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

/** Runs REAL Postgres RLS/PLpgSQL in PGlite, without a live Supabase project.
 * Supabase auth/storage schemas are minimal local stand-ins; deploy smoke tests remain required. */
const sqlDir = new URL('../../supabase/migrations/', import.meta.url);
const ids = { merchantA: randomUUID(), merchantB: randomUUID(), guest: randomUUID(), staff: randomUUID(), branchAdmin: randomUUID() };
let db: PGlite;
let orgA: string;
let orgB: string;
let branchA: string;
let branchB: string;
let secondBranch: string;
let customer: string;
let legacyVerifiedVisit: string;
let legacyMemoryId: string;

const bootstrap = `
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, email_confirmed_at timestamptz);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.role',true),'') $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb, '{}'::jsonb) $$;
CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(), bucket_id text);
`;

async function as<T>(role: 'authenticated' | 'service_role', userId: string | null, action: () => Promise<T>,
  claims: object = {}) {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claim.role',$2,false), set_config('request.jwt.claims',$3,false)",
    [userId ?? '', role, JSON.stringify(claims)]);
  await db.exec(`SET ROLE ${role}`);
  try { return await action(); } finally { await db.exec('RESET ROLE'); }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(bootstrap);
  for (const migration of [
    '00001_initial_schema.sql',
    '00002_product_refactor.sql',
    '00003_wallet_pass_links.sql',
    '00004_tenant_wallet_quotas.sql',
    '00005_security_and_rls_hardening.sql',
    '00006_production_complete.sql',
  ]) {
    await db.exec(readFileSync(new URL(migration, sqlDir), 'utf8'));
  }
  // A historical API could set verification_status without staff authorization.
  const legacyUser = randomUUID();
  await db.query('INSERT INTO auth.users(id) VALUES($1)', [legacyUser]);
  const legacyOrg = (await db.query<{ id: string }>(
    "INSERT INTO public.organizations(name,slug,country) VALUES('Old Cafe','old-cafe','EG') RETURNING id")).rows[0].id;
  const legacyBranch = (await db.query<{ id: string }>(
    "INSERT INTO public.branches(organization_id,name,slug) VALUES($1,'Main','main') RETURNING id", [legacyOrg])).rows[0].id;
  const legacyCustomer = (await db.query<{ id: string }>(
    'INSERT INTO public.customers(auth_user_id) VALUES($1) RETURNING id', [legacyUser])).rows[0].id;
  legacyVerifiedVisit = (await db.query<{ id: string }>(
    "INSERT INTO public.visits(customer_id,organization_id,branch_id,verification_status) VALUES($1,$2,$3,'verified') RETURNING id",
    [legacyCustomer, legacyOrg, legacyBranch])).rows[0].id;
  legacyMemoryId = (await db.query<{ id: string }>(
    "INSERT INTO public.memories(customer_id,organization_id,branch_id,visit_id,original_url,status,visibility) VALUES($1,$2,$3,$4,'https://example.com/legacy.jpg','approved','live_wall') RETURNING id",
    [legacyCustomer, legacyOrg, legacyBranch, legacyVerifiedVisit])).rows[0].id;
  await db.query('INSERT INTO public.memory_consents(memory_id,customer_id,live_wall_consent) VALUES($1,$2,true)',
    [legacyMemoryId, legacyCustomer]);
  await db.exec(readFileSync(new URL('00007_secure_core.sql', sqlDir), 'utf8'));
  await db.exec(readFileSync(new URL('00008_customer_accounts.sql', sqlDir), 'utf8'));
  await db.exec(readFileSync(new URL('00009_visit_keepsakes.sql', sqlDir), 'utf8'));
  await db.exec(readFileSync(new URL('00010_brand_wallet_privacy.sql', sqlDir), 'utf8'));
  await db.exec(readFileSync(new URL('00011_remediate_legacy_policies.sql', sqlDir), 'utf8'));
  await db.exec(readFileSync(new URL('00012_memory_status_and_roster.sql', sqlDir), 'utf8'));
  // Mirrors Supabase default public-schema grants while preserving explicit
  // server-only secrets / validated-write restrictions from the migration.
  await db.exec(`GRANT USAGE ON SCHEMA public, auth TO authenticated, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
    REVOKE UPDATE ON public.organizations, public.branches FROM authenticated;
    REVOKE ALL ON public.wallet_connectors, public.wallet_passes, public.wallet_campaign_deliveries FROM authenticated;
    REVOKE INSERT, UPDATE, DELETE ON public.customer_wallet_preferences, public.campaigns FROM authenticated;`);
  for (const [name, id] of Object.entries(ids)) await db.query(
    'INSERT INTO auth.users(id,email_confirmed_at) VALUES($1,$2)',
    [id, name.startsWith('merchant') ? new Date().toISOString() : null]);
  orgA = (await as('authenticated', ids.merchantA, async () =>
    (await db.query<{ id: string }>("SELECT public.provision_merchant('Alpha Cafe','alpha-cafe') id")).rows[0].id,
    { email: 'alpha@example.com' }));
  orgB = (await as('authenticated', ids.merchantB, async () =>
    (await db.query<{ id: string }>("SELECT public.provision_merchant('Beta Cafe','beta-cafe') id")).rows[0].id,
    { email: 'beta@example.com' }));
  branchA = (await db.query<{ id: string }>('SELECT id FROM public.branches WHERE organization_id=$1', [orgA])).rows[0].id;
  branchB = (await db.query<{ id: string }>('SELECT id FROM public.branches WHERE organization_id=$1', [orgB])).rows[0].id;
  secondBranch = (await db.query<{ id: string }>("INSERT INTO public.branches(organization_id,name,slug) VALUES($1,'Second','second') RETURNING id", [orgA])).rows[0].id;
  await db.query("INSERT INTO public.users(id,email,name) VALUES($1,'staff@example.com','Staff')", [ids.staff]);
  await db.query("INSERT INTO public.organization_members(organization_id,user_id,branch_id,role) VALUES($1,$2,$3,'staff')", [orgA, ids.staff, branchA]);
  await db.query("INSERT INTO public.users(id,email,name) VALUES($1,'branchadmin@example.com','Admin')", [ids.branchAdmin]);
  await db.query("INSERT INTO public.organization_members(organization_id,user_id,branch_id,role) VALUES($1,$2,$3,'admin')", [orgA, ids.branchAdmin, branchA]);
  customer = (await db.query<{ id: string }>('INSERT INTO public.customers(auth_user_id) VALUES($1) RETURNING id', [ids.guest])).rows[0].id;
  await as('authenticated', ids.guest, async () => db.query('SELECT public.check_in_customer($1)', [branchA]));
}, 30_000);
afterAll(async () => { if (db) await db.close(); });

describe('migration security invariants (real PostgreSQL engine)', () => {
  it('quarantines unproven legacy verified visits rather than granting free rewards', async () => {
    const row = (await db.query<{ verification_status: string; verified_at: string | null }>(
      'SELECT verification_status,verified_at FROM public.visits WHERE id=$1', [legacyVerifiedVisit])).rows[0];
    expect(row).toEqual({ verification_status: 'suspicious', verified_at: null });
    const legacy = (await db.query<{ visibility: string; live_wall_consent: boolean }>(
      'SELECT m.visibility,c.live_wall_consent FROM public.memories m JOIN public.memory_consents c ON c.memory_id=m.id WHERE m.id=$1',
      [legacyMemoryId])).rows[0];
    expect(legacy).toEqual({ visibility: 'private', live_wall_consent: false });
  });

  it('ensures loose legacy RLS policies are completely remediated', async () => {
    const policies = (await db.query<{ policyname: string }>(
      "SELECT policyname FROM pg_policies WHERE policyname IN ('Visits insertable by visitors', 'Customers can register checkins', 'Customers can upload memories', 'Wallet links readable and writable', 'Wallet pass links viewable by all')"
    )).rows;
    expect(policies).toHaveLength(0);
  });

  it('persists only the caller’s customer settings and hides the contact number from merchants', async () => {
    const ownerId = randomUUID();
    const otherId = randomUUID();
    await db.query('INSERT INTO auth.users(id) VALUES($1),($2)', [ownerId, otherId]);
    const owner = (await db.query<{ id: string }>(
      "INSERT INTO public.customers(auth_user_id,display_name) VALUES($1,'ضيف مميز') RETURNING id", [ownerId])).rows[0].id;
    await db.query("INSERT INTO public.customers(auth_user_id,display_name) VALUES($1,'ضيف مميز')", [otherId]);
    await as('authenticated', ownerId, async () => {
      expect((await db.query<{ customer_has_saved_data: boolean }>(
        'SELECT public.customer_has_saved_data()')).rows[0].customer_has_saved_data).toBe(false);
      await expect(db.query('SELECT public.set_customer_account($1,$2)', ['X', '01012345678']))
        .rejects.toThrow(/Invalid customer settings/);
      await expect(db.query('SELECT public.set_customer_account($1,$2)', ['أحمد', 'not-verified']))
        .rejects.toThrow(/Invalid customer settings/);
      await db.query('SELECT public.set_customer_account($1,$2)', [' أحمد ', '01012345678']);
      expect((await db.query<{ customer_has_saved_data: boolean }>(
        'SELECT public.customer_has_saved_data()')).rows[0].customer_has_saved_data).toBe(true);
      expect((await db.query("UPDATE public.customers SET auth_user_id=$1, email='stolen@example.com' WHERE id=$2 RETURNING id",
        [otherId, owner])).rows).toEqual([]);
      expect((await db.query('SELECT * FROM public.customer_accounts')).rows).toEqual([]);
    });
    const persisted = (await db.query<{ display_name: string; phone: string }>(
      'SELECT c.display_name,a.phone FROM public.customers c JOIN public.customer_accounts a ON a.customer_id=c.id WHERE c.id=$1',
      [owner])).rows[0];
    expect(persisted).toEqual({ display_name: 'أحمد', phone: '01012345678' });
    await as('authenticated', otherId, async () => {
      expect((await db.query('SELECT * FROM public.customer_accounts')).rows).toEqual([]);
      // No caller-supplied customer ID exists in the write RPC.
      await db.query('SELECT public.set_customer_account($1,$2)', ['منى', null]);
    });
    // Even merchants allowed to view the visited customer's public profile may
    // never fetch the optional phone number directly.
    await db.query("INSERT INTO public.visits(customer_id,organization_id,branch_id,source,verification_status,verified_at) VALUES($1,$2,$3,'staff','verified',now())",
      [owner, orgA, branchA]);
    await as('authenticated', ids.merchantA, async () => {
      expect((await db.query<{ id: string }>('SELECT id FROM public.customers WHERE id=$1', [owner])).rows).toHaveLength(1);
      expect((await db.query('SELECT * FROM public.customer_accounts')).rows).toEqual([]);
    });
    expect((await db.query<{ auth_user_id: string; email: string | null }>(
      'SELECT auth_user_id,email FROM public.customers WHERE id=$1', [owner])).rows[0])
      .toEqual({ auth_user_id: ownerId, email: null });
  });

  it('treats pending visits in other venues as history when changing Auth identities', async () => {
    const guestId = randomUUID();
    await db.query('INSERT INTO auth.users(id) VALUES($1)', [guestId]);
    const guest = (await db.query<{ id: string }>(
      "INSERT INTO public.customers(auth_user_id,display_name) VALUES($1,'ضيف مميز') RETURNING id", [guestId])).rows[0].id;
    await as('authenticated', guestId, async () => {
      expect((await db.query<{ customer_has_saved_data: boolean }>(
        'SELECT public.customer_has_saved_data()')).rows[0].customer_has_saved_data).toBe(false);
    });
    await db.query('INSERT INTO public.visits(customer_id,organization_id,branch_id) VALUES($1,$2,$3)',
      [guest, orgB, branchB]);
    await as('authenticated', guestId, async () => {
      expect((await db.query<{ customer_has_saved_data: boolean }>(
        'SELECT public.customer_has_saved_data()')).rows[0].customer_has_saved_data).toBe(true);
    });
    await as('authenticated', ids.merchantA, async () => {
      await expect(db.query('SELECT public.customer_has_saved_data()')).rejects.toThrow(/Customer account not found/);
    });
  });

  it('prevents self-promotion, anonymous merchant onboarding and cross-tenant membership', async () => {
    await as('authenticated', ids.merchantA, async () => {
      await expect(db.query("UPDATE public.users SET role='admin' WHERE id=$1", [ids.merchantA]))
        .rejects.toThrow(/Platform roles cannot be changed/);
      const rows = await db.query<{ id: string }>('SELECT id FROM public.organizations');
      expect(rows.rows.map(({ id }) => id)).toEqual([orgA]);
    });
    await as('authenticated', ids.guest, async () => {
      await expect(db.query("SELECT public.provision_merchant('Fake Cafe','fake-cafe')"))
        .rejects.toThrow(/Verified merchant identity required/);
    }, { is_anonymous: true });
    await expect(db.query("INSERT INTO public.organization_members(organization_id,user_id,branch_id) VALUES($1,$2,$3)",
      [orgA, ids.guest, branchB])).rejects.toThrow();
  });

  it('blocks unconfirmed merchants, branch admins from global writes, and direct QR/reward edits', async () => {
    await as('authenticated', ids.staff, async () => {
      await expect(db.query("SELECT public.provision_merchant('Staff Cafe','staff-cafe')"))
        .rejects.toThrow(/Verified merchant identity required/);
    }, { email: 'staff@example.com' });
    await as('authenticated', ids.branchAdmin, async () => {
      expect((await db.query<{ allowed: boolean }>('SELECT public.is_org_admin($1,$2) allowed', [ids.branchAdmin, orgA])).rows[0].allowed).toBe(false);
      expect((await db.query("UPDATE public.organization_members SET role='owner' WHERE user_id=$1 RETURNING id", [ids.branchAdmin])).rows).toEqual([]);
      await expect(db.query("UPDATE public.organizations SET status='active' WHERE id=$1 RETURNING id", [orgA]))
        .rejects.toThrow(/permission denied/);
      await expect(db.query("INSERT INTO public.qr_codes(organization_id,branch_id,slug,source) VALUES($1,$2,'forged-qr','table')", [orgA, branchA]))
        .rejects.toThrow();
      await expect(db.query("SELECT public.configure_visit_reward($1,'Free Tea',2)", [orgA]))
        .rejects.toThrow(/Not authorized/);
    });
    await as('authenticated', ids.merchantA, async () => {
      await expect(db.query("UPDATE public.organizations SET status='suspended' WHERE id=$1 RETURNING id", [orgA]))
        .rejects.toThrow(/permission denied/);
      await expect(db.query("INSERT INTO public.reward_rules(organization_id,name,trigger_type,threshold,reward_type) VALUES($1,'Forged','visit_count',1,'free_item')", [orgA]))
        .rejects.toThrow();
    });
  });

  it('requires an authenticated, branch-scoped guest check-in before visits and redemptions', async () => {
    const outsiderId = randomUUID();
    await db.query('INSERT INTO auth.users(id) VALUES($1)', [outsiderId]);
    const outsider = (await db.query<{ id: string }>('INSERT INTO public.customers(auth_user_id) VALUES($1) RETURNING id', [outsiderId])).rows[0].id;
    await as('authenticated', ids.staff, async () => {
      await expect(db.query('SELECT public.check_in_customer($1)', [branchA]))
        .rejects.toThrow(/Guest or venue not found/);
      await expect(db.query('SELECT public.record_verified_visit($1,$2,$3)', [outsider, branchA, randomUUID()]))
        .rejects.toThrow(/Guest check-in required/);
    });
    await as('authenticated', outsiderId, async () => db.query('SELECT public.check_in_customer($1)', [branchB]));
    await as('authenticated', ids.staff, async () => {
      await expect(db.query('SELECT public.record_verified_visit($1,$2,$3)', [outsider, branchA, randomUUID()]))
        .rejects.toThrow(/Guest check-in required/);
    });
    await as('authenticated', outsiderId, async () => db.query('SELECT public.check_in_customer($1)', [branchA]));
    await as('authenticated', ids.staff, async () => {
      const result = await db.query<{ record_verified_visit: { replayed: boolean } }>(
        'SELECT public.record_verified_visit($1,$2,$3)', [outsider, branchA, randomUUID()]);
      expect(result.rows[0].record_verified_visit.replayed).toBe(false);
    });
  });

  it('limits a staff member to their assigned branch, including direct Supabase queries', async () => {
    const otherCustomer = (await db.query<{ id: string }>(
      "INSERT INTO public.customers(anonymous_id) VALUES('unlinked-legacy-guest') RETURNING id")).rows[0].id;
    await db.query("INSERT INTO public.visits(customer_id,organization_id,branch_id) VALUES($1,$2,$3)",
      [otherCustomer, orgA, secondBranch]);
    await as('authenticated', ids.staff, async () => {
      const branches = await db.query<{ id: string }>('SELECT id FROM public.branches');
      expect(branches.rows.map(({ id }) => id)).toEqual([branchA]);
      expect((await db.query('SELECT id FROM public.visits WHERE branch_id=$1', [secondBranch])).rows).toEqual([]);
      expect((await db.query('SELECT id FROM public.customers WHERE id=$1', [otherCustomer])).rows).toEqual([]);
      await expect(db.query('SELECT public.merchant_overview($1,$2)', [orgA, secondBranch]))
        .rejects.toThrow(/Organization membership required/);
    });
  });

  it('requires membership for visits; retries replay, parallel keys hit cooldown', async () => {
    await as('authenticated', ids.guest, async () => {
      await expect(db.query('SELECT public.record_verified_visit($1,$2,$3)',
        [customer, branchA, randomUUID()])).rejects.toThrow(/Not authorized/);
    });
    await as('authenticated', ids.merchantB, async () => {
      await expect(db.query('SELECT public.record_verified_visit($1,$2,$3)',
        [customer, branchA, randomUUID()])).rejects.toThrow(/Not authorized/);
    });
    const key = randomUUID();
    await as('authenticated', ids.merchantA, async () => {
      const first = (await db.query<{ record_verified_visit: { visitId: string; replayed: boolean } }>(
        'SELECT public.record_verified_visit($1,$2,$3)', [customer, branchA, key])).rows[0].record_verified_visit;
      expect(first.replayed).toBe(false);
      const again = (await db.query<{ record_verified_visit: { visitId: string; replayed: boolean } }>(
        'SELECT public.record_verified_visit($1,$2,$3)', [customer, branchA, key])).rows[0].record_verified_visit;
      expect(again).toEqual({ visitId: first.visitId, replayed: true });
      await expect(db.query('SELECT public.record_verified_visit($1,$2,$3)',
        [customer, branchA, randomUUID()])).rejects.toThrow(/Visit cooldown/);
    });
  });

  it('spends a reward once and protects against retry/overspend', async () => {
    const rule = await as('authenticated', ids.merchantA, async () =>
      (await db.query<{ id: string }>("SELECT public.configure_visit_reward($1,'Free Coffee',2) id", [orgA])).rows[0].id);
    await db.query("INSERT INTO public.visits(customer_id,organization_id,branch_id,source,verification_status,verified_at,created_at) VALUES($1,$2,$3,'staff','verified',now()-interval '2 hours',now()-interval '2 hours')",
      [customer, orgA, branchA]);
    await as('authenticated', ids.merchantA, async () => {
      const key = randomUUID();
      const first = (await db.query<{ redeem_customer_reward: { replayed: boolean } }>(
        'SELECT public.redeem_customer_reward($1,$2,$3,$4)', [customer, branchA, rule, key])).rows[0].redeem_customer_reward;
      expect(first.replayed).toBe(false);
      const retry = (await db.query<{ redeem_customer_reward: { replayed: boolean } }>(
        'SELECT public.redeem_customer_reward($1,$2,$3,$4)', [customer, branchA, rule, key])).rows[0].redeem_customer_reward;
      expect(retry.replayed).toBe(true);
      await expect(db.query('SELECT public.redeem_customer_reward($1,$2,$3,$4)',
        [customer, branchA, rule, randomUUID()])).rejects.toThrow(/Insufficient verified visits/);
    });
    const count = await db.query<{ count: number }>("SELECT count(*)::int count FROM public.reward_events WHERE type='reward_redeemed'");
    expect(count.rows[0].count).toBe(1);
  });

  it('atomically creates pending memories and revokes consent on owner request', async () => {
    const prefix = `${orgA}/${customer}/${randomUUID()}`;
    const memoryId = await as('service_role', null, async () => (await db.query<{ id: string }>(
      'SELECT public.create_customer_memory($1,$2,$3,$4,$5,$6,$7) id',
      [customer, branchA, `${prefix}/original.webp`, `${prefix}/optimized.webp`, `${prefix}/thumbnail.webp`, null, false])).rows[0].id);
    const initial = (await db.query<{ visit_id: string; status: string; visibility: string }>(
      'SELECT visit_id,status,visibility FROM public.memories WHERE id=$1', [memoryId])).rows[0];
    expect(initial).toMatchObject({ status: 'pending', visibility: 'private' });
    expect(initial.visit_id).toBeTruthy();
    await as('authenticated', ids.merchantA, async () => {
      expect((await db.query('SELECT id FROM public.memories WHERE id=$1', [memoryId])).rows).toEqual([]);
      expect((await db.query('SELECT memory_id FROM public.memory_consents WHERE memory_id=$1', [memoryId])).rows).toEqual([]);
      expect((await db.query('SELECT id FROM public.visits WHERE id=$1', [initial.visit_id])).rows).toEqual([]);
      expect((await db.query('SELECT id FROM public.customers WHERE id=$1', [customer])).rows)
        .toHaveLength(1); // Customer has another real verified visit; no photo metadata is exposed.
      const overview = (await db.query<{ merchant_overview: { today: { newMemories: number }; attentionCenter: { pendingMemories: number } } }>(
        'SELECT public.merchant_overview($1,$2)', [orgA, branchA])).rows[0].merchant_overview;
      expect(overview.today.newMemories).toBe(0);
      expect(overview.attentionCenter.pendingMemories).toBe(0);
      expect((await db.query("UPDATE public.memories SET status='approved' WHERE id=$1 RETURNING id", [memoryId])).rows)
        .toEqual([]);
    });
    await as('authenticated', ids.merchantB, async () => {
      const rows = await db.query('SELECT id FROM public.memories WHERE id=$1', [memoryId]);
      expect(rows.rows).toEqual([]);
      await expect(db.query('SELECT public.set_customer_wall_consent($1,true)', [memoryId]))
        .rejects.toThrow(/Authentication required/);
    });
    await as('authenticated', ids.guest, async () => {
      const update = await db.query("UPDATE public.memories SET status='approved' WHERE id=$1", [memoryId]);
      expect(update.affectedRows).toBe(0); // RLS hides the row from UPDATE.
      await db.query('SELECT public.set_customer_wall_consent($1,true)', [memoryId]);
    });
    await as('authenticated', ids.merchantA, async () => {
      expect((await db.query('SELECT id FROM public.memories WHERE id=$1', [memoryId])).rows)
        .toHaveLength(1);
      expect((await db.query('SELECT memory_id FROM public.memory_consents WHERE memory_id=$1', [memoryId])).rows)
        .toHaveLength(1);
      const overview = (await db.query<{ merchant_overview: { attentionCenter: { pendingMemories: number } } }>(
        'SELECT public.merchant_overview($1,$2)', [orgA, branchA])).rows[0].merchant_overview;
      expect(overview.attentionCenter.pendingMemories).toBe(1);
      await db.query("UPDATE public.memories SET status='approved' WHERE id=$1", [memoryId]);
    });
    await as('authenticated', ids.guest, async () => {
      await db.query('SELECT public.set_customer_wall_consent($1,false)', [memoryId]);
    });
    await as('authenticated', ids.merchantA, async () => {
      expect((await db.query('SELECT id FROM public.memories WHERE id=$1', [memoryId])).rows).toEqual([]);
      expect((await db.query('SELECT memory_id FROM public.memory_consents WHERE memory_id=$1', [memoryId])).rows).toEqual([]);
      const overview = (await db.query<{ merchant_overview: { today: { newMemories: number } } }>(
        'SELECT public.merchant_overview($1,$2)', [orgA, branchA])).rows[0].merchant_overview;
      expect(overview.today.newMemories).toBe(0);
    });
    const revoked = (await db.query<{ visibility: string; live_wall_consent: boolean }>(
      'SELECT visibility, live_wall_consent FROM public.memories JOIN public.memory_consents ON memories.id=memory_consents.memory_id WHERE memories.id=$1',
      [memoryId])).rows[0];
    expect(revoked).toEqual({ visibility: 'private', live_wall_consent: false });
  });

  it('resolves a QR code in its own branch and increments scans atomically', async () => {
    await db.query("INSERT INTO public.qr_codes(organization_id,branch_id,slug,source) VALUES($1,$2,'qr-alpha-test','table')", [orgA, branchA]);
    const scan = await as('service_role', null, async () => db.query<{
      qr_id: string; org_slug: string; branch_slug: string;
    }>("SELECT * FROM public.record_qr_scan('qr-alpha-test')"));
    expect(scan.rows[0]).toMatchObject({ org_slug: 'alpha-cafe', branch_slug: 'main' });
    expect((await db.query<{ scan_count: number }>("SELECT scan_count FROM public.qr_codes WHERE slug='qr-alpha-test'")).rows[0].scan_count).toBe(1);
  });

  it('enforces one-time pairing and commits failed-attempt counters', async () => {
    await db.query("INSERT INTO public.screen_pairing_codes(organization_id,branch_id,code,screen_name,expires_at) VALUES($1,$2,'12345678','Main Wall',now()+interval '10 minutes')", [orgA, branchA]);
    await as('authenticated', ids.guest, async () => {
      await expect(db.query("SELECT public.consume_screen_pairing('12345678',$1,$2)", ['a'.repeat(64), 'b'.repeat(64)]))
        .rejects.toThrow();
    });
    const paired = await as('service_role', null, async () => (await db.query<{ id: string }>(
      "SELECT public.consume_screen_pairing('12345678',$1,$2) id", ['a'.repeat(64), 'b'.repeat(64)])).rows[0].id);
    expect(paired).toBeTruthy();
    const replay = await as('service_role', null, async () => (await db.query<{ id: string }>(
      "SELECT public.consume_screen_pairing('12345678',$1,$2) id", ['c'.repeat(64), 'b'.repeat(64)])).rows[0].id);
    expect(replay).toBeNull();
    for (let i = 0; i < 6; i++) {
      await as('service_role', null, async () => db.query("SELECT public.consume_screen_pairing('00000000',$1,$2)",
        ['d'.repeat(64), 'c'.repeat(64)]));
    }
    const attempts = (await db.query<{ attempts: number }>('SELECT attempts FROM public.screen_pairing_attempts WHERE ip_hash=$1', ['c'.repeat(64)])).rows[0].attempts;
    expect(attempts).toBe(6);
  });
});

describe('confirmed visit photobooth ledger', () => {
  const merchant = randomUUID();
  const guest = randomUUID();
  const outsider = randomUUID();
  let org: string;
  let main: string;
  let second: string;
  let owner: string;
  let otherCustomer: string;

  beforeAll(async () => {
    for (const id of [merchant, guest, outsider]) {
      await db.query('INSERT INTO auth.users(id,email_confirmed_at) VALUES($1,now())', [id]);
    }
    org = await as('authenticated', merchant, async () => (await db.query<{ id: string }>(
      "SELECT public.provision_merchant('Keepsake Cafe','keepsake-cafe') id")).rows[0].id,
    { email: 'keepsake@example.com' });
    main = (await db.query<{ id: string }>('SELECT id FROM public.branches WHERE organization_id=$1', [org])).rows[0].id;
    second = (await db.query<{ id: string }>(
      "INSERT INTO public.branches(organization_id,name,slug) VALUES($1,'Second','second') RETURNING id",
      [org])).rows[0].id;
    owner = (await db.query<{ id: string }>('INSERT INTO public.customers(auth_user_id) VALUES($1) RETURNING id',
      [guest])).rows[0].id;
    otherCustomer = (await db.query<{ id: string }>('INSERT INTO public.customers(auth_user_id) VALUES($1) RETURNING id',
      [outsider])).rows[0].id;
    await as('authenticated', guest, async () => db.query('SELECT public.check_in_customer($1)', [main]));
  });

  it('only saves one optional private photo per verified visit, without inventing stamps', async () => {
    const prefix = `${org}/${owner}/${randomUUID()}`;
    const memoryId = await as('service_role', null, async () => (await db.query<{ id: string }>(
      'SELECT public.create_customer_memory($1,$2,$3,$4,$5,$6,$7) id',
      [owner, main, `${prefix}/original.webp`, `${prefix}/optimized.webp`,
        `${prefix}/thumbnail.webp`, null, false])).rows[0].id);
    const pendingVisit = (await db.query<{ visit_id: string }>(
      'SELECT visit_id FROM public.memories WHERE id=$1', [memoryId])).rows[0].visit_id;
    const takePhoto = (customerId: string, visitId: string, keyPrefix: string) =>
      db.query<{ id: string }>('SELECT public.attach_verified_visit_memory($1,$2,$3,$4,$5,$6,$7) id',
        [customerId, visitId, `${keyPrefix}/original.webp`, `${keyPrefix}/optimized.webp`,
          `${keyPrefix}/thumbnail.webp`, 'اللحظة دي هتفضل', false]);
    await as('service_role', null, async () => {
      await expect(takePhoto(owner, pendingVisit, prefix)).rejects.toThrow(/Verified visit not found/);
    });
    const rule = await as('authenticated', merchant, async () => (await db.query<{ id: string }>(
      "SELECT public.configure_visit_reward($1,'Original gift',2) id", [org])).rows[0].id);
    const first = await as('authenticated', merchant, async () => (await db.query<{
      record_verified_visit: { visitId: string };
    }>('SELECT public.record_verified_visit($1,$2,$3)', [owner, main, randomUUID()])).rows[0].record_verified_visit.visitId);
    expect(first).toBe(pendingVisit); // Existing pre-stamp photo is attached, not a second stamp.
    expect((await db.query('SELECT id FROM public.keepsake_cards WHERE customer_id=$1', [owner])).rows).toEqual([]);
    const secondVisit = (await db.query<{ id: string }>(
      "INSERT INTO public.visits(customer_id,organization_id,branch_id,source,verification_status,verified_at) VALUES($1,$2,$3,'staff','verified',now()) RETURNING id",
      [owner, org, second])).rows[0].id;
    const firstCard = (await db.query<{
      id: string; threshold: number; reward_name: string; visit_ids: string[];
    }>('SELECT id,threshold,reward_name,visit_ids FROM public.keepsake_cards WHERE customer_id=$1', [owner])).rows[0];
    expect(firstCard).toMatchObject({ threshold: 2, reward_name: 'Original gift' });
    expect(new Set(firstCard.visit_ids)).toEqual(new Set([first, secondVisit]));
    await as('authenticated', guest, async () => {
      expect((await db.query('SELECT * FROM public.keepsake_cards')).rows).toEqual([]);
      await expect(takePhoto(owner, secondVisit, prefix)).rejects.toThrow(/permission denied|Server-only operation/);
      await expect(db.query('SELECT public.get_keepsake_balance($1,$2)', [owner, org]))
        .rejects.toThrow(/permission denied|Server-only operation/);
    });
    await as('authenticated', merchant, async () => {
      expect((await db.query('SELECT * FROM public.keepsake_cards')).rows).toEqual([]);
    });
    await as('service_role', null, async () => {
      await expect(takePhoto(otherCustomer, secondVisit, `${org}/${otherCustomer}/${randomUUID()}`))
        .rejects.toThrow(/Verified visit not found/);
      await expect(takePhoto(owner, first, prefix)).rejects.toThrow(/Visit already has a photo/);
      await expect(takePhoto(owner, secondVisit, `${orgB}/${owner}/${randomUUID()}`))
        .rejects.toThrow(/Invalid photo or venue/);
      const photo = (await takePhoto(owner, secondVisit, `${org}/${owner}/${randomUUID()}`)).rows[0].id;
      expect((await db.query<{ visit_id: string; visibility: string; live_wall_consent: boolean }>(
        'SELECT m.visit_id,m.visibility,c.live_wall_consent FROM public.memories m JOIN public.memory_consents c ON c.memory_id=m.id WHERE m.id=$1',
        [photo])).rows[0]).toEqual({ visit_id: secondVisit, visibility: 'private', live_wall_consent: false });
      expect((await db.query<{ total: number }>(
        'SELECT count(*)::int total FROM public.visits WHERE customer_id=$1 AND organization_id=$2',
        [owner, org])).rows[0].total).toBe(2);
      await expect(takePhoto(owner, secondVisit, `${org}/${owner}/${randomUUID()}`))
        .rejects.toThrow(/Visit already has a photo/);
      const balance = (await db.query<{ balance: { usedVisits: number; availableRewards: number; oldestRewardName: string } }>(
        'SELECT public.get_keepsake_balance($1,$2) balance', [owner, org])).rows[0].balance;
      expect(balance).toEqual({ usedVisits: 2, availableRewards: 1, oldestRewardName: 'Original gift' });
    });
    const earned = await as('authenticated', merchant, async () => (await db.query<{
      redeem_customer_reward: { keepsakeCardId: string; rewardName: string; replayed: boolean };
    }>('SELECT public.redeem_customer_reward($1,$2,$3,$4)', [owner, main, rule, randomUUID()]))
      .rows[0].redeem_customer_reward);
    expect(earned).toMatchObject({ keepsakeCardId: firstCard.id, rewardName: 'Original gift', replayed: false });
    expect((await db.query<{ redeemed_at: string | null; redemption_event_id: string | null }>(
      'SELECT redeemed_at,redemption_event_id FROM public.keepsake_cards WHERE id=$1', [firstCard.id]))
      .rows[0]).toMatchObject({ redeemed_at: expect.any(Date), redemption_event_id: expect.any(String) });
    await as('authenticated', merchant, async () => {
      await expect(db.query('SELECT public.redeem_customer_reward($1,$2,$3,$4)',
        [owner, main, rule, randomUUID()])).rejects.toThrow(/Insufficient verified visits/);
    });
  });

  it('preserves old cards when the merchant changes the stamp threshold and reward name', async () => {
    await as('authenticated', merchant, async () =>
      db.query("SELECT public.configure_visit_reward($1,'New gift',3)", [org]));
    const before = (await db.query<{ id: string; visit_ids: string[] }>(
      'SELECT id,visit_ids FROM public.keepsake_cards WHERE customer_id=$1 ORDER BY sequence_number', [owner])).rows;
    for (let index = 0; index < 3; index++) {
      await db.query("INSERT INTO public.visits(customer_id,organization_id,branch_id,source,verification_status,verified_at) VALUES($1,$2,$3,'staff','verified',now())", [owner, org, index % 2 ? main : second]);
    }
    const cards = (await db.query<{
      id: string; reward_name: string; threshold: number; visit_ids: string[];
    }>('SELECT id,reward_name,threshold,visit_ids FROM public.keepsake_cards WHERE customer_id=$1 ORDER BY sequence_number',
      [owner])).rows;
    expect(cards).toHaveLength(2);
    expect(cards[0]).toEqual({ id: before[0].id, reward_name: 'Original gift', threshold: 2, visit_ids: before[0].visit_ids });
    expect(cards[1]).toMatchObject({ reward_name: 'New gift', threshold: 3 });
    expect(cards[1].visit_ids).toHaveLength(3);
    const unpictured = await as('service_role', null, async () => (await db.query<{ visit_id: string }>(
      'SELECT visit_id FROM public.list_unpictured_verified_visits($1,$2,60)', [owner, org])).rows);
    expect(new Set(unpictured.map((visit) => visit.visit_id))).toEqual(new Set(cards[1].visit_ids));
    await as('authenticated', merchant, async () =>
      db.query("SELECT public.configure_visit_reward($1,'Future gift',2)", [org]));
    const unchanged = (await db.query<{ reward_name: string; threshold: number }>(
      'SELECT reward_name,threshold FROM public.keepsake_cards WHERE id=$1', [cards[1].id])).rows[0];
    expect(unchanged).toEqual({ reward_name: 'New gift', threshold: 3 });
    const balance = await as('service_role', null, async () => (await db.query<{
      balance: { usedVisits: number; availableRewards: number; oldestRewardName: string };
    }>('SELECT public.get_keepsake_balance($1,$2) balance', [owner, org])).rows[0].balance);
    expect(balance).toEqual({ usedVisits: 5, availableRewards: 1, oldestRewardName: 'New gift' });
  });

  it('awards the card and gift after confirmed stamps even when no photos were uploaded', async () => {
    await as('authenticated', merchant, async () =>
      db.query("SELECT public.configure_visit_reward($1,'Gift without photos',2)", [org]));
    await as('authenticated', outsider, async () => db.query('SELECT public.check_in_customer($1)', [main]));
    const first = await as('authenticated', merchant, async () => (await db.query<{
      record_verified_visit: { visitId: string };
    }>('SELECT public.record_verified_visit($1,$2,$3)', [otherCustomer, main, randomUUID()]))
      .rows[0].record_verified_visit.visitId);
    const secondVisitId = (await db.query<{ id: string }>(
      "INSERT INTO public.visits(customer_id,organization_id,branch_id,source,verification_status,verified_at) VALUES($1,$2,$3,'staff','verified',now()) RETURNING id",
      [otherCustomer, org, second])).rows[0].id;
    const cards = (await db.query<{ visit_ids: string[]; threshold: number }>(
      'SELECT visit_ids,threshold FROM public.keepsake_cards WHERE customer_id=$1', [otherCustomer])).rows;
    expect(cards).toHaveLength(1);
    expect(cards[0].threshold).toBe(2);
    expect(new Set(cards[0].visit_ids)).toEqual(new Set([first, secondVisitId]));
    expect((await db.query('SELECT id FROM public.memories WHERE customer_id=$1', [otherCustomer])).rows).toEqual([]);
  });
});

describe('WalletWallet tenant permissions, CRM and outbox', () => {
  let walletGuest: string;
  let walletCustomer: string;
  let connectorId: string;
  let passId: string;
  let campaignId: string;
  beforeAll(async () => {
    walletGuest = randomUUID();
    await db.query('INSERT INTO auth.users(id) VALUES($1)', [walletGuest]);
    walletCustomer = (await db.query<{ id: string }>(
      "INSERT INTO public.customers(auth_user_id,display_name) VALUES($1,'Wallet Guest') RETURNING id",
      [walletGuest])).rows[0].id;
    await db.query("INSERT INTO public.visits(customer_id,organization_id,branch_id,source,verification_status,verified_at) VALUES($1,$2,$3,'staff','verified',now())",
      [walletCustomer,orgA,branchA]);
    connectorId = (await as('service_role',null,async () => (await db.query<{id:string}>(
      "INSERT INTO public.wallet_connectors(label,sealed_key,plan,verified_at) VALUES('Team A','v1:sealed-only','pro',now()) RETURNING id")).rows[0].id));
    await as('service_role',null,async () => {
      await db.query('UPDATE public.organizations SET wallet_connector_id=$1 WHERE id=$2',[connectorId,orgA]);
      await db.query('INSERT INTO public.customer_wallet_preferences(organization_id,customer_id,wallet_opt_in,marketing_opt_in,nearby_opt_in) VALUES($1,$2,true,true,false)',[orgA,walletCustomer]);
      passId = (await db.query<{id:string}>(
        "INSERT INTO public.wallet_passes(organization_id,customer_id,connector_id,status,issued_plan,serial_number,share_url) VALUES($1,$2,$3,'issued','pro','serial-test-123','https://pass.walletwallet.dev/p/serial-test-123') RETURNING id",
        [orgA,walletCustomer,connectorId])).rows[0].id;
    });
  });

  it('does not reveal credentials, other tenants or private photos through CRM', async () => {
    await as('authenticated',ids.merchantA,async () => {
      await expect(db.query('SELECT sealed_key FROM public.wallet_connectors')).rejects.toThrow(/permission denied/);
      await expect(db.query('SELECT * FROM public.wallet_passes')).rejects.toThrow(/permission denied/);
      expect((await db.query('SELECT * FROM public.customer_wallet_preferences')).rows).toHaveLength(0);
      const {rows} = await db.query<{customer_id:string; verified_visits:number; wallet_issued:boolean; wallet_marketing_opt_in:boolean}>(
        'SELECT * FROM public.merchant_crm_customers($1,$2,$3,$4,$5,$6)',
        [orgA,null,30,null,null,'Wallet']);
      expect(rows).toEqual([{customer_id:walletCustomer,display_name:'Wallet Guest',last_visit_at:expect.any(Date),
        verified_visits:1,rewards_redeemed:0,wallet_issued:true,wallet_marketing_opt_in:true}]);
      expect(Object.keys(rows[0])).not.toContain('photo');
      const firstPage = (await db.query<{customer_id:string;last_visit_at:Date}>(
        'SELECT * FROM public.merchant_crm_customers($1,$2,$3,$4,$5,$6)',
        [orgA,null,1,null,null,null])).rows;
      expect(firstPage).toHaveLength(2); // limit + 1 signals more results.
      const nextPage = (await db.query<{customer_id:string}>(
        'SELECT * FROM public.merchant_crm_customers($1,$2,$3,$4,$5,$6)',
        [orgA,null,1,firstPage[0].last_visit_at,firstPage[0].customer_id,null])).rows;
      expect(nextPage[0].customer_id).not.toBe(firstPage[0].customer_id);
    });
    await as('authenticated',ids.branchAdmin,async () => {
      const {rows} = await db.query<{customer_id:string}>(
        'SELECT * FROM public.merchant_crm_customers($1,$2,$3,$4,$5,$6)',
        [orgA,branchA,30,null,null,'Wallet']);
      expect(rows.map(row=>row.customer_id)).toEqual([walletCustomer]);
      await expect(db.query('SELECT * FROM public.merchant_crm_customers($1)',[orgA]))
        .rejects.toThrow(/CRM membership required/);
    });
    await as('authenticated',ids.staff,async () => {
      await expect(db.query('SELECT * FROM public.merchant_crm_customers($1,$2,$3,$4,$5,$6)',
        [orgA,branchA,30,null,null,'Wallet'])).rejects.toThrow(/CRM membership required/);
    });
    await as('authenticated',ids.merchantB,async () => {
      await expect(db.query('SELECT * FROM public.merchant_crm_customers($1,$2,$3,$4,$5,$6)',
        [orgA,null,30,null,null,'Wallet'])).rejects.toThrow(/CRM membership required/);
    });
    await as('authenticated',walletGuest,async () => {
      expect((await db.query('SELECT * FROM public.customer_wallet_preferences')).rows).toHaveLength(1);
      await expect(db.query('UPDATE public.customer_wallet_preferences SET marketing_opt_in=false'))
        .rejects.toThrow(/permission denied/);
      await expect(db.query('SELECT * FROM public.wallet_passes')).rejects.toThrow(/permission denied/);
      await expect(db.query('SELECT * FROM public.claim_wallet_sync(NULL)')).rejects.toThrow(/permission denied|Server-only/);
    });
  });

  it('atomically leases full-pass syncs and never reclaims the same campaign/guest', async () => {
    const current = async () => (await db.query<{sync_revision:number;synced_revision:number;sync_token:string|null}>(
      'SELECT sync_revision,synced_revision,sync_token FROM public.wallet_passes WHERE id=$1',[passId])).rows[0];
    await as('service_role',null,async () => db.query('SELECT public.queue_wallet_sync($1,$2)',[orgA,walletCustomer]));
    expect((await current()).sync_revision).toBe(1);
    const claim = await as('service_role',null,async () => (await db.query<{pass_id:string;revision:number;token:string}>(
      'SELECT * FROM public.claim_wallet_sync($1)',[passId])).rows[0]);
    expect(claim).toMatchObject({pass_id:passId,revision:1});
    await as('service_role',null,async () => {
      expect((await db.query('SELECT * FROM public.claim_wallet_sync($1)',[passId])).rows).toHaveLength(0);
      await db.query('SELECT public.queue_wallet_sync($1,$2)',[orgA,walletCustomer]);
      const wrong = (await db.query<{finish_wallet_sync:boolean}>(
        'SELECT public.finish_wallet_sync($1,$2,$3,true,NULL)',[passId,randomUUID(),1])).rows[0];
      expect(wrong.finish_wallet_sync).toBe(false);
      const done = (await db.query<{finish_wallet_sync:boolean}>(
        'SELECT public.finish_wallet_sync($1,$2,$3,true,NULL)',[passId,claim.token,claim.revision])).rows[0];
      expect(done.finish_wallet_sync).toBe(true);
      expect(await current()).toMatchObject({sync_revision:2,synced_revision:1,sync_token:null});
      const next = (await db.query<{pass_id:string;revision:number;token:string}>(
        'SELECT * FROM public.claim_wallet_sync($1)',[passId])).rows[0];
      expect(next.revision).toBe(2);
      await db.query('SELECT public.finish_wallet_sync($1,$2,$3,true,NULL)',[passId,next.token,next.revision]);
    });
    // Real stamp trigger creates a new revision without the worker route.
    await db.query("INSERT INTO public.visits(customer_id,organization_id,branch_id,source,verification_status,verified_at) VALUES($1,$2,$3,'staff','verified',now())",[walletCustomer,orgA,branchA]);
    expect((await current()).sync_revision).toBe(3);
    campaignId = (await as('service_role',null,async () => (await db.query<{id:string}>(
      `INSERT INTO public.campaigns(organization_id,name,status,config) VALUES($1,'Welcome','active',
       '{"channel":"wallet","audience":"all","message":"Welcome back"}'::jsonb) RETURNING id`,[orgA])).rows[0].id));
    await as('authenticated',ids.merchantA,async () => {
      await expect(db.query('INSERT INTO public.campaigns(organization_id,name) VALUES($1,$2)',[orgA,'Not allowed']))
        .rejects.toThrow(/permission denied/);
    });
    await as('service_role',null,async () => {
      const delivery = (await db.query<{delivery_id:string;pass_id:string;token:string;revision:number}>(
        'SELECT * FROM public.claim_wallet_campaign_delivery($1,$2)',[campaignId,5])).rows;
      expect(delivery).toHaveLength(1);
      expect(delivery[0].pass_id).toBe(passId);
      expect((await db.query('SELECT * FROM public.claim_wallet_sync($1)',[passId])).rows).toHaveLength(0);
      expect((await db.query('SELECT * FROM public.claim_wallet_campaign_delivery($1,$2)',[campaignId,5])).rows).toHaveLength(0);
      const done = (await db.query<{finish_wallet_campaign_delivery:boolean}>(
        'SELECT public.finish_wallet_campaign_delivery($1,$2,$3,true)',
        [delivery[0].delivery_id,delivery[0].token,delivery[0].revision])).rows[0];
      expect(done.finish_wallet_campaign_delivery).toBe(true);
      expect(await current()).toMatchObject({sync_revision:3,synced_revision:3,sync_token:null});
      expect((await db.query('SELECT * FROM public.claim_wallet_campaign_delivery($1,$2)',[campaignId,5])).rows).toHaveLength(0);
      const results = (await db.query<{accepted:number;unknown:number;processing:number}>(
        'SELECT accepted,unknown,processing FROM public.wallet_campaign_delivery_counts($1)',[orgA])).rows[0];
      expect(results).toEqual({accepted:1,unknown:0,processing:0});
    });
    await as('authenticated',ids.staff,async () => {
      expect((await db.query('SELECT id FROM public.campaigns WHERE id=$1',[campaignId])).rows).toHaveLength(0);
    });
    await as('authenticated',walletGuest,async () => {
      await expect(db.query('SELECT * FROM public.claim_wallet_campaign_delivery($1,$2)',[campaignId,5]))
        .rejects.toThrow(/permission denied|Server-only/);
    });
  });

  it('backs off failed functional updates and retries a full pass without blocking later work',async () => {
    await as('service_role',null,async () => {
      await db.query('SELECT public.queue_wallet_sync($1,$2)',[orgA,walletCustomer]);
      const row = (await db.query<{pass_id:string;token:string;revision:number}>(
        'SELECT * FROM public.claim_wallet_sync($1)',[passId])).rows[0];
      const failed = (await db.query<{finish_wallet_sync:boolean}>(
        "SELECT public.finish_wallet_sync($1,$2,$3,false,'Provider update unavailable')",
        [passId,row.token,row.revision])).rows[0];
      expect(failed.finish_wallet_sync).toBe(true);
      const state = (await db.query<{sync_attempts:number;sync_retry_at:Date}>(
        'SELECT sync_attempts,sync_retry_at FROM public.wallet_passes WHERE id=$1',[passId])).rows[0];
      expect(state.sync_attempts).toBe(1);
      expect(state.sync_retry_at.getTime()).toBeGreaterThan(Date.now());
      expect((await db.query('SELECT * FROM public.claim_wallet_sync($1)',[passId])).rows).toHaveLength(0);
      await db.query("UPDATE public.wallet_passes SET sync_retry_at=now()-interval '1 minute' WHERE id=$1",[passId]);
      const retry = (await db.query<{token:string;revision:number}>(
        'SELECT * FROM public.claim_wallet_sync($1)',[passId])).rows[0];
      expect(retry.revision).toBe(row.revision);
      await db.query('SELECT public.finish_wallet_sync($1,$2,$3,true,NULL)',[passId,retry.token,retry.revision]);
      const recovered = (await db.query<{sync_attempts:number;sync_error:string|null;sync_retry_at:Date|null}>(
        'SELECT sync_attempts,sync_error,sync_retry_at FROM public.wallet_passes WHERE id=$1',[passId])).rows[0];
      expect(recovered).toEqual({sync_attempts:0,sync_error:null,sync_retry_at:null});
    });
  });

  it('segments by real stamps, honors withdrawal, and never resends unknown campaign outcomes',async () => {
    const returning = (await as('service_role',null,async () => (await db.query<{id:string}>(
      `INSERT INTO public.campaigns(organization_id,name,status,config) VALUES($1,'Return','active',
       '{"channel":"wallet","audience":"returning","message":"Third visit surprise"}'::jsonb) RETURNING id`,[orgA])).rows[0].id));
    await as('service_role',null,async () => {
      expect((await db.query('SELECT * FROM public.claim_wallet_campaign_delivery($1,$2)',[returning,5])).rows).toHaveLength(0);
    });
    await db.query("INSERT INTO public.visits(customer_id,organization_id,branch_id,source,verification_status,verified_at) VALUES($1,$2,$3,'staff','verified',now())",[walletCustomer,orgA,branchA]);
    await as('service_role',null,async () => {
      // Even a different campaign cannot blast the same phone again today.
      expect((await db.query('SELECT * FROM public.claim_wallet_campaign_delivery($1,$2)',[returning,5])).rows).toHaveLength(0);
      await db.query("UPDATE public.wallet_campaign_deliveries SET attempted_at=now()-interval '2 days' WHERE campaign_id=$1",[campaignId]);
      const leased = (await db.query<{delivery_id:string;token:string;revision:number}>(
        'SELECT * FROM public.claim_wallet_campaign_delivery($1,$2)',[returning,5])).rows;
      expect(leased).toHaveLength(1);
      const result = (await db.query<{finish_wallet_campaign_delivery:boolean}>(
        'SELECT public.finish_wallet_campaign_delivery($1,$2,$3,false)',
        [leased[0].delivery_id,leased[0].token,leased[0].revision])).rows[0];
      expect(result.finish_wallet_campaign_delivery).toBe(true);
      expect((await db.query('SELECT * FROM public.claim_wallet_campaign_delivery($1,$2)',[returning,5])).rows).toHaveLength(0);
      const status = (await db.query<{status:string}>(
        'SELECT status FROM public.wallet_campaign_deliveries WHERE id=$1',[leased[0].delivery_id])).rows[0];
      expect(status.status).toBe('unknown');
      const before = (await db.query<{sync_revision:number}>(
        'SELECT sync_revision FROM public.wallet_passes WHERE id=$1',[passId])).rows[0].sync_revision;
      await db.query('UPDATE public.customer_wallet_preferences SET marketing_opt_in=false WHERE organization_id=$1 AND customer_id=$2',
        [orgA,walletCustomer]);
      expect((await db.query<{sync_revision:number}>(
        'SELECT sync_revision FROM public.wallet_passes WHERE id=$1',[passId])).rows[0].sync_revision).toBe(before+1);
      const newCampaign = (await db.query<{id:string}>(
        `INSERT INTO public.campaigns(organization_id,name,status,config) VALUES($1,'Another','active',
         '{"channel":"wallet","audience":"all","message":"No direct marketing"}'::jsonb) RETURNING id`,[orgA])).rows[0].id;
      expect((await db.query('SELECT * FROM public.claim_wallet_campaign_delivery($1,$2)',[newCampaign,5])).rows).toHaveLength(0);
    });
    await as('authenticated',ids.merchantA,async () => {
      const {rows} = await db.query<{wallet_marketing_opt_in:boolean}>(
        'SELECT * FROM public.merchant_crm_customers($1,$2,$3,$4,$5,$6)',
        [orgA,null,30,null,null,'Wallet']);
      expect(rows[0].wallet_marketing_opt_in).toBe(false);
      await expect(db.query('SELECT public.wallet_health_stats()')).rejects.toThrow(/permission denied|Server-only/);
    });
    const { rows: stats } = await as('service_role',null,async () => db.query<{
      wallet_health_stats: { pendingUpdates:number; manualReviews:number; unknownCampaigns:number; staleProcessing:number };
    }>('SELECT public.wallet_health_stats()'));
    expect(stats[0].wallet_health_stats.unknownCampaigns).toBeGreaterThanOrEqual(1);
    expect(stats[0].wallet_health_stats.pendingUpdates).toBeGreaterThanOrEqual(1);
  });
});

it('backfills only audited historical visits and maps old redemptions to their saved card', async () => {
  const historic = new PGlite();
  try {
    await historic.exec(bootstrap);
    for (const migration of ['00001_initial_schema.sql', '00002_product_refactor.sql',
      '00007_secure_core.sql', '00008_customer_accounts.sql']) {
      await historic.exec(readFileSync(new URL(migration, sqlDir), 'utf8'));
    }
    const userId = randomUUID();
    await historic.query('INSERT INTO auth.users(id) VALUES($1)', [userId]);
    const orgId = (await historic.query<{ id: string }>(
      "INSERT INTO public.organizations(name,slug,country) VALUES('History Cafe','history-cafe','EG') RETURNING id")).rows[0].id;
    const branchId = (await historic.query<{ id: string }>(
      "INSERT INTO public.branches(organization_id,name,slug) VALUES($1,'Main','main') RETURNING id", [orgId])).rows[0].id;
    const customerId = (await historic.query<{ id: string }>(
      'INSERT INTO public.customers(auth_user_id) VALUES($1) RETURNING id', [userId])).rows[0].id;
    const ruleId = (await historic.query<{ id: string }>(
      "INSERT INTO public.reward_rules(organization_id,name,threshold,trigger_type,reward_type) VALUES($1,'Old gift',2,'visit_count','free_item') RETURNING id",
      [orgId])).rows[0].id;
    for (let index = 0; index < 2; index++) await historic.query(
      "INSERT INTO public.visits(customer_id,organization_id,branch_id,source,verification_status,verified_at) VALUES($1,$2,$3,'staff','verified',now()-interval '2 hours')",
      [customerId, orgId, branchId]);
    await historic.query('INSERT INTO public.visits(customer_id,organization_id,branch_id,verification_status) VALUES($1,$2,$3,$4)',
      [customerId, orgId, branchId, 'suspicious']);
    const eventId = (await historic.query<{ id: string }>(
      "INSERT INTO public.reward_events(customer_id,organization_id,branch_id,type,value,reference_type,reference_id) VALUES($1,$2,$3,'reward_redeemed',1,'reward_rules',$4) RETURNING id",
      [customerId, orgId, branchId, ruleId])).rows[0].id;
    await historic.exec(readFileSync(new URL('00009_visit_keepsakes.sql', sqlDir), 'utf8'));
    const cards = (await historic.query<{
      threshold: number; reward_name: string; visit_ids: string[]; redemption_event_id: string;
    }>('SELECT threshold,reward_name,visit_ids,redemption_event_id FROM public.keepsake_cards WHERE customer_id=$1',
      [customerId])).rows;
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ threshold: 2, reward_name: 'Old gift', redemption_event_id: eventId });
    expect(cards[0].visit_ids).toHaveLength(2);
  } finally { await historic.close(); }
}, 15_000);

it('supports pending_consent memory_status enum and seeds deterministic staff roster (00012)', async () => {
  const staff = (await db.query<{ id: string; role: string }>(
    "SELECT om.user_id id, om.role FROM public.organization_members om JOIN public.organizations o ON o.id = om.organization_id WHERE o.slug = 'memories' AND om.user_id = 'a0000000-0000-0000-0000-000000000001'::uuid"
  )).rows;
  expect(staff).toHaveLength(1);
  expect(staff[0].role).toBe('staff');

  const vId = (await db.query<{ id: string }>(
    "INSERT INTO public.visits(customer_id, organization_id, branch_id, source, verification_status, verified_at) VALUES($1, $2, $3, 'staff', 'verified', now()) RETURNING id",
    [customer, orgA, branchA]
  )).rows[0].id;
  const memoryId = randomUUID();
  await db.query(
    "INSERT INTO public.memories(id, customer_id, organization_id, branch_id, visit_id, original_url, status, visibility) VALUES($1, $2, $3, $4, $5, 'https://example.com/test.jpg', 'pending_consent', 'private')",
    [memoryId, customer, orgA, branchA, vId]
  );
  const rows = (await db.query<{ id: string; status: string }>(
    "SELECT id, status FROM public.memories WHERE status = 'pending_consent' AND id = $1",
    [memoryId]
  )).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe('pending_consent');
});
