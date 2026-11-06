'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Building2, Ticket, Car, Globe, Search, ExternalLink, Plus, Check, Loader2, BookmarkPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { TripPicker } from '@/components/TripPicker';
import { cityName, extractIata } from '@/lib/iata';
import { formatBRL, parseMoney } from '@/lib/format';
import type { SearchResponse, SearchResult } from '@/types';
import styles from '@/styles/Discover.module.css';

const SECTIONS = [
  { key: 'flights', title: 'Voos (Travelpayouts)', icon: Plane, color: 'var(--cat-flight-text)', bg: 'var(--cat-flight-bg)' },
  { key: 'hotels', title: 'Hospedagens proximas', icon: Building2, color: 'var(--cat-hotel-text)', bg: 'var(--cat-hotel-bg)' },
  { key: 'tours', title: 'Passeios & Atracoes', icon: Ticket, color: 'var(--cat-tour-text)', bg: 'var(--cat-tour-bg)' },
  { key: 'transport', title: 'Deslocamento Local', icon: Car, color: 'var(--cat-transport-text)', bg: 'var(--cat-transport-bg)' },
  { key: 'web', title: 'Ideias da Web & Garimpo Livre', icon: Globe, color: 'var(--cat-food-text)', bg: 'var(--cat-food-bg)' },
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
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  const budgetNumber = parseMoney(budget);

  const trackOutboundClick = (provider: string, url: string, title?: string) => {
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        action: 'click_partner',
        destination: searched.destination || destination,
        metadata: { url, title },
      }),
    }).catch(() => {});
  };

  const runSearch = useCallback(async (o: string, d: string, m: string) => {
    if (!d) return;
    setMessage(null);
    const params = new URLSearchParams({ origin: o, destination: d });
    if (m) params.set('month', m);

    setSections(Object.fromEntries(SECTIONS.map((s) => [s.key, { loading: true }])) as Record<SectionKey, SectionState>);
    await Promise.all(
      SECTIONS.map(async (s) => {
        try {
          const res = await fetch(`/api/discover/${s.key}?${params}`);
          const data = (await res.json()) as SearchResponse & { error?: string };
          setSections((prev) => ({
            ...prev,
            [s.key]: res.ok ? { loading: false, data } : { loading: false, error: data.error ?? 'Erro na busca.' },
          }));
        } catch {
          setSections((prev) => ({ ...prev, [s.key]: { loading: false, error: 'Falha de conexao.' } }));
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
    setMessage({ type: 'ok', text: `Viagem para ${cityName(dest)} criada! Agora e so guardar os achados.` });
  };

  const saveResult = async (r: SearchResult) => {
    if (!supabase || !user) return signIn();
    if (!selectedTrip) return setMessage({ type: 'error', text: 'Crie ou escolha uma viagem antes de guardar itens.' });
    const { error } = await supabase.from('discoveries').insert({
      trip_id: selectedTrip.id,
      user_id: user.id,
      title: r.title,
      category: r.category,
      description: r.description,
      source_type: r.source_type,
      external_url: r.url,
      estimated_price: r.price,
      currency: r.currency,
      raw_payload: r.raw,
    });
    if (error) return setMessage({ type: 'error', text: error.message });
    setSaved((prev) => ({ ...prev, [r.id]: true }));
    setMessage({ type: 'ok', text: `"${r.title}" foi para a sua Caixa de Descobertas!` });
  };

  const saveManualWebIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return signIn();
    if (!selectedTrip) return setMessage({ type: 'error', text: 'Escolha uma viagem acima antes de guardar itens.' });
    if (!manualTitle.trim()) return setMessage({ type: 'error', text: 'De um titulo ou nome para o que voce encontrou.' });

    setManualSaving(true);
    const manualItem: SearchResult = {
      id: `manual-${Date.now()}`,
      category: 'web_idea',
      source_type: 'manual',
      source: 'Garimpo Livre',
      title: manualTitle.trim(),
      description: manualUrl ? `Link salvo da web: ${manualUrl}` : 'Anotacao de garimpo livre na web',
      price: null,
      currency: 'BRL',
      url: manualUrl.trim() || null,
      raw: { manual: true, url: manualUrl.trim() },
    };

    await saveResult(manualItem);
    setManualTitle('');
    setManualUrl('');
    setManualSaving(false);
  };

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

        <form className={styles.searchForm} onSubmit={onSubmit}>
          <label className="gt-label">Origem<input className="gt-input" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Sao Paulo (GRU)" /></label>
          <label className="gt-label">Destino<input className="gt-input" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Salvador (SSA)" required /></label>
          <label className="gt-label">Mes da ida<input className="gt-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
          <label className="gt-label">Teto (R$)<input className="gt-input" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="3500" /></label>
          <button type="submit" className="gt-btn gt-btn-dark"><Search size={16} /> Garimpar</button>
        </form>

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
              Voce pode pesquisar a vontade. Para guardar itens na Caixa de Descobertas,{' '}
              <button type="button" className={styles.inlineLink} onClick={signIn}>entre com Google</button>.
            </div>
          )}
        </div>

        {message && <div className={message.type === 'ok' ? 'gt-success' : 'gt-error'} style={{ marginBottom: '1.5rem' }}>{message.text}</div>}

        {!searched.destination && <div className="gt-notice">Digite um destino e clique em Garimpar para comecar.</div>}

        {searched.destination && (
          <div className={styles.sections}>
            {SECTIONS.map((s) => {
              const st = sections[s.key];
              const Icon = s.icon;
              const isWeb = s.key === 'web';
              const isDegraded = isWeb && (st?.data?.degraded || (st?.data?.results?.length === 0 && !st?.loading));

              return (
                <section key={s.key} className={styles.section}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionIcon} style={{ background: s.bg, color: s.color }}><Icon size={18} /></span>
                    <h2 className={styles.sectionTitle}>{s.title}</h2>
                    {st?.data?.moreUrl && (
                      <a
                        href={st.data.moreUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className={styles.moreLink}
                        onClick={() => trackOutboundClick(s.key, st.data!.moreUrl!)}
                      >
                        Ver mais no parceiro <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {st?.loading && <div className={styles.loading}><Loader2 size={18} className={styles.spin} /> Garimpando...</div>}
                  {st?.error && <div className="gt-error">{st.error}</div>}
                  {st?.data?.notice && <div className="gt-notice">{st.data.notice}</div>}

                  {isWeb && isDegraded && (
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--bg-sand-300)',
                      borderRadius: 'var(--radius-bento)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--brand-dark)' }}>
                          Pesquise agora em nova aba e cole o link do que gostar:
                        </strong>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          <a
                            href={st?.data?.fallbackUrls?.google ?? `https://www.google.com/search?q=o+que+fazer+em+${encodeURIComponent(cityName(searched.destination))}+dicas`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gt-btn gt-btn-light gt-btn-sm"
                            onClick={() => trackOutboundClick('google_fallback', 'https://google.com')}
                          >
                            Abrir no Google <ExternalLink size={12} />
                          </a>
                          <a
                            href={st?.data?.fallbackUrls?.brave ?? `https://search.brave.com/search?q=o+que+fazer+em+${encodeURIComponent(cityName(searched.destination))}+dicas`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gt-btn gt-btn-light gt-btn-sm"
                            onClick={() => trackOutboundClick('brave_fallback', 'https://search.brave.com')}
                          >
                            Abrir no Brave <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>

                      {user ? (
                        <form onSubmit={saveManualWebIdea} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                          <label className="gt-label" style={{ margin: 0 }}>
                            Nome do lugar ou dica
                            <input
                              className="gt-input"
                              placeholder="Ex.: Sorveteria da Ribeira ou Museu de Arte"
                              value={manualTitle}
                              onChange={(e) => setManualTitle(e.target.value)}
                              required
                            />
                          </label>
                          <label className="gt-label" style={{ margin: 0 }}>
                            Link encontrado (opcional)
                            <input
                              className="gt-input"
                              placeholder="https://exemplo.com/dica"
                              value={manualUrl}
                              onChange={(e) => setManualUrl(e.target.value)}
                            />
                          </label>
                          <button type="submit" className="gt-btn gt-btn-dark" disabled={manualSaving}>
                            {manualSaving ? <Loader2 size={14} className={styles.spin} /> : <BookmarkPlus size={14} />}
                            Guardar na Caixa
                          </button>
                        </form>
                      ) : (
                        <div className="gt-notice" style={{ margin: 0 }}>
                          Entre com o Google acima para colar seus links e notas direto na Caixa de Descobertas.
                        </div>
                      )}
                    </div>
                  )}

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
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer sponsored"
                                  className="gt-btn gt-btn-light gt-btn-sm"
                                  aria-label="Abrir no site original"
                                  onClick={() => trackOutboundClick(r.source, r.url!, r.title)}
                                >
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
