'use client';
// Seletor de viagem usado na Caixa, no Pacote e na tela Descobrir.
import React from 'react';
import Link from 'next/link';
import type { Trip } from '@/types';
import styles from '@/styles/TripPicker.module.css';

interface Props {
  trips: Trip[];
  selectedId: string;
  onChange: (id: string) => void;
  loading?: boolean;
}

export function TripPicker({ trips, selectedId, onChange, loading }: Props) {
  if (loading && trips.length === 0) return <div className="gt-muted">Carregando suas viagens…</div>;

  if (trips.length === 0) {
    return (
      <div className="gt-notice">
        Você ainda não tem viagens. <Link href="/trips" className={styles.link}>Crie sua primeira viagem</Link> ou
        faça uma busca em <Link href="/discover" className={styles.link}>Descobrir Destinos</Link>.
      </div>
    );
  }

  return (
    <label className={styles.picker}>
      <span className={styles.label}>Viagem</span>
      <select className={`gt-input ${styles.select}`} value={selectedId} onChange={(e) => onChange(e.target.value)}>
        {trips.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title} — {t.destination_city}
            {t.status === 'arquivado' ? ' (arquivada)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
