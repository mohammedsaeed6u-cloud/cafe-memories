import { apiError } from '@/lib/server/context';

/** Retired: this endpoint accepted arbitrary phone/tenant IDs and minted verified visits. */
export async function POST() {
  return apiError('Capture moved to /api/v1/memories/upload; a merchant must verify visits separately', 410);
}
