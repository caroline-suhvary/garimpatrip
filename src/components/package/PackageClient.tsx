'use client';
// Pacote Oficial: as 10 áreas da viagem. Áreas 1–7 e 10 guardam itens com custo e status,
// a área 8 é o cronograma diário e a área 9 consolida o orçamento.
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { TripPicker } from '@/components/TripPicker';
import { LoginRequired } from '@/components/LoginRequired';
import { PackageItemRow } from '@/components/package/PackageItemRow';
import { ScheduleArea } from '@/components/package/ScheduleArea';
import { BudgetArea } from '@/components/package/BudgetArea';
import { CurrencyRates } from '@/components/package/CurrencyRates';
import { ConsolidatedTripMap } from '@/components/package/ConsolidatedTripMap';
import { TravelDocumentsPanel } from '@/components/package/TravelDocumentsPanel';
import { BoxClient } from '@/components/box/BoxClient';
import { PACKAGE_CATEGORIES } from '@/lib/categories';
import { summarizeBudget } from '@/lib/budget';
import { formatBRL, formatDate, parseMoney } from '@/lib/format';
import type { PackageItem, ScheduleItem } from '@/types';
import styles from '@/styles/Package.module.css';

export function PackageClient({ initialTripId }: { initialTripId?: string }) {
  const { supabase, user, loading: authLoading, configured, signIn } = useAuth();
  const { trips, selectedTrip, selectedId, setSelectedId, reload, loading: tripsLoading } = useTrips(supabase, user, initialTripId);
  const [items, setItems] = useState<PackageItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, { title: string; cost: string }>>({});
  const [budgetDraft, setBudgetDraft] = useState('0');
  const [showDiscoveryBox, setShowDiscoveryBox] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !selectedId) {
      setItems([]);
      setSchedule([]);
      return;
    }
    const [pi, si] = await Promise.all([
      supabase.from('package_items').select('*').eq('trip_id', selectedId).order('created_at'),
      supabase.from('schedule_items').select('*').eq('trip_id', selectedId).order('day_number').order('start_time', { nullsFirst: true }),
    ]);
    if (pi.error || si.error) setError((pi.error ?? si.error)!.message);
    setItems((pi.data ?? []) as PackageItem[]);
    setSchedule((si.data ?? []) as ScheduleItem[]);
  }, [supabase, selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setBudgetDraft(String(selectedTrip?.budget_limit ?? 0));
  }, [selectedTrip?.id, selectedTrip?.budget_limit]);

  const updateItem = async (id: string, patch: Partial<PackageItem>) => {
    if (!supabase) return;
    const { error: err } = await supabase.from('package_items').update(patch).eq('id', id);
    if (err) return setError(err.message);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const saveBudget = async () => {
    if (!supabase || !selectedTrip) return;
    const value = Number(String(budgetDraft).replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) return setError('Informe um teto válido, igual ou maior que zero.');
    const { error: err } = await supabase.from('trips').update({ budget_limit: value }).eq('id', selectedTrip.id);
    if (err) return setError(err.message);
    setError(null);
    await reload();
  };

  const deleteItem = async (id: string) => {
    if (!supabase) return;
    const { error: err } = await supabase.from('package_items').delete().eq('id', id);
    if (err) return setError(err.message);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addItem = async (categoryId: number) => {
    const draft = drafts[categoryId];
    if (!supabase || !selectedId || !draft?.title.trim()) return;
    const { data, error: err } = await supabase
      .from('package_items')
      .insert({ trip_id: selectedId, category_id: categoryId, title: draft.title.trim().slice(0, 200), estimated_cost: parseMoney(draft.cost) ?? 0 })
      .select('*')
      .single();
    if (err) return setError(err.message);
    setItems((prev) => [...prev, data as PackageItem]);
    setDrafts((prev) => ({ ...prev, [categoryId]: { title: '', cost: '' } }));
  };

  if (!authLoading && !user) {
    return (
      <main className="gt-page">
        <div className="gt-container">
          <h1 className="gt-title">Meu Pacote (10 Áreas)</h1>
          <div style={{ marginTop: '1.5rem' }}><LoginRequired configured={configured} onLogin={signIn} /></div>
        </div>
      </main>
    );
  }

  const summary = summarizeBudget(items, Number(selectedTrip?.budget_limit ?? 0));

  return (
    <main className="gt-page">
      <div className="gt-container">
        <div className={styles.header}>
          <span className="gt-badge" style={{ background: 'var(--cat-budget-bg)', borderColor: 'var(--cat-budget-border)', color: 'var(--cat-budget-text)' }}>
            Pacote Oficial
          </span>
          <h1 className="gt-title">Meu Pacote{selectedTrip ? `: ${selectedTrip.destination_city}` : ' (10 Áreas)'}</h1>
          <p className="gt-subtitle">Tudo que foi decidido para a viagem, organizado nas 10 áreas, com custos, status de reserva e roteiro diário.</p>
        </div>

        <div className={styles.toolbar}>
          <TripPicker trips={trips} selectedId={selectedId} onChange={setSelectedId} loading={tripsLoading} />
          {selectedTrip && (
            <button type="button" className="gt-btn gt-btn-light" onClick={() => setShowDiscoveryBox((value) => !value)}><Sparkles size={14} /> {showDiscoveryBox ? 'Fechar triagem' : 'Triagem de descobertas'}</button>
          )}
        </div>

        {error && <div className="gt-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {selectedTrip && <ConsolidatedTripMap items={items} schedule={schedule} />}

        {selectedTrip && (
          <>
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Rota</span>
                <strong>{selectedTrip.origin_city} ➔ {selectedTrip.destination_city}</strong>
                <span className="gt-muted">{formatDate(selectedTrip.start_date)} a {formatDate(selectedTrip.end_date)} · {selectedTrip.travelers_count} viajante(s)</span>
              </div>
              <div className={styles.summaryItem}>
                <label className={styles.summaryLabel} htmlFor="trip-budget-limit">Teto do orçamento (R$)</label>
                <div className={styles.budgetEditor}>
                  <input id="trip-budget-limit" className="gt-input" type="number" min="0" step="0.01" value={budgetDraft} onChange={(e) => setBudgetDraft(e.target.value)} onBlur={saveBudget} aria-label="Editar teto do orçamento" />
                  <button type="button" className="gt-btn gt-btn-light gt-btn-sm" onClick={saveBudget}>Salvar</button>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total previsto</span>
                <strong className={summary.overBudget ? styles.over : ''}>{formatBRL(summary.projectedTotal)}</strong>
                {Number(selectedTrip.budget_limit) > 0 && (
                  <span className={summary.overBudget ? styles.over : 'gt-muted'}>
                    {summary.overBudget ? `${formatBRL(-summary.remaining)} acima do teto` : `${formatBRL(summary.remaining)} disponíveis`}
                  </span>
                )}
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Já pago</span>
                <strong className={styles.paid}>{formatBRL(summary.paidTotal)}</strong>
              </div>
            </div>

            <div className={styles.areas}>
              {PACKAGE_CATEGORIES.map((cat) => {
                const areaItems = items.filter((i) => i.category_id === cat.id);
                const draft = drafts[cat.id] ?? { title: '', cost: '' };
                const wide = cat.id === 8 || cat.id === 9;
                return (
                  <section
                    key={cat.id}
                    id={`area-${cat.id}`}
                    className={`${styles.area} ${wide ? styles.areaWide : ''}`}
                    style={{ borderTopColor: cat.border }}
                  >
                    <div className={styles.areaHead}>
                      <span className={styles.areaNumber} style={{ background: cat.bg, color: cat.color }}>{cat.id}</span>
                      <div>
                        <h2 className={styles.areaTitle}>{cat.title}</h2>
                        <p className={styles.areaDesc}>{cat.description}</p>
                      </div>
                      {cat.id !== 8 && cat.id !== 9 && areaItems.length > 0 && (
                        <span className={styles.areaTotal}>{formatBRL(summary.byCategory[cat.id] ?? 0)}</span>
                      )}
                    </div>

                    {cat.id === 5 && selectedTrip && <TravelDocumentsPanel trip={selectedTrip} />}
                    {cat.id === 7 && <CurrencyRates />}
                    {cat.id === 8 && supabase && (
                      <ScheduleArea supabase={supabase} trip={selectedTrip} items={schedule} onChange={setSchedule} onError={setError} />
                    )}
                    {cat.id === 9 && <BudgetArea summary={summary} budgetLimit={Number(selectedTrip.budget_limit)} />}

                    {cat.id !== 8 && cat.id !== 9 && (
                      <>
                        <div className={styles.itemList}>
                          {areaItems.length === 0 && <p className={styles.empty}>Nenhum item ainda.</p>}
                          {areaItems.map((it) => (
                            <PackageItemRow key={it.id} item={it} onUpdate={updateItem} onDelete={deleteItem} />
                          ))}
                        </div>
                        <form
                          className={styles.addForm}
                          onSubmit={(e) => {
                            e.preventDefault();
                            addItem(cat.id);
                          }}
                        >
                          <input
                            className="gt-input"
                            placeholder={cat.id === 10 ? 'Ex.: Contratar seguro viagem' : 'Novo item'}
                            value={draft.title}
                            maxLength={200}
                            onChange={(e) => setDrafts((p) => ({ ...p, [cat.id]: { ...draft, title: e.target.value } }))}
                          />
                          <input
                            className={`gt-input ${styles.costInput}`}
                            placeholder="R$"
                            inputMode="decimal"
                            value={draft.cost}
                            onChange={(e) => setDrafts((p) => ({ ...p, [cat.id]: { ...draft, cost: e.target.value } }))}
                          />
                          <button type="submit" className="gt-btn gt-btn-dark gt-btn-sm" aria-label="Adicionar item"><Plus size={14} /></button>
                        </form>
                      </>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
        {showDiscoveryBox && selectedTrip && (
          <section className={styles.discoveryPanel} aria-label="Triagem de descobertas da viagem">
            <h2>Caixa de Descobertas · {selectedTrip.destination_city}</h2>
            <p className="gt-muted">Guarde ideias e transfira achados para uma das áreas do pacote.</p>
            <BoxClient initialTripId={selectedTrip.id} embedded />
          </section>
        )}
      </div>
    </main>
  );
}
