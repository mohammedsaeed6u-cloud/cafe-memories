import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/v1/customer/wallet/route';

const mocks = vi.hoisted(() => ({ customer:vi.fn(),issue:vi.fn(),payload:vi.fn(),
  savedPreferences:vi.fn(),reserved:vi.fn(),updated:vi.fn(),admin:vi.fn(),
  state:{existing:null as null | {status:string},logo:null as string | null} }));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/server/context',async (importActual) => {
  const original = await importActual<typeof import('@/lib/server/context')>();
  return {...original,requireCustomer:mocks.customer};
});
vi.mock('@/lib/server/wallet-crypto',()=>({walletEncryptionReady:()=>true,openWalletKey:()=>''}));
vi.mock('@/lib/server/walletwallet',()=>({issueWalletWalletPass:mocks.issue,
  validateInstallLink:()=>null,revokeWalletWalletPass:vi.fn()}));
vi.mock('@/lib/server/wallet-service',()=>({payloadForWalletPass:mocks.payload,
  processWalletSync:vi.fn()}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:mocks.admin}));

const customerId='13901516-1304-4c1e-89cd-f98466576bb8';
const orgId='9e6a796d-08f5-4cbb-833b-49495c682714';
const connectorId='7647bed3-b2a0-498e-8912-9e82cc48d2d4';
const passId='aa54b5a4-f899-49e7-8df3-494d07acf766';
const serial='serial-123456';
const shareUrl=`https://pass.walletwallet.dev/p/${serial}`;
function post(body:object) { return new NextRequest('https://cafe.example.test/api/v1/customer/wallet',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); }
const choices={cafeSlug:'real-cafe',walletConsent:true,marketingConsent:false,nearbyConsent:false};

beforeEach(() => {
  vi.clearAllMocks(); mocks.state.existing=null; mocks.state.logo=null;
  vi.stubEnv('NEXT_PUBLIC_SITE_URL','');
  mocks.customer.mockResolvedValue({context:{customerId}});
  mocks.issue.mockResolvedValue({serialNumber:serial,shareUrl});
  mocks.payload.mockResolvedValue({apiKey:'server-only-key',payload:{branded:true}});
  mocks.admin.mockImplementation(() => ({from:(table:string) => {
    const chain:Record<string, (...args: unknown[]) => unknown> = { eq:()=>chain,select:()=>chain,not:()=>chain,
      limit:()=>chain,
      maybeSingle:async () => ({data:table==='organizations'
        ? {id:orgId,name:'Café',status:'active',logo_url:mocks.state.logo,wallet_connector_id:connectorId}
        : table==='wallet_connectors' ? {id:connectorId,plan:'pro',enabled:true,verified_at:new Date().toISOString()}
          : table==='wallet_passes' ? mocks.state.existing : null,error:null}),
      upsert:async (value:unknown) => {mocks.savedPreferences(value);return {error:null};},
      insert:(value:unknown) => {mocks.reserved(value); mocks.state.existing={status:'pending'};
        return {select:()=>({single:async()=>({data:{id:passId},error:null})})};},
      update:(value:{status:string}) => {mocks.updated(value);mocks.state.existing={status:value.status};
        return {eq:()=>({eq:()=>({select:()=>({maybeSingle:async()=>({data:{id:passId},error:null})})})})};},
    };
    return chain;
  }}));
});

afterEach(() => vi.unstubAllEnvs());

describe('customer-owned Wallet issuance API',() => {
  it('requires explicit issuance consent before any Supabase or provider call',async () => {
    const response = await POST(post({cafeSlug:'real-cafe',marketingConsent:false,nearbyConsent:false}));
    expect(response.status).toBe(400);
    expect(mocks.customer).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it('blocks unauthenticated guests before the service-role client is used',async () => {
    mocks.customer.mockResolvedValueOnce({error:NextResponse.json({error:'Sign in'}, {status:401})});
    const response = await POST(post(choices));
    expect(response.status).toBe(401);
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it('never duplicates a pass already issued or awaiting manual review',async () => {
    mocks.state.existing={status:'needs_review'};
    const response = await POST(post(choices));
    expect(response.status).toBe(409);
    expect(mocks.reserved).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it('refuses a Pro pass with an uploaded logo until the public HTTPS image origin is configured',async () => {
    mocks.state.logo=`${orgId}/logo-67a985bf-d1a0-4825-a9dc-795d35fe29c2.png`;
    const response = await POST(post(choices));
    expect(response.status).toBe(503);
    expect(mocks.reserved).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://cafe-memories.example.org');
    expect((await POST(post(choices))).status).toBe(201);
  });
  it('persists owner permissions and reserves a pending row before calling the provider',async () => {
    const response = await POST(post(choices));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({issued:true,shareUrl});
    expect(mocks.savedPreferences).toHaveBeenCalledWith(expect.objectContaining({
      organization_id:orgId, customer_id:customerId,wallet_opt_in:true,
      marketing_opt_in:false,nearby_opt_in:false}));
    expect(mocks.reserved).toHaveBeenCalledWith(expect.objectContaining({
      organization_id:orgId,customer_id:customerId,connector_id:connectorId,status:'pending'}));
    expect(mocks.issue).toHaveBeenCalledWith('server-only-key',{branded:true});
    expect(mocks.updated).toHaveBeenCalledWith(expect.objectContaining({status:'issued',
      serial_number:serial,share_url:shareUrl}));
  });
  it('holds an unknown provider outcome for human review instead of claiming a second issuance',async () => {
    mocks.issue.mockRejectedValueOnce(new Error('timeout'));
    const failed = await POST(post(choices));
    expect(failed.status).toBe(503);
    expect(mocks.updated).toHaveBeenCalledWith(expect.objectContaining({status:'needs_review'}));
    expect((await POST(post(choices))).status).toBe(409);
    expect(mocks.issue).toHaveBeenCalledTimes(1);
  });
});
