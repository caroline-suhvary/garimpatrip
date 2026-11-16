"use client";
// Radar de Preços: monitoramento diário e histórico acumulado em janela de 2 anos.
// Exibe cards visuais de rotas gerais e as rotas dos pacotes do usuário logado.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Database,
  Bell,
  BellOff,
  Trash2,
  Plane,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  computeRadarStats,
  buildHolidayChart,
  barHeightPct,
} from "@/lib/radar";
import { formatBRL, shortDayMonth } from "@/lib/format";
import type {
  CalendarDay,
  MonitoredRoute,
  PriceRecord,
  UserAlert,
} from "@/types";
import styles from "@/styles/Radar.module.css";

export function RadarClient() {
  const { supabase, user, configured, signIn } = useAuth();
  const [routes, setRoutes] = useState<MonitoredRoute[]>([]);
  const [routeId, setRouteId] = useState("");
  const [records, setRecords] = useState<PriceRecord[]>([]);
  const [cheapest, setCheapest] = useState<PriceRecord[]>([]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originFilter, setOriginFilter] = useState<
    "ALL" | "GRU" | "GIG" | "VCP"
  >("ALL");
  const [alertMsg, setAlertMsg] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  // 1) Rotas monitoradas
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("monitored_routes")
      .select("*")
      .eq("is_active", true)
      .order("is_base_route", { ascending: false })
      .order("route_name")
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        const list = (data ?? []) as MonitoredRoute[];
        setRoutes(list);
        setRouteId((cur) => cur || list[0]?.id || "");
        if (list.length === 0) setLoading(false);
      });
  }, [supabase]);

  // 2) Histórico da rota selecionada
  useEffect(() => {
    if (!supabase || !routeId) return;
    setLoading(true);
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const since2y = new Date(Date.now() - 730 * 86_400_000).toISOString();
    Promise.all([
      supabase
        .from("price_history")
        .select("flight_date, price, airline, stops, recorded_at")
        .eq("route_id", routeId)
        .gte("recorded_at", since30)
        .order("recorded_at", { ascending: false })
        .limit(1000),
      supabase
        .from("price_history")
        .select("flight_date, price, airline, stops, recorded_at")
        .eq("route_id", routeId)
        .gte("recorded_at", since2y)
        .order("price", { ascending: true })
        .limit(1),
    ]).then(async ([recent, cheapest]) => {
      if (recent.error) setError(recent.error.message);
      setRecords((recent.data ?? []) as PriceRecord[]);
      setCheapest((cheapest.data ?? []) as PriceRecord[]);
      const dates = [
        ...new Set(
          ((recent.data ?? []) as PriceRecord[]).map((r) => r.flight_date),
        ),
      ].sort();
      if (dates.length) {
        const { data: cal } = await supabase
          .from("dim_calendar")
          .select(
            "date_day, holiday_name, holiday_type, is_school_vacation, period_classification",
          )
          .gte("date_day", dates[0])
          .lte("date_day", dates[dates.length - 1]);
        setCalendar((cal ?? []) as CalendarDay[]);
      } else {
        setCalendar([]);
      }
      setLoading(false);
    });
  }, [supabase, routeId]);

  // 3) Alertas do usuário logado
  const loadAlerts = useCallback(async () => {
    if (!supabase || !user) return setAlerts([]);
    const { data } = await supabase
      .from("user_route_alerts")
      .select(
        "id, route_id, target_price, preferred_month, is_active, monitored_routes(id, origin_iata, destination_iata, route_name)",
      )
      .order("created_at", { ascending: false });
    setAlerts((data ?? []) as unknown as UserAlert[]);
  }, [supabase, user]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const route = routes.find((r) => r.id === routeId);
  const stats = useMemo(
    () => computeRadarStats([...cheapest, ...records]),
    [cheapest, records],
  );
  const bars = useMemo(
    () => buildHolidayChart(records, calendar),
    [records, calendar],
  );
  const minBar = bars.length ? Math.min(...bars.map((b) => b.price)) : 0;
  const maxBar = bars.length ? Math.max(...bars.map((b) => b.price)) : 0;

  // Filtra as rotas gerais (base) por aeroporto de saída
  const baseRoutes = useMemo(() => {
    const list = routes.filter((r) => r.is_base_route || !r.subscribers_count);
    if (originFilter === "ALL") return list;
    return list.filter((r) => r.origin_iata === originFilter);
  }, [routes, originFilter]);

  const toggleAlert = async (a: UserAlert) => {
    if (!supabase) return;
    const { error: err } = await supabase
      .from("user_route_alerts")
      .update({ is_active: !a.is_active })
      .eq("id", a.id);
    if (err) return setAlertMsg({ type: "error", text: err.message });
    loadAlerts();
  };

  const deleteAlert = async (id: string) => {
    if (!supabase) return;
    const { error: err } = await supabase
      .from("user_route_alerts")
      .delete()
      .eq("id", id);
    if (err) return setAlertMsg({ type: "error", text: err.message });
    loadAlerts();
  };

  return (
    <main className="gt-page">
      <div className={styles.container}>
        {/* CABEÇALHO */}
        <div className={styles.topBar}>
          <div>
            <span className={styles.badge}>
              Inteligência de Mercado & Tendências
            </span>
            <h1 className={styles.title}>Radar de Preços Aéreos</h1>
            <p className={styles.subtitle}>
              Histórico diário de tarifas e oscilações de preços. Clique em
              qualquer rota para analisar os valores e o impacto de feriados.
            </p>
          </div>
        </div>

        {error && (
          <div className="gt-error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        {alertMsg && (
          <div
            className={alertMsg.type === "ok" ? "gt-success" : "gt-error"}
            style={{ marginBottom: "1rem" }}>
            {alertMsg.text}
          </div>
        )}

        {/* SEÇÃO 1: ROTAS DOS MEUS PACOTES (USUÁRIO LOGADO) */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Plane size={20} color="var(--brand-amber)" />
              <span>Minhas Rotas Monitoradas</span>
            </h2>
          </div>

          {!user ? (
            <div className={styles.emptyAlertsCard}>
              <button
                type="button"
                className={styles.inlineLink}
                onClick={signIn}>
                Entre com Google
              </button>{" "}
              para acompanhar até 5 rotas dos seus pacotes de viagem com
              histórico exclusivo.
            </div>
          ) : alerts.length === 0 ? (
            <div className={styles.emptyAlertsCard}>
              Você ainda não possui rotas no seu Radar pessoal. Abra um roteiro
              em{" "}
              <Link href="/package" className={styles.inlineLink}>
                Meu Pacote
              </Link>{" "}
              e clique em <strong>"Ativar monitoramento no Radar"</strong> no
              card de transporte aéreo para acompanhá-lo aqui.
            </div>
          ) : (
            <div className={styles.routeGrid}>
              {alerts.map((a: any) => {
                const r = a.monitored_routes;
                const isSelected = routeId === a.route_id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setRouteId(a.route_id)}
                    className={`${styles.routeCard} ${isSelected ? styles.routeCardActive : ""} ${!a.is_active ? styles.alertOff : ""}`}>
                    <div className={styles.routeCardHeader}>
                      <div>
                        <strong className={styles.routeCardName}>
                          {r?.route_name ||
                            `${r?.origin_iata} ➔ ${r?.destination_iata}`}
                        </strong>
                        <span className={styles.routeCardCode}>
                          {r?.origin_iata} ➔ {r?.destination_iata}
                        </span>
                      </div>
                      <div
                        style={{ display: "flex", gap: "0.3rem" }}
                        onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="gt-btn gt-btn-light gt-btn-sm"
                          onClick={() => toggleAlert(a)}
                          title={a.is_active ? "Pausar" : "Ativar"}>
                          {a.is_active ? (
                            <Bell size={12} color="#059669" />
                          ) : (
                            <BellOff size={12} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="gt-btn gt-btn-danger gt-btn-sm"
                          onClick={() => deleteAlert(a.id)}
                          title="Excluir alerta">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {isSelected && (
                      <span className={styles.routeActiveBadge}>
                        <CheckCircle2 size={13} /> Visualizando gráfico
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SEÇÃO 2: ROTAS EM DESTAQUE (15 ROTAS) */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                <Sparkles size={20} color="var(--brand-amber)" />
                <span>Rotas Sugeridas em Destaque</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                Selecione uma das 15 rotas nacionais e internacionais para
                carregar o histórico de preços.
              </p>
            </div>
            <div className={styles.filterTabs}>
              <button
                type="button"
                className={`${styles.filterTab} ${originFilter === "ALL" ? styles.filterTabActive : ""}`}
                onClick={() => setOriginFilter("ALL")}>
                Todas
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${originFilter === "GRU" ? styles.filterTabActive : ""}`}
                onClick={() => setOriginFilter("GRU")}>
                São Paulo (GRU)
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${originFilter === "GIG" ? styles.filterTabActive : ""}`}
                onClick={() => setOriginFilter("GIG")}>
                Rio de Janeiro (GIG)
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${originFilter === "VCP" ? styles.filterTabActive : ""}`}
                onClick={() => setOriginFilter("VCP")}>
                Campinas (VCP)
              </button>
            </div>
          </div>

          <div className={styles.routeGrid}>
            {baseRoutes.map((r) => {
              const isSelected = routeId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRouteId(r.id)}
                  className={`${styles.routeCard} ${isSelected ? styles.routeCardActive : ""}`}>
                  <div className={styles.routeCardHeader}>
                    <strong className={styles.routeCardName}>
                      {r.route_name}
                    </strong>
                    <span className={styles.routeCardCode}>
                      {r.origin_iata} ➔ {r.destination_iata}
                    </span>
                  </div>
                  {isSelected && (
                    <span className={styles.routeActiveBadge}>
                      <CheckCircle2 size={13} /> Selecionada
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* MÉTRICAS DA ROTA SELECIONADA */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Rota Selecionada</span>
            <h3 className={styles.metricVal}>
              {route ? `${route.origin_iata} ➔ ${route.destination_iata}` : "—"}
            </h3>
            <span className={styles.metricNote}>
              {route?.route_name ?? "Selecione uma rota"}
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Menor Preço Hoje</span>
            <h3 className={`${styles.metricVal} ${styles.metricHighlight}`}>
              {formatBRL(stats.todayMin)}
            </h3>
            {stats.diffVsAvgPct !== null && (
              <span
                className={
                  stats.diffVsAvgPct <= 0 ? styles.metricGood : styles.metricBad
                }>
                {Math.abs(stats.diffVsAvgPct)}%{" "}
                {stats.diffVsAvgPct <= 0 ? "abaixo" : "acima"} da média
              </span>
            )}
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Média Histórica (30d)</span>
            <h3 className={styles.metricVal}>{formatBRL(stats.avg30d)}</h3>
            <span className={styles.metricNote}>
              {stats.airlines.length
                ? `Cias: ${stats.airlines.slice(0, 4).join(", ")}`
                : "Aguardando coletas"}
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Menor Preço (2 Anos)</span>
            <h3 className={styles.metricVal}>{formatBRL(stats.min2y)}</h3>
            <span className={styles.metricNote}>Histórico acumulado</span>
          </div>
        </div>

        {/* GRÁFICO DE BARRAS COM R$ */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>
              Preço por Data de Voo e Impacto de Feriados
            </h2>
            <div className={styles.legend}>
              <span className={styles.legendNormal}>Data comum</span>
              <span className={styles.legendHoliday}>Feriado / férias</span>
            </div>
          </div>

          {loading && <p className="gt-muted">Carregando histórico…</p>}
          {!loading && bars.length === 0 && (
            <p className="gt-muted">Ainda não há coletas para esta rota.</p>
          )}

          {bars.length > 0 && (
            <div className={styles.chart}>
              {bars.map((d) => (
                <div
                  key={d.date}
                  className={styles.barCol}
                  title={d.label ?? "Data comum"}>
                  <span
                    className={
                      d.holiday ? styles.barValueHoliday : styles.barValue
                    }>
                    {formatBRL(Math.round(d.price)).replace(",00", "")}
                  </span>
                  <div className={styles.barTrack}>
                    <div
                      className={d.holiday ? styles.barHoliday : styles.bar}
                      style={{
                        height: `${barHeightPct(d.price, minBar, maxBar)}%`,
                      }}
                    />
                  </div>
                  <span className={styles.barLabel}>
                    {shortDayMonth(d.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
