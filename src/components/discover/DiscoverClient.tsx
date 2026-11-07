'use client';
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

interface DiscoverClientProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialBudget?: string;
  initialMonth?: string;
}

export function DiscoverClient({
  initialOrigin,
  initialDestination,
  initialBudget,
  initialMonth,
}: DiscoverClientProps = {}) {
  const { supabase, user, signIn } = useAuth();
  const { trips, selectedTrip, selectedId, setSelectedId, reload, loading: tripsLoading } = useTrips(supabase, user);

  const [origin, setOrigin] = useState(initialOrigin || DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(initialDestination || DEFAULT_DESTINATION);
  const [month, setMonth] = useState(initialMonth || '2026-12');
  const [budget, setBudget] = useState(initialBudget || '3500');

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
          text: 'Sua conta precisa ser sincronizada com o banco. Por favor, execute o script sql/03_fix_profiles_and_trips.sql no Supabase.' 
        });
      }
      return setMessage({ type: 'error', text: error.message });
    }

    if (data?.id) {
      await reload();
      setSelectedId(data.id);
      setMessage({ type: 'ok', text: `Viagem para ${destCity} criada com sucesso e selecionada!` });
    }
  };

  const saveToBox = async (r: SearchResult) => {
    if (!supabase || !user) return signIn();
    if (!selectedId) {
      return setMessage({ type: 'error', text: 'Crie ou selecione uma viagem antes de salvar itens na Caixa.' });
    }

    const { error: err } = await supabase.from('discovery_items').insert({
      trip_id: selectedId,
      user_id: user.id,
      title: r.title.slice(0, 200),
      category: r.category,
      description: r.description,
      source_type: r.source_type,
      external_url: r.url,
      estimated_price: r.price ?? 0,
      currency: 'BRL',
      raw_payload: (r as any).raw || {},
    });

    if (err) return setMessage({ type: 'error', text: err.message });
    setSavedUrls((s) => new Set(s).add(r.url || ''));
    setMessage({ type: 'ok', text: `"${r.title}" guardado na Caixa de Descobertas!` });
  };

  return (
    <main className="gt-page">
      <div className="gt-container">
        
        {/* Cabeçalho */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="gt-badge" style={{ marginBottom: '0.5rem' }}>
            <Compass size={14} /> Garimpar Ofertas & Dicas
          </div>
          <h1 className="gt-title">Descobrir Destinos</h1>
          <p className="gt-subtitle">
            Pesquise voos, estadias e passeios com autocomplete e guarde na sua Caixa de Descobertas.
          </p>
        </div>

        {/* Seletor de Viagem Ativa */}
        <div style={{ marginBottom: '1.5rem' }}>
          <TripPicker
            trips={trips}
            selectedId={selectedId}
            onChange={setSelectedId}
            loading={tripsLoading}
          />
        </div>

        {/* Barra de Pesquisa Bento com Autocomplete */}
        <div className="gt-card" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSearchSubmit}>
            <div className={styles.searchInputsGrid}>
              
              <div className={styles.autocompleteField}>
                <AutocompleteInput
                  id="origem"
                  label="Origem"
                  placeholder="Ex: São Paulo, Rio de Janeiro..."
                  value={origin}
                  onChange={setOrigin}
                />
              </div>

              <div className={styles.autocompleteField}>
                <AutocompleteInput
                  id="destino"
                  label="Destino"
                  placeholder="Ex: Salvador, Buenos Aires, Paris..."
                  value={destination}
                  onChange={setDestination}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className="gt-label">Mês da Viagem</label>
                <input 
                  type="month" 
                  className="gt-input" 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)} 
                />
              </div>

              <div className={styles.field}>
                <label className="gt-label">Teto Orçamento (R$)</label>
                <input 
                  type="text" 
                  className="gt-input" 
                  placeholder="Ex: 3500" 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value)} 
                />
              </div>

            </div>

            <div className={styles.searchActions}>
              <button type="submit" className="gt-btn gt-btn-yellow" disabled={searching}>
                <Search size={16} />
                <span>{searching ? 'Garimpando…' : 'Garimpar Destino'}</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={createTrip}
                  disabled={creatingTrip}
                  className="gt-btn gt-btn-light"
                >
                  <Plus size={16} />
                  <span>{creatingTrip ? 'Criando…' : 'Criar Viagem deste Destino'}</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Mensagens de Feedback */}
        {message && (
          <div 
            className="gt-card" 
            style={{ 
              marginBottom: '1.5rem', 
              borderColor: message.type === 'error' ? '#ef4444' : '#10b981',
              backgroundColor: message.type === 'error' ? '#fef2f2' : '#ecfdf5',
              padding: '1rem' 
            }}
          >
            <p style={{ color: message.type === 'error' ? '#b91c1c' : '#047857', margin: 0, fontWeight: 500 }}>
              {message.text}
            </p>
          </div>
        )}

        {/* Resultados */}
        {searched && (
          <div style={{ marginBottom: '1rem' }}>
            <h2 className="gt-title" style={{ fontSize: '1.25rem' }}>
              Ofertas e Ideias para {searched.destination} ({searched.month})
            </h2>
          </div>
        )}

        {results.length > 0 ? (
          <div className={styles.resultsGrid}>
            {results.map((r, idx) => {
              const saved = savedUrls.has(r.url || '');
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
                      <a href={r.url || '#'} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn-light gt-btn-sm">
                        <ExternalLink size={13} /> Ver oferta
                      </a>
                      {user && (
                        <button
                          type="button"
                          className="gt-btn gt-btn-yellow gt-btn-sm"
                          onClick={() => saveToBox(r)}
                          disabled={saved}
                        >
                          <Plus size={13} /> {saved ? 'Guardado' : 'Guardar na Caixa'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          searched && !searching && (
            <div className="gt-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p className="gt-subtitle">
                Nenhuma oferta encontrada para esta combinação no momento. Tente alterar o mês ou o destino.
              </p>
            </div>
          )
        )}

      </div>
    </main>
  );
}
