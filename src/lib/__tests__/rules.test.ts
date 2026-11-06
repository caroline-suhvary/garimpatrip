// Testes das regras de negócio calculadas no site. Rode com: npm test
import { describe, expect, it } from 'vitest';
import { summarizeBudget } from '@/lib/budget';
import { computeRadarStats, buildHolidayChart } from '@/lib/radar';
import { extractIata, cityName } from '@/lib/iata';
import { parseMoney } from '@/lib/format';
import { DEFAULT_PACKAGE_CATEGORY, PACKAGE_CATEGORIES } from '@/lib/categories';
import type { PackageItem, PriceRecord } from '@/types';

const item = (p: Partial<PackageItem>): PackageItem => ({
  id: Math.random().toString(), trip_id: 't', category_id: 1, title: 'x', status: 'planejado',
  estimated_cost: 0, final_cost: null, currency: 'BRL', booking_reference: null, external_url: null,
  notes: null, created_at: '', ...p,
});

describe('orçamento', () => {
  it('usa o custo final quando preenchido e soma o pago', () => {
    const s = summarizeBudget([
      item({ estimated_cost: 780, final_cost: 820, status: 'pago' }),
      item({ category_id: 2, estimated_cost: 760 }),
    ], 3500);
    expect(s.projectedTotal).toBe(1580);
    expect(s.paidTotal).toBe(820);
    expect(s.remaining).toBe(1920);
    expect(s.overBudget).toBe(false);
  });

  it('marca acima do teto quando o previsto passa do limite', () => {
    const s = summarizeBudget([item({ estimated_cost: 4000 })], 3500);
    expect(s.overBudget).toBe(true);
  });
});

describe('radar', () => {
  const rec = (day: string, price: number, flight = '2026-12-20'): PriceRecord => ({
    flight_date: flight, price, airline: 'G3', stops: 0, recorded_at: `${day}T06:00:00Z`,
  });

  it('menor preço de hoje, média de 30 dias e diferença percentual', () => {
    const now = new Date('2026-11-25T12:00:00Z');
    const s = computeRadarStats([rec('2026-11-24', 1000), rec('2026-11-25', 800), rec('2026-11-25', 900)], now);
    expect(s.todayMin).toBe(800);
    expect(s.avg30d).toBe(900);
    expect(s.diffVsAvgPct).toBe(-11);
  });

  it('destaca feriados no gráfico', () => {
    const bars = buildHolidayChart(
      [rec('2026-11-25', 1200, '2026-12-25'), rec('2026-11-25', 700, '2026-12-10')],
      [{ date_day: '2026-12-25', holiday_name: 'Natal', holiday_type: 'national', is_school_vacation: true, period_classification: 'Alta Temporada' }],
    );
    expect(bars.map((b) => b.holiday)).toEqual([false, true]);
  });
});

describe('textos digitados', () => {
  it('extrai IATA e nome da cidade', () => {
    expect(extractIata('Salvador (SSA)')).toBe('SSA');
    expect(extractIata('são paulo')).toBe('SAO');
    expect(cityName('Salvador (SSA)')).toBe('Salvador');
  });

  it('entende valores em reais', () => {
    expect(parseMoney('1.234,50')).toBe(1234.5);
    expect(parseMoney('R$ 780')).toBe(780);
    expect(parseMoney('abc')).toBeNull();
  });
});

describe('10 áreas do pacote', () => {
  it('tem exatamente 10 áreas numeradas de 1 a 10', () => {
    expect(PACKAGE_CATEGORIES.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('ideias da web vão para Passeios por padrão', () => {
    expect(DEFAULT_PACKAGE_CATEGORY.web_idea).toBe(3);
  });
});
