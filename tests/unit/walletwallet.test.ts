import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { walletPassPayload, safeSiteOrigin, type WalletPassInput } from '@/lib/wallet-pass';
import { sealWalletKey, openWalletKey, walletEncryptionReady } from '@/lib/server/wallet-crypto';
import { checkWalletUsage, issueWalletWalletPass, updateWalletWalletPass,
  revokeWalletWalletPass, validateInstallLink } from '@/lib/server/walletwallet';

const key = `ww_live_${'a'.repeat(32)}`;
const serial = 'serial-123456';
const base: WalletPassInput = {
  organizationId:'e8d47046-1669-4fb3-863d-09d86306b917', organizationSlug:'coffee-house',
  customerId:'fb0036f3-4b0a-42b5-8ba1-33b4a60f973c',
  brand:{name:'Mona Café',tagline:'Fresh',logoUrl:'/api/v1/brand/e8d47046-1669-4fb3-863d-09d86306b917/logo?v=logo-safe.png',
    primaryColor:'#183A32',accentColor:'#F2C77F',frameStyle:'film',walletColorPreset:'green',
    socialLinks:{instagram:'https://instagram.com/coffee-house'}},
  verifiedVisits:7,usedVisits:5,threshold:5,rewardName:'One coffee',
  marketingOptIn:false,nearbyOptIn:false,lastCampaignMessage:' ',plan:'pro',
  verifiedAt:new Date().toISOString(),siteOrigin:'https://coffee.example.com',
  branches:[{latitude:30.0,longitude:31.7},{latitude:null,longitude:31.7}],
};
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('WalletWallet pass data minimization and plan gates',() => {
  it('co-brands without leaking photos, phone or guest contacts',() => {
    const pass = walletPassPayload(base);
    expect(pass.organizationName).toContain('stampy. × Mona Café');
    expect(pass.secondaryFields).toEqual([{label:'الأختام',value:'2/5'},
      {label:'المكافأة',value:'One coffee'}]);
    expect(JSON.stringify(pass)).not.toMatch(/instagram|photo|email|phone|social/);
    expect(pass.logoURL).toContain('/wallet-mark');
    expect(pass).not.toHaveProperty('locations');
    expect(pass.backFields.some((field)=>field.label==='الإشعارات' && field.value===' ' &&
      'changeMessage' in field && field.changeMessage==='%@')).toBe(true);
  });
  it('uses at most ten real branch locations after explicit nearby permission and Pro verification',() => {
    const pass = walletPassPayload({...base,nearbyOptIn:true,marketingOptIn:true,
      lastCampaignMessage:'We miss you',branches:Array.from({length:15},()=>({latitude:30,longitude:31}))});
    expect(pass.locations).toHaveLength(10);
    expect(pass.backFields.find((field)=>field.label==='الإشعارات')?.value).toBe('We miss you');
    const free = walletPassPayload({...base,plan:'free',nearbyOptIn:true,marketingOptIn:true});
    expect(free).not.toHaveProperty('logoURL');
    expect(free).not.toHaveProperty('locations');
    expect(free.backFields.some((field)=>field.label==='الإشعارات')).toBe(false);
    const stale = walletPassPayload({...base,verifiedAt:'2020-01-01T00:00:00Z',nearbyOptIn:true});
    expect(stale).not.toHaveProperty('locations');
  });
  it('never trusts a browser host to build a public logo URL',() => {
    expect(safeSiteOrigin('http://localhost:3000')).toBeNull();
    expect(safeSiteOrigin('https://evil.com@trusted.example.com')).toBeNull();
    expect(safeSiteOrigin('https://coffee.example.com/path')).toBeNull();
    expect(walletPassPayload({...base,siteOrigin:'http://localhost:3000'})).not.toHaveProperty('logoURL');
    expect(safeSiteOrigin('https://coffee.example.com/')).toBe('https://coffee.example.com');
  });
});

describe('connector encryption and fixed-host provider client',() => {
  it('encrypts API keys with a dedicated authenticated deployment key',() => {
    vi.stubEnv('WALLET_CONNECTOR_ENCRYPTION_KEY',Buffer.alloc(32,4).toString('base64'));
    expect(walletEncryptionReady()).toBe(true);
    const blob = sealWalletKey(key);
    expect(blob).toMatch(/^v1:/);
    expect(blob).not.toContain(key);
    expect(openWalletKey(blob)).toBe(key);
    expect(() => openWalletKey(blob.slice(0,-3)+'abc')).toThrow();
    vi.stubEnv('WALLET_CONNECTOR_ENCRYPTION_KEY','');
    expect(walletEncryptionReady()).toBe(false);
  });
  it('pins provider calls and rejects forged hosted install links',async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      serialNumber:serial, shareUrl:`https://pass.walletwallet.dev/p/${serial}` }), {status:201}));
    vi.stubGlobal('fetch',fetcher);
    expect(await issueWalletWalletPass(key,{logoText:'stampy. × Café'}))
      .toEqual({serialNumber:serial,shareUrl:`https://pass.walletwallet.dev/p/${serial}`});
    expect(fetcher).toHaveBeenCalledWith('https://api.walletwallet.dev/api/passes',
      expect.objectContaining({method:'POST',redirect:'error',headers:expect.objectContaining({Authorization:`Bearer ${key}`})}));
    expect(validateInstallLink(`https://pass.walletwallet.dev.evil.tld/p/${serial}`,serial)).toBeNull();
    expect(validateInstallLink(`https://pass.walletwallet.dev/p/${serial}?redirect=evil`,serial)).toBeNull();
    expect(validateInstallLink(`https://pass.walletwallet.dev/p/another`,serial)).toBeNull();
  });
  it('rejects invalid provider responses rather than inventing a card or notification',async () => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      serialNumber:serial,shareUrl:`https://evil.test/p/${serial}`})))
      .mockResolvedValueOnce(new Response(JSON.stringify({serialNumber:'another',notifiedDevices:8})))
      .mockResolvedValueOnce(new Response(JSON.stringify({plan:'pro',count:3,remaining:10,limit:13})))
      .mockResolvedValueOnce(new Response(JSON.stringify({serialNumber:serial,deleted:true,googleRevoked:false}))));
    await expect(issueWalletWalletPass(key,{})).rejects.toThrow(/install URL/);
    await expect(updateWalletWalletPass(key,serial,{})).rejects.toThrow(/update response/);
    expect((await checkWalletUsage(key)).plan).toBe('pro');
    await expect(revokeWalletWalletPass(key,serial)).rejects.toThrow(/not confirmed/);
  });
});
