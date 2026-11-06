import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');

  let next = '/';
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'));
      next = safeNext(decoded.next);
    } catch {
      next = '/';
    }
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?login=erro_sem_codigo`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET ausente.');
    return NextResponse.redirect(`${origin}/?login=erro_chaves_google`);
  }

  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const baseUrl = isLocal ? origin : (process.env.NEXT_PUBLIC_SITE_URL || origin);
  const redirectUri = `${baseUrl.replace(/\/+$/, '')}/api/auth/callback/google`;

  try {
    // 1. Troca o código de autorização diretamente com o Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Erro na troca do código Google:', errBody);
      return NextResponse.redirect(`${origin}/?login=erro_troca_google`);
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;
    if (!idToken) {
      return NextResponse.redirect(`${origin}/?login=sem_id_token`);
    }

    // 2. Entrega o id_token do Google para o Supabase autenticar a sessão
    const supabase = await createSupabaseServer();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/?login=config`);
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      access_token: tokenData.access_token,
    });

    if (error || !data.user) {
      console.error('Erro signInWithIdToken Supabase:', error);
      return NextResponse.redirect(`${origin}/?login=erro_supabase_token`);
    }

    // 3. Atualiza registro de acesso na tabela profiles
    try {
      await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', data.user.id);
    } catch (e) {
      console.warn('Erro ao atualizar profiles:', e);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error('Exceção no fluxo Google:', err);
    return NextResponse.redirect(`${origin}/?login=erro_interno`);
  }
}
