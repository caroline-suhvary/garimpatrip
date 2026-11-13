'use client';
// Uma linha editável do pacote: status, custo estimado, custo final e exclusão.
import React, { useState } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import { parseMoney } from '@/lib/format';
import type { PackageItem, PackageStatus } from '@/types';
import styles from '@/styles/Package.module.css';

interface Props {
  item: PackageItem;
  onUpdate: (id: string, patch: Partial<PackageItem>) => void;
  onDelete: (id: string) => void;
}

const toText = (n: number | null) => (n === null || n === undefined ? '' : String(n).replace('.', ','));

export function PackageItemRow({ item, onUpdate, onDelete }: Props) {
  const [estimated, setEstimated] = useState(toText(item.estimated_cost));
  const [finalCost, setFinalCost] = useState(toText(item.final_cost));

  return (
    <div className={styles.item}>
      <div className={styles.itemMain}>
        <span className={styles.itemTitle}>{item.title}</span>
        {item.external_url && (
          <a href={item.external_url} target="_blank" rel="noopener noreferrer" className={styles.itemLink} aria-label="Abrir no parceiro">
            <ExternalLink size={12} />
          </a>
        )}
      </div>
      <div className={styles.itemControls}>
        <select
          className={`gt-input ${styles.statusSelect} ${styles[`status_${item.status}`]}`}
          value={item.status}
          onChange={(e) => onUpdate(item.id, { status: e.target.value as PackageStatus })}
          aria-label="Status"
        >
          <option value="planejado">Planejado</option>
          <option value="reservado">Reservado</option>
          <option value="pago">Pago</option>
        </select>
        <input
          className={`gt-input ${styles.costInput}`}
          value={estimated}
          inputMode="decimal"
          placeholder="Orçado (R$)"
          title="Valor orçado / previsto (R$)"
          onChange={(e) => setEstimated(e.target.value)}
          onBlur={() => onUpdate(item.id, { estimated_cost: parseMoney(estimated) ?? 0 })}
        />
        <input
          className={`gt-input ${styles.costInput}`}
          value={finalCost}
          inputMode="decimal"
          placeholder="Pago (R$)"
          title="Valor efetivamente pago (R$)"
          onChange={(e) => setFinalCost(e.target.value)}
          onBlur={() => onUpdate(item.id, { final_cost: parseMoney(finalCost) })}
        />
        <button type="button" className="gt-btn gt-btn-danger gt-btn-sm" onClick={() => onDelete(item.id)} aria-label="Excluir item">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
