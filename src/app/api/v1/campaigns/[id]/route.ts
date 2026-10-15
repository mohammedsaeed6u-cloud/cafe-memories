import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({
      ok: true,
      id,
      claimed: 5,
      accepted: 5,
      unknown: 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'تعذر بدء الحملة' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return NextResponse.json({
      ok: true,
      id,
      status: 'ended',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'تعذر إنهاء الحملة' },
      { status: 500 }
    );
  }
}
