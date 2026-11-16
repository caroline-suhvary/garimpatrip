import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      event_type,
      target_name,
      category,
      destination,
      url,
      metadata = {},
    } = body;

    const admin = getSupabaseAdmin();
    if (!admin || !event_type) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Geolocalização nativa gratuita fornecida pela Vercel em produção
    const country = request.headers.get("x-vercel-ip-country") || "BR";
    const region = request.headers.get("x-vercel-ip-country-region") || null; // Ex: 'SP', 'RJ'
    const city = request.headers.get("x-vercel-ip-city") || null; // Ex: 'Sao Paulo'

    await admin.from("site_events").insert({
      event_type,
      target_name,
      category,
      destination,
      url,
      user_region: region ? decodeURIComponent(region) : null,
      user_city: city ? decodeURIComponent(city) : null,
      user_country: country,
      metadata,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
