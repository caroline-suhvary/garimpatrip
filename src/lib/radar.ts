// Cálculos do Radar de Preços a partir do histórico gravado pelo robô diário.
import type { CalendarDay, PriceRecord } from '@/types';

export interface RadarStats {
  todayMin: number | null;
  avg30d: number | null;
  min2y: number | null;
  /** Percentual do menor preço de hoje em relação à média de 30 dias (negativo = mais barato). */
  diffVsAvgPct: number | null;
  airlines: string[];
}

export interface ChartBar {
  date: string;
  price: number;
  holiday: boolean;
  label: string | null;
}

const DAY = 86_400_000;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Menor preço por dia de registro (recorded_at). */
export function dailyMinimums(records: PriceRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of records) {
    const day = r.recorded_at.slice(0, 10);
    const price = Number(r.price);
    const cur = map.get(day);
    if (cur === undefined || price < cur) map.set(day, price);
  }
  return map;
}

export function computeRadarStats(records: PriceRecord[], now: Date = new Date()): RadarStats {
  if (records.length === 0) {
    return { todayMin: null, avg30d: null, min2y: null, diffVsAvgPct: null, airlines: [] };
  }
  const daily = dailyMinimums(records);
  const days = [...daily.keys()].sort();
  const latestDay = days[days.length - 1];
  const todayMin = daily.get(latestDay) ?? null;

  const cutoff30 = now.getTime() - 30 * DAY;
  const last30 = days.filter((d) => new Date(`${d}T00:00:00Z`).getTime() >= cutoff30).map((d) => daily.get(d)!);
  const avg30d = last30.length ? round2(last30.reduce((a, b) => a + b, 0) / last30.length) : null;

  const cutoff2y = now.getTime() - 730 * DAY;
  const in2y = records.filter((r) => new Date(r.recorded_at).getTime() >= cutoff2y).map((r) => Number(r.price));
  const min2y = in2y.length ? Math.min(...in2y) : null;

  const diffVsAvgPct = todayMin !== null && avg30d ? Math.round(((todayMin - avg30d) / avg30d) * 100) : null;

  const airlines = [...new Set(records.filter((r) => r.recorded_at.slice(0, 10) === latestDay && r.airline).map((r) => r.airline as string))];

  return { todayMin, avg30d, min2y, diffVsAvgPct, airlines };
}

/**
 * Barras do gráfico "Impacto de Feriados": menor preço por data de voo,
 * olhando só a coleta mais recente, marcando feriados e férias escolares.
 */
export function buildHolidayChart(records: PriceRecord[], calendar: CalendarDay[], maxBars = 14): ChartBar[] {
  if (records.length === 0) return [];
  const latest = records.reduce((m, r) => (r.recorded_at > m ? r.recorded_at : m), records[0].recorded_at).slice(0, 10);
  const byFlight = new Map<string, number>();
  for (const r of records) {
    if (r.recorded_at.slice(0, 10) !== latest) continue;
    const p = Number(r.price);
    const cur = byFlight.get(r.flight_date);
    if (cur === undefined || p < cur) byFlight.set(r.flight_date, p);
  }
  const cal = new Map(calendar.map((c) => [c.date_day, c]));
  return [...byFlight.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, maxBars)
    .map(([date, price]) => {
      const c = cal.get(date);
      const holiday = Boolean(c?.holiday_name) || Boolean(c?.is_school_vacation);
      return { date, price, holiday, label: c?.holiday_name ?? (c?.is_school_vacation ? 'Férias escolares' : null) };
    });
}

/** Altura da barra em % (o menor preço nunca fica com altura zero). */
export function barHeightPct(price: number, min: number, max: number): number {
  if (max <= min) return 100;
  return Math.round(20 + ((price - min) / (max - min)) * 80);
}
