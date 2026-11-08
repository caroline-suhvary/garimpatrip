"use client";
// Tela Descobrir: busca multi-provedores com autocomplete, categorias claras e integração de rotas/experiências.
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Sparkles,
  ExternalLink,
  Compass,
  Plane,
  Bus,
  Building,
  Ticket,
  Globe,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  BookmarkPlus,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTrips } from "@/hooks/useTrips";
import { TripPicker } from "@/components/TripPicker";
import { AutocompleteInput } from "@/components/search/AutocompleteInput";
import { cleanCity, slugifyCity, extractIata } from "@/lib/iata";
import { formatBRL, parseMoney } from "@/lib/format";
import type { SearchResponse, SearchResult } from "@/types";
import styles from "@/styles/Discover.module.css";

const DEFAULT_ORIGIN = "São Paulo (GRU)";
const DEFAULT_DESTINATION = "Paraty, Brasil";

interface DiscoverData {
  origin: string;
  destination: string;
  month?: string | null;
  flights: SearchResponse;
  hotels: SearchResponse;
  tours: SearchResponse;
  transport: SearchResponse;
  web: SearchResponse;
  results: SearchResult[];
}

interface DiscoverClientProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialBudget?: string;
  initialMonth?: string;
}

export function DiscoverClient({
  initialOrigin,
  initialDestination,
  initialBudget,
  initialMonth,
}: DiscoverClientProps = {}) {
  const { supabase, user, signIn } = useAuth();
  const {
    trips,
    selectedTrip,
    selectedId,
    setSelectedId,
    reload,
    loading: tripsLoading,
  } = useTrips(supabase, user);

  const [origin, setOrigin] = useState(initialOrigin || DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(
    initialDestination || DEFAULT_DESTINATION,
  );
  const [month, setMonth] = useState(initialMonth || "");
  const [budget, setBudget] = useState(initialBudget || "3500");

  const [data, setData] = useState<DiscoverData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "flights" | "transport" | "hotels" | "tours" | "web"
  >("all");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState<{
    origin: string;
    destination: string;
    month: string;
  } | null>(null);

  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [creatingTrip, setCreatingTrip] = useState(false);

  // Campos para o "Garimpo Livre" colar link manual na Caixa
  const [manualTitle, setManualTitle] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  const runSearch = async (orig: string, dest: string, m: string) => {
    setSearching(true);
    setMessage(null);
    try {
      const qs = new URLSearchParams({
        origin: orig,
        destination: dest,
      });
      if (m && m.trim().length > 0) {
        qs.set("month", m.trim());
      }
      const res = await fetch(`/api/discover/search?${qs.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Não foi possível buscar.");
      }
      const resData = (await res.json()) as DiscoverData;
      setData(resData);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Erro ao realizar a busca.",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      return setMessage({
        type: "error",
        text: "Informe um destino para pesquisar.",
      });
    }
    setSearched({ origin, destination, month });
    runSearch(origin, destination, month);
  };

  // Dispara busca automática se os parâmetros vierem da página inicial
  useEffect(() => {
    if (initialDestination) {
      const orig = initialOrigin || DEFAULT_ORIGIN;
      const dest = initialDestination;
      const m = initialMonth || "";
      setOrigin(orig);
      setDestination(dest);
      if (initialMonth) setMonth(initialMonth);
      if (initialBudget) setBudget(initialBudget);
      setSearched({ origin: orig, destination: dest, month: m });
      runSearch(orig, dest, m);
    }
  }, [initialOrigin, initialDestination, initialMonth, initialBudget]);

  // Garante perfil antes de criar viagem
  const ensureProfile = async () => {
    if (!supabase || !user) return;
    try {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email || "",
          full_name: (
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "Viajante"
          ).slice(0, 100),
          avatar_url: user.user_metadata?.avatar_url || null,
          last_sign_in_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    } catch {}
  };

  const createTrip = async () => {
    if (!supabase || !user) return signIn();
    const dest = searched?.destination || destination;
    if (!dest.trim())
      return setMessage({
        type: "error",
        text: "Informe um destino antes de criar a viagem.",
      });
    setCreatingTrip(true);
    setMessage(null);
    try {
      await ensureProfile();
      const budgetNum = parseMoney(budget) || 3500;
      const { data: trip, error } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          title: `Roteiro ${cleanCity(dest)}`,
          destination: dest,
          origin: searched?.origin || origin || "São Paulo",
          departure_date: searched?.month ? `${searched.month}-10` : null,
          return_date: searched?.month ? `${searched.month}-17` : null,
          total_budget: budgetNum,
          status: "planning",
        })
        .select()
        .single();

      if (error) throw error;
      await reload();
      setSelectedId(trip.id);
      setMessage({
        type: "ok",
        text: `Viagem para "${cleanCity(dest)}" criada com sucesso! Selecionada acima.`,
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Não foi possível criar a viagem.",
      });
    } finally {
      setCreatingTrip(false);
    }
  };

  const saveToBox = async (item: SearchResult) => {
    if (!supabase || !user) return signIn();
    if (!selectedId) {
      return setMessage({
        type: "error",
        text: "Selecione ou crie uma viagem ativa para guardar itens na Caixa.",
      });
    }
    try {
      await ensureProfile();
      const { error } = await supabase.from("discoveries").insert({
        user_id: user.id,
        trip_id: selectedId,
        title: item.title,
        description: item.description,
        category: item.category,
        estimated_price: item.price,
        currency: item.currency || "BRL",
        source_url: item.url,
        provider: item.source,
        raw_payload: item.raw || {},
      });
      if (error) throw error;
      setSavedUrls((prev) => new Set(prev).add(item.id || item.url));
      setMessage({
        type: "ok",
        text: `"${item.title.slice(0, 40)}" guardado na sua Caixa!`,
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Erro ao guardar na Caixa.",
      });
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim() || !manualTitle.trim()) {
      return setMessage({
        type: "error",
        text: "Preencha o título e o link para guardar.",
      });
    }
    const fakeItem: SearchResult = {
      id: `manual-${Date.now()}`,
      category: "web",
      source_type: "manual",
      source: "Garimpo Livre",
      title: manualTitle.trim(),
      description: "Dica garimpada livremente na web.",
      price: null,
      currency: "BRL",
      url: manualUrl.trim(),
    };
    setSavingManual(true);
    await saveToBox(fakeItem);
    setSavingManual(false);
    setManualTitle("");
    setManualUrl("");
  };

  const cleanDest = cleanCity(searched?.destination || destination);
  const cleanOrig = cleanCity(searched?.origin || origin);

  const flightsList = data?.flights?.results || [];
  const transportList = data?.transport?.results || [];
  const hotelsList = data?.hotels?.results || [];
  const toursList = data?.tours?.results || [];
  const webList = data?.web?.results || [];
  const webNotice = data?.web?.notice;
  const isWebDegraded = data?.web?.degraded;
  const webFallback = data?.web?.fallbackUrls;

  return (
    <div className={styles.container}>
      {/* SELETOR DE VIAGEM ATIVA NO TOPO */}
      <section className={styles.tripBar}>
        <div className={styles.tripBarContent}>
          <div className={styles.tripBarLeft}>
            <Compass size={20} className={styles.tripIcon} />
            <div>
              <span className={styles.tripBarLabel}>Sua Viagem Ativa:</span>
              <TripPicker
                trips={trips}
                selectedId={selectedId}
                onChange={setSelectedId}
                loading={tripsLoading}
              />
            </div>
          </div>
          <button
            type="button"
            className={styles.createTripBtn}
            onClick={createTrip}
            disabled={creatingTrip}>
            <Plus size={16} />
            <span>
              {creatingTrip
                ? "Criando..."
                : `Criar Viagem para ${cleanDest || "Destino"}`}
            </span>
          </button>
        </div>
      </section>

      {/* CABEÇALHO E FORMULÁRIO DE BUSCA */}
      <section className={styles.heroSection}>
        <div className={styles.heroHeader}>
          <h1 className={styles.title}>
            Descobrir <span className={styles.highlight}>Destinos & Rotas</span>
          </h1>
          <p className={styles.subtitle}>
            Garimpe voos, trajetos de ônibus, hospedagens, experiências
            culturais e dicas livres em uma única busca transparente.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <MapPin size={15} /> Origem
            </label>
            <AutocompleteInput
              value={origin}
              onChange={setOrigin}
              placeholder="Ex.: São Paulo (GRU), Brasil"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <MapPin size={15} /> Destino
            </label>
            <AutocompleteInput
              value={destination}
              onChange={setDestination}
              placeholder="Ex.: Paraty, Brasil ou Salvador (SSA)"
            />
          </div>

          <div className={styles.inputGroupSmall}>
            <label className={styles.label}>
              <Calendar size={15} /> Mês de Ida
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={styles.inputField}
              placeholder="Qualquer época"
            />
            <span className={styles.fieldNote}>Opcional (flexível)</span>
          </div>

          <div className={styles.inputGroupSmall}>
            <label className={styles.label}>
              <TrendingDown size={15} /> Teto (R$)
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={styles.inputField}
              placeholder="3500"
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={searching}>
            <Search size={18} />
            <span>{searching ? "Garimpando..." : "Garimpar"}</span>
          </button>
        </form>

        {message && (
          <div
            className={message.type === "ok" ? styles.msgOk : styles.msgError}>
            {message.type === "ok" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </section>

      {/* ABAS / FILTROS DE NAVEGAÇÃO DOS RESULTADOS */}
      {data && (
        <section className={styles.tabsSection}>
          <div className={styles.tabsBar}>
            <button
              className={activeTab === "all" ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab("all")}>
              <Sparkles size={16} /> Todos ({data.results.length})
            </button>
            <button
              className={
                activeTab === "flights" ? styles.tabActive : styles.tab
              }
              onClick={() => setActiveTab("flights")}>
              <Plane size={16} /> Voos ({flightsList.length})
            </button>
            <button
              className={
                activeTab === "transport" ? styles.tabActive : styles.tab
              }
              onClick={() => setActiveTab("transport")}>
              <Bus size={16} /> Ônibus & Rome2Rio ({transportList.length})
            </button>
            <button
              className={activeTab === "hotels" ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab("hotels")}>
              <Building size={16} /> Hospedagens ({hotelsList.length})
            </button>
            <button
              className={activeTab === "tours" ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab("tours")}>
              <Ticket size={16} /> Passeios & Experiências ({toursList.length})
            </button>
            <button
              className={activeTab === "web" ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab("web")}>
              <Globe size={16} /> Garimpo Livre{" "}
              {isWebDegraded ? "(Ativado)" : `(${webList.length})`}
            </button>
          </div>
        </section>
      )}

      {/* ÁREA DE RESULTADOS */}
      {searching && (
        <div className={styles.loadingArea}>
          <div className={styles.spinner} />
          <p>
            Consultando Travelpayouts, OpenTripMap, Rome2Rio, Booking e vias
            terrestres...
          </p>
        </div>
      )}

      {data && !searching && (
        <div className={styles.resultsArea}>
          {/* 1. SEÇÃO VOOS */}
          {(activeTab === "all" || activeTab === "flights") && (
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <Plane className={styles.sectionIcon} />
                  <h2>Voos & Passagens Aéreas</h2>
                </div>
                <span className={styles.sectionBadge}>
                  Travelpayouts & Google Voos
                </span>
              </div>

              {/* AVISO CASO NÃO HAJA AEROPORTO */}
              {data.flights.notice && (
                <div className={styles.noticeCard}>
                  <AlertCircle size={20} className={styles.noticeIcon} />
                  <div className={styles.noticeContent}>
                    <p>{data.flights.notice}</p>
                    {data.flights.fallbackUrls?.google && (
                      <a
                        href={data.flights.fallbackUrls.google}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.linkButtonSmall}>
                        <ExternalLink size={14} /> Abrir busca flexível no
                        Google Voos
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* LISTA DE VOOS ENCONTRADOS */}
              {flightsList.length > 0 && (
                <div className={styles.grid}>
                  {flightsList.map((flight, idx) => {
                    const saved = savedUrls.has(flight.id || flight.url);
                    const googleUrl =
                      flight.raw?.google_flights_url ||
                      `https://www.google.com/travel/flights?q=Voos+para+${cleanDest}&hl=pt-BR&curr=BRL`;

                    return (
                      <div key={`${flight.id}-${idx}`} className={styles.card}>
                        <div className={styles.cardHeader}>
                          <span className={styles.sourceTag}>
                            {flight.source}
                          </span>
                          {flight.price && (
                            <span className={styles.priceTag}>
                              {formatBRL(flight.price)}
                            </span>
                          )}
                        </div>
                        <h3 className={styles.cardTitle}>{flight.title}</h3>
                        <p className={styles.cardDesc}>{flight.description}</p>
                        <div className={styles.disclaimerText}>
                          Tarifa garimpada em cache histórico. Preços variam em
                          tempo real.
                        </div>
                        <div className={styles.cardActions}>
                          <a
                            href={googleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtnPrimary}>
                            <ExternalLink size={15} />
                            <span>Google Voos (com datas)</span>
                          </a>
                          <a
                            href={flight.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtnSecondary}>
                            <span>Aviasales</span>
                          </a>
                          <button
                            type="button"
                            className={saved ? styles.savedBtn : styles.saveBtn}
                            onClick={() => saveToBox(flight)}
                            disabled={saved}>
                            <BookmarkPlus size={16} />
                            <span>{saved ? "Guardado" : "Guardar"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 2. SEÇÃO ROTAS TERRESTRES & ÔNIBUS */}
          {(activeTab === "all" || activeTab === "transport") && (
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <Bus className={styles.sectionIcon} />
                  <h2>Ônibus, Rome2Rio & Rotas Terrestres</h2>
                </div>
                <span className={styles.sectionBadge}>Conexões Integradas</span>
              </div>

              <div className={styles.grid}>
                {transportList.map((item) => {
                  const saved = savedUrls.has(item.id || item.url);
                  const isRome2Rio = item.source === "Rome2Rio";

                  return (
                    <div
                      key={item.id}
                      className={
                        isRome2Rio
                          ? `${styles.card} ${styles.highlightCard}`
                          : styles.card
                      }>
                      <div className={styles.cardHeader}>
                        <span className={styles.sourceTag}>{item.source}</span>
                        {isRome2Rio && (
                          <span className={styles.badgePromo}>Recomendado</span>
                        )}
                      </div>
                      <h3 className={styles.cardTitle}>{item.title}</h3>
                      <p className={styles.cardDesc}>{item.description}</p>
                      <div className={styles.cardActions}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionBtnPrimary}>
                          <ExternalLink size={15} />
                          <span>Ver Rotas no {item.source}</span>
                        </a>
                        <button
                          type="button"
                          className={saved ? styles.savedBtn : styles.saveBtn}
                          onClick={() => saveToBox(item)}
                          disabled={saved}>
                          <BookmarkPlus size={16} />
                          <span>{saved ? "Guardado" : "Guardar"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. SEÇÃO HOSPEDAGENS */}
          {(activeTab === "all" || activeTab === "hotels") && (
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <Building className={styles.sectionIcon} />
                  <h2>Hospedagens & Pousadas</h2>
                </div>
                <span className={styles.sectionBadge}>
                  Booking.com & Geoapify
                </span>
              </div>

              {/* CARD DESTAQUE DO BOOKING */}
              <div className={styles.partnerBanner}>
                <div className={styles.partnerBannerInfo}>
                  <h3>Pesquisar Todas as Hospedagens em {cleanDest}</h3>
                  <p>
                    Veja opções de pousadas, hotéis e chalés com notas reais e
                    cancelamento grátis no Booking.
                  </p>
                </div>
                <a
                  href={`https://www.booking.com/searchresults.pt-br.html?ss=${encodeURIComponent(cleanDest)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.bannerBtn}>
                  <ExternalLink size={16} />
                  <span>Abrir Booking.com</span>
                </a>
              </div>

              <div className={styles.grid}>
                {hotelsList.map((hotel) => {
                  const saved = savedUrls.has(hotel.id || hotel.url);
                  return (
                    <div key={hotel.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <span className={styles.sourceTag}>Hospedagem</span>
                      </div>
                      <h3 className={styles.cardTitle}>{hotel.title}</h3>
                      <p className={styles.cardDesc}>{hotel.description}</p>
                      <div className={styles.cardActions}>
                        <a
                          href={hotel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionBtnPrimary}>
                          <ExternalLink size={15} />
                          <span>Ver no Booking</span>
                        </a>
                        {hotel.raw?.map_url && (
                          <a
                            href={hotel.raw.map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtnSecondary}>
                            <MapPin size={15} />
                            <span>Mapa</span>
                          </a>
                        )}
                        <button
                          type="button"
                          className={saved ? styles.savedBtn : styles.saveBtn}
                          onClick={() => saveToBox(hotel)}
                          disabled={saved}>
                          <BookmarkPlus size={16} />
                          <span>{saved ? "Guardado" : "Guardar"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. SEÇÃO PASSEIOS & EXPERIÊNCIAS */}
          {(activeTab === "all" || activeTab === "tours") && (
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <Ticket className={styles.sectionIcon} />
                  <h2>Passeios, Ingressos & Atrações Culturais</h2>
                </div>
                <span className={styles.sectionBadge}>
                  GetYourGuide, Civitatis & OpenTripMap
                </span>
              </div>

              {/* AGREGADORES EM DESTAQUE */}
              <div className={styles.aggregatorsBox}>
                <span className={styles.aggregatorsTitle}>
                  Garimpar Passeios & Experiências nos Agregadores:
                </span>
                <div className={styles.aggregatorsRow}>
                  <a
                    href={`https://www.getyourguide.com.br/s/?q=${encodeURIComponent(cleanDest)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.aggregatorBtn}>
                    <ExternalLink size={14} /> GetYourGuide
                  </a>
                  <a
                    href={`https://www.civitatis.com/br/busca?q=${encodeURIComponent(cleanDest)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.aggregatorBtn}>
                    <ExternalLink size={14} /> Civitatis
                  </a>
                  <a
                    href={`https://www.tripadvisor.com.br/Search?q=${encodeURIComponent("passeios em " + cleanDest)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.aggregatorBtn}>
                    <ExternalLink size={14} /> Tripadvisor
                  </a>
                  <a
                    href={`https://www.viator.com/searchResults/all?text=${encodeURIComponent(cleanDest)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.aggregatorBtn}>
                    <ExternalLink size={14} /> Viator
                  </a>
                </div>
              </div>

              {data.tours.notice && (
                <div className={styles.noticeCard}>
                  <AlertCircle size={20} className={styles.noticeIcon} />
                  <p>{data.tours.notice}</p>
                </div>
              )}

              <div className={styles.grid}>
                {toursList.map((tour) => {
                  const saved = savedUrls.has(tour.id || tour.url);
                  return (
                    <div key={tour.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <span className={styles.sourceTag}>{tour.source}</span>
                      </div>
                      <h3 className={styles.cardTitle}>{tour.title}</h3>
                      <p className={styles.cardDesc}>{tour.description}</p>
                      <div className={styles.cardActions}>
                        <a
                          href={tour.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionBtnPrimary}>
                          <ExternalLink size={15} />
                          <span>Buscar Ingressos</span>
                        </a>
                        {tour.raw?.map_url && (
                          <a
                            href={tour.raw.map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtnSecondary}>
                            <MapPin size={15} />
                            <span>Mapa</span>
                          </a>
                        )}
                        <button
                          type="button"
                          className={saved ? styles.savedBtn : styles.saveBtn}
                          onClick={() => saveToBox(tour)}
                          disabled={saved}>
                          <BookmarkPlus size={16} />
                          <span>{saved ? "Guardado" : "Guardar"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 5. SEÇÃO GARIMPO LIVRE NA WEB (Brave Search / Fallback) */}
          {(activeTab === "all" || activeTab === "web") && (
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <Globe className={styles.sectionIcon} />
                  <h2>Garimpo Livre na Web</h2>
                </div>
                <span className={styles.sectionBadge}>
                  {isWebDegraded ? "Modo Livre Ativado" : "Brave Search API"}
                </span>
              </div>

              {/* BANNER SE COTA ESTIVER SIMULADA OU ESGOTADA */}
              {(isWebDegraded || webNotice) && (
                <div className={styles.degradedBanner}>
                  <div className={styles.degradedInfo}>
                    <h3>🌐 Modo Garimpo Livre Ativado</h3>
                    <p>
                      {webNotice ||
                        "Pesquise dicas e blogs em uma nova guia no Google ou Brave e cole os links que achar interessantes abaixo para guardar no seu roteiro:"}
                    </p>
                  </div>
                  <div className={styles.degradedButtons}>
                    <a
                      href={
                        webFallback?.google ||
                        `https://www.google.com/search?q=${encodeURIComponent(`o que fazer em ${cleanDest} dicas roteiro`)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.engineBtn}>
                      <ExternalLink size={16} />
                      <span>Pesquisar no Google</span>
                    </a>
                    <a
                      href={
                        webFallback?.brave ||
                        `https://search.brave.com/search?q=${encodeURIComponent(`o que fazer em ${cleanDest} dicas roteiro`)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.engineBtn}>
                      <ExternalLink size={16} />
                      <span>Pesquisar no Brave</span>
                    </a>
                  </div>

                  {/* FORMULÁRIO DE COLAR LINK DIRETO */}
                  <form
                    onSubmit={handleManualSave}
                    className={styles.manualForm}>
                    <h4>Guardar Link Encontrado na Minha Caixa</h4>
                    <div className={styles.manualRow}>
                      <input
                        type="text"
                        placeholder="Título da dica (ex.: Melhores praias de Paraty)"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className={styles.manualInput}
                      />
                      <input
                        type="url"
                        placeholder="Cole o link aqui (https://...)"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        className={styles.manualInputUrl}
                      />
                      <button
                        type="submit"
                        className={styles.manualSaveBtn}
                        disabled={savingManual}>
                        <BookmarkPlus size={16} />
                        <span>
                          {savingManual ? "Salvando..." : "Guardar na Caixa"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* RESULTADOS NORMAIS SE O BRAVE ESTIVER RETORNANDO */}
              {webList.length > 0 && !isWebDegraded && (
                <div className={styles.grid}>
                  {webList.map((webItem) => {
                    const saved = savedUrls.has(webItem.id || webItem.url);
                    return (
                      <div key={webItem.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                          <span className={styles.sourceTag}>Brave Web</span>
                        </div>
                        <h3 className={styles.cardTitle}>{webItem.title}</h3>
                        <p className={styles.cardDesc}>{webItem.description}</p>
                        <div className={styles.cardActions}>
                          <a
                            href={webItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtnPrimary}>
                            <ExternalLink size={15} />
                            <span>Abrir Artigo</span>
                          </a>
                          <button
                            type="button"
                            className={saved ? styles.savedBtn : styles.saveBtn}
                            onClick={() => saveToBox(webItem)}
                            disabled={saved}>
                            <BookmarkPlus size={16} />
                            <span>{saved ? "Guardado" : "Guardar"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
