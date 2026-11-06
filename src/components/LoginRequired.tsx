'use client';
// Aviso exibido nas telas que precisam de login (Caixa, Pacote, Viagens).
import React from 'react';
import { User } from 'lucide-react';

interface Props {
  configured: boolean;
  onLogin: () => void;
  message?: string;
}

export function LoginRequired({ configured, onLogin, message }: Props) {
  if (!configured) {
    return (
      <div className="gt-notice">
        O banco de dados ainda não está conectado. Preencha <code>NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no arquivo <code>.env.local</code> e reinicie o <code>npm run dev</code>.
      </div>
    );
  }
  return (
    <div className="gt-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
      <p style={{ fontWeight: 700, marginBottom: '1rem' }}>
        {message ?? 'Entre com sua conta Google para salvar e organizar suas viagens.'}
      </p>
      <button type="button" className="gt-btn gt-btn-dark" onClick={onLogin}>
        <User size={16} /> Entrar com Google
      </button>
    </div>
  );
}
