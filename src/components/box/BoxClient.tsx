'use client';
// Caixa de Descobertas: lista o que foi guardado para a viagem, permite adicionar ideias manuais,
// remover itens e transferir os escolhidos para uma das 10 áreas do Pacote Oficial.
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Trash2, ExternalLink, Plus, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { TripPicker } from '@/components/TripPicker';
import { LoginRequired } from '@/components/LoginRequired';
import { DEFAULT_PACKAGE_CATEGORY, ITEM_CATEGORY_IDS, categoryById } from '@/lib/categories';
import { formatBRL, parseMoney } from '@/lib/format';
import type { DiscoveryCategory, DiscoveryItem } from '@/types';
import styles from '@/styles/Box.module.css';

const COLUMNS: { key: string; title: string; categories: DiscoveryCategory[] }[] = [
  { key: 'flights_hotels', title: 'Voos & Hospedagens', categories: ['flight', 'hotel'] },
  { key: 'tours', title: 'Passeios, Deslocamento & Outros', categories: ['tour', 'transport', 'food', 'doc'] },
  { key: 'web_ideas', title: 'Ideias da Web & Anotações', categories: ['web_idea'] },
];

const MANUAL_CATEGORIES: { value: DiscoveryCategory; label: string }[] = [
  { value: 'web_idea', label: 'Ideia / anotação' },
  { value: 'flight', label: 'Voo / ônibus' },
  { value: 'hotel', label: 'Hospedagem' },
  { value: 'tour', label: 'Passeio' },
  { value: 'transport', label: 'Deslocamento local' },
  { value: 'food', label: 'Alimentação' },
  { value: 'doc', label: 'Documentação' },
];

