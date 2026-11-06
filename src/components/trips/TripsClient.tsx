'use client';
// Minhas Viagens: o limite de viagens ativas é garantido pelo banco (trigger enforce_trip_limit).
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Save, Sparkles, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { LoginRequired } from '@/components/LoginRequired';
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

const EMPTY_FORM = { title: '', origin: '', destination: '', start: '', end: '', travelers: '1', budget: '', flexible: false };

export function TripsClient() {
  const { supabase, user, loading: authLoading, configured, signIn } = useAuth();
  const { trips, reload, loading } = useTrips(supabase, user);
  const [maxTrips, setMaxTrips] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<Record<string, Partial<Trip>>>({});
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !user) return;
    supabase.from('profiles').select('max_trips').eq('id', user.id).maybeSingle().then(({ data }) => {
      setMaxTrips(data?.max_trips ?? 5);
    });
  }, [supabase, user]);

  const activeCount = trips.filter((t) => t.status !== 'arquivado').length;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setError(null);
    setOk(null);
    if (form.start && form.end && form.end < form.start) return setError('A data de volta precisa ser depois da ida.');
    const { error: err } = await supabase.from('trips').insert({
      user_id: user.id,
      title: (form.title.trim() || `Viagem para ${cityName(form.destination)}`).slice(0, 150),
      origin_city: cityName(form.origin).slice(0, 100),
      origin_iata: extractIata(form.origin),
      destination_city: cityName(form.destination).slice(0, 100),
      destination_iata: extractIata(form.destination),
      start_date: form.start || null,
      end_date: form.end || null,
      is_flexible_dates: form.flexible,
      travelers_count: Math.min(50, Math.max(1, Number(form.travelers) || 1)),
      budget_limit: parseMoney(form.budget) ?? 0,
    });
    if (err) return setError(err.message);
    setForm(EMPTY_FORM);
    setOk('Viagem criada!');
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
    setOk('Alterações salvas.');
    reload();
  };

  const remove = async (trip: Trip) => {
    if (!supabase) return;
    if (!window.confirm(`Excluir "${trip.title}"? Todos os itens da Caixa, do Pacote e do cronograma desta viagem serão apagados.`)) return;
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
          <div style={{ marginTop: '1.5rem' }}><LoginRequired configured={configured} onLogin={signIn} /></div>
        </div>
      </main>
    );
  }

  return (
    <main className="gt-page">
      <div className="gt-container">
        <span className="gt-badge" style={{ background: 'var(--cat-tour-bg)', borderColor: 'var(--cat-tour-border)', color: 'var(--cat-tour-text)' }}>
          Seu painel
        </span>
        <h1 className="gt-title">Minhas Viagens</h1>
        <p className="gt-subtitle">
          {maxTrips !== null ? `${activeCount} de ${maxTrips} viagens ativas. ` : ''}Arquive viagens antigas para liberar espaço para novas.
        </p>

        {error && <div className="gt-error" style={{ margin: '1rem 0' }}>{error}</div>}
        {ok && <div className="gt-success" style={{ margin: '1rem 0' }}>{ok}</div>}

        <form className={styles.form} onSubmit={create}>
          <h2 className={styles.formTitle}>Nova viagem</h2>
          <div className={styles.formGrid}>
            <label className="gt-label">Nome (opcional)<input className="gt-input" value={form.title} maxLength={150} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Férias de verão" /></label>
            <label className="gt-label">Origem<input className="gt-input" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="São Paulo (GRU)" required /></label>
            <label className="gt-label">Destino<input className="gt-input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Salvador (SSA)" required /></label>
            <label className="gt-label">Ida<input className="gt-input" type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
            <label className="gt-label">Volta<input className="gt-input" type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label>
            <label className="gt-label">Viajantes<input className="gt-input" type="number" min={1} max={50} value={form.travelers} onChange={(e) => setForm({ ...form, travelers: e.target.value })} /></label>
            <label className="gt-label">Teto (R$)<input className="gt-input" inputMode="decimal" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="3500" /></label>
            <label className={styles.checkbox}><input type="checkbox" checked={form.flexible} onChange={(e) => setForm({ ...form, flexible: e.target.checked })} /> Datas flexíveis</label>
          </div>
          <button type="submit" className="gt-btn gt-btn-dark"><Plus size={16} /> Criar viagem</button>
        </form>

        {loading && trips.length === 0 && <p className="gt-muted">Carregando…</p>}
        {!loading && trips.length === 0 && <div className="gt-notice">Nenhuma viagem ainda. Crie a primeira acima.</div>}

        <div className={styles.list}>
          {trips.map((t) => {
            const draft = { ...t, ...editing[t.id] };
            const dirty = Boolean(editing[t.id]);
            return (
              <article key={t.id} className={`${styles.trip} ${t.status === 'arquivado' ? styles.archived : ''}`}>
                <div className={styles.tripHead}>
                  <input className={styles.tripTitle} value={draft.title} maxLength={150} onChange={(e) => edit(t.id, { title: e.target.value })} aria-label="Nome da viagem" />
                  <select className={`gt-input ${styles.status}`} value={draft.status} onChange={(e) => edit(t.id, { status: e.target.value as TripStatus })} aria-label="Status">
                    {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <p className={styles.route}>
                  {t.origin_city}{t.origin_iata ? ` (${t.origin_iata})` : ''} ➔ {t.destination_city}{t.destination_iata ? ` (${t.destination_iata})` : ''}
                </p>
                <div className={styles.tripGrid}>
                  <label className="gt-label">Ida<input className="gt-input" type="date" value={draft.start_date ?? ''} onChange={(e) => edit(t.id, { start_date: e.target.value || null })} /></label>
                  <label className="gt-label">Volta<input className="gt-input" type="date" value={draft.end_date ?? ''} onChange={(e) => edit(t.id, { end_date: e.target.value || null })} /></label>
                  <label className="gt-label">Viajantes<input className="gt-input" type="number" min={1} max={50} value={draft.travelers_count} onChange={(e) => edit(t.id, { travelers_count: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })} /></label>
                  <label className="gt-label">Teto (R$)<input className="gt-input" type="number" min={0} step="0.01" value={draft.budget_limit} onChange={(e) => edit(t.id, { budget_limit: Number(e.target.value) || 0 })} /></label>
                </div>
                <p className="gt-muted">
                  {formatDate(t.start_date)} a {formatDate(t.end_date)} · Teto {Number(t.budget_limit) > 0 ? formatBRL(t.budget_limit) : 'não definido'}
                </p>
                <div className={styles.tripActions}>
                  <Link href={`/box?trip=${t.id}`} className="gt-btn gt-btn-light gt-btn-sm"><Sparkles size={13} /> Caixa</Link>
                  <Link href={`/package?trip=${t.id}`} className="gt-btn gt-btn-light gt-btn-sm"><Briefcase size={13} /> Pacote</Link>
                  <span style={{ flex: 1 }} />
                  {dirty && <button type="button" className="gt-btn gt-btn-yellow gt-btn-sm" onClick={() => save(t)}><Save size={13} /> Salvar</button>}
                  <button type="button" className="gt-btn gt-btn-danger gt-btn-sm" onClick={() => remove(t)} aria-label="Excluir viagem"><Trash2 size={13} /></button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
