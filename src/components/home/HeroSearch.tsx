'use client';
// Barra de garimpo da página inicial com autocomplete: leva origem, destino e orçamento para /discover.
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, DollarSign, ArrowRight } from 'lucide-react';
import { AutocompleteInput } from '@/components/search/AutocompleteInput';
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
        <AutocompleteInput
          id="hero-origin"
          label="Origem"
          value={origin}
          onChange={setOrigin}
          placeholder="Cidade de partida"
          icon={<MapPin size={20} color="#6B7280" />}
        />

        <AutocompleteInput
          id="hero-destination"
          label="Destino"
          value={destination}
          onChange={setDestination}
          placeholder="Para onde quer viajar?"
          required
          icon={<Search size={20} color="#F5B731" />}
        />

        <div className={styles.inputField}>
          <DollarSign size={20} color="#10B981" />
          <div className={styles.inputContent}>
            <label className={styles.inputLabel} htmlFor="hero-budget">Teto de Orçamento (R$)</label>
            <input
              id="hero-budget"
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={styles.textInput}
              placeholder="Ex: 3500"
            />
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
