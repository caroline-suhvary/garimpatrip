// Página inicial: banner de busca + as 10 áreas do pacote em Bento Grid.
import React from 'react';
import Link from 'next/link';
import {
  Plane, Building2, Ticket, Car, FileCheck, Utensils, Banknote, CalendarDays, PiggyBank, ListChecks, ArrowUpRight,
} from 'lucide-react';
import { HeroSearch } from '@/components/home/HeroSearch';
import { PACKAGE_CATEGORIES } from '@/lib/categories';
import styles from '@/styles/Home.module.css';

const ICONS = [Plane, Building2, Ticket, Car, FileCheck, Utensils, Banknote, CalendarDays, PiggyBank, ListChecks];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ login?: string }> }) {
  const { login } = await searchParams;

  return (
    <main className={styles.main}>
      {login && (
        <div className={styles.loginAlert}>
          <div className="gt-error">
            {login === 'config'
              ? 'O login ainda não está configurado: preencha as chaves do Supabase no .env.local.'
              : 'Não foi possível concluir o login com Google. Tente novamente.'}
          </div>
        </div>
      )}

      {/* HERO SECTION COM FUSÃO LAYOUT 1 + 3 */}
      <section className={styles.heroSection}>
        <div className={styles.heroBanner}>
          <span className={styles.heroTag}>Planejamento Inteligente & Transparente</span>
          <h1 className={styles.heroTitle}>Garimpe a viagem perfeita sem 30 abas abertas.</h1>
          <p className={styles.heroSubtitle}>
            Pesquise voos com histórico real, hospede-se onde cabe no bolso, descubra atrações e controle seu orçamento com transparência total.
          </p>
          <HeroSearch />
        </div>
      </section>

      {/* BENTO GRID DAS 10 MACROCATEGORIAS */}
      <section className={styles.bentoSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionSub}>As 10 Áreas do Pacote</span>
            <h2 className={styles.sectionTitle}>Explore por Categoria Modular</h2>
          </div>
          <p className={styles.sectionDesc}>
            Recolha ideias na sua Caixa de Descobertas e monte seu pacote completo sem compromisso financeiro antecipado.
          </p>
        </div>

        <div className={styles.bentoGrid}>
          {PACKAGE_CATEGORIES.map((cat, i) => {
            const Icon = ICONS[i];
            return (
              <Link
                key={cat.id}
                href={`/package#area-${cat.id}`}
                className={styles.bentoCard}
                style={{ backgroundColor: cat.bg, borderColor: cat.border }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.iconBox} style={{ color: cat.color }}>
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <span className={styles.cardBadge}>{cat.badge}</span>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>
                    <span>{cat.id}. {cat.title}</span>
                    <ArrowUpRight size={18} />
                  </h3>
                  <p className={styles.cardDesc}>{cat.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* COMO FUNCIONA: SEARCH, LOOK AND REDIRECT */}
      <section className={styles.howSection}>
        <span className={styles.sectionSub}>Search, Look and Redirect</span>
        <h2 className={styles.sectionTitle}>Como o GarimpaTrip funciona</h2>
        <div className={styles.howGrid}>
          <div className={styles.howStep}>
            <div className={styles.howNumber}>1</div>
            <h3 className={styles.howTitle}>Garimpe</h3>
            <p className="gt-muted">Buscamos voos, hospedagens, passeios e ideias da web em fontes oficiais e parceiros.</p>
          </div>
          <div className={styles.howStep}>
            <div className={styles.howNumber}>2</div>
            <h3 className={styles.howTitle}>Separe na Caixa</h3>
            <p className="gt-muted">Guarde o que interessar na Caixa de Descobertas e compare com calma.</p>
          </div>
          <div className={styles.howStep}>
            <div className={styles.howNumber}>3</div>
            <h3 className={styles.howTitle}>Monte o Pacote</h3>
            <p className="gt-muted">Transfira os escolhidos para as 10 áreas, acompanhe o orçamento e reserve direto no site do parceiro.</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        GarimpaTrip · Preços informados pelos parceiros podem mudar. A reserva é sempre feita no site oficial de cada parceiro.
      </footer>
    </main>
  );
}
