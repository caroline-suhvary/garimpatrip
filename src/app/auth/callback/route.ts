// Retorno do login com Google: troca o código pela sessão e volta para a página de origem.
import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

function safeNext(next: string | null): string {
  // Só aceita caminhos internos ("/box"), nunca outro site ("//site.com" ou "https://...").
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (!code) return NextResponse.redirect(`${origin}/?login=erro`);

  const supabase = await createSupabaseServer();
  if (!supabase) return NextResponse.redirect(`${origin}/?login=config`);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/?login=erro`);

  // Registra o último acesso (usado pela regra de inatividade dos alertas).
  await supabase.from('profiles').update({ last_sign_in_at: new Date().toISOString() }).eq('id', data.user.id);

  return NextResponse.redirect(`${origin}${next}`);
}
