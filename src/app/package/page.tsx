// "use client";

// import React from "react";
// import Link from "next/link";
// import { Sparkles, ArrowRight, BriefcaseBusiness, CheckCircle } from "lucide-react";
// import styles from "@/styles/Vitrine.module.css";

// export default function PackagePage() {
//   return (
//     <main className={styles.wrapper}>
//       <section className={styles.onboardingBanner}>
//         <div className={styles.onboardingTag}>
//           <BriefcaseBusiness size={16} /> <span>Montador do Pacote</span>
//         </div>
//         <h1 className={styles.pageTitle}>Seu Pacote de Viagem (10 Áreas)</h1>
//         <p className={styles.pageSubtitle}>
//           Esta tela consolida o status da sua viagem ativa. Para visualizar um exemplo completo com
//           dados reais e regras climáticas em funcionamento, acesse a nossa Vitrine de Degustação.
//         </p>
//         <Link href="/vitrine" className={styles.ctaPrimary}>
//           <Sparkles size={18} />
//           <span>Abrir Roteiro Completo na Vitrine</span>
//         </Link>
//       </section>
//     </main>
//   );
// }
// Meu Pacote (10 Áreas). Aceita ?trip=<id>.
import { PackageClient } from "@/components/package/PackageClient";

export const metadata = { title: "Meu Pacote | GarimpaTrip" };

export default async function PackagePage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string }>;
}) {
  const { trip } = await searchParams;
  return <PackageClient initialTripId={trip} />;
}
