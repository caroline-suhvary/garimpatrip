import { NextResponse } from 'next/server';

function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get('next'));

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error('GOOGLE_CLIENT_ID não configurado no servidor.');
    return NextResponse.redirect(`${origin}/?login=missing_google_client_id`);
  }

  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const baseUrl = isLocal ? origin : (process.env.NEXT_PUBLIC_SITE_URL || origin);
  const redirectUri = `${baseUrl.replace(/\/+$/, '')}/api/auth/callback/google`;

  const stateObj = { next, nonce: Math.random().toString(36).substring(2) };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
