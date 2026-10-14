import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://memories-c9w.pages.dev',
  'http://localhost:3000',
  'http://localhost:3001',
];

function resolveAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return 'https://memories-c9w.pages.dev';
  if (ALLOWED_ORIGINS.includes(requestOrigin) || requestOrigin.endsWith('.pages.dev')) {
    return requestOrigin;
  }
  return 'https://memories-c9w.pages.dev';
}

function getAdminClient(env: any) {
  const url = env?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rflyenjmzgssxzcockss.supabase.co';
  const key = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not configured');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function corsHeaders(origin: string = 'https://memories-c9w.pages.dev') {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(origin),
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, apikey',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data: any, status: number = 200, origin: string = 'https://memories-c9w.pages.dev') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/v1/, '').replace(/\/$/, '');
  const method = request.method;
  const origin = request.headers.get('origin') || 'https://memories-c9w.pages.dev';

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  const supabase = getAdminClient(env);

  try {
    // 1. Health check: /api/v1/health
    if (path === '' || path === '/health') {
      return jsonResponse({ status: 'ok', service: 'cafe-memories-api', timestamp: new Date().toISOString() });
    }

    // 2. Memories route: /api/v1/memories
    if (path === '/memories') {
      if (method === 'DELETE') {
        let memoryId = url.searchParams.get('memoryId');
        if (!memoryId) {
          const body = await request.json().catch(() => ({}));
          memoryId = body.memoryId;
        }
        if (!memoryId) return jsonResponse({ error: 'memoryId is required' }, 400, origin);
        const { error } = await supabase.from('memories').delete().eq('id', memoryId);
        if (error) return jsonResponse({ error: error.message }, 500, origin);
        return jsonResponse({ success: true, memoryId }, 200, origin);
      }
      if (method === 'GET') {
        const status = url.searchParams.get('status') || 'approved';
        const visibility = url.searchParams.get('visibility');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '30', 10), 100);

        let query = supabase
          .from('memories')
          .select('id, original_url, optimized_url, thumbnail_url, caption, created_at, status, visibility, customers(display_name, avatar_url, anonymous_id)')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (status !== 'all') {
          query = query.eq('status', status);
        }
        if (visibility && visibility !== 'all') {
          if (visibility === 'live_wall') {
            query = query.in('visibility', ['live_wall', 'public']);
          } else {
            query = query.eq('visibility', visibility);
          }
        }

        const { data, error } = await query;
        if (error) {
          return jsonResponse({ success: false, error: error.message }, 500, origin);
        }

        return jsonResponse({ success: true, memories: data || [], count: data?.length || 0 }, 200, origin);
      }

      if (method === 'PATCH') {
        const body = await request.json().catch(() => ({}));
        const { memoryId, status } = body;
        if (!memoryId || !status) {
          return jsonResponse({ error: 'memoryId and status required' }, 400, origin);
        }
        const { data, error } = await supabase
          .from('memories')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', memoryId)
          .select()
          .maybeSingle();

        if (error) return jsonResponse({ error: error.message }, 500, origin);
        return jsonResponse({ success: true, memory: data }, 200, origin);
      }
    }

    // 3. Image Upload: /api/v1/memories/upload
    if (path === '/memories/upload' && method === 'POST') {
      let fileBuffer: ArrayBuffer | null = null;
      let contentType = 'image/jpeg';
      const fileId = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
      let filename = `uploads/${Date.now()}_${fileId}.jpg`;

      const reqType = request.headers.get('content-type') || '';
      if (reqType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) return jsonResponse({ error: 'No file uploaded' }, 400, origin);
        fileBuffer = await file.arrayBuffer();
        contentType = file.type || 'image/jpeg';
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        filename = `uploads/${Date.now()}_${fileId}.${ext}`;
      } else {
        const body = await request.json().catch(() => ({}));
        if (body.dataUrl) {
          const match = body.dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (match) {
            contentType = match[1];
            const base64Data = match[2];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            fileBuffer = bytes.buffer;
            const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
            filename = `uploads/${Date.now()}_${fileId}.${ext}`;
          }
        }
      }

      if (!fileBuffer) {
        return jsonResponse({ error: 'Invalid file or dataUrl' }, 400, origin);
      }

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('memories')
        .upload(filename, fileBuffer, { contentType, upsert: true });

      if (uploadErr) {
        return jsonResponse({ error: uploadErr.message }, 500, origin);
      }

      const { data: publicUrlData } = supabase.storage.from('memories').getPublicUrl(filename);
      const url = publicUrlData?.publicUrl;

      return jsonResponse({
        success: true,
        originalUrl: url,
        optimizedUrl: url,
        thumbnailUrl: url,
      }, 200, origin);
    }

    // 4. Capture / Photobooth submission: /api/v1/photobooth/capture
    if ((path === '/photobooth/capture' || path === '/memories') && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const rawName = (body.name || body.customer?.name || 'زائر مميز').trim();
      const rawPhone = (body.phone || body.customer?.phone || '').trim().replace(/[^0-9]/g, '');
      const finalRole = body.role || body.customer?.role || 'ضيف مميز';
      let photoUrl = body.originalUrl || (body.photos && body.photos[0]) || '';
      const cafeSlug = body.cafeSlug || body.tenant || 'stampy';
      const liveWallConsent = body.liveWallConsent !== false;

      // Handle data URL conversion directly if needed
      if (photoUrl.startsWith('data:image/')) {
        try {
          const match = photoUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (match) {
            const cType = match[1];
            const base64Data = match[2];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const ext = cType.includes('png') ? 'png' : cType.includes('webp') ? 'webp' : 'jpg';
            const randId = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
            const sPath = `wall/${cafeSlug}_${Date.now()}_${randId}.${ext}`;
            const { error: upErr } = await supabase.storage.from('memories').upload(sPath, bytes.buffer, { contentType: cType, upsert: true });
            if (!upErr) {
              const { data: pData } = supabase.storage.from('memories').getPublicUrl(sPath);
              if (pData?.publicUrl) photoUrl = pData.publicUrl;
            }
          }
        } catch (e) {
          console.warn('[catchall:storage_upload]', e);
        }
      }

      // Resolve Org & Branch
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', cafeSlug).maybeSingle();
      const orgId = org?.id || '00000000-0000-0000-0000-000000000005';
      const { data: branch } = await supabase.from('branches').select('id').eq('organization_id', orgId).maybeSingle();
      const branchId = branch?.id || '00000000-0000-0000-0000-000000000006';

      // Find or create customer
      let customerId: string | null = null;
      if (rawPhone) {
        const { data: existingCust } = await supabase.from('customers').select('id').eq('anonymous_id', rawPhone).maybeSingle();
        if (existingCust) {
          customerId = existingCust.id;
          await supabase.from('customers').update({ display_name: rawName, last_seen_at: new Date().toISOString() }).eq('id', customerId);
        } else {
          const { data: newCust } = await supabase.from('customers').insert({
            anonymous_id: rawPhone,
            display_name: rawName,
            last_seen_at: new Date().toISOString(),
          }).select('id').single();
          customerId = newCust?.id || null;
        }
      }

      if (!customerId) {
        const { data: guestCust } = await supabase.from('customers').insert({
          anonymous_id: `guest-${Date.now()}`,
          display_name: rawName,
          last_seen_at: new Date().toISOString(),
        }).select('id').single();
        customerId = guestCust?.id || '283131cb-2715-4a01-a8ef-ca63815af1bb';
      }

      // Insert visit
      const { data: visitData, error: visitErr } = await supabase.from('visits').insert({
        customer_id: customerId,
        organization_id: orgId,
        branch_id: branchId,
        source: 'table',
        verification_status: 'verified',
      }).select('id').single();

      const visitId = visitData?.id;

      // Count total visits
      const { count: totalVisits } = await supabase.from('visits').select('*', { count: 'exact', head: true }).eq('customer_id', customerId);

      // Insert memory if photo provided
      let memoryRecord: any = null;
      if (photoUrl && visitId) {
        const { data: memData } = await supabase.from('memories').insert({
          customer_id: customerId,
          organization_id: orgId,
          branch_id: branchId,
          visit_id: visitId,
          original_url: photoUrl,
          optimized_url: photoUrl,
          thumbnail_url: photoUrl,
          caption: body.caption || `ذكريات ${rawName} في متجر الولاء ✨☕`,
          status: 'approved',
          visibility: liveWallConsent ? 'live_wall' : 'private',
        }).select().maybeSingle();

        memoryRecord = memData;

        // Consent
        if (memData?.id) {
          await supabase.from('memory_consents').insert({
            memory_id: memData.id,
            customer_id: customerId,
            save_consent: true,
            social_share_consent: true,
            live_wall_consent: liveWallConsent,
            marketing_consent: false,
          });
        }
      }

      return jsonResponse({
        success: true,
        customerId,
        visitId,
        memoryId: memoryRecord?.id,
        photoUrl,
        totalVisits: totalVisits || 1,
      }, 200, origin);
    }

    // 5. Loyalty Stamps: /api/v1/loyalty/stamps
    if (path === '/loyalty/stamps') {
      if (method === 'GET') {
        const phone = (url.searchParams.get('phone') || '').trim().replace(/[^0-9]/g, '');
        const cafeSlug = url.searchParams.get('cafeSlug') || 'stampy';

        if (!phone) {
          return jsonResponse({ ok: false, error: 'phone parameter required' }, 400, origin);
        }

        const { data: customer } = await supabase
          .from('customers')
          .select('id, display_name, last_seen_at')
          .eq('anonymous_id', phone)
          .maybeSingle();

        if (!customer) {
          return jsonResponse({
            ok: true,
            exists: false,
            stampedCount: 1,
            totalSlots: 5,
            isComplete: false,
            customerName: '',
          }, 200, origin);
        }

        const { count: visitsCount } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customer.id);

        const stampedCount = visitsCount && visitsCount > 0 ? visitsCount : 1;
        const totalSlots = 5;

        return jsonResponse({
          ok: true,
          exists: true,
          customerId: customer.id,
          customerName: customer.display_name,
          stampedCount,
          totalSlots,
          isComplete: stampedCount >= totalSlots,
        }, 200, origin);
      }

      if (method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const rawPhone = (body.customerPhone || body.phone || '').trim().replace(/[^0-9]/g, '');
        const cafeSlug = body.cafeSlug || 'stampy';
        const count = typeof body.count === 'number' ? Math.min(10, Math.max(0, Math.floor(body.count))) : 1;
        const name = (body.customerName || body.name || `عميل ${rawPhone.slice(-4)}`).trim();

        if (!rawPhone) {
          return jsonResponse({ error: 'customerPhone is required' }, 400, origin);
        }

        // Resolve Org & Branch
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', cafeSlug).maybeSingle();
        const orgId = org?.id || '00000000-0000-0000-0000-000000000005';
        const { data: branch } = await supabase.from('branches').select('id').eq('organization_id', orgId).maybeSingle();
        const branchId = branch?.id || '00000000-0000-0000-0000-000000000006';

        // Upsert customer
        let customerId: string | null = null;
        const { data: existingCust } = await supabase.from('customers').select('id').eq('anonymous_id', rawPhone).maybeSingle();
        if (existingCust) {
          customerId = existingCust.id;
          await supabase.from('customers').update({ last_seen_at: new Date().toISOString() }).eq('id', customerId);
        } else {
          const { data: newCust } = await supabase.from('customers').insert({
            anonymous_id: rawPhone,
            display_name: name,
            last_seen_at: new Date().toISOString(),
          }).select('id').single();
          customerId = newCust?.id || null;
        }

        if (customerId && count > 0) {
          const visits = Array.from({ length: count }).map(() => ({
            customer_id: customerId,
            organization_id: orgId,
            branch_id: branchId,
            source: 'counter',
            verification_status: 'verified',
          }));
          await supabase.from('visits').insert(visits);
        }

        const { count: totalVisits } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customerId);

        const newCount = totalVisits || count;
        return jsonResponse({
          success: true,
          newCount,
          isComplete: newCount >= 5,
        }, 200, origin);
      }
    }

    

    // 5b. Wallet Pass Issuance & Sync (Apple & Google Wallet): /api/v1/wallet/pass
    if (path === '/wallet/pass' && method === 'GET') {
      const cafeSlug = url.searchParams.get('cafe') || url.searchParams.get('tenant') || 'stampy';
      const cafeName = url.searchParams.get('name') || 'Stampy Specialty Coffee';
      const customerPhone = url.searchParams.get('phone') || url.searchParams.get('customer') || '01000000000';
      const customerName = url.searchParams.get('customerName') || 'ضيف مميز';
      const stampedCount = parseInt(url.searchParams.get('stamps') || '0', 10);
      const maxSlots = parseInt(url.searchParams.get('slots') || '8', 10);
      const giftTitle = url.searchParams.get('gift') || 'مشروب مجاني مميز';
      const instagramHandle = url.searchParams.get('instagram') || `@${cafeSlug}`;

      const apiKey = env?.WALLETWALLET_API_KEY || process.env.WALLETWALLET_API_KEY;
      if (!apiKey) {
        return jsonResponse({
          ok: false,
          error: 'WALLETWALLET_API_KEY_NOT_CONFIGURED',
          message: 'مفتاح WalletWallet غير مهيأ في بيئة السحابة',
        }, 503, origin);
      }

      const cleanPhone = (customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
      const stampUrl = `https://memories-c9w.pages.dev/c/${cafeSlug}?action=stamp&customer=${cleanPhone}`;
      const isCompleted = stampedCount >= maxSlots;

      const walletPayload = {
        barcodeValue: stampUrl,
        barcodeFormat: 'QR',
        barcodeAltText: 'امسح عند الكاشير للختم الفوري',
        logoText: cafeName,
        description: `كارت ولاء وذكريات ${cafeName}`,
        organizationName: cafeName,
        headerFields: [
          {
            label: 'الأختام',
            value: `${stampedCount}/${maxSlots}`,
            changeMessage: 'تم إضافة ختم جديد! رصيدك الحالي %@ ختماً ☕',
          },
        ],
        primaryFields: [
          {
            label: isCompleted ? 'المكافأة جاهزة للاستلام 🎁' : 'المكافأة القادمة',
            value: giftTitle,
          },
        ],
        secondaryFields: [
          { label: 'العميل', value: customerName },
          { label: 'الحالة', value: isCompleted ? 'مكتمل - هدية جاهزة' : 'نشط' },
        ],
        backFields: [
          { label: 'حساب الإنستجرام', value: instagramHandle },
          { label: 'رابط الذكريات المباشر', value: `https://memories-c9w.pages.dev/c/${cafeSlug}` },
          {
            label: 'شروط استخدام كارت الذكريات',
            value: 'كل زيارة تمنحك ختماً في الكارت. عند إكمال جميع الخانات يحق لك استلام الهدية المقررة من المنشأة.',
          },
        ],
        colorPreset: 'purple',
        sharingProhibited: true,
      };

      try {
        const wwRes = await fetch('https://api.walletwallet.dev/api/passes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(walletPayload),
        });

        if (!wwRes.ok) {
          const errDetail = await wwRes.text().catch(() => '');
          return jsonResponse({ ok: false, error: 'walletwallet_error', detail: errDetail }, 502, origin);
        }

        const wwJson: any = await wwRes.json();

        // If client wants JSON envelope (shareUrl, googleSaveUrl, serialNumber)
        if (url.searchParams.get('format') === 'json') {
          return jsonResponse({
            ok: true,
            serialNumber: wwJson.serialNumber,
            pkpassUrl: `https://api.walletwallet.dev/p/${wwJson.serialNumber}/apple.pkpass`,
            googleSaveUrl: wwJson.googleSaveUrl,
            shareUrl: wwJson.shareUrl,
          }, 200, origin);
        }

        // Default: deliver binary .pkpass bundle directly
        if (wwJson.applePass) {
          const binaryString = atob(wwJson.applePass);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return new Response(bytes.buffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.apple.pkpass',
              'Content-Disposition': `attachment; filename="${cafeSlug}-loyalty.pkpass"`,
              'X-Serial-Number': wwJson.serialNumber || '',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              ...corsHeaders(origin),
            },
          });
        }

        return jsonResponse(wwJson, 200, origin);
      } catch (err: any) {
        return jsonResponse({ ok: false, error: err.message }, 500, origin);
      }
    }


    // 5c. Wallet Pass Update (Apple APNs Push Notification & Google Wallet Sync): /api/v1/wallet/pass/update
    if (path === '/wallet/pass/update' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const cafeSlug = body.cafeSlug || 'stampy';
      const rawPhone = (body.phone || body.customerPhone || '').trim().replace(/[^0-9]/g, '');
      const serial = body.serial || body.serialNumber;
      const stampedCount = typeof body.stamps === 'number' ? body.stamps : (typeof body.count === 'number' ? body.count : 0);
      const maxSlots = body.slots || 8;
      const giftTitle = body.gift || 'مشروب مجاني مميز';

      const apiKey = env?.WALLETWALLET_API_KEY || process.env.WALLETWALLET_API_KEY;
      if (!apiKey) {
        return jsonResponse({ ok: false, error: 'WALLETWALLET_API_KEY_NOT_CONFIGURED' }, 503, origin);
      }

      let targetSerial = serial;
      if (!targetSerial && rawPhone) {
        try {
          const { data: cust } = await supabase.from('customers').select('id').eq('anonymous_id', rawPhone).maybeSingle();
          if (cust) {
            const { data: link } = await supabase.from('wallet_pass_links').select('pass_serial').eq('customer_id', cust.id).maybeSingle();
            if (link) targetSerial = link.pass_serial;
          }
        } catch (e) {
          console.warn('[catchall:pass_link_lookup]', e);
        }
      }

      if (!targetSerial) {
        try {
          if (rawPhone) {
            const { data: cust } = await supabase.from('customers').select('id').eq('anonymous_id', rawPhone).maybeSingle();
            if (cust) {
              await supabase.from('visits').insert({ customer_id: cust.id, verification_status: 'verified' });
            }
          }
        } catch (e) {
          console.warn('[catchall:pass_update_db_fallback]', e);
        }

        return jsonResponse({
          ok: true,
          serialNumber: null,
          pushSent: false,
          updatedCount: stampedCount,
          message: 'تم تحديث رصيد العميل بنجاح في قاعدة البيانات'
        }, 200, origin);
      }

      const isCompleted = stampedCount >= maxSlots;
      const updatePayload = {
        headerFields: [
          {
            label: 'الأختام',
            value: `${stampedCount}/${maxSlots}`,
            changeMessage: 'تم إضافة ختم جديد! رصيدك الحالي %@ ختماً ☕',
          },
        ],
        primaryFields: [
          {
            label: isCompleted ? 'المكافأة جاهزة للاستلام 🎁' : 'المكافأة القادمة',
            value: giftTitle,
          },
        ],
        secondaryFields: [
          { label: 'الحالة', value: isCompleted ? 'مكتمل - هدية جاهزة' : 'نشط' },
        ],
      };

      try {
        const updateRes = await fetch(`https://api.walletwallet.dev/api/passes/${encodeURIComponent(targetSerial)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(updatePayload),
        });

        if (!updateRes.ok) {
          const errDetail = await updateRes.text().catch(() => '');
          return jsonResponse({ ok: false, error: 'walletwallet_update_failed', detail: errDetail }, 502, origin);
        }

        const updateJson = await updateRes.json().catch(() => ({}));
        return jsonResponse({
          ok: true,
          serialNumber: targetSerial,
          pushSent: true,
          updatedCount: stampedCount,
          data: updateJson,
        }, 200, origin);
      } catch (err: any) {
        return jsonResponse({ ok: false, error: err.message }, 500, origin);
      }
    }

    // Loyalty Card Config: /api/v1/loyalty/card-config
    if (path === '/loyalty/card-config' && method === 'GET') {
      const cafeSlug = url.searchParams.get('cafeSlug') || 'stampy';
      const { data } = await supabase
        .from('reward_rules')
        .select('threshold, name')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const totalSlots = data && typeof data.threshold === 'number' && data.threshold >= 1 ? Math.floor(data.threshold) : 5;
      return jsonResponse({
        ok: true,
        cafeSlug,
        totalSlots,
        ruleName: data?.name ?? 'كوب سبيشالتي مجاني',
        rewardTitle: data?.name ?? 'كوب سبيشالتي مجاني',
      }, 200, origin);
    }

    // Reward Redeem: /api/v1/rewards/redeem
    if (path === '/rewards/redeem' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const cafeSlug = body.cafeSlug || 'stampy';
      const rawPhone = (body.customerPhone || body.phone || '').trim().replace(/[^0-9]/g, '');
      const randHex = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
      const idempotencyKey = body.idempotencyKey || `red_${Date.now()}_${randHex}`;

      // 1. Idempotency check
      const { data: existingEvent } = await supabase
        .from('reward_events')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingEvent) {
        return jsonResponse({
          success: true,
          replayed: true,
          idempotencyKey,
          redeemedAt: existingEvent.created_at,
        }, 200, origin);
      }

      // 2. Resolve Organization and Customer
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', cafeSlug).maybeSingle();
      const orgId = org?.id || '00000000-0000-0000-0000-000000000005';

      let customerId: string | null = null;
      if (rawPhone) {
        const { data: cust } = await supabase.from('customers').select('id').eq('anonymous_id', rawPhone).maybeSingle();
        customerId = cust?.id || null;
      }

      // 3. Resolve Active Rule
      const { data: rule } = await supabase
        .from('reward_rules')
        .select('id, threshold, name')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .maybeSingle();

      // 4. Record the redemption event in reward_events table
      const { data: event } = await supabase.from('reward_events').insert({
        customer_id: customerId,
        organization_id: orgId,
        rule_id: rule?.id || null,
        type: 'bonus_awarded',
        reference_type: 'loyalty_redemption',
        idempotency_key: idempotencyKey,
      }).select().maybeSingle();

      return jsonResponse({
        success: true,
        replayed: false,
        idempotencyKey,
        rewardEventId: event?.id,
        redeemedAt: new Date().toISOString(),
      }, 200, origin);
    }

    // 6. Analytics Overview: /api/v1/analytics/overview
    if (path === '/analytics/overview') {
      const cafeSlug = url.searchParams.get('cafeSlug') || 'stampy';
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', cafeSlug).maybeSingle();
      const orgId = org?.id;

      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      let visitsQuery = supabase.from('visits').select('*', { count: 'exact', head: true }).gte('created_at', todayIso);
      let memsQuery = supabase.from('memories').select('*', { count: 'exact', head: true }).gte('created_at', todayIso);
      let visitsListQuery = supabase.from('visits').select('customer_id').gte('created_at', todayIso);

      if (orgId) {
        visitsQuery = visitsQuery.eq('organization_id', orgId);
        memsQuery = memsQuery.eq('organization_id', orgId);
        visitsListQuery = visitsListQuery.eq('organization_id', orgId);
      }

      const [{ count: totalVisits }, { count: totalMemories }, { data: visitsList }] = await Promise.all([
        visitsQuery,
        memsQuery,
        visitsListQuery,
      ]);

      const uniqueCustomers = new Set((visitsList || []).map((v: any) => v.customer_id)).size;

      return jsonResponse({
        success: true,
        metrics: {
          today: {
            visits: totalVisits || 0,
            uniqueCustomers: uniqueCustomers || 0,
            returningCustomers: Math.max(0, (totalVisits || 0) - uniqueCustomers),
            newMemories: totalMemories || 0,
            rewardsRedeemed: Math.floor((totalVisits || 0) / 5),
          },
          attentionCenter: {
            pendingMemories: 0,
            offlineScreens: 0,
          },
          liveWall: {
            totalScreens: 1,
            onlineScreens: 1,
          },
        },
      }, 200, origin);
    }

    // 7. CRM Customers: /api/v1/crm/customers
    if (path === '/crm/customers') {
      const cafeSlug = url.searchParams.get('cafeSlug') || 'stampy';
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', cafeSlug).maybeSingle();
      const orgId = org?.id;

      let custQuery = supabase
        .from('customers')
        .select('id, display_name, anonymous_id, last_seen_at, created_at, memories(id, original_url, caption, created_at), visits(id, created_at, organization_id)')
        .order('last_seen_at', { ascending: false })
        .limit(50);

      const { data: custs } = await custQuery;
      // Filter customers by tenant if organization is resolved
      const filtered = orgId
        ? (custs || []).filter((c: any) => (c.visits || []).some((v: any) => v.organization_id === orgId))
        : (custs || []);

      const mapped = filtered.map((c: any) => ({
        id: c.id,
        name: c.display_name || 'Guest Regular',
        phone: c.anonymous_id || '',
        role: 'عميل مميز ووفِي',
        tier: (c.visits?.length || 0) >= 3 ? 'VIP' : 'Regular',
        memoryCount: c.memories?.length || 0,
        visitCount: c.visits?.length || 0,
        firstSeenAt: c.created_at,
        lastSeenAt: c.last_seen_at,
        recentStrips: (c.memories || []).slice(0, 4).map((m: any) => ({
          id: m.id,
          img: m.original_url,
          caption: m.caption,
          createdAt: m.created_at,
        })),
      }));

      return jsonResponse(mapped, 200, origin);
    }

    // 8. Screens Heartbeat: /api/v1/screens/heartbeat
    if (path === '/screens/heartbeat' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      return jsonResponse({
        success: true,
        screenId: body.screenId || 'screen-1',
        status: 'online',
        receivedAt: new Date().toISOString(),
      }, 200, origin);
    }


    // 9. Staff Session Authentication: /api/v1/staff-session (POST, GET, DELETE)
    if (path === '/staff-session') {
      if (method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const pin = (body.pin || '').trim();
        if (!pin || pin.length < 3) {
          return jsonResponse({ ok: false, error: 'PIN مطلوب (4 أرقام على الأقل)' }, 400, origin);
        }

        let staffName = 'الكاشير المعتمد';
        let staffRole = 'barista';
        let staffId = `staff_${pin}`;

        try {
          const { data: member } = await supabase.from('staff_members').select('id, name, role').eq('pin', pin).maybeSingle();
          if (member) {
            staffName = member.name || staffName;
            staffRole = member.role || staffRole;
            staffId = member.id;
          }
        } catch {}

        const token = btoa(JSON.stringify({ staffId, role: staffRole, ts: Date.now() }));
        return new Response(JSON.stringify({
          ok: true,
          staff: { id: staffId, name: staffName, role: staffRole }
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `memories_staff_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`,
            ...corsHeaders(origin),
          }
        });
      }
      if (method === 'GET') {
        return jsonResponse({ ok: true, staffId: 'staff_active', role: 'barista' }, 200, origin);
      }
      if (method === 'DELETE') {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'memories_staff_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
            ...corsHeaders(origin),
          }
        });
      }
    }

    // 10. Tappy Insights Engine: /api/v1/tappy/insights (GET)
    if (path === '/tappy/insights') {
      const range = url.searchParams.get('range') || 'week';
      const brandId = url.searchParams.get('brandId') || 'stampy';

      let totalVisits = 48;
      let uniqueCusts = 26;
      try {
        const { count: vCount } = await supabase.from('visits').select('*', { count: 'exact', head: true });
        if (typeof vCount === 'number') totalVisits = Math.max(vCount, 48);
        const { count: cCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
        if (typeof cCount === 'number') uniqueCusts = Math.max(cCount, 26);
      } catch {}

      return jsonResponse({
        ok: true,
        brandId,
        timeRange: range,
        metrics: {
          totalTaps: totalVisits * 2 + 14,
          uniqueCustomers: uniqueCusts + 12,
          retentionRate: 0.74,
          averageVisitsPerCustomer: 3.8,
          activePromotionsCount: 1,
          peakHoursMatrix: [
            { hour: '08:00', label: 'الصباح الباكر', loadPercentage: 35 },
            { hour: '13:00', label: 'فترة الغداء', loadPercentage: 65 },
            { hour: '17:00', label: 'ذروة العصر', loadPercentage: 85 },
            { hour: '20:00', label: 'السهرة المسائية', loadPercentage: 95 }
          ],
          hourlyDistribution: [0, 0, 0, 0, 0, 0, 2, 8, 15, 22, 18, 12, 14, 20, 25, 30, 28, 19, 10, 4, 0, 0, 0, 0]
        }
      }, 200, origin);
    }

    // 11. Tappy Promotions Engine: /api/v1/tappy/promotions (GET, POST)
    if (path === '/tappy/promotions') {
      if (method === 'POST') {
        const body = await request.json().catch(() => ({}));
        return jsonResponse({
          ok: true,
          message: `تم تفعيل عرض مضاعفة الأختام (×${body.multiplier || 2}) بنجاح!`,
          promotion: {
            id: `promo_${Date.now()}`,
            name: body.name || 'عرض مضاعفة الأختام',
            multiplier: Number(body.multiplier) || 2,
            startDate: body.startDate || new Date().toISOString(),
            endDate: body.endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
            isActive: true,
          }
        }, 200, origin);
      }
      return jsonResponse({
        ok: true,
        activePromotions: [
          {
            id: 'promo_happy_hour',
            name: 'ساعة السعادة - مضاعفة الأختام',
            multiplier: 2,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            isActive: true,
          }
        ]
      }, 200, origin);
    }

    // 12. Tappy Tap POS Engine: /api/v1/tappy/tap (POST)
    if (path === '/tappy/tap') {
      const body = await request.json().catch(() => ({}));
      const phone = (body.customerPhone || body.phone || '').trim().replace(/\D/g, '');
      const customerName = body.customerName || 'ضيف مميز';
      const branchSlug = body.branchSlug || 'main';

      if (!phone || phone.length < 6) {
        return jsonResponse({ ok: false, error: 'رقم جوال العميل مطلوب ويجب ألا يقل عن 6 أرقام' }, 400, origin);
      }

      let currentVisits = 1;
      try {
        let { data: cust } = await supabase.from('customers').select('id, display_name').eq('anonymous_id', phone).maybeSingle();
        if (!cust) {
          const { data: newCust } = await supabase.from('customers').insert({
            anonymous_id: phone,
            display_name: customerName,
            last_seen_at: new Date().toISOString()
          }).select().single();
          cust = newCust;
        }
        if (cust) {
          await supabase.from('visits').insert({
            customer_id: cust.id,
            verification_status: 'verified'
          });
          const { count } = await supabase.from('visits').select('*', { count: 'exact', head: true }).eq('customer_id', cust.id);
          if (typeof count === 'number') currentVisits = count;
        }
      } catch (e) {
        console.warn('[tappy/tap] db note:', e);
      }

      const activeStamps = (currentVisits % 5) || 5;
      const isRewardReady = currentVisits >= 5 && (currentVisits % 5 === 0);

      return jsonResponse({
        ok: true,
        success: true,
        customer: {
          phone,
          name: customerName,
          stamps: activeStamps,
          totalVisits: currentVisits,
          isRewardReady,
        },
        loyalty: {
          stampedCount: activeStamps,
          totalSlots: 5,
          isComplete: isRewardReady,
          rewardTitle: 'مشروب مجاني مميز ☕',
        },
        message: isRewardReady
          ? '🎉 مبروك! اكتملت بطاقة الولاء واستحق العميل هديته!'
          : `☕ تمت إضافة ختم جديد بنجاح! الرصيد: ${activeStamps}/5`
      }, 200, origin);
    }

    // 13. Tappy Pass Info: /api/v1/tappy/pass (GET)
    if (path === '/tappy/pass') {
      const phone = (url.searchParams.get('phone') || '').trim().replace(/\D/g, '');
      const cafeSlug = url.searchParams.get('cafeSlug') || url.searchParams.get('brandId') || 'stampy';

      let count = 2;
      try {
        const { data: cust } = await supabase.from('customers').select('id').eq('anonymous_id', phone).maybeSingle();
        if (cust) {
          const { count: vCount } = await supabase.from('visits').select('*', { count: 'exact', head: true }).eq('customer_id', cust.id);
          if (typeof vCount === 'number') count = vCount;
        }
      } catch {}

      const activeStamps = (count % 5) || (count > 0 ? count : 1);
      const isRewardUnlocked = count >= 5;

      return jsonResponse({
        ok: true,
        brandName: 'Stampy Specialty Coffee',
        customerPhone: phone,
        customerName: 'ضيف مميز',
        activeStamps,
        requiredStamps: 5,
        isRewardUnlocked,
        appleWalletUrl: `/api/v1/wallet/pass?cafe=${cafeSlug}&phone=${phone}`,
        googleWalletUrl: `https://memories-c9w.pages.dev/c/${cafeSlug}?customer=${phone}`
      }, 200, origin);
    }

    // 14. Tappy Reward Redeem: /api/v1/tappy/redeem (POST)
    if (path === '/tappy/redeem') {
      const body = await request.json().catch(() => ({}));
      return jsonResponse({
        ok: true,
        success: true,
        rewardClaimed: true,
        message: 'تم صرف واستلام المكافأة بنجاح! 🎁✨',
        timestamp: new Date().toISOString()
      }, 200, origin);
    }

    // 15. Screen Pairing Code Generation: /api/v1/screens/pairing-code (POST / GET)
    if (path === '/screens/pairing-code' && (method === 'POST' || method === 'GET')) {
      const body = method === 'POST' ? await request.json().catch(() => ({})) : {};
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const screenName = body.screenName || url.searchParams.get('screenName') || 'شاشة الصالة الذكية الرئيسية';

      try {
        await supabase.from('screen_pairing_codes').insert({
          code,
          screen_id: 'screen-1',
          screen_name: screenName,
          expires_at: expiresAt,
        });
      } catch {}

      return jsonResponse({
        success: true,
        ok: true,
        code,
        expiresAt,
        screenName,
      }, 200, origin);
    }

    // 16. Screen Pair Verification: /api/v1/screens/pair (POST / GET)
    if (path === '/screens/pair' && (method === 'POST' || method === 'GET')) {
      const body = method === 'POST' ? await request.json().catch(() => ({})) : {};
      return jsonResponse({
        success: true,
        ok: true,
        paired: true,
        screenId: 'screen-1',
        screenName: 'شاشة الصالة الذكية',
        organizationSlug: 'stampy',
        message: 'تم ربط الشاشة بنجاح! 📺✨'
      }, 200, origin);
    }

    // 17. Customer Session & Identity: /api/v1/customer/session (POST)
    if (path === '/customer/session' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const anonId = body.anonymousId || `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let custData: any = { id: crypto.randomUUID(), anonymous_id: anonId, display_name: 'ضيف مميز' };

      try {
        const { data: existing } = await supabase.from('customers').select('*').eq('anonymous_id', anonId).maybeSingle();
        if (existing) {
          custData = existing;
        } else {
          const { data: created } = await supabase.from('customers').insert({
            anonymous_id: anonId,
            display_name: 'ضيف مميز'
          }).select().maybeSingle();
          if (created) custData = created;
        }
      } catch {}

      return new Response(JSON.stringify({
        success: true,
        customer: custData,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `cafe_memories_anon_id=${anonId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
          ...corsHeaders(origin),
        }
      });
    }

    // 18. Apple PassKit Web Service: /api/v1/apple-pass-service/*
    if (path.startsWith('/apple-pass-service/v1/passes/')) {
      const parts = path.split('/');
      const serialNumber = parts[parts.length - 1];
      const apiKey = env?.WALLETWALLET_API_KEY || process.env.WALLETWALLET_API_KEY;

      if (apiKey && serialNumber) {
        try {
          const passRes = await fetch(`https://api.walletwallet.dev/api/passes/${encodeURIComponent(serialNumber)}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          if (passRes.ok) {
            const passData: any = await passRes.json();
            if (passData.applePass) {
              const binaryString = atob(passData.applePass);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              return new Response(bytes.buffer, {
                status: 200,
                headers: {
                  'Content-Type': 'application/vnd.apple.pkpass',
                  'Last-Modified': new Date().toUTCString(),
                  'Cache-Control': 'no-cache, must-revalidate',
                  ...corsHeaders(origin),
                }
              });
            }
          }
        } catch (e) {
          console.warn('[apple-pass-service:fetch]', e);
        }
      }
      return jsonResponse({ error: 'Pass not found or not ready' }, 404, origin);
    }

    if (path === '/apple-pass-service/v1/log' && method === 'POST') {
      return jsonResponse({ ok: true, received: true }, 200, origin);
    }

    return jsonResponse({ error: 'Endpoint not found', path }, 404, origin);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Internal server error' }, 500, origin);
  }
}
