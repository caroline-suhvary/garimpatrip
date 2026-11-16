import { NextResponse } from "next/server";
import { AVAILABLE_PARTNERS } from "@/lib/affiliates";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ partner: string }> },
) {
  const resolvedParams = await params;
  const partnerId = resolvedParams.partner?.toLowerCase();
  const partner = AVAILABLE_PARTNERS[partnerId];

  if (!partner) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Registra clique em site_events com geolocalização Vercel
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const country = request.headers.get("x-vercel-ip-country") || "BR";
      const region = request.headers.get("x-vercel-ip-country-region") || null;
      const city = request.headers.get("x-vercel-ip-city") || null;

      await admin.from("site_events").insert({
        event_type: "partner_click",
        target_name: partner.name,
        category: partner.category,
        url: partner.fallbackUrl,
        user_region: region ? decodeURIComponent(region) : null,
        user_city: city ? decodeURIComponent(city) : null,
        user_country: country,
        metadata: { source: "redirect_link" },
      });
    } catch {}
  }

  return NextResponse.redirect(partner.fallbackUrl, 302);
}
