import { NextResponse } from "next/server";
import aliasesData from "@/data/destination_aliases.json";

export interface PlaceSuggestion {
  id: string;
  name: string;
  subtitle: string;
  code: string;
  type: "city" | "airport";
  label: string;
  lat?: number;
  lon?: number;
}

interface DestinationAlias {
  keywords: string[];
  name: string;
  subtitle: string;
  code: string;
  label: string;
  lat?: number;
  lon?: number;
}

const QUICK_IATA: Record<
  string,
  { name: string; subtitle: string; code: string }
> = {
  GRU: {
    name: "São Paulo (Guarulhos)",
    subtitle: "São Paulo, Brasil",
    code: "GRU",
  },
  CGH: {
    name: "São Paulo (Congonhas)",
    subtitle: "São Paulo, Brasil",
    code: "CGH",
  },
  VCP: {
    name: "Campinas (Viracopos)",
    subtitle: "São Paulo, Brasil",
    code: "VCP",
  },
  GIG: {
    name: "Rio de Janeiro (Galeão)",
    subtitle: "Rio de Janeiro, Brasil",
    code: "GIG",
  },
  SDU: {
    name: "Rio de Janeiro (Santos Dumont)",
    subtitle: "Rio de Janeiro, Brasil",
    code: "SDU",
  },
  SSA: { name: "Salvador", subtitle: "Bahia, Brasil", code: "SSA" },
  BSB: { name: "Brasília", subtitle: "Distrito Federal, Brasil", code: "BSB" },
  FOR: { name: "Fortaleza", subtitle: "Ceará, Brasil", code: "FOR" },
  REC: { name: "Recife", subtitle: "Pernambuco, Brasil", code: "REC" },
  POA: {
    name: "Porto Alegre",
    subtitle: "Rio Grande do Sul, Brasil",
    code: "POA",
  },
  CWB: { name: "Curitiba", subtitle: "Paraná, Brasil", code: "CWB" },
  FLN: {
    name: "Florianópolis",
    subtitle: "Santa Catarina, Brasil",
    code: "FLN",
  },
  CNF: {
    name: "Belo Horizonte (Confins)",
    subtitle: "Minas Gerais, Brasil",
    code: "CNF",
  },
  BYO: {
    name: "Bonito (Regional)",
    subtitle: "Mato Grosso do Sul, Brasil",
    code: "BYO",
  },
  CGR: {
    name: "Campo Grande",
    subtitle: "Mato Grosso do Sul, Brasil",
    code: "CGR",
  },
  PNZ: { name: "Petrolina", subtitle: "Pernambuco, Brasil", code: "PNZ" },
  SJO: { name: "San José", subtitle: "San José, Costa Rica", code: "SJO" },
  BUE: {
    name: "Buenos Aires",
    subtitle: "Buenos Aires, Argentina",
    code: "BUE",
  },
  SCL: {
    name: "Santiago",
    subtitle: "Região Metropolitana, Chile",
    code: "SCL",
  },
};

function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const term = (searchParams.get("term") ?? "").trim();

  if (term.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const upper = term.toUpperCase();
  const normTerm = normalizeText(term);
  const results: PlaceSuggestion[] = [];
  const seen = new Set<string>();

  // 1. Sigla IATA direta digitada pelo usuário (ex: GRU, SSA, MCO)
  if (QUICK_IATA[upper]) {
    const q = QUICK_IATA[upper];
    results.push({
      id: `iata-${q.code}`,
      name: q.name,
      subtitle: q.subtitle,
      code: q.code,
      type: "airport",
      label: `${q.name}, ${q.subtitle} (${q.code})`,
    });
    seen.add(q.name.toLowerCase());
  }

  // 2. Apelidos e pontos turísticos (ex: Disney, Beto Carrero, Jalapão)
  const aliases = (aliasesData as DestinationAlias[]) || [];
  for (const alias of aliases) {
    const matched = alias.keywords.some((kw) => {
      const normKw = normalizeText(kw);
      return (
        normKw === normTerm ||
        normKw.includes(normTerm) ||
        normTerm.includes(normKw)
      );
    });

    if (matched) {
      const dedupeKey = alias.label.toLowerCase();
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        results.push({
          id: `alias-${alias.label}`,
          name: alias.name,
          subtitle: alias.subtitle,
          code: alias.code,
          type: "city",
          label: alias.label,
          lat: alias.lat,
          lon: alias.lon,
        });
      }
    }
  }

  // 3. Cidades normais via Open-Meteo Geocoding
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=12&language=pt&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GarimpaTrip/1.0", Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data.results) ? data.results : [];

      items.sort((a: any, b: any) => {
        const aBr = a.country_code === "BR" ? 1 : 0;
        const bBr = b.country_code === "BR" ? 1 : 0;
        if (aBr !== bBr) return bBr - aBr;
        return (b.population || 0) - (a.population || 0);
      });

      for (const item of items) {
        const name = item.name;
        const state = item.admin1 || "";
        const country = item.country || "";
        const countryCode = item.country_code || "";
        const parts = [state, country].filter(Boolean);
        const subtitle = parts.join(", ");
        const label = subtitle ? `${name}, ${subtitle}` : name;

        const dedupeKey = `${name.toLowerCase()}_${state.toLowerCase()}_${countryCode.toLowerCase()}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        results.push({
          id: `geo-${item.id}`,
          name,
          subtitle,
          code: countryCode,
          type: "city",
          label,
          lat: item.latitude,
          lon: item.longitude,
        });

        if (results.length >= 8) break;
      }
    }
  } catch (err) {
    console.error("Erro no autocomplete Geocoding:", err);
  }

  return NextResponse.json({ results });
}
