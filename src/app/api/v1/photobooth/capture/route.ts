import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const captureSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(6, 'Phone number must be at least 6 digits').max(30),
  originalUrl: z.string().min(1, 'Photo is required'),
  caption: z.string().max(280).optional().nullable(),
  organizationId: z.string().uuid().optional().default('00000000-0000-0000-0000-000000000001'),
  branchId: z.string().uuid().optional().default('00000000-0000-0000-0000-000000000002'),
  liveWallConsent: z.boolean().optional().default(true),
});

// Helper to normalize Arabic numerals and symbols to standard digits
function normalizePhoneNumber(raw: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let cleaned = raw.trim();
  arabicDigits.forEach((digit, index) => {
    cleaned = cleaned.replaceAll(digit, index.toString());
  });
  // Keep leading + if present, strip all other non-digits
  const hasPlus = cleaned.startsWith('+');
  const digitsOnly = cleaned.replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = captureSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      phone: rawPhone,
      originalUrl,
      caption,
      organizationId,
      branchId,
      liveWallConsent,
    } = parsed.data;

    const cleanPhone = normalizePhoneNumber(rawPhone);
    if (cleanPhone.length < 6) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Resolve or Create Customer (CRM Lead)
    let customer: any = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('anonymous_id', cleanPhone)
      .maybeSingle();

    if (existingCustomer) {
      const { data: updatedCustomer, error: updateErr } = await supabase
        .from('customers')
        .update({
          display_name: name,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();

      customer = updateErr ? existingCustomer : updatedCustomer;
    } else {
      const { data: newCustomer, error: insertErr } = await supabase
        .from('customers')
        .insert({
          display_name: name,
          anonymous_id: cleanPhone,
          last_seen_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json(
          { error: 'Failed to create customer profile in CRM', details: insertErr.message },
          { status: 500 }
        );
      }
      customer = newCustomer;
    }

    // 2. Record Visit for Anti-Fraud & Reward Progression
    const { data: visit, error: visitErr } = await supabase
      .from('visits')
      .insert({
        customer_id: customer.id,
        organization_id: organizationId,
        branch_id: branchId,
        source: 'table',
        verification_status: 'verified',
      })
      .select()
      .single();

    if (visitErr) {
      return NextResponse.json(
        { error: 'Failed to record visit', details: visitErr.message },
        { status: 500 }
      );
    }

    // 3. Create Memory record linked to visit_id
    const { data: memory, error: memErr } = await supabase
      .from('memories')
      .insert({
        customer_id: customer.id,
        organization_id: organizationId,
        branch_id: branchId,
        visit_id: visit.id,
        original_url: originalUrl,
        optimized_url: originalUrl,
        thumbnail_url: originalUrl,
        caption: caption || 'Specialty Coffee Memory ☕✨',
        status: 'approved',
        visibility: liveWallConsent ? 'live_wall' : 'private',
      })
      .select()
      .single();

    if (memErr) {
      return NextResponse.json(
        { error: 'Failed to create memory', details: memErr.message },
        { status: 500 }
      );
    }

    // 4. Return confirmed customer and memory profile
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.display_name,
        phone: customer.anonymous_id,
        createdAt: customer.created_at,
      },
      memory: {
        id: memory.id,
        status: memory.status,
        visibility: memory.visibility,
        caption: memory.caption,
        createdAt: memory.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
