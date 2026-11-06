#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GarimpaTrip - Correção de Foreign Key de Viagens & Redesign de Minhas Viagens
-----------------------------------------------------------------------------
1. Cria sql/03_fix_profiles_and_trips.sql para sincronizar usuários do auth.users com public.profiles.
2. Atualiza TripsClient.tsx com o novo layout Bento, Autocomplete de Origem/Destino e garantia de perfil.
3. Atualiza DiscoverClient.tsx com garantia de perfil antes da criação de viagem.
4. Atualiza Trips.module.css com o novo design refinado no padrão Bento Areia/Mostarda.
5. Garante a rota e componentes de Autocomplete (src/components/search/AutocompleteInput.tsx).
"""

import os
import sys

def check_project_root():
    if not (os.path.exists("package.json") and os.path.exists("src")):
        print("❌ Erro: Execute este script na pasta raiz do projeto GarimpaTrip (onde fica o package.json).")
        sys.exit(1)

def backup_and_write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if os.path.exists(path):
        bak = path + ".bak"
        with open(path, "r", encoding="utf-8") as f_old:
            with open(bak, "w", encoding="utf-8") as f_bak:
                f_bak.write(f_old.read())
        print(f"📦 Backup: {bak}")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Atualizado: {path}")


API_AUTOCOMPLETE = """import { NextResponse } from 'next/server';

export interface PlaceSuggestion {
  id: string;
  name: string;
  subtitle: string;
  code: string;
  type: 'city' | 'airport';
  label: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const term = (searchParams.get('term') ?? '').trim();

  if (term.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(term)}&locale=pt&types[]=city&types[]=airport`;
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ results: [] });
    }

    const seen = new Set<string>();
    const results: PlaceSuggestion[] = [];

    for (const item of data) {
      if (!item.name || !item.code) continue;
      const key = `${item.code}_${item.name}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const parts = [item.state_code, item.country_name].filter(Boolean);
      const subtitle = parts.join(', ');

      const labelParts = [item.name];
      if (item.country_name) labelParts.push(item.country_name);
      const label = `${labelParts.join(', ')} (${item.code})`;

      results.push({
        id: item.id || `${item.code}-${results.length}`,
        name: item.name,
        subtitle,
        code: item.code,
        type: item.type === 'airport' ? 'airport' : 'city',
        label,
      });

