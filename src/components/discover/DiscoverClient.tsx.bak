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
