import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ qrSlug: string }> }
) {
  const resolvedParams = await params;
  
  // 1. Look up QR slug to find branch and customer details
  // 2. Redirect to customer portal
  
  const targetUrl = new URL(`/c/demo-cafe?ref=${resolvedParams.qrSlug}`, request.url);
  return NextResponse.redirect(targetUrl);
}