export function BoxClient({ initialTripId }: { initialTripId?: string }) {
  const { supabase, user, loading: authLoading, configured, signIn } = useAuth();
  const { trips, selectedTrip, selectedId, setSelectedId, loading: tripsLoading } = useTrips(supabase, user, initialTripId);
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<{ id: string; categoryId: number } | null>(null);
  const [form, setForm] = useState({ title: '', category: 'web_idea' as DiscoveryCategory, price: '', url: '' });

  const load = useCallback(async () => {
    if (!supabase || !selectedId) {
      setItems([]);
      return;
    }
    const { data, error: err } = await supabase
      .from('discoveries')
      .select('*')
      .eq('trip_id', selectedId)
      .eq('is_transferred_to_package', false)
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setItems((data ?? []) as DiscoveryItem[]);
  }, [supabase, selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  const removeItem = async (id: string) => {
    if (!supabase) return;
    const { error: err } = await supabase.from('discoveries').delete().eq('id', id);
    if (err) return setError(err.message);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const confirmTransfer = async (item: DiscoveryItem, categoryId: number) => {
    if (!supabase) return;
    const { error: insErr } = await supabase.from('package_items').insert({
      trip_id: item.trip_id,
      category_id: categoryId,
      title: item.title,
      estimated_cost: item.estimated_price ?? 0,
      currency: item.currency ?? 'BRL',
      external_url: item.external_url,
      notes: item.description,
      meta_details: { ...(item.raw_payload ?? {}), discovery_id: item.id, source_type: item.source_type },
    });
    if (insErr) return setError(insErr.message);
    const { error: updErr } = await supabase.from('discoveries').update({ is_transferred_to_package: true }).eq('id', item.id);
    if (updErr) return setError(updErr.message);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setTransfer(null);
    setNotice(`"${item.title}" foi para a área ${categoryById(categoryId)?.title}.`);
  };

  const addManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user || !selectedId || !form.title.trim()) return;
    let url: string | null = form.url.trim() || null;
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    const { data, error: err } = await supabase
      .from('discoveries')
      .insert({
        trip_id: selectedId,
        user_id: user.id,
        title: form.title.trim().slice(0, 200),
        category: form.category,
        source_type: 'manual',
        external_url: url,
        estimated_price: parseMoney(form.price) ?? 0,
      })
      .select('*')
      .single();
    if (err) return setError(err.message);
    setItems((prev) => [data as DiscoveryItem, ...prev]);
    setForm({ title: '', category: 'web_idea', price: '', url: '' });
  };

  if (!authLoading && !user) {
    return (
      <main className="gt-page">
        <div className={styles.container}>
          <h1 className={styles.title}>Caixa de Descobertas</h1>
          <div style={{ marginTop: '1.5rem' }}><LoginRequired configured={configured} onLogin={signIn} /></div>
        </div>
      </main>
    );
  }

  const badgeClass = (it: DiscoveryItem) =>
    it.source_type === 'web_result' ? styles.badgeWeb : it.source_type === 'manual' ? styles.badgeManual : styles.badgePartner;

  const sourceLabel = (it: DiscoveryItem) =>
    (it.raw_payload?.source as string | undefined) ?? (it.source_type === 'manual' ? 'Manual' : it.source_type === 'web_result' ? 'Web' : 'Parceiro');

  return (
    <main className="gt-page">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>Espaço Temporário de Triagem</span>
          <h1 className={styles.title}>Caixa de Descobertas{selectedTrip ? `: ${selectedTrip.destination_city}` : ''}</h1>
          <p className={styles.subtitle}>
            Junte opções soltas de voos, hotéis, passeios e ideias da web sem pressa.
            Quando estiver pronto, transfira os itens definitivos para o pacote e cronograma oficial.
          </p>
        </div>

        <div className={styles.toolbar}>
          <TripPicker trips={trips} selectedId={selectedId} onChange={setSelectedId} loading={tripsLoading} />
          <div className="gt-row">
            <Link href="/discover" className="gt-btn gt-btn-light">Garimpar mais</Link>
            {selectedTrip && <Link href={`/package?trip=${selectedTrip.id}`} className="gt-btn gt-btn-dark">Ver Pacote <ArrowRight size={14} /></Link>}
          </div>
        </div>

        {error && <div className="gt-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {notice && <div className="gt-success" style={{ marginBottom: '1rem' }}>{notice}</div>}

        {selectedTrip && (
          <form className={styles.manualForm} onSubmit={addManual}>
            <label className="gt-label">Nova anotação<input className="gt-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Restaurante indicado pela Ana" required maxLength={200} /></label>
            <label className="gt-label">Tipo
              <select className="gt-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as DiscoveryCategory })}>
                {MANUAL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className="gt-label">Preço (R$)<input className="gt-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0,00" inputMode="decimal" /></label>
            <label className="gt-label">Link (opcional)<input className="gt-input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" /></label>
            <button type="submit" className="gt-btn gt-btn-yellow" style={{ height: 40 }}><Plus size={14} /> Adicionar</button>
          </form>
        )}

        {selectedTrip && (
          <div className={styles.columnsGrid}>
            {COLUMNS.map((col) => {
              const colItems = items.filter((i) => col.categories.includes(i.category));
              return (
                <div key={col.key} className={styles.column}>
                  <div className={styles.columnHeader}>
                    <span className={styles.colTitle}>{col.title}</span>
                    <span className={styles.countBadge}>{colItems.length}</span>
                  </div>

                  {colItems.length === 0 && <div className={styles.empty}>Nada por aqui ainda.</div>}

                  {colItems.map((item) => (
                    <div key={item.id} className={styles.cardItem}>
                      <span className={`${styles.sourceBadge} ${badgeClass(item)}`}>{sourceLabel(item)}</span>
                      <h3 className={styles.itemTitle}>{item.title}</h3>
                      {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                      {item.external_url && (
                        <a href={item.external_url} target="_blank" rel="noopener noreferrer" className={styles.linkOut}>
                          <span>Abrir site original</span> <ExternalLink size={12} />
                        </a>
                      )}

                      {transfer?.id === item.id ? (
                        <div className={styles.transferPanel}>
                          <label className="gt-label">Enviar para a área
                            <select className="gt-input" value={transfer.categoryId} onChange={(e) => setTransfer({ id: item.id, categoryId: Number(e.target.value) })}>
                              {ITEM_CATEGORY_IDS.map((id) => <option key={id} value={id}>{id}. {categoryById(id)?.title}</option>)}
                            </select>
                          </label>
                          <div className="gt-row" style={{ gap: '0.5rem' }}>
                            <button type="button" className="gt-btn gt-btn-dark gt-btn-sm" onClick={() => confirmTransfer(item, transfer.categoryId)}>Confirmar</button>
                            <button type="button" className="gt-btn gt-btn-light gt-btn-sm" onClick={() => setTransfer(null)}><X size={12} /> Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.itemFooter}>
                          <span className={styles.price}>{Number(item.estimated_price) > 0 ? formatBRL(item.estimated_price) : 'Sem preço'}</span>
                          <div className={styles.actions}>
                            <button type="button" onClick={() => setTransfer({ id: item.id, categoryId: DEFAULT_PACKAGE_CATEGORY[item.category] })} className={styles.btnTransfer}>
                              <span>Pacote</span> <ArrowRight size={14} />
                            </button>
                            <button type="button" onClick={() => removeItem(item.id)} className={styles.btnRemove} aria-label="Remover">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
