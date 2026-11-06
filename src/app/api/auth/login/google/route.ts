import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') || '/';

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID não configurado no servidor (.env.local / Vercel).' },
      { status: 500 }
    );
  }

  const stateData = {
    csrf: crypto.randomBytes(16).toString('hex'),
    next: next.startsWith('/') && !next.startsWith('//') ? next : '/',
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

  const redirectUri = `${origin}/api/auth/callback/google`;

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  const res = NextResponse.redirect(googleAuthUrl.toString());
  res.cookies.set('oauth_state', stateData.csrf, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return res;
}
