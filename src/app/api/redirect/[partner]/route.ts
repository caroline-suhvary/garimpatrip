import { NextResponse } from 'next/server';
import { AVAILABLE_PARTNERS } from '@/lib/affiliates';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: { partner: string } }
) {
  const partnerId = params.partner?.toLowerCase();
  const partner = AVAILABLE_PARTNERS[partnerId];

  if (!partner) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Registra clique no Supabase para Engenharia de Dados
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      await supabase.from('affiliate_clicks').insert({
        partner_name: partner.name,
        category: partner.category,
        target_url: partner.fallbackUrl,
      });
    } catch {}
  }

  return NextResponse.redirect(partner.fallbackUrl, 302);
}