      if (results.length >= 8) break;
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Autocomplete error:', err);
    return NextResponse.json({ results: [] });
  }
}
"""

# ==============================================================================
# 2. ESTILOS DO AUTOCOMPLETE: src/styles/Autocomplete.module.css
# ==============================================================================

CSS_AUTOCOMPLETE = """/* Dropdown e Campos de Autocomplete - GarimpaTrip (Layout Bento / Sand) */
.inputField {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1.5px solid var(--bg-sand-300, #CFC7B9);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-height: 54px;
}

[data-theme="dark"] .inputField,
body.dark .inputField {
  background-color: var(--bg-sand-200, #2C2824);
  border-color: var(--bg-sand-400, #4A443D);
}

.inputField:focus-within {
  border-color: var(--brand-dark, #1A1816);
  box-shadow: 0 0 0 3px rgba(229, 164, 40, 0.25);
}

.inputContent {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.inputLabel {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-muted, #5C564E);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.textInput {
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-dark, #1A1816);
  outline: none;
  width: 100%;
}

.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background-color: #FFFFFF;
  border: 1.5px solid var(--bg-sand-300, #CFC7B9);
  border-radius: 12px;
  box-shadow: 0 12px 28px -6px rgba(26, 24, 22, 0.18);
  max-height: 280px;
  overflow-y: auto;
  z-index: 120;
  list-style: none;
  margin: 0;
  padding: 0.4rem;
}

[data-theme="dark"] .dropdown,
body.dark .dropdown {
  background-color: #24201C;
  border-color: #4A443D;
  box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.5);
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.item:hover,
.itemSelected {
  background-color: var(--bg-sand-100, #FAF7F2);
}

[data-theme="dark"] .item:hover,
[data-theme="dark"] .itemSelected,
body.dark .item:hover,
body.dark .itemSelected {
  background-color: #332D27;
}

.itemMain {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.itemIcon {
  color: var(--brand-amber, #D97706);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.itemText {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.itemName {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-dark, #1A1816);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme="dark"] .itemName,
body.dark .itemName {
  color: #FAF7F2;
}

.itemSub {
  font-size: 0.74rem;
  color: var(--text-muted, #5C564E);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.itemBadge {
  font-size: 0.72rem;
  font-weight: 800;
  background-color: var(--bg-sand-200, #EAE4D9);
  color: var(--text-dark, #1A1816);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

[data-theme="dark"] .itemBadge,
body.dark .itemBadge {
  background-color: #3D3630;
  color: #E5A428;
}

.spinner {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted, #5C564E);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}
"""

# ==============================================================================
# 3. COMPONENTE AUTOCOMPLETE: src/components/search/AutocompleteInput.tsx
# ==============================================================================

COMPONENT_AUTOCOMPLETE = """'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Plane, MapPin, Loader2 } from 'lucide-react';
import type { PlaceSuggestion } from '@/app/api/autocomplete/route';
import styles from '@/styles/Autocomplete.module.css';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export function AutocompleteInput({ id, label, value, onChange, placeholder, required, icon }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed === value) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/autocomplete?term=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
          setIsOpen((data.results || []).length > 0);
          setSelectedIndex(-1);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, value]);

  const handleSelect = (item: PlaceSuggestion) => {
    setQuery(item.label);
    onChange(item.label);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.inputField} ref={wrapperRef}>
      {icon}
      <div className={styles.inputContent}>
        <label className={styles.inputLabel} htmlFor={id}>{label}</label>
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={styles.textInput}
          autoComplete="off"
        />
      </div>

      {loading && <Loader2 size={16} className={styles.spinner} />}

      {isOpen && suggestions.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              role="option"
              aria-selected={idx === selectedIndex}
              className={`${styles.item} ${idx === selectedIndex ? styles.itemSelected : ''}`}
              onClick={() => handleSelect(item)}
            >
              <div className={styles.itemMain}>
                <span className={styles.itemIcon}>
                  {item.type === 'airport' ? <Plane size={15} /> : <MapPin size={15} />}
                </span>
                <div className={styles.itemText}>
                  <span className={styles.itemName}>{item.name}</span>
                  {item.subtitle && <span className={styles.itemSub}>{item.subtitle}</span>}
                </div>
              </div>
              <span className={styles.itemBadge}>{item.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
"""

# ==============================================================================
# 4. HOME: src/components/home/HeroSearch.tsx
# ==============================================================================

SQL_FIX = """-- ==============================================================================
-- GARIMPATRIP: CORREÇÃO E SINCRONIZAÇÃO DE PERFIS (auth.users -> public.profiles)
-- Execute este script no SQL Editor do Supabase para corrigir o erro:
-- 'violates foreign key constraint "trips_user_id_fkey"'
-- ==============================================================================

-- 1. Sincroniza imediatamente todos os usuários existentes de auth.users para public.profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url, max_trips, max_active_alerts, created_at)
SELECT 
  u.id,
  COALESCE(u.email, 'sem-email@garimpatrip.local'),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email, 'Viajante'), '@', 1)),
  u.raw_user_meta_data->>'avatar_url',
  5,
  3,
  COALESCE(u.created_at, NOW())
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
  avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
  last_sign_in_at = NOW();

-- 2. Recria a função e o gatilho com suporte a UPSERT seguro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, max_trips, max_active_alerts)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Viajante'),
    NEW.raw_user_meta_data->>'avatar_url',
    5,
    3
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    last_sign_in_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Garante permissão de inserção/leitura no profile para o usuário autenticado caso falte
GRANT INSERT, SELECT, UPDATE ON public.profiles TO authenticated;

-- 4. Função auxiliar para auto-garantir perfil (RPC seguro)
CREATE OR REPLACE FUNCTION public.ensure_my_profile()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_user RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = v_uid;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, max_trips, max_active_alerts)
  VALUES (
    v_uid,
    COALESCE(v_user.email, ''),
    COALESCE(v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name', 'Viajante'),
    v_user.raw_user_meta_data->>'avatar_url',
    5,
    3
  )
  ON CONFLICT (id) DO UPDATE SET
    last_sign_in_at = NOW();

  RETURN v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;
"""

# ==============================================================================
# 2. NOVO TripsClient.tsx
# ==============================================================================

NEW_TRIPS_CLIENT = """'use client';
// Minhas Viagens: Redesign Bento moderno, Autocomplete em Origem/Destino e garantia de perfil.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Users, 
  Wallet, 
  Plane,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { LoginRequired } from '@/components/LoginRequired';
import { AutocompleteInput } from '@/components/search/AutocompleteInput';
import { cityName, extractIata } from '@/lib/iata';
import { formatBRL, formatDate, parseMoney } from '@/lib/format';
import type { Trip, TripStatus } from '@/types';
import styles from '@/styles/Trips.module.css';

const STATUS_LABEL: Record<TripStatus, string> = {
  planejamento: 'Planejamento',
  reservado: 'Reservado',
  concluido: 'Concluída',
  arquivado: 'Arquivada',
};

const EMPTY_FORM = { 
  title: '', 
  origin: '', 
  destination: '', 
  start: '', 
  end: '', 
  travelers: '1', 
  budget: '', 
  flexible: false 
};

export function TripsClient() {
  const { supabase, user, loading: authLoading, configured, signIn } = useAuth();
  const { trips, reload, loading } = useTrips(supabase, user);
  const [maxTrips, setMaxTrips] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<Record<string, Partial<Trip>>>({});
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Garante que o perfil existe em public.profiles para não dar foreign key constraint
  const ensureProfile = async () => {
    if (!supabase || !user) return false;
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email || '',
            full_name: (user.user_metadata?.full_name || user.user_metadata?.name || 'Viajante').slice(0, 100),
            avatar_url: user.user_metadata?.avatar_url || null,
            last_sign_in_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      if (profileErr) {
        console.warn('Upsert de perfil avisou:', profileErr.message);
      }
      return true;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    if (!supabase || !user) return;
    ensureProfile();
    supabase
      .from('profiles')
      .select('max_trips')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setMaxTrips(data?.max_trips ?? 5);
      });
  }, [supabase, user]);

  const activeCount = trips.filter((t) => t.status !== 'arquivado').length;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setError(null);
    setOk(null);

    if (!form.destination.trim()) {
      return setError('Informe o destino da viagem.');
    }
    if (form.start && form.end && form.end < form.start) {
      return setError('A data de volta precisa ser depois da data de ida.');
    }

    setSubmitting(true);
    await ensureProfile();

    const destCity = cityName(form.destination).slice(0, 100);
    const title = (form.title.trim() || `Viagem para ${destCity}`).slice(0, 150);

    const { error: err } = await supabase.from('trips').insert({
      user_id: user.id,
      title,
      origin_city: cityName(form.origin || 'São Paulo').slice(0, 100),
      origin_iata: extractIata(form.origin) || null,
      destination_city: destCity,
      destination_iata: extractIata(form.destination) || null,
      start_date: form.start || null,
      end_date: form.end || null,
      is_flexible_dates: form.flexible,
      travelers_count: Math.min(50, Math.max(1, Number(form.travelers) || 1)),
      budget_limit: parseMoney(form.budget) ?? 0,
    });

    setSubmitting(false);

    if (err) {
      if (err.message.includes('foreign key constraint')) {
        return setError('Sua conta precisa ser sincronizada com o banco. Por favor, execute o script sql/03_fix_profiles_and_trips.sql no Supabase.');
      }
      return setError(err.message);
    }

    setForm(EMPTY_FORM);
    setOk(`Viagem para ${destCity} criada com sucesso!`);
    reload();
  };

  const save = async (trip: Trip) => {
    if (!supabase) return;
    const patch = editing[trip.id];
    if (!patch) return;
    setError(null);
    const { error: err } = await supabase.from('trips').update(patch).eq('id', trip.id);
    if (err) return setError(err.message);
    setEditing((p) => {
      const n = { ...p };
      delete n[trip.id];
      return n;
    });
    setOk('Alterações salvas com sucesso.');
    reload();
  };

  const remove = async (trip: Trip) => {
    if (!supabase) return;
    if (!window.confirm(`Excluir "${trip.title}"? Todos os itens da Caixa de Descobertas e do Pacote serão apagados.`)) return;
    const { error: err } = await supabase.from('trips').delete().eq('id', trip.id);
    if (err) return setError(err.message);
    reload();
  };

  const edit = (id: string, patch: Partial<Trip>) => setEditing((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  if (!authLoading && !user) {
    return (
      <main className="gt-page">
        <div className="gt-container">
          <h1 className="gt-title">Minhas Viagens</h1>
          <div style={{ marginTop: '1.5rem' }}>
            <LoginRequired configured={configured} onLogin={signIn} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="gt-page">
      <div className="gt-container">
        
        {/* Cabeçalho Bento */}
        <header className={styles.header}>
          <div>
            <span className={styles.headerBadge}>
              <Compass size={14} /> Painel de Roteiros
            </span>
            <h1 className="gt-title">Minhas Viagens</h1>
            <p className="gt-subtitle">
              Organize seus roteiros, planeje o orçamento e guarde achados nas 10 macrocategorias.
            </p>
          </div>
          <div className={styles.quotaPill}>
            <span className={styles.quotaNumber}>{activeCount} / {maxTrips ?? 5}</span>
            <span className={styles.quotaText}>viagens ativas</span>
          </div>
        </header>

        {error && (
          <div className="gt-error" style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {ok && (
          <div className="gt-success" style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{ok}</span>
          </div>
        )}

        {/* Formulário Novo Bento com Autocomplete */}
        <section className={styles.createCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconBox}>
              <Plane size={20} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Planejar Nova Viagem</h2>
              <p className={styles.cardSubtitle}>
                Escolha o destino pelo buscador para preenchimento automático de IATA e sugestões.
              </p>
            </div>
          </div>

          <form onSubmit={create} className={styles.formContainer}>
            {/* Linha 1: Nome da Viagem */}
            <div className={styles.fullWidth}>
              <label className="gt-label">
                Nome do Roteiro (opcional)
                <input
                  className="gt-input"
                  value={form.title}
                  maxLength={150}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex.: Férias na Costa Rica, Mochilão Europa..."
                />
              </label>
            </div>

            {/* Linha 2: Origem e Destino com AUTOCOMPLETE */}
            <div className={styles.autocompleteRow}>
              <div className={styles.autocompleteCol}>
                <AutocompleteInput
                  id="origin-input"
                  label="Origem de Partida"
                  value={form.origin}
                  onChange={(val) => setForm((prev) => ({ ...prev, origin: val }))}
                  placeholder="De onde você sai? (ex.: São Paulo)"
                  required
                  icon={<Plane size={16} />}
                />
              </div>

              <div className={styles.autocompleteCol}>
                <AutocompleteInput
                  id="destination-input"
                  label="Destino Desejado"
                  value={form.destination}
                  onChange={(val) => setForm((prev) => ({ ...prev, destination: val }))}
                  placeholder="Para onde quer ir? (ex.: San José, Costa Rica)"
                  required
                  icon={<MapPin size={16} />}
                />
              </div>
            </div>

            {/* Linha 3: Datas, Viajantes e Orçamento */}
            <div className={styles.detailsGrid}>
              <label className="gt-label">
                <span className={styles.labelWithIcon}><Calendar size={13} /> Data de Ida</span>
                <input
                  className="gt-input"
                  type="date"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </label>

              <label className="gt-label">
                <span className={styles.labelWithIcon}><Calendar size={13} /> Data de Volta</span>
                <input
                  className="gt-input"
                  type="date"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </label>

              <label className="gt-label">
                <span className={styles.labelWithIcon}><Users size={13} /> Viajantes</span>
                <input
                  className="gt-input"
                  type="number"
                  min={1}
                  max={50}
                  value={form.travelers}
                  onChange={(e) => setForm({ ...form, travelers: e.target.value })}
                />
              </label>

              <label className="gt-label">
                <span className={styles.labelWithIcon}><Wallet size={13} /> Teto Orçamento (R$)</span>
                <input
                  className="gt-input"
                  inputMode="decimal"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="Ex.: 4500"
                />
              </label>
            </div>

            {/* Rodapé do Form */}
            <div className={styles.formFooter}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.flexible}
                  onChange={(e) => setForm({ ...form, flexible: e.target.checked })}
                />
                <span>Tenho flexibilidade de datas (+/- 3 dias)</span>
              </label>

              <button 
                type="submit" 
                className="gt-btn gt-btn-dark"
                disabled={submitting}
                style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}
              >
                <Plus size={18} />
                <span>{submitting ? 'Criando roteiro…' : 'Criar e Começar Garimpo'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Lista de Viagens Existentes */}
        <section className={styles.tripsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Seus Roteiros Cadastrados</h2>
            <span className={styles.sectionCount}>{trips.length} roteiro(s)</span>
          </div>

          {loading && trips.length === 0 && (
            <p className="gt-muted" style={{ padding: '2rem 0' }}>Carregando seus roteiros…</p>
          )}

          {!loading && trips.length === 0 && (
            <div className={styles.emptyNotice}>
              <Compass size={36} color="var(--brand-amber)" style={{ marginBottom: '0.5rem' }} />
              <h3>Nenhuma viagem criada ainda</h3>
              <p>Preencha os campos acima com o seu próximo destino para começar a montar o pacote.</p>
            </div>
          )}

          <div className={styles.list}>
            {trips.map((t) => {
              const draft = { ...t, ...editing[t.id] };
              const dirty = Boolean(editing[t.id]);
              return (
                <article 
                  key={t.id} 
                  className={`${styles.tripCard} ${t.status === 'arquivado' ? styles.archived : ''}`}
                >
                  <div className={styles.tripHead}>
                    <input
                      className={styles.tripTitle}
                      value={draft.title}
                      maxLength={150}
                      onChange={(e) => edit(t.id, { title: e.target.value })}
                      aria-label="Nome da viagem"
                    />
                    <select
                      className={`gt-input ${styles.statusSelect}`}
                      value={draft.status}
                      onChange={(e) => edit(t.id, { status: e.target.value as TripStatus })}
                      aria-label="Status da viagem"
                    >
                      {Object.entries(STATUS_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.routeBadge}>
                    <Plane size={15} />
                    <span>{t.origin_city}{t.origin_iata ? ` (${t.origin_iata})` : ''}</span>
                    <ArrowRight size={14} />
                    <strong>{t.destination_city}{t.destination_iata ? ` (${t.destination_iata})` : ''}</strong>
                  </div>

                  <div className={styles.tripGrid}>
                    <label className="gt-label">
                      Ida
                      <input
                        className="gt-input"
                        type="date"
                        value={draft.start_date ?? ''}
                        onChange={(e) => edit(t.id, { start_date: e.target.value || null })}
                      />
                    </label>
                    <label className="gt-label">
                      Volta
                      <input
                        className="gt-input"
                        type="date"
                        value={draft.end_date ?? ''}
                        onChange={(e) => edit(t.id, { end_date: e.target.value || null })}
                      />
                    </label>
                    <label className="gt-label">
                      Viajantes
                      <input
                        className="gt-input"
                        type="number"
                        min={1}
                        max={50}
                        value={draft.travelers_count}
                        onChange={(e) => edit(t.id, { travelers_count: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })}
                      />
                    </label>
                    <label className="gt-label">
                      Teto (R$)
                      <input
                        className="gt-input"
                        type="number"
                        min={0}
                        step="0.01"
                        value={draft.budget_limit}
                        onChange={(e) => edit(t.id, { budget_limit: Number(e.target.value) || 0 })}
                      />
                    </label>
                  </div>

                  <div className={styles.tripMeta}>
                    <span>
                      📅 {formatDate(t.start_date)} a {formatDate(t.end_date)}
                    </span>
                    <span>
                      💰 Teto: {Number(t.budget_limit) > 0 ? formatBRL(t.budget_limit) : 'Livre'}
                    </span>
                  </div>

                  <div className={styles.tripActions}>
                    <Link href={`/box?trip=${t.id}`} className="gt-btn gt-btn-light gt-btn-sm">
                      <Sparkles size={14} /> Caixa de Descobertas
                    </Link>
                    <Link href={`/package?trip=${t.id}`} className="gt-btn gt-btn-light gt-btn-sm">
                      <Briefcase size={14} /> Montar Pacote
                    </Link>
                    <span style={{ flex: 1 }} />
                    {dirty && (
                      <button type="button" className="gt-btn gt-btn-yellow gt-btn-sm" onClick={() => save(t)}>
                        <Save size={14} /> Salvar
                      </button>
                    )}
                    <button
                      type="button"
                      className="gt-btn gt-btn-danger gt-btn-sm"
                      onClick={() => remove(t)}
                      aria-label="Excluir viagem"
                      title="Excluir viagem"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
"""

# ==============================================================================
# 3. ATUALIZAÇÃO DO DiscoverClient.tsx (Garantia de perfil no "Criar Viagem")
# ==============================================================================

NEW_DISCOVER_CLIENT = """'use client';
// Tela Descobrir: busca multi-provedores com autocomplete e garantia de perfil.
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Sparkles, ExternalLink, Compass } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { TripPicker } from '@/components/TripPicker';
import { AutocompleteInput } from '@/components/search/AutocompleteInput';
import { cityName, extractIata } from '@/lib/iata';
import { formatBRL, parseMoney } from '@/lib/format';
import type { SearchResult } from '@/types';
import styles from '@/styles/Discover.module.css';

const DEFAULT_ORIGIN = 'São Paulo (GRU)';
const DEFAULT_DESTINATION = 'Salvador (SSA)';

export function DiscoverClient() {
  const { supabase, user, signIn } = useAuth();
  const { trips, selectedTrip, selectedId, setSelectedId, reload, loading: tripsLoading } = useTrips(supabase, user);

  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_DESTINATION);
  const [month, setMonth] = useState('2026-12');
  const [budget, setBudget] = useState('3500');

  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState<{ origin: string; destination: string; month: string } | null>(null);
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const runSearch = async (orig: string, dest: string, m: string) => {
    setSearching(true);
    setMessage(null);
    try {
      const qs = new URLSearchParams({ origin: orig, destination: dest, month: m });
      const res = await fetch(`/api/discover/search?${qs.toString()}`);
      if (!res.ok) throw new Error('Não foi possível buscar.');
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro na busca.' });
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      return setMessage({ type: 'error', text: 'Informe um destino para pesquisar.' });
    }
    setSearched({ origin, destination, month });
    runSearch(origin, destination, month);
  };

  // Garante que o profile existe antes de dar insert em trips
  const ensureProfile = async () => {
    if (!supabase || !user) return;
    try {
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email || '',
          full_name: (user.user_metadata?.full_name || user.user_metadata?.name || 'Viajante').slice(0, 100),
          avatar_url: user.user_metadata?.avatar_url || null,
          last_sign_in_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {}
  };

  const createTrip = async () => {
    if (!supabase || !user) return signIn();
    const dest = searched?.destination || destination;
    if (!dest.trim()) return setMessage({ type: 'error', text: 'Informe um destino antes de criar a viagem.' });
    
    setCreatingTrip(true);
    await ensureProfile();

    const destCity = cityName(dest);
    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        title: `Viagem para ${destCity}`,
        origin_city: cityName(searched?.origin || origin) || 'São Paulo',
        origin_iata: extractIata(searched?.origin || origin),
        destination_city: destCity,
        destination_iata: extractIata(dest),
        budget_limit: parseMoney(budget) ?? 0,
      })
      .select('id')
      .single();

    setCreatingTrip(false);

    if (error) {
      if (error.message.includes('foreign key constraint')) {
        return setMessage({ 
          type: 'error', 
          text: 'Sua conta precisa ser sincronizada com o banco. Execute sql/03_fix_profiles_and_trips.sql no Supabase.' 
        });
      }
      return setMessage({ type: 'error', text: error.message });
    }

    await reload();
    if (data?.id) setSelectedId(data.id);
    setMessage({ type: 'ok', text: `Viagem para ${destCity} criada! Agora é só guardar os achados.` });
  };

  const saveResult = async (r: SearchResult) => {
    if (!supabase || !user) return signIn();
    if (!selectedTrip) return setMessage({ type: 'error', text: 'Crie ou escolha uma viagem antes de guardar itens.' });
    
    await ensureProfile();

    const { error: err } = await supabase.from('discoveries').insert({
      trip_id: selectedTrip.id,
      user_id: user.id,
      title: r.title.slice(0, 200),
      category: r.category,
      description: r.description,
      source_type: r.source_type,
      external_url: r.url,
      estimated_price: r.price ?? 0,
      currency: 'BRL',
      raw_payload: r.meta || {},
    });

    if (err) return setMessage({ type: 'error', text: err.message });
    setSavedUrls((s) => new Set(s).add(r.url));
    setMessage({ type: 'ok', text: `"${r.title}" guardado na Caixa de Descobertas!` });
  };

  return (
    <main className="gt-page">
      <div className="gt-container">
        
        {/* Cabeçalho */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="gt-badge" style={{ background: 'var(--brand-yellow-light)', color: 'var(--brand-dark)' }}>
            <Compass size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Buscador Multi-Provedores
          </span>
          <h1 className="gt-title" style={{ marginTop: '0.5rem' }}>Descobrir Viagens</h1>
          <p className="gt-subtitle">
            Pesquise voos, estadias e passeios com autocomplete e guarde na sua Caixa de Descobertas.
          </p>
        </div>

        {/* Barra de Pesquisa Bento com Autocomplete */}
        <section className={styles.searchSection}>
          <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
            <div className={styles.searchInputsGrid}>
              <div className={styles.autocompleteField}>
                <AutocompleteInput
                  id="disc-origin"
                  label="Origem"
                  value={origin}
                  onChange={setOrigin}
                  placeholder="De onde você sai?"
                  required
                />
              </div>

              <div className={styles.autocompleteField}>
                <AutocompleteInput
                  id="disc-destination"
                  label="Destino"
                  value={destination}
                  onChange={setDestination}
                  placeholder="Para onde quer ir?"
                  required
                />
              </div>

              <div className={styles.smallField}>
                <label className="gt-label">Mês da ida
                  <input 
                    className="gt-input" 
                    type="month" 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)} 
                    required 
                  />
                </label>
              </div>

              <div className={styles.smallField}>
                <label className="gt-label">Teto (R$)
                  <input 
                    className="gt-input" 
                    type="number" 
                    min={0} 
                    value={budget} 
                    onChange={(e) => setBudget(e.target.value)} 
                    placeholder="3500" 
                  />
                </label>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button type="submit" className="gt-btn gt-btn-dark" disabled={searching}>
                <Search size={16} /> 
                <span>{searching ? 'Garimpando…' : 'Garimpar Destino'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Barra de Seleção / Criação de Viagem */}
        <div className={styles.tripBar}>
          {user ? (
            <>
              <TripPicker trips={trips} selectedId={selectedId} onChange={setSelectedId} loading={tripsLoading} />
              {searched?.destination && (
                <button type="button" className="gt-btn gt-btn-yellow" onClick={createTrip} disabled={creatingTrip}>
                  <Plus size={16} /> Criar viagem para {cityName(searched.destination)}
                </button>
              )}
            </>
          ) : (
            <div className="gt-notice">
              Para guardar itens na Caixa de Descobertas,{' '}
              <button type="button" className={styles.inlineLink} onClick={signIn}>entre com Google</button>.
            </div>
          )}
        </div>

        {/* Mensagens de Feedback */}
        {message && (
          <div className={message.type === 'ok' ? 'gt-success' : 'gt-error'} style={{ margin: '1rem 0' }}>
            {message.text}
          </div>
        )}

        {/* Resultados */}
        <section style={{ marginTop: '2rem' }}>
          {searching && <p className="gt-muted">Garimpando provedores oficiais…</p>}
          {!searching && searched && results.length === 0 && (
            <div className="gt-notice">
              Nenhuma oferta encontrada para esta combinação no momento. Tente alterar o mês ou o destino.
            </div>
          )}

          <div className={styles.resultsGrid}>
            {results.map((r, idx) => {
              const saved = savedUrls.has(r.url);
              return (
                <article key={idx} className={styles.resultCard}>
                  <div className={styles.cardTop}>
                    <span className="gt-badge">{r.category}</span>
                    <span className={styles.sourceTag}>{r.source_type}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{r.title}</h3>
                  <p className={styles.cardDesc}>{r.description}</p>
                  
                  <div className={styles.cardBottom}>
                    <span className={styles.price}>
                      {r.price ? formatBRL(r.price) : 'Consulte parceiro'}
                    </span>
                    <div className={styles.cardBtns}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn-light gt-btn-sm">
                        <ExternalLink size={13} /> Ver oferta
                      </a>
                      {user && (
                        <button
                          type="button"
                          className="gt-btn gt-btn-yellow gt-btn-sm"
                          disabled={saved}
                          onClick={() => saveResult(r)}
                        >
                          <Sparkles size={13} /> {saved ? 'Guardado' : 'Guardar'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
"""

# ==============================================================================
# 4. NOVO Trips.module.css (Estilos Bento refinados para Minhas Viagens)
# ==============================================================================

NEW_TRIPS_CSS = """.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.headerBadge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background-color: var(--brand-yellow-light, #FEF3C7);
  color: var(--brand-dark, #231F20);
  margin-bottom: 0.5rem;
}

.quotaPill {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: #FFFFFF;
  border: 1px solid var(--bg-sand-300, #EAE5DE);
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-bento, 16px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05));
}

.quotaNumber {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--brand-dark, #231F20);
  line-height: 1.1;
}

.quotaText {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted, #736E65);
}

/* Card Principal de Criação (Bento) */
.createCard {
  background: #FFFFFF;
  border: 1px solid var(--bg-sand-300, #EAE5DE);
  border-radius: var(--radius-bento, 20px);
  padding: 1.75rem;
  margin-bottom: 3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.cardHeader {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--bg-sand-200, #F4F1EC);
}

.cardIconBox {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background-color: var(--brand-yellow, #F4C430);
  color: var(--brand-dark, #231F20);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cardTitle {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--brand-dark, #231F20);
  margin: 0;
}

.cardSubtitle {
  font-size: 0.85rem;
  color: var(--text-muted, #736E65);
  margin: 0.2rem 0 0;
}

.formContainer {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.fullWidth {
  width: 100%;
}

.autocompleteRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.autocompleteCol {
  position: relative;
}

.detailsGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  align-items: end;
}

.labelWithIcon {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.formFooter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--bg-sand-200, #F4F1EC);
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted, #5C564E);
  cursor: pointer;
}

/* Seção de Listagem */
.tripsSection {
  margin-top: 2rem;
}

.sectionHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.sectionTitle {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--brand-dark, #231F20);
}

.sectionCount {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted, #736E65);
  background: var(--bg-sand-200, #F4F1EC);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
}

.emptyNotice {
  background: #FFFFFF;
  border: 2px dashed var(--bg-sand-300, #EAE5DE);
  border-radius: var(--radius-bento, 16px);
  padding: 3rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-muted, #736E65);
}

.emptyNotice h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--brand-dark, #231F20);
  margin-bottom: 0.35rem;
}

.list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.tripCard {
  background-color: #FFFFFF;
  border: 1px solid var(--bg-sand-300, #EAE5DE);
  border-top: 4px solid var(--brand-yellow, #F4C430);
  border-radius: var(--radius-bento, 16px);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05));
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.tripCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.archived {
  border-top-color: var(--text-light, #9E9991);
  opacity: 0.75;
}

.tripHead {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.tripTitle {
  flex: 1;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.3rem 0.5rem;
  font-size: 1.2rem;
  font-weight: 900;
  background: transparent;
  color: var(--brand-dark, #231F20);
  font-family: inherit;
}

.tripTitle:hover,
.tripTitle:focus {
  border-color: var(--bg-sand-300, #EAE5DE);
  background: var(--bg-sand-100, #FAF8F5);
  outline: none;
}

.statusSelect {
  width: auto;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
}

.routeBadge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--bg-sand-100, #FAF8F5);
  border: 1px solid var(--bg-sand-300, #EAE5DE);
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--brand-dark, #231F20);
  width: fit-content;
}

.tripGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.tripMeta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-muted, #736E65);
  padding: 0.4rem 0;
  border-top: 1px solid var(--bg-sand-200, #F4F1EC);
}

.tripActions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  border-top: 1px solid var(--bg-sand-200, #F4F1EC);
  padding-top: 0.85rem;
}

/* Responsividade */
@media (max-width: 960px) {
  .autocompleteRow {
    grid-template-columns: 1fr;
  }

  .detailsGrid {
    grid-template-columns: repeat(2, 1fr);
  }

  .list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 580px) {
  .detailsGrid,
  .tripGrid {
    grid-template-columns: 1fr;
  }

  .formFooter {
    flex-direction: column;
    align-items: stretch;
  }

  .formFooter button {
    width: 100%;
    justify-content: center;
  }
}
"""

def main():
    print("=" * 65)
    print("  GarimpaTrip: Correção de Foreign Key & Redesign de Viagens")
    print("=" * 65)
    check_project_root()

    # 1. Garante rota e componentes do Autocomplete
    backup_and_write("src/app/api/autocomplete/route.ts", API_AUTOCOMPLETE)
    backup_and_write("src/styles/Autocomplete.module.css", CSS_AUTOCOMPLETE)
    backup_and_write("src/components/search/AutocompleteInput.tsx", COMPONENT_AUTOCOMPLETE)

    # 2. Cria o script SQL de sincronização no Supabase
    backup_and_write("sql/03_fix_profiles_and_trips.sql", SQL_FIX)

    # 3. Atualiza TripsClient.tsx com novo layout Bento e Autocomplete
    backup_and_write("src/components/trips/TripsClient.tsx", NEW_TRIPS_CLIENT)

    # 4. Atualiza DiscoverClient.tsx com garantia de perfil
    backup_and_write("src/components/discover/DiscoverClient.tsx", NEW_DISCOVER_CLIENT)

    # 5. Atualiza Trips.module.css com o novo design Bento
    backup_and_write("src/styles/Trips.module.css", NEW_TRIPS_CSS)

    print("=" * 65)
    print("✨ Arquivos atualizados com sucesso!")
    print()
    print("👉 PRÓXIMOS PASSOS OBRIGATÓRIOS:")
    print("   1. Abra o Supabase Dashboard -> SQL Editor")
    print("   2. Copie e cole o conteúdo do arquivo \x27sql/03_fix_profiles_and_trips.sql\x27 e clique em RUN")
    print("      (Isso vincula seu usuário do Google com public.profiles e resolve o erro foreign key)")
    print("   3. Rode \x27npm run dev\x27 no seu terminal")
    print("   4. Acesse Minhas Viagens e teste a criação com o novo dropdown de autocomplete!")
    print("=" * 65)

if __name__ == "__main__":
    main()
