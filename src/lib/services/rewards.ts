export interface EvaluateRewardParams {
  currentVisitCount: number;
  threshold: number;
  rewardType: string;
  rewardValue?: number | null;
  ruleId: string;
}

export interface RewardEvaluationResult {
  unlocked: boolean;
  progressPercent: number;
  visitsUntilNext: number;
  currentStreak: number;
}

export function calculateRewardProgress(params: EvaluateRewardParams): RewardEvaluationResult {
  const { currentVisitCount, threshold } = params;
  if (threshold <= 0) {
    throw new Error('Threshold must be a positive integer');
  }

  const remainder = currentVisitCount % threshold;
  const unlocked = currentVisitCount > 0 && remainder === 0;
  const visitsUntilNext = unlocked ? threshold : threshold - remainder;
  const progressPercent = Math.min(100, Math.round(((threshold - visitsUntilNext) / threshold) * 100));

  return {
    unlocked,
    progressPercent,
    visitsUntilNext,
    currentStreak: currentVisitCount,
  };
}

export function generateIdempotencyKey(prefix: string, customerId: string, eventIndex: number): string {
  return `${prefix}_${customerId}_${eventIndex}_${Date.now()}`;
}
