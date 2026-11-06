#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GarimpaTrip - Script de Atualização: Autocomplete e Barra de Busca Bento
1. Cria a rota /api/autocomplete (Travelpayouts places2)
2. Cria o componente AutocompleteInput e seus estilos (Autocomplete.module.css)
3. Atualiza HeroSearch.tsx na Home com Autocomplete para Origem e Destino
4. Moderniza a barra de pesquisa da página de resultados (/discover):
   - Transforma a área crua no visual Bento fiel da Home (cards areia, ícones, tipografia espresso)
   - Adiciona Autocomplete em Origem e Destino
   - Estiliza os campos de Mês da ida, Teto e botão Garimpar
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

# ==============================================================================
# 1. ROTA DE API: /api/autocomplete/route.ts
# ==============================================================================
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
HERO_SEARCH = """'use client';
// Barra de garimpo da página inicial com autocomplete: leva origem, destino e orçamento para /discover.
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, DollarSign, ArrowRight } from 'lucide-react';
import { AutocompleteInput } from '@/components/search/AutocompleteInput';
import styles from '@/styles/Home.module.css';

export function HeroSearch() {
  const router = useRouter();
  const [origin, setOrigin] = useState('São Paulo (GRU)');
  const [destination, setDestination] = useState('Salvador (SSA)');
  const [budget, setBudget] = useState('3500');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    const params = new URLSearchParams({ origin, destination, budget });
    router.push(`/discover?${params}`);
  };

  return (
    <div className={styles.searchBar}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <AutocompleteInput
          id="hero-origin"
          label="Origem"
          value={origin}
          onChange={setOrigin}
          placeholder="Cidade de partida"
          icon={<MapPin size={20} color="#6B7280" />}
        />

        <AutocompleteInput
          id="hero-destination"
          label="Destino"
          value={destination}
          onChange={setDestination}
          placeholder="Para onde quer viajar?"
          required
          icon={<Search size={20} color="#F5B731" />}
        />

        <div className={styles.inputField}>
          <DollarSign size={20} color="#10B981" />
          <div className={styles.inputContent}>
            <label className={styles.inputLabel} htmlFor="hero-budget">Teto de Orçamento (R$)</label>
            <input
              id="hero-budget"
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={styles.textInput}
              placeholder="Ex: 3500"
            />
          </div>
        </div>

        <button type="submit" className={styles.searchBtn}>
          <span>Garimpar</span>
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
"""

