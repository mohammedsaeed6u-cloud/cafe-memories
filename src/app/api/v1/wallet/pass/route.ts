import { apiError } from '@/lib/server/context';

/** A ZIP called .pkpass is not an Apple-signed pass. Never issue forged passes. */
export async function GET() {
  return apiError('Wallet passes require configured PassKit signing; issuance is not available', 501);
}
