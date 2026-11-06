#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Correção: Erro 'JWT expired' e Renovação Automática de Sessão no GarimpaTrip
"""

import os
import sys

def check_project_root():
    if not (os.path.exists('package.json') and os.path.exists('src')):
        print("❌ Erro: Execute este script na pasta raiz do projeto GarimpaTrip.")
        sys.exit(1)

def backup_and_write(path: str, new_content: str):
    dir_name = os.path.dirname(path)
    if dir_name and not os.path.exists(dir_name):
        os.makedirs(dir_name, exist_ok=True)
    if os.path.exists(path):
        bak = f"{path}.bak"
        with open(path, "r", encoding="utf-8") as f:
            old = f.read()
        with open(bak, "w", encoding="utf-8") as f:
            f.write(old)
        print(f"📦 Backup criado: {bak}")
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"✅ Atualizado: {path}")

MIDDLEWARE_CODE = """import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Valida e renova a sessão automaticamente em segundo plano
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
"""

def main():
    print("🚀 Configurando renovação automática de sessão (middleware)...")
    check_project_root()
    backup_and_write("src/middleware.ts", MIDDLEWARE_CODE)
    print("\n✨ Middleware ativado com sucesso!")
    print("👉 Agora faça 'Sair' e 'Entrar com Google' uma vez no navegador para renovar a sessão atual.")

if __name__ == '__main__':
    main()