# ==============================================================================
# 5. RESULTADOS: src/components/discover/DiscoverClient.tsx
# ==============================================================================
DISCOVER_CLIENT = """'use client';
// Tela de garimpo: consulta as 5 fontes em paralelo (via /api/discover/*)
// e permite guardar qualquer resultado na Caixa de Descobertas da viagem escolhida.
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Building2, Ticket, Car, Globe, Search, MapPin, Calendar, DollarSign, ExternalLink, Plus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { TripPicker } from '@/components/TripPicker';
import { AutocompleteInput } from '@/components/search/AutocompleteInput';
import { cityName, extractIata } from '@/lib/iata';
import { formatBRL, parseMoney } from '@/lib/format';
import type { SearchResponse, SearchResult } from '@/types';
import styles from '@/styles/Discover.module.css';

const SECTIONS = [
  { key: 'flights', title: 'Voos (Travelpayouts)', icon: Plane, color: 'var(--cat-flight-text)', bg: 'var(--cat-flight-bg)' },
  { key: 'hotels', title: 'Hospedagens próximas', icon: Building2, color: 'var(--cat-hotel-text)', bg: 'var(--cat-hotel-bg)' },
  { key: 'tours', title: 'Passeios & Atrações', icon: Ticket, color: 'var(--cat-tour-text)', bg: 'var(--cat-tour-bg)' },
  { key: 'transport', title: 'Deslocamento Local', icon: Car, color: 'var(--cat-transport-text)', bg: 'var(--cat-transport-bg)' },
  { key: 'web', title: 'Ideias da Web (Brave)', icon: Globe, color: 'var(--cat-food-text)', bg: 'var(--cat-food-bg)' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];
type SectionState = { loading: boolean; data?: SearchResponse; error?: string };

interface Props {
  initialOrigin: string;
  initialDestination: string;
  initialBudget: string;
  initialMonth: string;
}

export function DiscoverClient({ initialOrigin, initialDestination, initialBudget, initialMonth }: Props) {
  const router = useRouter();
  const { supabase, user, signIn } = useAuth();
  const { trips, selectedTrip, selectedId, setSelectedId, reload, loading: tripsLoading } = useTrips(supabase, user);

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [budget, setBudget] = useState(initialBudget);
  const [month, setMonth] = useState(initialMonth);
  const [searched, setSearched] = useState({ origin: initialOrigin, destination: initialDestination, month: initialMonth });
  const [sections, setSections] = useState<Record<SectionKey, SectionState>>({} as Record<SectionKey, SectionState>);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [creatingTrip, setCreatingTrip] = useState(false);

  const runSearch = useCallback(async (o: string, d: string, m: string) => {
    if (d.trim().length < 2) return;
    const params = new URLSearchParams({ origin: o, destination: d });
    if (m) params.set('month', m);
    setSections(Object.fromEntries(SECTIONS.map((s) => [s.key, { loading: true }])) as Record<SectionKey, SectionState>);
    await Promise.all(
      SECTIONS.map(async (s) => {
        try {
          const res = await fetch(`/api/discover/${s.key}?${params}`);
          const data = (await res.json()) as SearchResponse & { error?: string };
          setSections((prev) => ({ ...prev, [s.key]: res.ok ? { loading: false, data } : { loading: false, error: data.error ?? 'Erro na busca.' } }));
        } catch {
          setSections((prev) => ({ ...prev, [s.key]: { loading: false, error: 'Falha de conexão.' } }));
        }
      }),
    );
  }, []);

  useEffect(() => {
    if (initialDestination) runSearch(initialOrigin, initialDestination, initialMonth);
  }, [initialOrigin, initialDestination, initialMonth, runSearch]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ origin, destination, budget });
    if (month) params.set('month', month);
    router.replace(`/discover?${params}`, { scroll: false });
    setSearched({ origin, destination, month });
    runSearch(origin, destination, month);
  };

  const createTrip = async () => {
    if (!supabase || !user) return signIn();
    const dest = searched.destination || destination;
    if (!dest.trim()) return setMessage({ type: 'error', text: 'Informe um destino antes de criar a viagem.' });
    setCreatingTrip(true);
    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        title: `Viagem para ${cityName(dest)}`,
        origin_city: cityName(searched.origin || origin) || 'A definir',
        origin_iata: extractIata(searched.origin || origin),
        destination_city: cityName(dest),
        destination_iata: extractIata(dest),
        budget_limit: parseMoney(budget) ?? 0,
      })
      .select('id')
      .single();
    setCreatingTrip(false);
    if (error) return setMessage({ type: 'error', text: error.message });
    await reload();
    setSelectedId(data.id);
    setMessage({ type: 'ok', text: `Viagem para ${cityName(dest)} criada! Agora é só guardar os achados.` });
  };

  const saveResult = async (r: SearchResult) => {
    if (!supabase || !user) return signIn();
    if (!selectedTrip) return setMessage({ type: 'error', text: 'Crie ou escolha uma viagem antes de guardar itens.' });
    const { error } = await supabase.from('discoveries').insert({
      trip_id: selectedTrip.id,
      user_id: user.id,
      title: r.title.slice(0, 200),
      category: r.category,
      description: r.description,
      source_type: r.source_type,
      external_url: r.url,
      estimated_price: r.price ?? 0,
      currency: r.currency,
      raw_payload: { ...r.raw, source: r.source },
    });
    if (error) return setMessage({ type: 'error', text: error.message });
    setSaved((prev) => ({ ...prev, [r.id]: true }));
  };

  const budgetNumber = parseMoney(budget);

  return (
    <main className="gt-page">
      <div className="gt-container">
        <div className={styles.header}>
          <span className="gt-badge" style={{ background: 'var(--cat-flight-bg)', borderColor: 'var(--cat-flight-border)', color: 'var(--cat-flight-text)' }}>
            Search, Look and Redirect
          </span>
          <h1 className="gt-title">Descobrir Destinos{searched.destination ? `: ${cityName(searched.destination)}` : ''}</h1>
          <p className="gt-subtitle">
            Consultamos parceiros e fontes oficiais ao mesmo tempo. Guarde o que gostar na Caixa de Descobertas e reserve sempre no site do parceiro.
          </p>
        </div>

        <div className={styles.searchBar}>
          <form className={styles.searchForm} onSubmit={onSubmit}>
            <AutocompleteInput
              id="discover-origin"
              label="Origem"
              value={origin}
              onChange={setOrigin}
              placeholder="São Paulo (GRU)"
              icon={<MapPin size={18} color="#6B7280" />}
            />

            <AutocompleteInput
              id="discover-destination"
              label="Destino"
              value={destination}
              onChange={setDestination}
              placeholder="Salvador (SSA)"
              required
              icon={<Search size={18} color="#F5B731" />}
            />

            <div className={styles.inputField}>
              <Calendar size={18} color="#D97706" />
              <div className={styles.inputContent}>
                <label className={styles.inputLabel} htmlFor="discover-month">Mês da ida</label>
                <input
                  id="discover-month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className={styles.textInput}
                />
              </div>
            </div>

            <div className={styles.inputField}>
              <DollarSign size={18} color="#10B981" />
              <div className={styles.inputContent}>
                <label className={styles.inputLabel} htmlFor="discover-budget">Teto (R$)</label>
                <input
                  id="discover-budget"
                  type="number"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={styles.textInput}
                  placeholder="Ex: 3500"
                />
              </div>
            </div>

            <button type="submit" className={styles.searchBtn}>
              <Search size={18} />
              <span>Garimpar</span>
            </button>
          </form>
        </div>

        <div className={styles.tripBar}>
          {user ? (
            <>
              <TripPicker trips={trips} selectedId={selectedId} onChange={setSelectedId} loading={tripsLoading} />
              {searched.destination && (
                <button type="button" className="gt-btn gt-btn-yellow" onClick={createTrip} disabled={creatingTrip}>
                  <Plus size={16} /> Criar viagem para {cityName(searched.destination)}
                </button>
              )}
            </>
          ) : (
            <div className="gt-notice">
              Você pode pesquisar à vontade. Para guardar itens na Caixa de Descobertas,{' '}
              <button type="button" className={styles.inlineLink} onClick={signIn}>entre com Google</button>.
            </div>
          )}
        </div>

        {message && <div className={message.type === 'ok' ? 'gt-success' : 'gt-error'} style={{ marginBottom: '1.5rem' }}>{message.text}</div>}

        {!searched.destination && <div className="gt-notice">Digite um destino e clique em Garimpar para começar.</div>}

        {searched.destination && (
          <div className={styles.sections}>
            {SECTIONS.map((s) => {
              const st = sections[s.key];
              const Icon = s.icon;
              return (
                <section key={s.key} className={styles.section}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionIcon} style={{ background: s.bg, color: s.color }}><Icon size={18} /></span>
                    <h2 className={styles.sectionTitle}>{s.title}</h2>
                    {st?.data?.moreUrl && (
                      <a href={st.data.moreUrl} target="_blank" rel="noopener noreferrer sponsored" className={styles.moreLink}>
                        Ver mais no parceiro <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {st?.loading && <div className={styles.loading}><Loader2 size={18} className={styles.spin} /> Garimpando…</div>}
                  {st?.error && <div className="gt-error">{st.error}</div>}
                  {st?.data?.notice && <div className="gt-notice">{st.data.notice}</div>}

                  <div className={styles.results}>
                    {st?.data?.results.map((r) => {
                      const overBudget = budgetNumber !== null && budgetNumber > 0 && r.price !== null && r.price > budgetNumber;
                      return (
                        <article key={r.id} className={styles.result}>
                          <span className={styles.source}>{r.source}</span>
                          <h3 className={styles.resultTitle}>{r.title}</h3>
                          {r.description && <p className={styles.resultDesc}>{r.description}</p>}
                          <div className={styles.resultFooter}>
                            <span className={overBudget ? styles.priceOver : styles.price}>
                              {r.price !== null ? formatBRL(r.price) : 'Consultar'}
                              {overBudget && <small> acima do teto</small>}
                            </span>
                            <div className="gt-row" style={{ gap: '0.4rem' }}>
                              {r.url && (
                                <a href={r.url} target="_blank" rel="noopener noreferrer sponsored" className="gt-btn gt-btn-light gt-btn-sm" aria-label="Abrir no site original">
                                  <ExternalLink size={13} />
                                </a>
                              )}
                              <button type="button" className="gt-btn gt-btn-dark gt-btn-sm" onClick={() => saveResult(r)} disabled={saved[r.id]}>
                                {saved[r.id] ? <><Check size={13} /> Guardado</> : <><Plus size={13} /> Caixa</>}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
"""

