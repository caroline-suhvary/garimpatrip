import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const errorParam = searchParams.get('error');

  if (errorParam) {
    return NextResponse.redirect(`${origin}/?login=cancelado`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${origin}/?login=invalido`);
  }

  let next = '/';
  let csrf = '';
  try {
    const parsed = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'));
    csrf = parsed.csrf || '';
    if (parsed.next && typeof parsed.next === 'string' && parsed.next.startsWith('/') && !parsed.next.startsWith('//')) {
      next = parsed.next;
    }
  } catch {
    return NextResponse.redirect(`${origin}/?login=erro_state`);
  }

  const cookieCsrf = request.cookies.get('oauth_state')?.value;
  if (!cookieCsrf || cookieCsrf !== csrf) {
    return NextResponse.redirect(`${origin}/?login=erro_csrf`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!clientId || !clientSecret || !supabaseUrl || !supabaseAnonKey) {
    console.error('Faltam variáveis GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / SUPABASE');
    return NextResponse.redirect(`${origin}/?login=config_ausente`);
  }

  // Troca o código pelo token direto no Google
  const redirectUri = `${origin}/api/auth/callback/google`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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

  if (!tokenResponse.ok) {
    const errBody = await tokenResponse.text();
    console.error('Erro na troca de token do Google:', errBody);
    return NextResponse.redirect(`${origin}/?login=erro_google`);
  }

  const tokens = await tokenResponse.json();
  const idToken = tokens.id_token;
  const accessToken = tokens.access_token;

  if (!idToken) {
    return NextResponse.redirect(`${origin}/?login=sem_id_token`);
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Autentica no Supabase usando o ID Token emitido pelo Google
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    access_token: accessToken,
  });

  if (error || !data?.user) {
    console.error('Erro no Supabase signInWithIdToken:', error);
    return NextResponse.redirect(`${origin}/?login=erro_supabase`);
  }

  await supabase
    .from('profiles')
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq('id', data.user.id);

  response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });

  return response;
}
