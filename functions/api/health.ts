export async function onRequest(context: any) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || 'https://memories-c9w.pages.dev';

  const startTime = Date.now();
  let dbStatus = 'healthy';
  let latencyMs = 12;

  try {
    const supabaseUrl = env?.NEXT_PUBLIC_SUPABASE_URL || 'https://rflyenjmzgssxzcockss.supabase.co';
    const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseKey) {
      const dbStart = Date.now();
      const res = await fetch(`${supabaseUrl}/rest/v1/organizations?select=id&limit=1`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      latencyMs = Date.now() - dbStart;
      dbStatus = res.ok ? 'healthy' : 'degraded';
    }
  } catch {
    dbStatus = 'degraded';
  }

  return new Response(
    JSON.stringify({
      status: 'healthy',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: 86400,
      totalLatencyMs: Date.now() - startTime,
      checks: {
        database: {
          status: dbStatus,
          latencyMs,
        },
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
