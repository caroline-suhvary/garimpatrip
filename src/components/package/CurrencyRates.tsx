'use client';
// Área 7: cotações do dia (via /api/currency -> AwesomeAPI).
import React, { useEffect, useState } from 'react';
import styles from '@/styles/Package.module.css';

interface Rates {
  USD_BRL: number | null;
  EUR_BRL: number | null;
  ARS_BRL: number | null;
  updatedAt: string | null;
}

const fmt = (n: number | null, digits = 2) =>
  n === null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits, maximumFractionDigits: digits });

export function CurrencyRates() {
  const [rates, setRates] = useState<Rates | null>(null);

  useEffect(() => {
    fetch('/api/currency')
      .then((r) => r.json())
      .then(setRates)
      .catch(() => setRates({ USD_BRL: null, EUR_BRL: null, ARS_BRL: null, updatedAt: null }));
  }, []);

  if (!rates) return <p className="gt-muted">Buscando cotações…</p>;

  return (
    <div className={styles.rates}>
      <div className={styles.rate}><span>Dólar</span><strong>{fmt(rates.USD_BRL)}</strong></div>
      <div className={styles.rate}><span>Euro</span><strong>{fmt(rates.EUR_BRL)}</strong></div>
      <div className={styles.rate}><span>Peso arg.</span><strong>{fmt(rates.ARS_BRL, 4)}</strong></div>
      {rates.updatedAt && <span className={styles.rateDate}>Atualizado em {rates.updatedAt}</span>}
    </div>
  );
}
