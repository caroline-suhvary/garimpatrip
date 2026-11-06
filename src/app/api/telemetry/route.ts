import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, action, status = 'success', destination, latency_ms, metadata } = body;
    const admin = getSupabaseAdmin();
    if (!admin || !provider || !action) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await admin.from('api_telemetry_events').insert({
      provider,
      action,
      status,
      destination,
      latency_ms,
      metadata: metadata ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
