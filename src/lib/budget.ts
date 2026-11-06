// Soma do orçamento do pacote: usa o custo final quando existe, senão o estimado.
import type { PackageItem } from '@/types';

export interface BudgetSummary {
  estimatedTotal: number;
  paidTotal: number;
  /** Custo considerado: final_cost quando preenchido, senão estimated_cost. */
  projectedTotal: number;
  remaining: number;
  overBudget: boolean;
  usedPct: number;
  byCategory: Record<number, number>;
}

export function itemCost(item: Pick<PackageItem, 'final_cost' | 'estimated_cost'>): number {
  if (item.final_cost !== null && item.final_cost !== undefined) return Number(item.final_cost);
  return Number(item.estimated_cost ?? 0);
}

export function summarizeBudget(items: PackageItem[], budgetLimit: number): BudgetSummary {
  let estimatedTotal = 0;
  let paidTotal = 0;
  let projectedTotal = 0;
  const byCategory: Record<number, number> = {};
  for (const it of items) {
    estimatedTotal += Number(it.estimated_cost ?? 0);
    const cost = itemCost(it);
    projectedTotal += cost;
    if (it.status === 'pago') paidTotal += cost;
    byCategory[it.category_id] = (byCategory[it.category_id] ?? 0) + cost;
  }
  const r = (n: number) => Math.round(n * 100) / 100;
  const limit = Number(budgetLimit) || 0;
  return {
    estimatedTotal: r(estimatedTotal),
    paidTotal: r(paidTotal),
    projectedTotal: r(projectedTotal),
    remaining: r(limit - projectedTotal),
    overBudget: limit > 0 && projectedTotal > limit,
    usedPct: limit > 0 ? Math.round((projectedTotal / limit) * 100) : 0,
    byCategory,
  };
}
