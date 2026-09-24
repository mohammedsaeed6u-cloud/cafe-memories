import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const cookieAnonId = request.cookies.get('cafe_memories_anon_id')?.value;
    const clientAnonId = body.anonymousId || cookieAnonId;

    const supabase = createAdminClient();
    let customer: any = null;

    if (clientAnonId) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, anonymous_id, display_name, created_at, last_seen_at')
        .eq('anonymous_id', clientAnonId)
        .maybeSingle();

      if (existingCustomer) {
        customer = existingCustomer;
        // Update last seen
        await supabase
          .from('customers')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', customer.id);
      }
    }

    if (!customer) {
      const newAnonId = 'anon_' + crypto.randomBytes(16).toString('hex');
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          anonymous_id: newAnonId,
          display_name: 'ضيف مميز',
        })
        .select()
        .single();

      if (error || !newCustomer) {
        return NextResponse.json({ error: 'Failed to create guest identity', details: error?.message }, { status: 500 });
      }

      customer = newCustomer;

      // Link identity provider
      await supabase.from('customer_identities').insert({
        customer_id: customer.id,
        provider: 'anonymous',
        provider_subject: newAnonId,
      });
    }

    // Fetch customer's verified visits count & memories for café story
    const { count: visitsCount } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id)
      .eq('verification_status', 'verified');

    const { data: memories } = await supabase
      .from('memories')
      .select('id, original_url, optimized_url, thumbnail_url, caption, status, visibility, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        anonymousId: customer.anonymous_id,
        displayName: customer.display_name,
        visitsCount: visitsCount || 0,
        memories: memories || [],
      },
    });

    // Set persistent session cookie (1 year expiry)
    response.cookies.set('cafe_memories_anon_id', customer.anonymous_id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
