import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'healthy' | 'degraded'; latencyMs: number }> = {};

  try {
    const dbStart = Date.now();
    // Check connectivity as the server, not a random visitor constrained by RLS.
    const { error: dbError } = await createAdminClient().from('organizations').select('id').limit(1);
    checks.database = {
      status: dbError ? 'degraded' : 'healthy',
      latencyMs: Date.now() - dbStart,
    };
  } catch {
    checks.database = { status: 'degraded', latencyMs: 0 };
  }

  const isHealthy = Object.values(checks).every(c => c.status === 'healthy');

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      scope: 'database-connectivity-only',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime ? Math.floor(process.uptime()) : 0,
      totalLatencyMs: Date.now() - startTime,
      checks,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
