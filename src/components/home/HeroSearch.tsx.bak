'use client';
// Barra de garimpo da página inicial: leva origem, destino e orçamento para /discover.
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, DollarSign, ArrowRight } from 'lucide-react';
import styles from '@/styles/Home.module.css';

export function HeroSearch() {
  const router = useRouter();
  const [origin, setOrigin] = useState('São Paulo (GRU)');
  const [destination, setDestination] = useState('Salvador (SSA)');
  const [budget, setBudget] = useState('3500');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    const params = new URLSearchParams({ origin, destination, budget });
    router.push(`/discover?${params}`);
  };

  return (
    <div className={styles.searchBar}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.inputField}>
          <MapPin size={20} color="#6B7280" />
          <div className={styles.inputContent}>
            <label className={styles.inputLabel} htmlFor="hero-origin">Origem</label>
            <input id="hero-origin" type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} className={styles.textInput} placeholder="Cidade de partida" />
          </div>
        </div>

        <div className={styles.inputField}>
          <Search size={20} color="#F5B731" />
          <div className={styles.inputContent}>
            <label className={styles.inputLabel} htmlFor="hero-destination">Destino</label>
            <input id="hero-destination" type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className={styles.textInput} placeholder="Para onde quer viajar?" required />
          </div>
        </div>

        <div className={styles.inputField}>
          <DollarSign size={20} color="#10B981" />
          <div className={styles.inputContent}>
            <label className={styles.inputLabel} htmlFor="hero-budget">Teto de Orçamento (R$)</label>
            <input id="hero-budget" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} className={styles.textInput} placeholder="Ex: 3500" />
          </div>
        </div>

        <button type="submit" className={styles.searchBtn}>
          <span>Garimpar</span>
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
