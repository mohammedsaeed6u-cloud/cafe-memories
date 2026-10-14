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
  for (const migration of ['00001_initial_schema.sql', '00002_product_refactor.sql']) {
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
  await db.exec(readFileSync(new URL('00003_secure_core.sql', sqlDir), 'utf8'));
  // Mirrors Supabase default public-schema grants; RLS must still reject unsafe operations.
  await db.exec('GRANT USAGE ON SCHEMA public, auth TO authenticated, service_role; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;');
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
      expect((await db.query("UPDATE public.organizations SET status='active' WHERE id=$1 RETURNING id", [orgA])).rows).toEqual([]);
      await expect(db.query("INSERT INTO public.qr_codes(organization_id,branch_id,slug,source) VALUES($1,$2,'forged-qr','table')", [orgA, branchA]))
        .rejects.toThrow();
      await expect(db.query("SELECT public.configure_visit_reward($1,'Free Tea',2)", [orgA]))
        .rejects.toThrow(/Not authorized/);
    });
    await as('authenticated', ids.merchantA, async () => {
      expect((await db.query("UPDATE public.organizations SET status='suspended' WHERE id=$1 RETURNING id", [orgA])).rows).toEqual([]);
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
      await db.query("UPDATE public.memories SET status='approved' WHERE id=$1", [memoryId]);
    });
    await as('authenticated', ids.guest, async () => {
      await db.query('SELECT public.set_customer_wall_consent($1,false)', [memoryId]);
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
