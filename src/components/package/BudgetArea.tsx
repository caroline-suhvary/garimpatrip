'use client';
// Área 9: orçamento consolidado por área, comparado ao teto da viagem.
import React from 'react';
import type { BudgetSummary } from '@/lib/budget';
import { ITEM_CATEGORY_IDS, categoryById } from '@/lib/categories';
import { formatBRL } from '@/lib/format';
import styles from '@/styles/Package.module.css';

export function BudgetArea({ summary, budgetLimit }: { summary: BudgetSummary; budgetLimit: number }) {
  const max = Math.max(...ITEM_CATEGORY_IDS.map((id) => summary.byCategory[id] ?? 0), 1);
  return (
    <div className={styles.budget}>
      {budgetLimit > 0 && (
        <div>
          <div className={styles.progressLabel}>
            <span>{summary.usedPct}% do teto</span>
            <span>{formatBRL(summary.projectedTotal)} de {formatBRL(budgetLimit)}</span>
          </div>
          <div className={styles.progress}>
            <div
              className={summary.overBudget ? styles.progressOver : styles.progressFill}
              style={{ width: `${Math.min(summary.usedPct, 100)}%` }}
            />
          </div>
        </div>
      )}
      <div className={styles.budgetRows}>
        {ITEM_CATEGORY_IDS.map((id) => {
          const cat = categoryById(id)!;
          const value = summary.byCategory[id] ?? 0;
          return (
            <div key={id} className={styles.budgetRow}>
              <span className={styles.budgetName}>{id}. {cat.title}</span>
              <div className={styles.budgetBarTrack}>
                <div className={styles.budgetBar} style={{ width: `${(value / max) * 100}%`, background: cat.border }} />
              </div>
              <span className={styles.budgetValue}>{formatBRL(value)}</span>
            </div>
          );
        })}
      </div>
      <p className="gt-muted">
        Estimado original: {formatBRL(summary.estimatedTotal)} · O total previsto usa o custo final quando você o preenche.
      </p>
    </div>
  );
}
