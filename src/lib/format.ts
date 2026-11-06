// Formatação de valores para o padrão brasileiro.

export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** "2026-11-15" -> "15/Nov" (usado no eixo do gráfico do Radar). */
export function shortDayMonth(iso: string): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${months[Number(m) - 1] ?? m}`;
}

/** Converte texto digitado ("1.234,50" ou "1234.5") em número; devolve null se inválido. */
export function parseMoney(input: string): number | null {
  const clean = input.trim().replace(/[R$\s]/g, '');
  if (!clean) return null;
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
