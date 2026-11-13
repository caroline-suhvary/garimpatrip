'use client';
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
                    <Link href={`/package?trip=${t.id}`} className="gt-btn gt-btn-dark gt-btn-sm" style={{ fontWeight: 600 }}>
                      <Briefcase size={14} /> Montar / Ver Pacote
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
