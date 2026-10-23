import { NextRequest, NextResponse } from 'next/server';

export interface ServerPrintJob {
  id: string;
  venueSlug: string;
  name: string;
  phone: string;
  role?: string;
  totalVisits?: number;
  lastVisit?: string;
  photoStripUrl: string;
  format: string;
  createdAt: string;
  status: 'pending' | 'printed' | 'dismissed';
}

// In-memory tenant print queues (shared across requests in worker lifecycle)
const tenantPrintQueues = new Map<string, ServerPrintJob[]>();

function getQueue(venueSlug: string): ServerPrintJob[] {
  const normalized = (venueSlug || 'memories').toLowerCase().trim();
  if (!tenantPrintQueues.has(normalized)) {
    tenantPrintQueues.set(normalized, []);
  }
  return tenantPrintQueues.get(normalized)!;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueSlug = searchParams.get('slug') || searchParams.get('branch') || searchParams.get('venue') || searchParams.get('cafeSlug') || 'memories';
    const queue = getQueue(venueSlug);

    // Return active jobs (pending status)
    const activeJobs = queue
      .filter((j) => j.status === 'pending')
      .slice(0, 50);

    return NextResponse.json({
      success: true,
      venueSlug,
      jobs: activeJobs,
      totalCount: activeJobs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve print jobs', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const venueSlug = (body.venueSlug || body.slug || body.cafeSlug || 'memories').toLowerCase().trim();

    if (!body.photoStripUrl) {
      return NextResponse.json(
        { success: false, error: 'photoStripUrl is required to dispatch print job' },
        { status: 400 }
      );
    }

    const newJob: ServerPrintJob = {
      id: body.id || `print_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      venueSlug,
      name: body.name || 'ضيف مميز',
      phone: body.phone || 'guest',
      role: body.role || 'loyal_customer',
      totalVisits: Number(body.totalVisits) || 1,
      lastVisit: body.lastVisit || new Date().toISOString(),
      photoStripUrl: body.photoStripUrl,
      format: body.format || 'standard-2x6',
      createdAt: body.createdAt || new Date().toISOString(),
      status: 'pending',
    };

    const queue = getQueue(venueSlug);
    // Prepend newest job first, cap at 50
    const updated = [newJob, ...queue.filter((j) => j.id !== newJob.id)].slice(0, 50);
    tenantPrintQueues.set(venueSlug, updated);

    return NextResponse.json({
      success: true,
      job: newJob,
      message: 'Print job dispatched successfully to terminal',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to queue print job', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const venueSlug = (searchParams.get('slug') || searchParams.get('branch') || searchParams.get('venue') || searchParams.get('cafeSlug') || 'memories').toLowerCase().trim();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Job ID required' }, { status: 400 });
    }

    const queue = getQueue(venueSlug);
    const updated = queue.filter((j) => j.id !== id);
    tenantPrintQueues.set(venueSlug, updated);

    return NextResponse.json({
      success: true,
      message: 'Print job dismissed successfully',
      remainingCount: updated.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to dismiss print job', details: error?.message },
      { status: 500 }
    );
  }
}