# ==============================================================================
# 6. ESTILOS DE RESULTADOS: src/styles/Discover.module.css
# ==============================================================================
CSS_DISCOVER = """/* ==============================================================================
   GARIMPATRIP - TELA DE DESCOBRIR (RESULTADOS)
   Barra de busca Bento unificada com a Home + Seções de Resultados
   ============================================================================== */

.header {
  margin-bottom: 2rem;
}

/* Container Bento da barra de busca */
.searchBar {
  background-color: var(--bg-sand-50, #FAF7F2);
  border: 1.5px solid var(--bg-sand-300, #CFC7B9);
  border-radius: var(--radius-bento, 18px);
  padding: 1.25rem;
  box-shadow: var(--shadow-lg, 0 10px 25px -5px rgba(26, 24, 22, 0.08));
  margin-bottom: 2rem;
}

[data-theme="dark"] .searchBar,
body.dark .searchBar {
  background-color: #24201C;
  border-color: #4A443D;
}

.searchForm {
  display: grid;
  grid-template-columns: 1.25fr 1.25fr 0.95fr 0.85fr auto;
  gap: 0.85rem;
  align-items: center;
}

/* Card individual de input */
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

[data-theme="dark"] .textInput,
body.dark .textInput {
  color: #FAF7F2;
}

/* Botão Garimpar */
.searchBtn {
  height: 54px;
  background-color: #1A1816;
  color: #FFFFFF;
  font-size: 0.95rem;
  font-weight: 800;
  border-radius: 12px;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.15s ease, transform 0.15s ease;
  border: 1.5px solid #1A1816;
  cursor: pointer;
  white-space: nowrap;
}

.searchBtn:hover {
  background-color: #332D27;
  transform: translateY(-1px);
}

/* Barra de vínculo com a Viagem */
.tripBar {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.inlineLink {
  color: var(--brand-amber, #D97706);
  font-weight: 700;
  text-decoration: underline;
  font-size: inherit;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

/* Seções de Resultados */
.sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background-color: var(--bg-sand-50, #FAF7F2);
  border: 1.5px solid var(--bg-sand-300, #CFC7B9);
  border-radius: var(--radius-bento, 18px);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

[data-theme="dark"] .section,
body.dark .section {
  background-color: #24201C;
  border-color: #4A443D;
}

.sectionHead {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sectionIcon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sectionTitle {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--brand-dark, #1A1816);
  flex: 1;
}

[data-theme="dark"] .sectionTitle,
body.dark .sectionTitle {
  color: #FAF7F2;
}

.moreLink {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--brand-amber, #D97706);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  text-decoration: none;
}

.moreLink:hover {
  text-decoration: underline;
}

.loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted, #5C564E);
  font-size: 0.9rem;
  padding: 1rem 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.15rem;
}

.result {
  background-color: #FFFFFF;
  border: 1.5px solid var(--bg-sand-300, #CFC7B9);
  border-radius: var(--radius-card, 14px);
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(26, 24, 22, 0.05));
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

[data-theme="dark"] .result,
body.dark .result {
  background-color: #2C2824;
  border-color: #4A443D;
}

.result:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(26, 24, 22, 0.08));
  border-color: rgba(26, 24, 22, 0.28);
}

.source {
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-pill, 9999px);
  text-transform: uppercase;
  background-color: #E0F2FE;
  color: #0369A1;
  letter-spacing: 0.02em;
}

.resultTitle {
  font-size: 1rem;
  font-weight: 800;
  color: var(--brand-dark, #1A1816);
  line-height: 1.35;
}

[data-theme="dark"] .resultTitle,
body.dark .resultTitle {
  color: #FAF7F2;
}

.resultDesc {
  font-size: 0.84rem;
  color: var(--text-muted, #5C564E);
  flex: 1;
  line-height: 1.45;
}

.resultFooter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--bg-sand-200, #DFD8CC);
  margin-top: auto;
}

[data-theme="dark"] .resultFooter,
body.dark .resultFooter {
  border-color: #4A443D;
}

.price {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--success, #059669);
}

.priceOver {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--danger, #DC2626);
}

.priceOver small {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
}

/* Responsividade da Barra de Busca e Resultados */
@media (max-width: 1080px) {
  .searchForm {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .searchBtn {
    grid-column: 1 / -1;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .searchForm {
    grid-template-columns: 1fr;
  }

  .searchBar {
    padding: 1rem;
  }

  .results {
    grid-template-columns: 1fr;
  }
}
"""

