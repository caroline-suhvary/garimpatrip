'use client';
// Radar: escolhe uma rota monitorada, calcula métricas e desenha o gráfico em CSS puro.
// Usuários logados podem criar até 3 alertas de preço (limite garantido pelo banco).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Database, Info, BellPlus, Trash2, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { computeRadarStats, buildHolidayChart, barHeightPct } from '@/lib/radar';
import { formatBRL, parseMoney, shortDayMonth } from '@/lib/format';
import type { CalendarDay, MonitoredRoute, PriceRecord, UserAlert } from '@/types';
import styles from '@/styles/Radar.module.css';

export function RadarClient({ lookerUrl }: { lookerUrl: string }) {
  const { supabase, user, configured, signIn } = useAuth();
  const [routes, setRoutes] = useState<MonitoredRoute[]>([]);
  const [routeId, setRouteId] = useState('');
  const [records, setRecords] = useState<PriceRecord[]>([]);
  const [cheapest, setCheapest] = useState<PriceRecord[]>([]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertForm, setAlertForm] = useState({ origin: '', destination: '', target: '', month: '' });
  const [alertMsg, setAlertMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // 1) Rotas monitoradas (leitura pública)
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from('monitored_routes')
      .select('*')
      .eq('is_active', true)
      .order('is_base_route', { ascending: false })
      .order('route_name')
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        const list = (data ?? []) as MonitoredRoute[];
        setRoutes(list);
        setRouteId((cur) => cur || list[0]?.id || '');
        if (list.length === 0) setLoading(false);
      });
  }, [supabase]);

  // 2) Histórico da rota escolhida
  useEffect(() => {
    if (!supabase || !routeId) return;
    setLoading(true);
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const since2y = new Date(Date.now() - 730 * 86_400_000).toISOString();
    Promise.all([
      supabase.from('price_history').select('flight_date, price, airline, stops, recorded_at')
        .eq('route_id', routeId).gte('recorded_at', since30).order('recorded_at', { ascending: false }).limit(1000),
      supabase.from('price_history').select('flight_date, price, airline, stops, recorded_at')
        .eq('route_id', routeId).gte('recorded_at', since2y).order('price', { ascending: true }).limit(1),
    ]).then(async ([recent, cheapest]) => {
      if (recent.error) setError(recent.error.message);
      setRecords((recent.data ?? []) as PriceRecord[]);
      setCheapest((cheapest.data ?? []) as PriceRecord[]);
      const dates = [...new Set(((recent.data ?? []) as PriceRecord[]).map((r) => r.flight_date))].sort();
      if (dates.length) {
        const { data: cal } = await supabase.from('dim_calendar')
          .select('date_day, holiday_name, holiday_type, is_school_vacation, period_classification')
          .gte('date_day', dates[0]).lte('date_day', dates[dates.length - 1]);
        setCalendar((cal ?? []) as CalendarDay[]);
      } else {
        setCalendar([]);
      }
      setLoading(false);
    });
  }, [supabase, routeId]);

  // 3) Alertas do usuário
  const loadAlerts = useCallback(async () => {
    if (!supabase || !user) return setAlerts([]);
    const { data } = await supabase
      .from('user_route_alerts')
      .select('id, route_id, target_price, preferred_month, is_active, monitored_routes(origin_iata, destination_iata, route_name)')
      .order('created_at', { ascending: false });
    setAlerts((data ?? []) as unknown as UserAlert[]);
  }, [supabase, user]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const route = routes.find((r) => r.id === routeId);

  useEffect(() => {
    if (route) setAlertForm((f) => ({ ...f, origin: route.origin_iata, destination: route.destination_iata }));
  }, [route]);

  const stats = useMemo(() => computeRadarStats([...cheapest, ...records]), [cheapest, records]);
  const bars = useMemo(() => buildHolidayChart(records, calendar), [records, calendar]);
  const minBar = bars.length ? Math.min(...bars.map((b) => b.price)) : 0;
  const maxBar = bars.length ? Math.max(...bars.map((b) => b.price)) : 0;

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return signIn();
    const target = parseMoney(alertForm.target);
    if (!target) return setAlertMsg({ type: 'error', text: 'Informe um preço-alvo válido.' });
    const { error: err } = await supabase.rpc('create_route_alert', {
      p_origin: alertForm.origin,
      p_destination: alertForm.destination,
      p_target_price: target,
      p_preferred_month: alertForm.month ? `${alertForm.month}-01` : null,
    });
    if (err) return setAlertMsg({ type: 'error', text: err.message });
    setAlertMsg({ type: 'ok', text: 'Alerta salvo! O robô diário passa a monitorar esta rota.' });
    setAlertForm((f) => ({ ...f, target: '', month: '' }));
    loadAlerts();
  };

  const toggleAlert = async (a: UserAlert) => {
    if (!supabase) return;
    const { error: err } = await supabase.from('user_route_alerts').update({ is_active: !a.is_active }).eq('id', a.id);
    if (err) return setAlertMsg({ type: 'error', text: err.message });
    loadAlerts();
  };

  const deleteAlert = async (id: string) => {
    if (!supabase) return;
    const { error: err } = await supabase.from('user_route_alerts').delete().eq('id', id);
    if (err) return setAlertMsg({ type: 'error', text: err.message });
    loadAlerts();
  };

  return (
    <main className="gt-page">
      <div className={styles.container}>
        {/* CABEÇALHO */}
        <div className={styles.topBar}>
          <div>
            <span className={styles.badge}>Inteligência de Mercado & Tendências</span>
            <h1 className={styles.title}>Radar de Preços Aéreos</h1>
            <p className={styles.subtitle}>
              Monitoramento diário de passagens e histórico acumulado em janela de 2 anos.
              Cruze preços médios com feriados nacionais e sazonalidade turística.
            </p>
          </div>
          <a href={lookerUrl} target="_blank" rel="noopener noreferrer" className={styles.lookerBtn}>
            <Database size={18} />
            <span>Ver no Looker Studio</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {!configured && (
          <div className="gt-notice" style={{ marginBottom: '1.5rem' }}>
            Conecte o Supabase no <code>.env.local</code> para ver os dados reais do Radar.
          </div>
        )}
        {error && <div className="gt-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        {configured && routes.length > 0 && (
          <label className={styles.routePicker}>
            <span>Rota</span>
            <select className="gt-input" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.route_name} ({r.origin_iata} ➔ {r.destination_iata})</option>
              ))}
            </select>
          </label>
        )}

        {configured && !loading && routes.length === 0 && (
          <div className="gt-notice" style={{ marginBottom: '1.5rem' }}>
            Nenhuma rota monitorada ainda. Rode o robô diário uma vez (GitHub → Actions → “Run workflow”) para cadastrar as 15 rotas base.
          </div>
        )}

        {/* CARDS DE MÉTRICAS ANALÍTICAS */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Rota Selecionada</span>
            <h3 className={styles.metricVal}>{route ? `${route.origin_iata} ➔ ${route.destination_iata}` : '—'}</h3>
            <span className={styles.metricNote}>{route?.route_name ?? 'Sem rota'}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Menor Preço Hoje</span>
            <h3 className={`${styles.metricVal} ${styles.metricHighlight}`}>{formatBRL(stats.todayMin)}</h3>
            {stats.diffVsAvgPct !== null && (
              <span className={stats.diffVsAvgPct <= 0 ? styles.metricGood : styles.metricBad}>
                {Math.abs(stats.diffVsAvgPct)}% {stats.diffVsAvgPct <= 0 ? 'abaixo' : 'acima'} da média
              </span>
            )}
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Média Histórica (30d)</span>
            <h3 className={styles.metricVal}>{formatBRL(stats.avg30d)}</h3>
            <span className={styles.metricNote}>{stats.airlines.length ? `Companhias: ${stats.airlines.slice(0, 4).join(', ')}` : 'Aguardando coletas'}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Menor Preço (2 Anos)</span>
            <h3 className={styles.metricVal}>{formatBRL(stats.min2y)}</h3>
            <span className={styles.metricNote}>Desde o início da coleta</span>
          </div>
        </div>

        {/* CARD DO GRÁFICO */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Preço por Data de Voo e Impacto de Feriados</h2>
            <div className={styles.legend}>
              <span className={styles.legendNormal}>Data comum</span>
              <span className={styles.legendHoliday}>Feriado / férias</span>
            </div>
          </div>

          {loading && configured && <p className="gt-muted">Carregando histórico…</p>}
          {!loading && bars.length === 0 && <p className="gt-muted">Ainda não há preços coletados para esta rota.</p>}

          {bars.length > 0 && (
            <div className={styles.chart}>
              {bars.map((d) => (
                <div key={d.date} className={styles.barCol} title={d.label ?? 'Data comum'}>
                  <span className={d.holiday ? styles.barValueHoliday : styles.barValue}>{Math.round(d.price)}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={d.holiday ? styles.barHoliday : styles.bar}
                      style={{ height: `${barHeightPct(d.price, minBar, maxBar)}%` }}
                    />
                  </div>
                  <span className={styles.barLabel}>{shortDayMonth(d.date)}</span>
                </div>
              ))}
            </div>
          )}

          {/* PAINEL DIDÁTICO */}
          <div className={styles.explainBox}>
            <h4 className={styles.explainTitle}>
              <Info size={18} color="#D97706" />
              <span>Como este pipeline de dados opera por trás dos panos</span>
            </h4>
            <p className={styles.explainText}>
              Este painel é alimentado por uma rotina automatizada em <strong>Python</strong> que roda diariamente às 06h UTC via <strong>GitHub Actions</strong> (sem custo de servidor).
              O script consulta as APIs da Travelpayouts e AwesomeAPI para as rotas ativas (com deduplicação: cada rota é consultada uma única vez, não importa quantos usuários a acompanhem),
              cruza as datas de voo com a tabela dimensional <code>dim_calendar</code> (férias escolares e feriados nacionais da BrasilAPI) e grava tudo no <strong>PostgreSQL (Supabase)</strong>,
              com retenção móvel de 2 anos. O mesmo banco pode ser conectado ao <strong>Google Looker Studio</strong> para análises profundas.
            </p>
          </div>
        </div>

        {/* ALERTAS DE PREÇO */}
        <section className={styles.alertsCard}>
          <h2 className={styles.chartTitle}><BellPlus size={20} /> Meus Alertas de Preço</h2>
          {!user ? (
            <div className="gt-notice">
              <button type="button" className={styles.inlineLink} onClick={signIn}>Entre com Google</button> para criar até 3 alertas de preço.
            </div>
          ) : (
            <>
              <form className={styles.alertForm} onSubmit={createAlert}>
                <label className="gt-label">Origem (IATA)<input className="gt-input" value={alertForm.origin} maxLength={3} onChange={(e) => setAlertForm({ ...alertForm, origin: e.target.value.toUpperCase() })} placeholder="GRU" required /></label>
                <label className="gt-label">Destino (IATA)<input className="gt-input" value={alertForm.destination} maxLength={3} onChange={(e) => setAlertForm({ ...alertForm, destination: e.target.value.toUpperCase() })} placeholder="SSA" required /></label>
                <label className="gt-label">Avisar abaixo de (R$)<input className="gt-input" inputMode="decimal" value={alertForm.target} onChange={(e) => setAlertForm({ ...alertForm, target: e.target.value })} placeholder="700" required /></label>
                <label className="gt-label">Mês preferido<input className="gt-input" type="month" value={alertForm.month} onChange={(e) => setAlertForm({ ...alertForm, month: e.target.value })} /></label>
                <button type="submit" className="gt-btn gt-btn-dark"><BellPlus size={14} /> Criar alerta</button>
              </form>
              {alertMsg && <div className={alertMsg.type === 'ok' ? 'gt-success' : 'gt-error'}>{alertMsg.text}</div>}
              {alerts.length === 0 && <p className="gt-muted">Você ainda não tem alertas.</p>}
              <div className={styles.alertList}>
                {alerts.map((a) => {
                  const hit = a.route_id === routeId && stats.todayMin !== null && stats.todayMin <= Number(a.target_price);
                  return (
                    <div key={a.id} className={`${styles.alertItem} ${a.is_active ? '' : styles.alertOff}`}>
                      <strong>{a.monitored_routes ? `${a.monitored_routes.origin_iata} ➔ ${a.monitored_routes.destination_iata}` : 'Rota'}</strong>
                      <span>abaixo de {formatBRL(a.target_price)}</span>
                      {a.preferred_month && <span className="gt-muted">· {a.preferred_month.slice(5, 7)}/{a.preferred_month.slice(0, 4)}</span>}
                      {hit && <span className={styles.hit}>Preço atingido hoje!</span>}
                      <span style={{ flex: 1 }} />
                      <button type="button" className="gt-btn gt-btn-light gt-btn-sm" onClick={() => toggleAlert(a)} title={a.is_active ? 'Desativar' : 'Reativar'}>
                        {a.is_active ? <BellOff size={13} /> : <Bell size={13} />}
                      </button>
                      <button type="button" className="gt-btn gt-btn-danger gt-btn-sm" onClick={() => deleteAlert(a.id)} aria-label="Excluir alerta"><Trash2 size={13} /></button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
