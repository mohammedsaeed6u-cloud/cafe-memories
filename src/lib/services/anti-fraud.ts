import crypto from 'crypto';

export interface AntiFraudCheckParams {
  customerId: string;
  branchId: string;
  deviceFingerprint?: string | null;
  ipAddress?: string | null;
  recentVisits: Array<{
    createdAt: string;
    deviceFingerprint?: string | null;
    ipHash?: string | null;
  }>;
}

export interface AntiFraudResult {
  status: 'verified' | 'suspicious' | 'cooldown_rejected';
  reason?: string;
  ipHash: string;
  cooldownRemainingMinutes?: number;
}

const VISIT_COOLDOWN_MINUTES = 60;
const VELOCITY_THRESHOLD_BURST = 5;
const VELOCITY_WINDOW_MINUTES = 10;

export function hashIpAddress(ip: string): string {
  const salt = process.env.ANTI_FRAUD_SALT || 'cafe-memories-anti-fraud-salt-2026';
  return crypto.createHmac('sha256', salt).update(ip.trim()).digest('hex');
}

export function evaluateVisitEligibility(params: AntiFraudCheckParams): AntiFraudResult {
  const now = Date.now();
  const currentIpHash = params.ipAddress ? hashIpAddress(params.ipAddress) : 'unknown_ip';

  // 1. Device Cooldown: Enforce single visit per 60-minute window per branch for the same device
  for (const visit of params.recentVisits) {
    const visitAgeMs = now - new Date(visit.createdAt).getTime();
    const visitAgeMinutes = visitAgeMs / (1000 * 60);

    const matchesDevice = Boolean(params.deviceFingerprint && visit.deviceFingerprint === params.deviceFingerprint);

    if (matchesDevice && visitAgeMinutes < VISIT_COOLDOWN_MINUTES) {
      const remainingMinutes = Math.ceil(VISIT_COOLDOWN_MINUTES - visitAgeMinutes);
      return {
        status: 'cooldown_rejected',
        reason: `Visit cooldown active. Please wait ${remainingMinutes} minutes before earning your next stamp.`,
        ipHash: currentIpHash,
        cooldownRemainingMinutes: remainingMinutes,
      };
    }
  }

  // 2. Velocity Check: Detect suspicious rapid bursts from same IP address
  const recentBurstVisits = params.recentVisits.filter(visit => {
    const ageMinutes = (now - new Date(visit.createdAt).getTime()) / (1000 * 60);
    return ageMinutes <= VELOCITY_WINDOW_MINUTES && visit.ipHash === currentIpHash;
  });

  if (recentBurstVisits.length >= VELOCITY_THRESHOLD_BURST) {
    return {
      status: 'suspicious',
      reason: 'High visit velocity detected from IP pool. Flagged for merchant review.',
      ipHash: currentIpHash,
    };
  }

  return {
    status: 'verified',
    ipHash: currentIpHash,
  };
}
