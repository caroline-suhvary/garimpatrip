# -*- coding: utf-8 -*-
"""
GarimpaTrip: Configuração de Login Direto com Google
Remove completamente o endereço do Supabase da tela do Google.
O Google exibirá apenas:
- Nome do app: GarimpaTrip
- Domínio: garimpatrip.com.br

Como executar:
python configurar_login_garimpatrip.py
"""
import os
import sys

def main():
    base_dir = os.getcwd()
    if not os.path.exists(os.path.join(base_dir, 'package.json')):
        print("ERRO: Execute este script na raiz do projeto 'garimpatrip-nextjs'.")
        sys.exit(1)

    print("==> 1. Criando rota de início de login: src/app/api/auth/login/google/route.ts")
    login_dir = os.path.join(base_dir, 'src', 'app', 'api', 'auth', 'login', 'google')
    os.makedirs(login_dir, exist_ok=True)
    login_route = os.path.join(login_dir, 'route.ts')

    login_code = """import { NextResponse } from 'next/server';

function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\\\')) return '/';
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
  const redirectUri = `${baseUrl.replace(/\\/+$/, '')}/api/auth/callback/google`;

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
"""
    with open(login_route, 'w', encoding='utf-8') as f:
        f.write(login_code)
    print("  [OK] Criado:", login_route)

    print("\n==> 2. Criando rota de retorno (callback): src/app/api/auth/callback/google/route.ts")
    callback_dir = os.path.join(base_dir, 'src', 'app', 'api', 'auth', 'callback', 'google')
    os.makedirs(callback_dir, exist_ok=True)
    callback_route = os.path.join(callback_dir, 'route.ts')

    callback_code = """import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\\\')) return '/';
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
  const redirectUri = `${baseUrl.replace(/\\/+$/, '')}/api/auth/callback/google`;

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
"""
    with open(callback_route, 'w', encoding='utf-8') as f:
        f.write(callback_code)
    print("  [OK] Criado:", callback_route)

    print("\n==> 3. Atualizando src/hooks/useAuth.ts para disparar o login direto...")
    use_auth_path = os.path.join(base_dir, 'src', 'hooks', 'useAuth.ts')
    if os.path.exists(use_auth_path):
        use_auth_code = """'use client';
// Estado do login (Google via rota própria GarimpaTrip + Supabase SSR) compartilhado pelas telas.
import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

export function useAuth() {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user ?? null);
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(() => {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/api/auth/login/google?next=${encodeURIComponent(next)}`;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = '/';
  }, [supabase]);

  return { supabase, user, loading, configured: Boolean(supabase), signIn, signOut };
}
"""
        with open(use_auth_path, 'w', encoding='utf-8') as f:
            f.write(use_auth_code)
        print("  [OK] useAuth.ts atualizado com sucesso!")

    print("\n=======================================================")
    print("Sucesso! Código configurado para login direto com GarimpaTrip.")
    print("=======================================================")

if __name__ == '__main__':
    main()
