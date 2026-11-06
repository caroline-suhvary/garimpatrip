"use client";

import React from "react";
import Link from "next/link";
import { Plane, Sparkles, Plus, Calendar, MapPin } from "lucide-react";
import styles from "@/styles/Vitrine.module.css";

export default function MyTripsPage() {
  return (
    <main className={styles.wrapper}>
      <section className={styles.onboardingBanner}>
        <div className={styles.onboardingTag}>
          <Plane size={16} /> <span>Painel de Bordo</span>
        </div>
        <h1 className={styles.pageTitle}>Minhas Viagens</h1>
        <p className={styles.pageSubtitle}>
          Aqui você gerencia suas viagens salvas e planos futuros. Veja como um pacote completo
          se parece navegando pelo modelo interativo da Vitrine.
        </p>

        <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/vitrine" className={styles.ctaPrimary}>
            <Sparkles size={18} />
            <span>Ver Roteiros na Vitrine de Degustação</span>
          </Link>
          <Link href="/" className={styles.ctaSecondary} style={{ color: "#27231e", background: "#ede6d9", borderColor: "rgba(91,73,49,0.2)" }}>
            <Plus size={18} />
            <span>Pesquisar Novo Destino</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
