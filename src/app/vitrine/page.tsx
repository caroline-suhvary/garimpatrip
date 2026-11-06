"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { WalkingElevationCard } from "@/components/walking/WalkingElevationCard";
import {
  Footprints,
  Sparkles,
  Sun,
  CloudRain,
  Plane,
  Hotel,
  MapPin,
  Ticket,
  Utensils,
  ShieldCheck,
  Coins,
  Calendar,
  PiggyBank,
  CheckSquare,
  AlertTriangle,
  Umbrella,
  Info,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Sparkle,
  Compass, // 👈 Adicionado aqui
  TrendingDown, // 👈 Adicionado aqui
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import styles from "@/styles/Vitrine.module.css";

// Função para calcular datas dinâmicas sempre atualizadas
function getDynamicDates() {
  const start = new Date();
  start.setDate(start.getDate() + 42); // 42 dias no futuro
  // Ajusta para quinta-feira
  const dayOfWeek = start.getDay();
  const diffToThursday = (4 - dayOfWeek + 7) % 7;
  start.setDate(start.getDate() + diffToThursday);

  const end = new Date(start);
  end.setDate(start.getDate() + 5); // 6 dias / 5 noites (quinta a terça)

  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

  return {
    startStr: fmt(start),
    endStr: fmt(end),
    year: start.getFullYear(),
    durationDays: 6,
    nights: 5,
  };
}

export default function VitrinePage() {
  const [selectedDestination, setSelectedDestination] = useState<
    "salvador" | "buenosaires"
  >("salvador");
  const dates = useMemo(() => getDynamicDates(), []);

  // Dados dinâmicos para Salvador (Nacional)
  const salvadorData = {
    title: "Salvador, Bahia",
    badge: "Viagem Nacional • Sol & Cultura",
    country: "Brasil 🇧🇷",
    summary:
      "Roteiro de 6 dias focado em praias históricas, Pelourinho e gastronomia baiana.",
    weather: {
      source: "Open-Meteo API",
      tempRange: "24°C a 29°C",
      condition: "Tropical Litorâneo",
      rainChance: "25% (Risco baixo)",
      uvIndex: "9 (Muito Alto • Protetor solar obrigatório)",
      status: "Ótima época para praias e passeios a pé",
    },
    areas: [
      {
        id: 1,
        name: "Transporte Principal",
        icon: Plane,
        cost: "R$ 840",
        note: "Voo direto ida/volta (GRU ➔ SSA) com mala de mão 10kg.",
      },
      {
        id: 2,
        name: "Hospedagem",
        icon: Hotel,
        cost: "R$ 1.350",
        note: "5 diárias em Pousada no Pelourinho / Santo Antônio c/ café.",
      },
      {
        id: 3,
        name: "Deslocamento Local",
        icon: MapPin,
        cost: "R$ 220",
        note: "Ubers entre orla e centro + Elevador Lacerda.",
      },
      {
        id: 4,
        name: "Passeios e Atividades",
        icon: Ticket,
        cost: "R$ 380",
        note: "Tour guiado Pelourinho, Museu Afro, Praia do Farol da Barra.",
      },
      {
        id: 5,
        name: "Alimentação",
        icon: Utensils,
        cost: "R$ 750",
        note: "Média de R$ 125/dia: acarajé, moquecas e restaurantes típicos.",
      },
      {
        id: 6,
        name: "Documentação & Saúde",
        icon: ShieldCheck,
        cost: "R$ 0",
        note: "Apenas RG em bom estado. Sem vacina obrigatória no momento.",
      },
      {
        id: 7,
        name: "Comunicação & Dinheiro",
        icon: Coins,
        cost: "R$ 0",
        note: "Moeda Real (R$). PIX e cartões aceitos em toda a cidade.",
      },
      {
        id: 8,
        name: "Cronograma Diário",
        icon: Calendar,
        cost: "Planejado",
        note: "Dias 1-3 Pelourinho/Igrejas; Dias 4-6 Praias e Pôr do Sol.",
      },
      {
        id: 9,
        name: "Orçamento & Parcelas",
        icon: PiggyBank,
        cost: "R$ 3.540",
        note: "Estimativa total para 1 pessoa (ou ~R$ 590 em 6x sem juros).",
      },
      {
        id: 10,
        name: "Checklist Operacional",
        icon: CheckSquare,
        cost: "Definido",
        note: "Protetor solar FPS 50, chapéu, roupas leves e calçado antiderrapante.",
      },
    ],
    scheduleHighlight: {
      day: "Sexta-feira (Dia 2)",
      forecast: "Sol com nuvens passageiras (28°C)",
      plan: "Manhã no Pelourinho e Fundação Casa de Jorge Amado. Tarde na Praia do Porto da Barra.",
      planoChuva:
        "Se chover, visita antecipada à Igreja São Francisco e Museu Náutico.",
    },
    packingAlert:
      "Clima ensolarado: Checklist adicionou automaticamente Óculos de Sol, Protetor FPS 50 e Roupas UV.",
  };

  // Dados dinâmicos para Buenos Aires (Internacional)
  const buenosAiresData = {
    title: "Buenos Aires",
    badge: "Viagem Internacional • Urbano & Câmbio",
    country: "Argentina 🇦🇷",
    summary:
      "Roteiro cultural e gastronômico de 6 dias por Palermo, Recoleta e San Telmo.",
    weather: {
      source: "Open-Meteo API",
      tempRange: "14°C a 22°C",
      condition: "Clima Temperado",
      rainChance: "45% (Chuva moderada em 1 dia)",
      uvIndex: "5 (Moderado)",
      status: "Clima fresco com noites frias. Ideal para passeios a pé.",
    },
    areas: [
      {
        id: 1,
        name: "Transporte Principal",
        icon: Plane,
        cost: "R$ 1.580",
        note: "Voo GRU ➔ AEP (Aeroparque perto do centro) com taxa de embarque.",
      },
      {
        id: 2,
        name: "Hospedagem",
        icon: Hotel,
        cost: "R$ 1.800",
        note: "5 diárias em Hotel Boutique em Palermo Soho c/ café.",
      },
      {
        id: 3,
        name: "Deslocamento Local",
        icon: MapPin,
        cost: "R$ 160",
        note: "Cartão SUBE (metrô/ônibus) e táxis locais (Cabify/Radio Taxi).",
      },
      {
        id: 4,
        name: "Passeios e Atividades",
        icon: Ticket,
        cost: "R$ 490",
        note: "Teatro Colón, Livraria El Ateneo, Show de Tango e MALBA.",
      },
      {
        id: 5,
        name: "Alimentação",
        icon: Utensils,
        cost: "R$ 950",
        note: "Média de R$ 160/dia: Parrillas argentinas, empanadas e cafés.",
      },
      {
        id: 6,
        name: "Documentação & Saúde",
        icon: ShieldCheck,
        cost: "R$ 180",
        note: "RG emitido há menos de 10 anos OU Passaporte. Seguro-viagem médico contratado.",
      },
      {
        id: 7,
        name: "Comunicação & Dinheiro",
        icon: Coins,
        cost: "R$ 120",
        note: "Câmbio Peso Argentino (ARS/BRL via cartão global tipo Nomad/Wise c/ IOF 1.1%) + chip eSIM.",
      },
      {
        id: 8,
        name: "Cronograma Diário",
        icon: Calendar,
        cost: "Planejado",
        note: "Dias culturais nos bairros históricos com plano de chuva alternativo.",
      },
      {
        id: 9,
        name: "Orçamento & Parcelas",
        icon: PiggyBank,
        cost: "R$ 5.280",
        note: "Estimativa total com câmbio e seguro inclusos (~R$ 528 em 10x).",
      },
      {
        id: 10,
        name: "Checklist Operacional",
        icon: CheckSquare,
        cost: "Definido",
        note: "Casaco corta-vento, adaptador de tomada (Tipo I argentino), seguro impresso.",
      },
    ],
    scheduleHighlight: {
      day: "Sábado (Dia 3)",
      forecast: "Chuva intermitente à tarde (17°C)",
      plan: "⚠️ Alerta de Chuva: Passeio pelo Jardim Japonês remanejado para a manhã; tarde reservada para a Livraria El Ateneo Grand Splendid e Café Tortoni.",
      planoChuva: "Ativação do Plano B Coberto: Teatros e Galerias Pacífico.",
    },
    packingAlert:
      "Previsão de 14°C e chuva: Checklist adicionou Casaco Corta-vento, Guarda-chuva resistente e Calçado fechado.",
  };

  const current =
    selectedDestination === "salvador" ? salvadorData : buenosAiresData;

  return (
    <main className={styles.wrapper}>
      {/* BANNER DO TOUR GUIADO PARA RECRUTADORES E NOVOS VISITANTES */}
      <section className={styles.onboardingBanner}>
        <div className={styles.onboardingHeader}>
          <div className={styles.onboardingTag}>
            <Sparkles size={16} /> <span>Modo Degustação Interativo</span>
          </div>
          <h1 className={styles.pageTitle}>Conheça o GarimpaTrip na Prática</h1>
          <p className={styles.pageSubtitle}>
            Veja como o aplicativo estrutura um planejamento completo sem deixar
            pontas soltas. Escolha entre uma viagem nacional e uma internacional
            para ver as regras de clima e câmbio mudarem dinamicamente.
          </p>
        </div>

        {/* 3 PASSOS SUCINTOS DE COMO A PLATAFORMA FUNCIONA */}
        <div className={styles.tourGrid}>
          <div className={styles.tourCard}>
            <span className={styles.tourNumber}>1</span>
            <h3>10 Áreas Modulares</h3>
            <p>
              Do transporte à vacina e à mala, cada área tem status e custos
              rastreados.
            </p>
          </div>
          <div className={styles.tourCard}>
            <span className={styles.tourNumber}>2</span>
            <h3>Clima Vivo (Open-Meteo)</h3>
            <p>
              O roteiro avisa se vai chover e monta a mala com as roupas certas.
            </p>
          </div>
          <div className={styles.tourCard}>
            <span className={styles.tourNumber}>3</span>
            <h3>Câmbio & Documentos</h3>
            <p>
              Calcula taxas, IOF e exigências alfandegárias de acordo com o
              destino.
            </p>
          </div>
        </div>
      </section>

      {/* SELETOR DE DESTINO EM PÍLULAS */}
      <section className={styles.selectorSection}>
        <span className={styles.selectorLabel}>
          Selecione um Roteiro de Exemplo:
        </span>
        <div className={styles.pillContainer}>
          <button
            type="button"
            className={`${styles.pillBtn} ${selectedDestination === "salvador" ? styles.pillActive : ""}`}
            onClick={() => setSelectedDestination("salvador")}>
            <span>🇧🇷 Salvador (Nacional)</span>
          </button>
          <button
            type="button"
            className={`${styles.pillBtn} ${selectedDestination === "buenosaires" ? styles.pillActive : ""}`}
            onClick={() => setSelectedDestination("buenosaires")}>
            <span>🇦🇷 Buenos Aires (Internacional)</span>
          </button>
        </div>
      </section>

      {/* CABEÇALHO DO DESTINO ESCOLHIDO */}
      <section className={styles.destinationHero}>
        <div className={styles.destInfo}>
          <span className={styles.destBadge}>{current.badge}</span>
          <h2 className={styles.destTitle}>{current.title}</h2>
          <p className={styles.destSummary}>{current.summary}</p>
          <div className={styles.datesBox}>
            <Calendar size={18} />
            <span>
              Datas Simuladas:{" "}
              <strong>
                {dates.startStr} a {dates.endStr} de {dates.year}
              </strong>{" "}
              ({dates.durationDays} dias / {dates.nights} noites)
            </span>
          </div>
        </div>

        {/* CARTÃO DE CLIMA DINÂMICO (OPEN-METEO) */}
        <div className={styles.weatherCard}>
          <div className={styles.weatherHeader}>
            <div className={styles.weatherIconBox}>
              {selectedDestination === "salvador" ? (
                <Sun size={26} color="#e59312" />
              ) : (
                <CloudRain size={26} color="#2b78b8" />
              )}
            </div>
            <div>
              <span className={styles.weatherSource}>
                {current.weather.source}
              </span>
              <h4 className={styles.weatherTemp}>
                {current.weather.tempRange}
              </h4>
            </div>
          </div>
          <ul className={styles.weatherList}>
            <li>
              <strong>Condição:</strong> {current.weather.condition}
            </li>
            <li>
              <strong>Chuva esperada:</strong> {current.weather.rainChance}
            </li>
            <li>
              <strong>Índice UV:</strong> {current.weather.uvIndex}
            </li>
          </ul>
          <div className={styles.weatherAlert}>
            <Info size={15} />
            <span>{current.weather.status}</span>
          </div>
        </div>
      </section>

      {/* AS 10 ÁREAS DO PACOTE */}
      <section className={styles.areasSection}>
        <div className={styles.sectionHeader}>
          <h2>Painel das 10 Áreas Estruturadas</h2>
          <p>
            Valores de referência, notas de atenção e requisitos específicos
            para este destino:
          </p>
        </div>

        <div className={styles.areasGrid}>
          {current.areas.map((area) => {
            const Icon = area.icon;
            return (
              <div key={area.id} className={styles.areaCard}>
                <div className={styles.areaHeader}>
                  <div className={styles.areaNumberIcon}>
                    <span className={styles.areaId}>{area.id}</span>
                    <Icon size={18} className={styles.areaIcon} />
                  </div>
                  <span className={styles.areaCost}>{area.cost}</span>
                </div>
                <h4 className={styles.areaName}>{area.name}</h4>
                <p className={styles.areaNote}>{area.note}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* DESTAQUE DE INTELIGÊNCIA: CLIMA CRUZADO COM CRONOGRAMA E MALA */}
      <section className={styles.intelligenceSection}>
        <div className={styles.intelCard}>
          <div className={styles.intelHeader}>
            <Umbrella size={22} className={styles.intelIcon} />
            <h3>Área 8: Cronograma Inteligente & Plano de Chuva</h3>
          </div>
          <div className={styles.intelBody}>
            <p>
              <strong>Dia em Destaque:</strong> {current.scheduleHighlight.day}{" "}
              • {current.scheduleHighlight.forecast}
            </p>
            <p className={styles.intelHighlight}>
              {current.scheduleHighlight.plan}
            </p>
            <div className={styles.intelTip}>
              <AlertTriangle size={16} />
              <span>Plano B: {current.scheduleHighlight.planoChuva}</span>
            </div>

            {/* Secao de Caminhada Inteligente & Relevo (OpenRouteService) */}
            <div className={styles.intelCard} style={{ gridColumn: "1 / -1" }}>
              <div className={styles.intelHeader}>
                <Footprints size={22} className={styles.intelIcon} />
                <h3>Área 8 & 9: Caminhada Inteligente & Alerta de Ladeiras</h3>
              </div>
              <div className={styles.intelBody}>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    color: "#6b7280",
                  }}>
                  Cálculo de rota a pé via <strong>OpenRouteService</strong> com
                  telemetria de elevação e aclives em tempo real.
                </p>
                {selectedDestination === "salvador" ? (
                  <WalkingElevationCard
                    originName="Pelourinho (Largo do Pelourinho)"
                    destinationName="Mercado Modelo (Comércio)"
                    startLon={-38.5085}
                    startLat={-12.9719}
                    endLon={-38.5134}
                    endLat={-12.9733}
                    initialRoute={{
                      distanceMeters: 1100,
                      durationMinutes: 16,
                      ascentMeters: 6,
                      descentMeters: 58,
                      difficulty: "challenging",
                      difficultyLabel: "Ladeira Íngreme / Forte Declive",
                      advice:
                        "Descida acentuada pelas ladeiras históricas (-58m). Para a volta, utilize o Elevador Lacerda para evitar subir a pé com cansaço.",
                      elevationProfile: [
                        { distanceM: 0, elevationM: 65 },
                        { distanceM: 250, elevationM: 58 },
                        { distanceM: 500, elevationM: 42 },
                        { distanceM: 750, elevationM: 20 },
                        { distanceM: 1100, elevationM: 7 },
                      ],
                    }}
                  />
                ) : (
                  <WalkingElevationCard
                    originName="Obelisco (Av. 9 de Julio)"
                    destinationName="Plaza de Mayo / Casa Rosada"
                    startLon={-58.3816}
                    startLat={-34.6037}
                    endLon={-58.3712}
                    endLat={-34.6083}
                    initialRoute={{
                      distanceMeters: 1400,
                      durationMinutes: 18,
                      ascentMeters: 4,
                      descentMeters: 9,
                      difficulty: "easy",
                      difficultyLabel: "Caminhada Plana / Leve",
                      advice:
                        "Trajeto amplo e plano pela Avenida de Mayo. Ideal para fazer a pé apreciando os cafés e a arquitetura clássica.",
                      elevationProfile: [
                        { distanceM: 0, elevationM: 25 },
                        { distanceM: 400, elevationM: 24 },
                        { distanceM: 800, elevationM: 22 },
                        { distanceM: 1100, elevationM: 19 },
                        { distanceM: 1400, elevationM: 16 },
                      ],
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.intelCard}>
          <div className={styles.intelHeader}>
            <CheckSquare size={22} className={styles.intelIcon} />
            <h3>Área 10: Mala Inteligente Alimentada pelo Clima</h3>
          </div>
          <div className={styles.intelBody}>
            <p>
              A API de clima verifica a probabilidade de precipitação e
              amplitude térmica para sugerir itens na bagagem:
            </p>
            <div className={styles.packingNotice}>
              <CheckSquare size={16} />
              <span>{current.packingAlert}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CHAMADA FINAL PARA RECRUTADORES E NOVOS USUÁRIOS */}
      <section className={styles.ctaFooter}>
        <div className={styles.ctaCard}>
          <Sparkles size={28} className={styles.ctaIcon} />
          <h2>Gostou deste modelo de planejamento?</h2>
          <p>
            Você pode duplicar este itinerário ou criar um novo plano
            personalizado com o seu destino preferido.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/" className={styles.ctaPrimary}>
              <Compass size={18} />
              <span>Explorar Mais Destinos</span>
            </Link>
            <Link href="/radar" className={styles.ctaSecondary}>
              <TrendingDown size={18} />
              <span>Ver Radar de Preços</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