def main():
    print("=" * 65)
    print("  GarimpaTrip - Atualização: Autocomplete e Barra Bento")
    print("=" * 65)
    check_project_root()

    # 1. Rota de API /api/autocomplete
    backup_and_write("src/app/api/autocomplete/route.ts", API_AUTOCOMPLETE)

    # 2. Estilos do Autocomplete
    backup_and_write("src/styles/Autocomplete.module.css", CSS_AUTOCOMPLETE)

    # 3. Componente AutocompleteInput
    backup_and_write("src/components/search/AutocompleteInput.tsx", COMPONENT_AUTOCOMPLETE)

    # 4. HeroSearch (Home)
    backup_and_write("src/components/home/HeroSearch.tsx", HERO_SEARCH)

    # 5. DiscoverClient (Resultados)
    backup_and_write("src/components/discover/DiscoverClient.tsx", DISCOVER_CLIENT)

    # 6. Discover.module.css
    backup_and_write("src/styles/Discover.module.css", CSS_DISCOVER)

    print("=" * 65)
    print("✨ Sucesso! Tudo pronto para rodar:")
    print("   1. Teste localmente: npm run dev")
    print("   2. Digite 'san jose' na barra de busca (Home ou Resultados).")
    print("   3. Selecione 'San José, Costa Rica (SJO)' no dropdown.")
    print("=" * 65)

if __name__ == "__main__":
    main()
