import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processImageDerivatives } from '@/lib/services/images';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const organizationId = formData.get('organizationId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Max 10MB upload guard
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // 1. Process WebP Derivatives via Sharp
    const derivatives = await processImageDerivatives(inputBuffer);

    const supabase = createAdminClient();
    const timestamp = Date.now();
    const orgPrefix = organizationId ? `${organizationId}/` : 'general/';
    const baseFilename = `${orgPrefix}${timestamp}_${Math.random().toString(36).substring(2, 8)}`;

    // 2. Upload original, optimized, and thumbnail to Supabase Storage
    const [origRes, optRes, thumbRes] = await Promise.all([
      supabase.storage.from('memories').upload(`${baseFilename}_orig.webp`, inputBuffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      }),
      supabase.storage.from('memories').upload(`${baseFilename}_opt.webp`, derivatives.optimizedBuffer, {
        contentType: 'image/webp',
        upsert: false,
      }),
      supabase.storage.from('memories').upload(`${baseFilename}_thumb.webp`, derivatives.thumbnailBuffer, {
        contentType: 'image/webp',
        upsert: false,
      }),
    ]);

    if (optRes.error || thumbRes.error) {
      return NextResponse.json(
        { error: 'Failed to upload derivative images to storage', details: (optRes.error || thumbRes.error)?.message },
        { status: 500 }
      );
    }

    const { data: optPublic } = supabase.storage.from('memories').getPublicUrl(`${baseFilename}_opt.webp`);
    const { data: thumbPublic } = supabase.storage.from('memories').getPublicUrl(`${baseFilename}_thumb.webp`);
    const { data: origPublic } = supabase.storage.from('memories').getPublicUrl(`${baseFilename}_orig.webp`);

    return NextResponse.json({
      success: true,
      originalUrl: origPublic.publicUrl,
      optimizedUrl: optPublic.publicUrl,
      thumbnailUrl: thumbPublic.publicUrl,
      width: derivatives.width,
      height: derivatives.height,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Image processing failed' }, { status: 500 });
  }
}
