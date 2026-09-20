import { describe, it, expect } from 'vitest';
import { evaluateVisitEligibility, hashIpAddress } from '@/lib/services/anti-fraud';

describe('Anti-Fraud Visit Cooldown & Velocity Engine', () => {
  const customerId = '00000000-0000-0000-0000-000000000001';
  const branchId = '00000000-0000-0000-0000-000000000002';
  const deviceFingerprint = 'device_fp_iphone16_xyz';
  const ipAddress = '198.51.100.42';

  it('approves a visit when no prior visits exist', () => {
    const result = evaluateVisitEligibility({
      customerId,
      branchId,
      deviceFingerprint,
      ipAddress,
      recentVisits: [],
    });

    expect(result.status).toBe('verified');
    expect(result.cooldownRemainingMinutes).toBeUndefined();
    expect(result.ipHash).toBe(hashIpAddress(ipAddress));
  });

  it('rejects a visit with cooldown_rejected when device visited 15 minutes ago', () => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const result = evaluateVisitEligibility({
      customerId,
      branchId,
      deviceFingerprint,
      ipAddress,
      recentVisits: [
        {
          createdAt: fifteenMinutesAgo,
          deviceFingerprint,
          ipHash: hashIpAddress(ipAddress),
        },
      ],
    });

    expect(result.status).toBe('cooldown_rejected');
    expect(result.cooldownRemainingMinutes).toBe(45);
    expect(result.reason).toContain('Visit cooldown active');
  });

  it('approves a visit when prior visit is older than 60 minutes', () => {
    const seventyMinutesAgo = new Date(Date.now() - 70 * 60 * 1000).toISOString();
    const result = evaluateVisitEligibility({
      customerId,
      branchId,
      deviceFingerprint,
      ipAddress,
      recentVisits: [
        {
          createdAt: seventyMinutesAgo,
          deviceFingerprint,
          ipHash: hashIpAddress(ipAddress),
        },
      ],
    });

    expect(result.status).toBe('verified');
  });

  it('flags as suspicious when an IP pool creates 5 or more visits within 10 minutes', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const currentIpHash = hashIpAddress(ipAddress);

    const burstVisits = Array.from({ length: 5 }, (_, i) => ({
      createdAt: fiveMinutesAgo,
      deviceFingerprint: `other_device_${i}`,
      ipHash: currentIpHash,
    }));

    const result = evaluateVisitEligibility({
      customerId,
      branchId,
      deviceFingerprint: 'new_device_different',
      ipAddress,
      recentVisits: burstVisits,
    });

    expect(result.status).toBe('suspicious');
    expect(result.reason).toContain('High visit velocity detected');
  });
});
