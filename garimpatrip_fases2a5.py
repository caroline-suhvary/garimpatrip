#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GarimpaTrip · complemento das Fases 2–5, Python 3.9+.

Aplicar na raiz do repositório, depois do patch da Fase 1. Cria backups antes
 de escrever e recusa versões inesperadas dos arquivos-alvo.
"""
import os
import sys
import shutil


def read_text(path):
    with open(path, "rb") as f:
        raw = f.read()
    return raw.decode("utf-8").replace("\r\n", "\n"), b"\r\n" in raw


def write_text(path, text, crlf):
    data = text.replace("\r\n", "\n")
    if crlf:
        data = data.replace("\n", "\r\n")
    with open(path, "wb") as f:
        f.write(data.encode("utf-8"))


def backup(path, tag):
    backup_path = path + ".bak_" + tag
    if not os.path.exists(backup_path):
        shutil.copy2(path, backup_path)
        print("[i] Backup: " + backup_path)


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise ValueError("{}: esperado 1 trecho, encontrado {}".format(label, count))
    return text.replace(old, new, 1)


def write_new(path, content):
    parent = os.path.dirname(path)
    if parent and not os.path.isdir(parent):
        os.makedirs(parent)
    if os.path.exists(path):
        existing, crlf = read_text(path)
        if existing == content:
            print("[i] Já atualizado: " + path)
            return
        backup(path, "fases2a5")
    else:
        crlf = False
    write_text(path, content, crlf)
    print("[+] Criado/atualizado: " + path)


def patch_providers(root):
    path = os.path.join(root, "src", "lib", "providers.ts")
    text, crlf = read_text(path)
    if "// GT_PHASES_2_5_WIKIVOYAGE" in text and "// GT_PHASES_2_5_FERRY" in text:
        print("[i] providers.ts já contém as fases 2–5.")
        return
    start = text.find("export async function searchTransport(")
    end = text.find("export async function searchWeb(", start)
    if start < 0 or end < 0:
        raise ValueError("providers.ts: não localizei os limites de searchTransport/searchWeb")
    backup(path, "fases2a5")
    transport = r'''// GT_PHASES_2_5_FERRY
async function searchFerryTerminals(destination: string): Promise<SearchResult[]> {
  const point = await geocode(destination);
  if (!point) return [];
  const radius = 18000;
  const query = `[out:json][timeout:12];(node[amenity=ferry_terminal](around:${radius},${point.lat},${point.lon});way[amenity=ferry_terminal](around:${radius},${point.lat},${point.lon});relation[amenity=ferry_terminal](around:${radius},${point.lat},${point.lon});node[waterway=dock](around:${radius},${point.lat},${point.lon});way[waterway=dock](around:${radius},${point.lat},${point.lon});node[leisure=boat_rental](around:${radius},${point.lat},${point.lon}););out center tags 12;`;
  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "GarimpaTrip/1.0 (contato@garimpatrip.com.br)" },
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!response.ok) return [];
    const data = await response.json() as { elements?: Array<{ id: number; type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> };
    return (data.elements || []).slice(0, 8).map((element) => {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      const tags = element.tags || {};
      const name = tags.name || tags["name:pt"] || "Terminal ou serviço náutico";
      const kind = tags.amenity === "ferry_terminal" ? "Terminal de balsas" : tags.leisure === "boat_rental" ? "Aluguel de barcos" : "Doca / terminal náutico";
      const mapUrl = lat != null && lon != null ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}` : `https://www.openstreetmap.org/search?query=${encodeURIComponent(name + " " + destination)}`;
      return {
        id: `osm-nautical-${element.type}-${element.id}`,
        category: "transport" as const,
        source_type: "web_result" as const,
        source: "OpenStreetMap",
        title: name,
        description: `${kind} · ${destination}`,
        price: null,
        currency: "BRL",
        url: mapUrl,
        raw: { type: "nautical", latitude: lat ?? null, longitude: lon ?? null, address: tags["addr:street"] || null, map_url: mapUrl, tags },
      };
    });
  } catch {
    return [];
  }
}

export async function searchTransport(
  destination: string,
  origin = "São Paulo",
): Promise<SearchResponse> {
  const destinationFull = cityName(destination);
  const cleanDest = cleanCity(destination);
  const cleanOrig = cleanCity(origin) || "São Paulo";
  const slugOrig = slugifyCity(cleanOrig);
  const slugDest = slugifyCity(cleanDest);
  const market = transportMarket(destinationFull);
  const rome2rioUrl = `https://www.rome2rio.com/pt/map/${encodeURIComponent(cleanOrig)}/${encodeURIComponent(cleanDest)}?accom_comparison=true`;
  const transportCards: SearchResult[] = [];
  const normDest = destination.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const isNoronha = /fernando\s+de\s+noronha|noronha\b|\bfen\b/.test(normDest);

  if (isNoronha) {
    transportCards.push({ id: `transport-bus-hub-${slugDest}`, category: "transport", source_type: "manual", source: "Transporte Terrestre", title: "Não há transporte de ônibus em Fernando de Noronha", description: "Fernando de Noronha é uma ilha. Consulte voos e opções náuticas locais; confirme disponibilidade diretamente com os operadores.", price: null, currency: "BRL", url: rome2rioUrl, raw: { type: "bus_hub", partnerLinks: [{ name: "Ver opções no Rome2Rio", url: rome2rioUrl }] } });
  } else if (market === "br") {
    transportCards.push({ id: `transport-bus-hub-${slugOrig}-${slugDest}`, category: "transport", source_type: "manual", source: "Passagens Rodoviárias", title: `Pesquise passagens de ônibus de ${cleanOrig} para ${cleanDest}`, description: "Consulte empresas e buscadores rodoviários; disponibilidade e horários variam por rota.", price: null, currency: "BRL", url: "https://www.clickbus.com.br", raw: { type: "bus_hub", partnerLinks: [{ name: "ClickBus", url: "https://www.clickbus.com.br" }, { name: "DeÔnibus", url: "https://deonibus.com" }, { name: "Buser", url: "https://www.buser.com.br" }, { name: "FlixBus", url: "https://www.flixbus.com.br" }] } });
  } else if (market === "south-america") {
    transportCards.push({ id: `transport-bus-hub-${slugOrig}-${slugDest}`, category: "transport", source_type: "manual", source: "Passagens Rodoviárias", title: `Pesquise passagens de ônibus de ${cleanOrig} para ${cleanDest}`, description: "Consulte empresas e buscadores rodoviários para viagens na América do Sul.", price: null, currency: "BRL", url: "https://www.clickbus.com.br", raw: { type: "bus_hub", partnerLinks: [{ name: "ClickBus", url: "https://www.clickbus.com.br" }, { name: "DeÔnibus", url: "https://deonibus.com" }, { name: "FlixBus", url: "https://www.flixbus.com.br" }] } });
  } else {
    transportCards.push({ id: `transport-bus-hub-${slugDest}`, category: "transport", source_type: "manual", source: "Ônibus & Trens", title: `Pesquise viagens intermunicipais saindo de ${cleanDest}`, description: "Consulte conexões de ônibus e trem disponíveis no destino; os sites parceiros podem pedir que você informe a rota.", price: null, currency: "BRL", url: "https://global.flixbus.com", raw: { type: "bus_hub", partnerLinks: [{ name: "FlixBus", url: "https://global.flixbus.com" }, { name: "Omio", url: "https://www.omio.com.br" }] } });
  }

  transportCards.push({ id: `transport-rome2rio-${slugOrig}-${slugDest}`, category: "transport", source_type: "manual", source: "Rome2Rio", title: `Rotas multimodais: ${cleanOrig} → ${cleanDest}`, description: "Compare opções e conexões multimodais. Confira os detalhes diretamente com cada operador.", price: null, currency: "BRL", url: rome2rioUrl, raw: { type: "multimodal", provider: "Rome2Rio" } });

  try {
    const geoPlaces = await geoapifyPlaces(destinationFull, "rental.car", "transport", "Aluguel de carros");
    const rentalTerms = /rental\.car|rental_car|car_rental|car rental|rent a car|car hire|rental car|rentacar|aluguel de carro|aluguel de ve[ií]culo|locadora|locadora de ve[ií]culos|hertz|avis|localiza|movida|europcar|sixt|enterprise|budget/i;
    const rentalCards = (geoPlaces.results || []).filter((item) => rentalTerms.test(`${item.title} ${item.description} ${JSON.stringify(item.raw || {})}`)).map((item) => ({ ...item, source: "Locadora de veículos" }));
    const nauticalCards = await searchFerryTerminals(destinationFull);
    return { results: [...transportCards, ...rentalCards, ...nauticalCards], fallbackUrls: { rome2rio: rome2rioUrl } };
  } catch {
    return { results: transportCards, fallbackUrls: { rome2rio: rome2rioUrl } };
  }
}

'''
    text = text[:start] + transport + text[end:]
    # Rebuild searchWeb to retrieve Wikivoyage sections, keeping Brave local-only behavior.
    start = text.find("export async function searchWeb(")
    end = text.find("function wmoCondition(", start)
    if start < 0 or end < 0:
        raise ValueError("providers.ts: não localizei limites de searchWeb/wmoCondition")
    web = r'''// GT_PHASES_2_5_WIKIVOYAGE
function wikiHtmlToText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\[editar\]/gi, " ").replace(/\s+/g, " ").trim();
}

export async function searchWeb(destination: string): Promise<SearchResponse> {
  const fullPlace = cityName(destination).trim();
  const city = cleanCity(destination).trim();
  const query = `o que fazer em ${fullPlace} dicas turismo roteiro`;
  const fallbackUrls = {
    google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    brave: `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
    duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
    youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(`roteiro viagem ${fullPlace}`)}`,
    tripadvisor: `https://www.tripadvisor.com.br/Search?q=${encodeURIComponent(`atrações ${fullPlace}`)}`,
  };
  const results: SearchResult[] = [];
  const seen = new Set<string>();
  try {
    const searchUrl = `https://pt.wikivoyage.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(city)}&gsrlimit=6&prop=extracts|pageimages|info&exintro=1&explaintext=1&exchars=700&piprop=thumbnail&pithumbsize=640&inprop=url&origin=*`;
    const data = await getJson<{ query?: { pages?: Record<string, { pageid?: number; index?: number; title?: string; extract?: string; canonicalurl?: string; fullurl?: string; thumbnail?: { source?: string } }> } }>(searchUrl, { headers: { "User-Agent": "GarimpaTrip/1.0 (contato@garimpatrip.com.br)" }, next: { revalidate: 86400 } });
    const pages = Object.values(data.query?.pages || {}).sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
    for (const page of pages) {
      if (!page.extract || page.extract.trim().length < 30 || !page.pageid) continue;
      const pageTitle = page.title || city;
      const pageUrl = page.canonicalurl || page.fullurl || `https://pt.wikivoyage.org/wiki/${encodeURIComponent(pageTitle)}`;
      const exact = pageTitle.toLocaleLowerCase("pt-BR").includes(city.toLocaleLowerCase("pt-BR"));
      if (!exact && pages.length > 1) continue;
      results.push({ id: `wiki-${page.pageid}`, category: "web", source_type: "web_result", source: "Wikivoyage", title: `Guia de viagem: ${pageTitle}`, description: page.extract.replace(/\s+/g, " ").trim(), price: null, currency: "BRL", url: pageUrl, raw: { imageUrl: page.thumbnail?.source || null, wiki: true, place: fullPlace } });
      seen.add(String(page.pageid));
      try {
        const sectionUrl = `https://pt.wikivoyage.org/w/api.php?action=parse&format=json&pageid=${page.pageid}&prop=sections&origin=*`;
        const sectionData = await getJson<{ parse?: { sections?: Array<{ index: string; line: string; level: string }> } }>(sectionUrl, { headers: { "User-Agent": "GarimpaTrip/1.0 (contato@garimpatrip.com.br)" }, next: { revalidate: 86400 } });
        const groups: Array<{ label: string; terms: RegExp; section: Array<{ index: string; line: string }> }> = [
          { label: "Ver e conhecer", terms: /^(see|ver|atrações|atracoes|pontos turísticos|pontos turisticos|o que ver)/i, section: [] },
          { label: "Fazer", terms: /^(do|fazer|atividades|praias|trilhas)/i, section: [] },
          { label: "Comer", terms: /^(eat|comer|gastronomia|restaurantes)/i, section: [] },
          { label: "Dormir", terms: /^(sleep|dormir|hospedagem|onde ficar)/i, section: [] },
        ];
        for (const section of sectionData.parse?.sections || []) {
          const group = groups.find((candidate) => candidate.terms.test(section.line.replace(/<[^>]+>/g, "").trim()));
          if (group && group.section.length < 1) group.section.push({ index: section.index, line: section.line });
        }
        for (const group of groups) {
          const selected = group.section[0];
          if (!selected) continue;
          try {
            const detailUrl = `https://pt.wikivoyage.org/w/api.php?action=parse&format=json&pageid=${page.pageid}&section=${encodeURIComponent(selected.index)}&prop=text&origin=*`;
            const detail = await getJson<{ parse?: { text?: { "*"?: string } } }>(detailUrl, { headers: { "User-Agent": "GarimpaTrip/1.0 (contato@garimpatrip.com.br)" }, next: { revalidate: 86400 } });
            const description = wikiHtmlToText(detail.parse?.text?.["*"] || "").slice(0, 700);
            if (description.length < 35) continue;
            results.push({ id: `wiki-${page.pageid}-section-${selected.index}`, category: "web", source_type: "web_result", source: "Wikivoyage", title: `${group.label} em ${pageTitle}`, description, price: null, currency: "BRL", url: pageUrl, raw: { imageUrl: page.thumbnail?.source || null, wiki: true, section: group.label, place: fullPlace } });
          } catch { /* Se uma seção falhar, o guia principal continua disponível. */ }
        }
      } catch { /* Seções são complementares: não removemos o guia principal. */ }
    }
  } catch (err: unknown) {
    console.warn("Consulta ao Wikivoyage falhou:", err instanceof Error ? err.message : err);
  }
  // Brave permanece exclusivamente local, mediante opt-in explícito.
  const isLocalBraveEnabled = process.env.NODE_ENV !== "production" && process.env.ENABLE_BRAVE_LOCAL === "true" && Boolean(process.env.BRAVE_SEARCH_API_KEY) && process.env.BRAVE_SIMULATE_QUOTA !== "true";
  if (isLocalBraveEnabled) {
    try {
      const data = await getJson<{ web?: { results?: { title: string; url: string; description?: string }[] } }>(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&country=BR&search_lang=pt-br&count=8`, { headers: { "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY!, Accept: "application/json" } });
      (data.web?.results || []).forEach((item, index) => results.push({ id: `brave-${index}-${slugifyCity(fullPlace)}`, category: "web", source_type: "web_result", source: "Brave Search (Local)", title: item.title, description: item.description || "", price: null, currency: "BRL", url: item.url, raw: { ...item, place: fullPlace } }));
    } catch (err: unknown) {
      console.warn("Brave local indisponível:", err instanceof Error ? err.message : err);
    }
  }
  return { results, fallbackUrls };
}

'''
    text = text[:start] + web + text[end:]
    write_text(path, text, crlf)
    print("[+] Atualizado: src/lib/providers.ts")


def create_components(root):
    location = r'''"use client";
import React, { useEffect, useState } from "react";

type Suggestion = { name: string; street?: string; housenumber?: string; city?: string; state?: string; country?: string; lat: number; lon: number; osm_id?: number; osm_type?: string };
interface Props { value?: string | null; placeholder?: string; onSelect: (place: { address: string; latitude: number; longitude: number; place_id: string }) => void; }

export function LocationAutocomplete({ value, placeholder = "Endereço opcional para aparecer no mapa", onSelect }: Props) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setQuery(value || ""); }, [value]);
  useEffect(() => {
    if (query.trim().length < 3 || query === value) { setSuggestions([]); return; }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=pt`;
        const response = await fetch(url);
        const data = await response.json() as { features?: Array<{ properties: Suggestion; geometry: { coordinates: [number, number] } }> };
        if (!cancelled) setSuggestions((data.features || []).map((feature) => ({ ...feature.properties, lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] })));
      } catch { if (!cancelled) setSuggestions([]); }
      finally { if (!cancelled) setLoading(false); }
    }, 350);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [query, value]);
  const label = (place: Suggestion) => [place.name, place.street, place.housenumber, place.city, place.state, place.country].filter(Boolean).join(", ");
  return <div className="gt-location-autocomplete"><input className="gt-input" value={query} placeholder={placeholder} onChange={(event) => setQuery(event.target.value)} aria-label="Endereço opcional" />{loading && <small>Buscando endereço…</small>}{suggestions.length > 0 && <ul className="gt-location-suggestions">{suggestions.map((place, index) => <li key={`${place.osm_type || "p"}-${place.osm_id || index}`}><button type="button" onClick={() => { const address = label(place); setQuery(address); setSuggestions([]); onSelect({ address, latitude: place.lat, longitude: place.lon, place_id: `${place.osm_type || "photon"}:${place.osm_id || address}` }); }}>{label(place)}</button></li>)}</ul>}</div>;
}
'''
    write_new(os.path.join(root, "src", "components", "package", "LocationAutocomplete.tsx"), location)

    map_component = r'''"use client";
import React, { useEffect, useRef } from "react";
import type { PackageItem, ScheduleItem } from "@/types";

declare global { interface Window { L?: any; } }
interface Props { items: PackageItem[]; schedule: ScheduleItem[]; }
const COLORS: Record<number, string> = { 1: "#e85d4a", 2: "#3478c5", 3: "#ed8b26", 4: "#8056b3", 5: "#718096", 6: "#2c9a69", 7: "#be8a18", 10: "#53616f" };

export function ConsolidatedTripMap({ items, schedule }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const points = [
    ...items.filter((item) => item.latitude != null && item.longitude != null).map((item) => ({ title: item.title, lat: Number(item.latitude), lon: Number(item.longitude), category: item.category_id, address: item.address || "" })),
    ...schedule.filter((item) => item.latitude != null && item.longitude != null).map((item) => ({ title: item.title, lat: Number(item.latitude), lon: Number(item.longitude), category: 8, address: item.location_name || "" })),
  ];
  useEffect(() => {
    const host = elementRef.current;
    if (!host || points.length === 0) return;
    let map: any;
    let cancelled = false;
    const cssId = "gt-leaflet-css";
    if (!document.getElementById(cssId)) { const link = document.createElement("link"); link.id = cssId; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link); }
    const init = () => {
      if (cancelled || !host || !window.L) return;
      map = window.L.map(host).setView([points[0].lat, points[0].lon], 12);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      const markers: any[] = [];
      points.forEach((point) => { const marker = window.L.circleMarker([point.lat, point.lon], { radius: 8, color: "#fff", weight: 2, fillColor: COLORS[point.category] || "#e85d4a", fillOpacity: 0.95 }).addTo(map); marker.bindPopup(`<strong>${String(point.title).replace(/[<>&]/g, "")}</strong>${point.address ? `<br>${String(point.address).replace(/[<>&]/g, "")}` : ""}`); markers.push(marker); });
      if (markers.length > 1) map.fitBounds(window.L.featureGroup(markers).getBounds().pad(0.15));
    };
    if (window.L) init();
    else {
      const existing = document.getElementById("gt-leaflet-js") as HTMLScriptElement | null;
      const script = existing || document.createElement("script");
      script.id = "gt-leaflet-js"; script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = init;
      if (!existing) document.body.appendChild(script);
    }
    return () => { cancelled = true; if (map) map.remove(); };
  }, [points.map((point) => `${point.lat},${point.lon},${point.title}`).join("|")]);
  if (points.length === 0) return <section className="gt-trip-map"><h3>Mapa da viagem</h3><p>Adicione endereços aos itens para ver os pontos salvos neste mapa. O endereço é opcional.</p></section>;
  return <section className="gt-trip-map"><h3>Mapa consolidado da viagem</h3><p>Os pontos aparecem quando um endereço é selecionado. Cores representam as áreas do pacote.</p><div className="gt-trip-map-legend">{[[2,"Hospedagens"],[3,"Passeios"],[6,"Alimentação"],[4,"Deslocamento"],[8,"Cronograma"]].map(([id,label]) => <span key={String(id)}><i style={{ background: COLORS[Number(id)] || "#e85d4a" }} />{label}</span>)}</div><div ref={elementRef} className="gt-trip-map-canvas" role="application" aria-label="Mapa com os locais salvos na viagem" /></section>;
}
'''
    write_new(os.path.join(root, "src", "components", "package", "ConsolidatedTripMap.tsx"), map_component)

    docs_component = r'''"use client";
import React from "react";
import { ExternalLink } from "lucide-react";
import type { Trip } from "@/types";

export function TravelDocumentsPanel({ trip }: { trip: Trip }) {
  const destination = encodeURIComponent(trip.destination_city);
  return <aside className="gt-docs-panel"><h3>Antes de viajar: documentação e saúde</h3><p>As exigências dependem da nacionalidade, do itinerário e das regras vigentes. Confirme os requisitos oficiais para <strong>{trip.destination_city}</strong> antes de comprar a viagem.</p><ul><li>Verifique passaporte, visto e prazo de permanência para a sua nacionalidade.</li><li>Confira vacinas, certificado internacional e recomendações sanitárias.</li><li>Considere seguro viagem e leve documentos e medicamentos essenciais na bagagem de mão.</li></ul><div><a href={`https://www.google.com/search?q=${destination}+site%3Agov.br%2Fmre+visto+brasileiros`} target="_blank" rel="noopener noreferrer">Consultar orientações do Itamaraty <ExternalLink size={13} /></a><a href="https://www.gov.br/anvisa/pt-br/assuntos/paf/certificado-internacional-de-vacinacao" target="_blank" rel="noopener noreferrer">Consultar Anvisa / vacinação <ExternalLink size={13} /></a></div><small>O GarimpaTrip não substitui a confirmação com consulados, companhias aéreas ou autoridades sanitárias.</small></aside>;
}
'''
    write_new(os.path.join(root, "src", "components", "package", "TravelDocumentsPanel.tsx"), docs_component)


def patch_package(root):
    type_path = os.path.join(root, "src", "types", "index.ts")
    text, crlf = read_text(type_path)
    package_item_start = text.find("export interface PackageItem")
    package_item_end = text.find("export interface ScheduleItem", package_item_start)
    package_item_block = text[package_item_start:package_item_end]
    if "latitude?: number | null;" not in package_item_block:
        text = replace_once(text, "  meta_details?: Record<string, unknown>;\n  created_at: string;\n}", "  meta_details?: Record<string, unknown>;\n  address?: string | null;\n  latitude?: number | null;\n  longitude?: number | null;\n  place_id?: string | null;\n  created_at: string;\n}", "PackageItem geo fields")
    if "latitude?: number | null;" not in text[text.find("export interface ScheduleItem"):text.find("export interface PackageCategory")]:
        text = replace_once(text, "  location_name: string | null;\n  notes: string | null;", "  location_name: string | null;\n  latitude?: number | null;\n  longitude?: number | null;\n  notes: string | null;", "ScheduleItem geo fields")
    backup(type_path, "fases2a5")
    write_text(type_path, text, crlf)

    row_path = os.path.join(root, "src", "components", "package", "PackageItemRow.tsx")
    text, crlf = read_text(row_path)
    if "LocationAutocomplete" not in text:
        text = replace_once(text, "import styles from '@/styles/Package.module.css';", "import styles from '@/styles/Package.module.css';\nimport { LocationAutocomplete } from '@/components/package/LocationAutocomplete';", "PackageItemRow import")
        anchor = "      <div className={styles.itemControls}>"
        insert = "      <div className={styles.itemLocation}><LocationAutocomplete value={item.address} onSelect={(place) => onUpdate(item.id, place)} /></div>\n"
        text = replace_once(text, anchor, insert + anchor, "PackageItemRow address field")
        backup(row_path, "fases2a5")
        write_text(row_path, text, crlf)

    schedule_path = os.path.join(root, "src", "components", "package", "ScheduleArea.tsx")
    text, crlf = read_text(schedule_path)
    if "LocationAutocomplete" not in text:
        text = replace_once(text, "import styles from '@/styles/Package.module.css';", "import styles from '@/styles/Package.module.css';\nimport { LocationAutocomplete } from '@/components/package/LocationAutocomplete';", "ScheduleArea import")
        text = replace_once(text, "const [form, setForm] = useState({ day: '1', time: '', title: '', location: '', rainy: false });", "const [form, setForm] = useState({ day: '1', time: '', title: '', location: '', latitude: null as number | null, longitude: null as number | null, rainy: false });", "ScheduleArea state")
        text = replace_once(text, "        location_name: form.location.trim() || null,\n        is_rainy_day_alternative: form.rainy,", "        location_name: form.location.trim() || null,\n        latitude: form.latitude,\n        longitude: form.longitude,\n        is_rainy_day_alternative: form.rainy,", "ScheduleArea insert coordinates")
        text = replace_once(text, "setForm({ ...form, time: '', title: '', location: '', rainy: false });", "setForm({ ...form, time: '', title: '', location: '', latitude: null, longitude: null, rainy: false });", "ScheduleArea reset")
        old = "<label className=\"gt-label\">Local<input className=\"gt-input\" value={form.location} maxLength={200} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder=\"Opcional\" /></label>"
        new = "<label className=\"gt-label\">Local <small>(endereço ajuda a incluir no mapa)</small><LocationAutocomplete value={form.location} placeholder=\"Rua, atração ou endereço opcional\" onSelect={(place) => setForm({ ...form, location: place.address, latitude: place.latitude, longitude: place.longitude })} /></label>"
        text = replace_once(text, old, new, "ScheduleArea location autocomplete")
        backup(schedule_path, "fases2a5")
        write_text(schedule_path, text, crlf)

    client_path = os.path.join(root, "src", "components", "package", "PackageClient.tsx")
    text, crlf = read_text(client_path)
    if "ConsolidatedTripMap" not in text:
        text = replace_once(text, "import { CurrencyRates } from '@/components/package/CurrencyRates';", "import { CurrencyRates } from '@/components/package/CurrencyRates';\nimport { ConsolidatedTripMap } from '@/components/package/ConsolidatedTripMap';\nimport { TravelDocumentsPanel } from '@/components/package/TravelDocumentsPanel';", "PackageClient imports")
        text = replace_once(text, "        {error && <div className=\"gt-error\" style={{ marginBottom: '1rem' }}>{error}</div>}", "        {error && <div className=\"gt-error\" style={{ marginBottom: '1rem' }}>{error}</div>}\n        {selectedTrip && <ConsolidatedTripMap items={items} schedule={schedule} />}", "PackageClient consolidated map")
        text = replace_once(text, "                    {cat.id === 7 && <CurrencyRates />}", "                    {cat.id === 5 && selectedTrip && <TravelDocumentsPanel trip={selectedTrip} />}\n                    {cat.id === 7 && <CurrencyRates />}", "PackageClient documentation guidance")
        backup(client_path, "fases2a5")
        write_text(client_path, text, crlf)

    css_path = os.path.join(root, "src", "styles", "Package.module.css")
    css, css_crlf = read_text(css_path)
    styles = r'''

/* GarimpaTrip Fases 2–5: endereço, mapa e documentação */
.itemLocation { flex: 1 1 100%; min-width: 100%; margin-top: 0.35rem; }
.gt-location-autocomplete { position: relative; width: 100%; }
.gt-location-autocomplete small { display: block; color: #64748b; margin-top: 0.25rem; }
.gt-location-suggestions { position: absolute; z-index: 30; top: calc(100% + 2px); left: 0; right: 0; margin: 0; padding: 0.25rem; list-style: none; background: #fff; border: 1px solid #cbd5e1; border-radius: 0.55rem; box-shadow: 0 8px 22px rgba(15,23,42,.14); }
.gt-location-suggestions button { width: 100%; text-align: left; border: 0; background: transparent; padding: .55rem .65rem; cursor: pointer; color: #253244; }
.gt-location-suggestions button:hover { background: #f1f5f9; }
.gt-trip-map, .gt-docs-panel { margin: 1rem 0 1.25rem; padding: 1rem; border: 1px solid #dbe4ef; border-radius: .9rem; background: #fff; }
.gt-trip-map h3, .gt-docs-panel h3 { margin: 0 0 .4rem; }
.gt-trip-map p, .gt-docs-panel p { color: #58677a; margin: .25rem 0 .75rem; }
.gt-trip-map-canvas { height: 360px; width: 100%; border-radius: .7rem; background: #e9eef2; z-index: 0; }
.gt-trip-map-legend { display: flex; flex-wrap: wrap; gap: .65rem 1rem; margin: .65rem 0; font-size: .84rem; }
.gt-trip-map-legend span { display: inline-flex; align-items: center; gap: .35rem; }
.gt-trip-map-legend i { display: inline-block; width: .7rem; height: .7rem; border-radius: 50%; }
.gt-docs-panel ul { margin: .5rem 0 .8rem; padding-left: 1.2rem; color: #334155; }
.gt-docs-panel div { display: flex; gap: .75rem 1.2rem; flex-wrap: wrap; }
.gt-docs-panel a { display: inline-flex; align-items: center; gap: .3rem; color: #1d5c88; }
.gt-docs-panel small { display: block; margin-top: .75rem; color: #64748b; }
'''
    if "gt-trip-map-canvas" not in css:
        backup(css_path, "fases2a5")
        write_text(css_path, css + styles, css_crlf)


def main():
    root = os.getcwd()
    if not os.path.isfile(os.path.join(root, "package.json")) or not os.path.isdir(os.path.join(root, "src")):
        print("[ERRO] Execute este arquivo na raiz do GarimpaTrip (onde está package.json).")
        return 1
    required = ["src/lib/providers.ts", "src/types/index.ts", "src/components/package/PackageClient.tsx", "src/styles/Package.module.css"]
    missing = [p for p in required if not os.path.isfile(os.path.join(root, p))]
    if missing:
        print("[ERRO] Arquivos necessários não encontrados: " + ", ".join(missing))
        return 1
    try:
        patch_providers(root)
        create_components(root)
        patch_package(root)
    except Exception as exc:
        print("[ERRO] Nenhuma etapa posterior foi iniciada com segurança: " + str(exc))
        print("Use os arquivos .bak_fases2a5 para restaurar apenas os arquivos alterados por este script.")
        return 1
    print("\n[FIM] Fases 2–5 aplicadas. Próximos passos:")
    print("1) Confira os diffs/backups e mantenha o git commit que você já fez.")
    print("2) Rode npm run typecheck e npm run build.")
    print("3) Teste Wikivoyage, endereços, mapa, roteiro diário e terminais náuticos no localhost.")
    print("4) O painel de documentação é orientativo e liga às fontes oficiais; não inventa regras de visto.")
    print("Observação: o SQL aditivo anterior precisa ter criado package_items.address/latitude/longitude/place_id.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
