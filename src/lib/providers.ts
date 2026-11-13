// GT_CORRECOES_CONSOLIDADAS
async function fetchWikiThumbnail(title: string): Promise<string | null> {
  try {
    const url = `https://pt.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=640&origin=*`;
    const res = await getJson<{
      query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
    }>(url, {
      headers: { "User-Agent": "GarimpaTrip/1.0 (contato@garimpatrip.com.br)" },
      next: { revalidate: 86400 },
    });
    const pages = Object.values(res.query?.pages || {});
    return pages[0]?.thumbnail?.source || null;
  } catch {
    return null;
  }
}
import "server-only";
import type {
  SearchResponse,
  SearchResult,
  WeatherData,
  CitySummary,
} from "@/types";
import { cityName, cleanCity, slugifyCity, resolveIata } from "@/lib/iata";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const TIMEOUT_MS = 10_000;

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

function missingKey(name: string): SearchResponse {
  return {
    results: [],
    notice: `Configure ${name} no .env.local para ver resultados reais aqui.`,
  };
}

function failed(provider: string): SearchResponse {
  return {
    results: [],
    notice: `Não foi possível consultar ${provider} agora. Tente novamente em instantes.`,
  };
}

async function logApiTelemetry(
  provider: string,
  action: string,
  status: string,
  destination?: string,
  latencyMs?: number,
  metadata?: Record<string, unknown>,
) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await admin.from("api_telemetry_events").insert({
      provider,
      action,
      status,
      destination,
      latency_ms: latencyMs,
      metadata: metadata ?? {},
    });
  } catch {}
}

export interface GeoPoint {
  lat: number;
  lon: number;
  label: string;
}

// export async function geocode(text: string): Promise<GeoPoint | null> {
//   const key = process.env.GEOAPIFY_API_KEY;
//   if (!key) return null;
//   const clean = cleanCity(text);
//   if (clean.length < 2) return null;

//   try {
//     const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(clean)}&type=city&lang=pt&limit=1&apiKey=${key}`;
//     const data = await getJson<{
//       features?: {
//         properties: { lat: number; lon: number; formatted?: string };
//       }[];
//     }>(url);
//     const p = data.features?.[0]?.properties;
//     return p ? { lat: p.lat, lon: p.lon, label: p.formatted ?? clean } : null;
//   } catch {
//     return null;
//   }
// }
// async function geocode(text: string): Promise<GeoPoint | null> {
//   const key = process.env.GEOAPIFY_API_KEY;
//   const clean = cleanCity(text);
//   if (clean.length < 2) return null;

//   if (key) {
//     try {
//       const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(clean)}&lang=pt&limit=1&apiKey=${key}`;
//       const data = await getJson<{
//         features?: {
//           properties: { lat: number; lon: number; formatted?: string };
//         }[];
//       }>(url);
//       const p = data.features?.[0]?.properties;
//       if (p && p.lat && p.lon) {
//         return { lat: p.lat, lon: p.lon, label: p.formatted ?? clean };
//       }
//     } catch {}
//   }

//   // Fallback Open-Meteo (garante coordenadas exatas para ilhas brasileiras)
//   try {
//     const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=1&language=pt&format=json`;
//     const omData = await getJson<{
//       results?: Array<{ latitude: number; longitude: number; name: string; country?: string }>;
//     }>(omUrl, { headers: { "User-Agent": "GarimpaTrip/1.0" } });
//     const first = omData.results?.[0];
//     if (first && first.latitude && first.longitude) {
//       return { lat: first.latitude, lon: first.longitude, label: `${first.name}, ${first.country ?? ""}` };
//     }
//   } catch {}

//   return null;
// }
async function geocode(text: string): Promise<GeoPoint | null> {
  const key = process.env.GEOAPIFY_API_KEY;
  const clean = cleanCity(text);
  if (clean.length < 2) return null;

  if (key) {
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(clean)}&lang=pt&limit=1&apiKey=${key}`;
      const data = await getJson<{
        features?: {
          properties: { lat: number; lon: number; formatted?: string };
        }[];
      }>(url);
      const p = data.features?.[0]?.properties;
      if (p && p.lat && p.lon) {
        return { lat: p.lat, lon: p.lon, label: p.formatted ?? clean };
      }
    } catch {}
  }

  // Fallback Open-Meteo (garante coordenadas exatas para ilhas brasileiras)
  try {
    const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=1&language=pt&format=json`;
    const omData = await getJson<{
      results?: Array<{
        latitude: number;
        longitude: number;
        name: string;
        country?: string;
      }>;
    }>(omUrl, { headers: { "User-Agent": "GarimpaTrip/1.0" } });
    const first = omData.results?.[0];
    if (first && first.latitude && first.longitude) {
      return {
        lat: first.latitude,
        lon: first.longitude,
        label: `${first.name}, ${first.country ?? ""}`,
      };
    }
  } catch {}

  return null;
}

interface GeoapifyPlace {
  properties: {
    place_id: string;
    name?: string;
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    categories?: string[];
    website?: string;
    distance?: number;
    lat: number;
    lon: number;
  };
}

async function geoapifyPlaces(
  destination: string,
  categories: string,
  category: SearchResult["category"],
  label: string,
): Promise<SearchResponse> {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return missingKey("GEOAPIFY_API_KEY");
  const t0 = Date.now();
  const clean = cleanCity(destination);
  try {
    const point = await geocode(clean);
    if (!point)
      return { results: [], notice: `Não encontramos "${clean}" no mapa.` };
    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${point.lon},${point.lat},8000&bias=proximity:${point.lon},${point.lat}&limit=12&lang=pt&apiKey=${key}`;
    const data = await getJson<{ features?: GeoapifyPlace[] }>(url);
    const results = (data.features ?? [])
      .filter((f) => f.properties.name)
      .map<SearchResult>((f) => {
        const p = f.properties;
        const placeName = p.name ?? "";
        const gmapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${placeName} ${p.address_line2 || clean}`)}`;
        const bookingSearchUrl = `https://www.booking.com/searchresults.pt-br.html?ss=${encodeURIComponent(`${placeName} ${clean}`)}`;
        const fallbackUrl =
          category === "hotel" ? bookingSearchUrl : gmapsSearchUrl;

        return {
          id: `geo-${p.place_id}`,
          category,
          source_type: "api_partner",
          source:
            category === "transport"
              ? "Locadora de veículos"
              : "Geoapify Places",
          title: placeName,
          description:
            p.address_line2 ||
            (p.distance ? `${Math.round(p.distance)} m do centro` : label),
          price: null,
          currency: "BRL",
          url: p.website || fallbackUrl,
          raw: {
            place_id: p.place_id,
            lat: p.lat,
            lon: p.lon,
            map_url: gmapsSearchUrl,
            booking_url: category === "hotel" ? bookingSearchUrl : null,
            website: p.website || null,
            categories: p.categories || [],
          },
        };
      });
    logApiTelemetry(
      "geoapify",
      categories,
      "success",
      destination,
      Date.now() - t0,
      { count: results.length },
    );
    return { results };
  } catch (err: any) {
    logApiTelemetry(
      "geoapify",
      categories,
      "error",
      destination,
      Date.now() - t0,
      { error: err.message },
    );
    return failed("Geoapify");
  }
}

// -----------------------------------------------------------------------------
// VOOS (Travelpayouts / Aviasales + Google Flights)
// -----------------------------------------------------------------------------
interface TpFlight {
  airline?: string;
  flight_number?: number;
  departure_at?: string;
  return_at?: string;
  price?: number;
  transfers?: number;
  link?: string;
}

export async function searchFlights(
  origin: string,
  destination: string,
  departMonth?: string,
): Promise<SearchResponse> {
  const cleanDest = cleanCity(destination);
  const cleanOrig = cleanCity(origin);

  const [o, d] = await Promise.all([
    resolveIata(origin),
    resolveIata(destination),
  ]);

  // Quando o destino não possui aeroporto comercial regular
  if (!d) {
    const googleVoosUrl = `https://www.google.com/travel/flights?q=Voos+para+${encodeURIComponent(cleanDest)}&hl=pt-BR&curr=BRL`;
    const rome2rioUrl = `https://www.rome2rio.com/pt/map/${encodeURIComponent(cleanOrig || "São Paulo")}/${encodeURIComponent(cleanDest)}?accom_comparison=true`;
    return {
      results: [],
      notice: (() => {
        const norm = cleanDest.toLowerCase();
        if (norm.includes("bonito"))
          return '"Bonito" conta com voos sazonais e tem Campo Grande (CGR) como principal hub aéreo com transfers e ônibus regulares. Recomendamos voar até Campo Grande (CGR) e seguir por via terrestre.';
        if (norm.includes("cabrobo"))
          return '"Cabrobó" não possui aeroporto comercial próprio. Recomendamos voar até Petrolina (PNZ), Juazeiro do Norte (JDO) ou Recife (REC) e seguir de ônibus ou transfer.';
        if (norm.includes("paraty"))
          return '"Paraty" não possui aeroporto comercial. Recomendamos voar até o Rio de Janeiro (GIG/SDU) ou São Paulo (GRU/CGH) e seguir de ônibus ou transfer pela Rio-Santos.';
        return `"${cleanDest}" não possui aeroporto com voos comerciais regulares. Recomendamos voar até o polo ou capital mais próxima e seguir de ônibus ou transfer (veja as opções abaixo).`;
      })(),
      fallbackUrls: {
        google: googleVoosUrl,
        rome2rio: rome2rioUrl,
      },
    };
  }

  if (!o) {
    return {
      results: [],
      notice: `Informe uma cidade de origem com aeroporto comercial (ex.: "São Paulo (GRU)") para cotar passagens aéreas.`,
    };
  }

  const token =
    process.env.TRAVELPAYOUTS_TOKEN || process.env.TRAVELPAYOUTS_API_KEY;
  if (!token) return missingKey("TRAVELPAYOUTS_TOKEN");

  const t0 = Date.now();
  try {
    const params = new URLSearchParams({
      origin: o,
      destination: d,
      currency: "brl",
      sorting: "price",
      one_way: "false",
      direct: "false",
      limit: "10",
    });
    if (departMonth && /^\d{4}-\d{2}$/.test(departMonth)) {
      params.set("departure_at", departMonth);
    }
    const data = await getJson<{ success: boolean; data?: TpFlight[] }>(
      `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${params}`,
      { headers: { "X-Access-Token": token } },
    );

    const marker = process.env.TRAVELPAYOUTS_MARKER || "596330";
    const results = (data.data ?? []).map<SearchResult>((f, i) => {
      const dep = f.departure_at?.slice(0, 10);
      const ret = f.return_at?.slice(0, 10);
      const stops =
        f.transfers === 0 ? "Voo direto" : `${f.transfers} conexão(ões)`;

      // Link Aviasales
      const aviasalesUrl = f.link
        ? `https://www.aviasales.com${f.link}?marker=${marker}`
        : `https://www.aviasales.com/search/${o}${dep?.replace(/-/g, "") || ""}${d}1?marker=${marker}`;

      // Link do Google Voos com as DATAS EXATAS retornadas pela cotação e moeda BRL
      let googleFlightsUrl = `https://www.google.com/travel/flights?q=Voos+de+${o}+para+${d}&hl=pt-BR&curr=BRL`;
      if (dep && ret) {
        googleFlightsUrl = `https://www.google.com/travel/flights?q=Voos+de+${o}+para+${d}+em+${dep}+a+${ret}&hl=pt-BR&curr=BRL`;
      } else if (dep) {
        googleFlightsUrl = `https://www.google.com/travel/flights?q=Voos+de+${o}+para+${d}+em+${dep}&hl=pt-BR&curr=BRL`;
      }

      return {
        id: `tp-${f.airline ?? "flight"}-${f.flight_number ?? i}-${dep ?? "any"}`,
        category: "flight",
        source_type: "api_partner",
        source: "Encontrado em Aviasales",
        title: `${o} → ${d} (${f.airline ?? "Cia Aérea"})`,
        description: `${stops} • Ida: ${dep || "flexível"} | Volta: ${ret || "flexível"} • Preço histórico garimpado`,
        price: f.price ?? null,
        currency: "BRL",
        url: aviasalesUrl,
        raw: {
          ...f,
          origin: o,
          destination: d,
          google_flights_url: googleFlightsUrl,
          price_disclaimer:
            "Tarifa garimpada em cache recente. Preços em tempo real podem variar conforme assentos e taxas na companhia.",
        },
      };
    });

    logApiTelemetry(
      "travelpayouts",
      "prices_for_dates",
      "success",
      `${o}->${d}`,
      Date.now() - t0,
      {
        count: results.length,
      },
    );

    const generalGoogleUrl = `https://www.google.com/travel/flights?q=Voos+de+${o}+para+${d}&hl=pt-BR&curr=BRL`;
    return {
      results,
      fallbackUrls: { google: generalGoogleUrl },
      notice:
        results.length === 0
          ? `Nenhum voo encontrado no histórico da Travelpayouts para ${o} → ${d}. Você pode verificar diretamente no Google Voos.`
          : undefined,
    };
  } catch (err: any) {
    logApiTelemetry(
      "travelpayouts",
      "prices_for_dates",
      "error",
      `${o}->${d}`,
      Date.now() - t0,
      {
        error: err.message,
      },
    );
    return failed("Travelpayouts (Voos)");
  }
}

// -----------------------------------------------------------------------------
// HOSPEDAGENS (Geoapify Places + Booking Search)
// -----------------------------------------------------------------------------
export async function searchHotels(
  destination: string,
): Promise<SearchResponse> {
  const clean = cleanCity(destination);
  const resp = await geoapifyPlaces(
    clean,
    "accommodation.hotel,accommodation.motel,accommodation.guest_house",
    "hotel",
    "Hospedagem",
  );

  // Adiciona atalho da busca do Booking no topo ou no fallbackUrls
  const bookingUrl = `https://www.booking.com/searchresults.pt-br.html?ss=${encodeURIComponent(clean)}`;
  resp.fallbackUrls = {
    booking: bookingUrl,
  };
  return resp;
}

// -----------------------------------------------------------------------------
// PASSEIOS & EXPERIÊNCIAS (OpenTripMap corrigida + Agregadores)
// -----------------------------------------------------------------------------
export async function searchTours(
  destination: string,
): Promise<SearchResponse> {
  const clean = cleanCity(destination);
  const key = process.env.OPENTRIPMAP_API_KEY;

  // URLs públicas dos agregadores de passeios com o destino preenchido
  const aggregatorsUrls = {
    getyourguide: `https://www.getyourguide.com.br/s/?q=${encodeURIComponent(clean)}`,
    civitatis: `https://www.civitatis.com/br/busca?q=${encodeURIComponent(clean)}`,
    tripadvisor: `https://www.tripadvisor.com.br/Search?q=${encodeURIComponent("passeios em " + clean)}`,
    viator: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(clean)}`,
  };

  if (!key) {
    return {
      results: [],
      notice:
        "Configure OPENTRIPMAP_API_KEY no .env.local para carregar atrações culturais.",
      fallbackUrls: aggregatorsUrls,
    };
  }

  const t0 = Date.now();
  try {
    // CORREÇÃO CRUCIAL: Usar idioma 'en' pois 'pt' causa HTTP 400 na OpenTripMap
    const geo = await getJson<{ lat?: number; lon?: number; status?: string }>(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(clean)}&apikey=${key}`,
    );

    if (geo.lat === undefined || geo.lon === undefined) {
      return {
        results: [],
        notice: `Não encontramos pontos turísticos mapeados para "${clean}" na OpenTripMap. Explore nos agregadores abaixo:`,
        fallbackUrls: aggregatorsUrls,
      };
    }

    const places = await getJson<
      Array<{
        xid: string;
        name: string;
        kinds: string;
        dist: number;
        rate: number;
      }>
    >(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=12000&lon=${geo.lon}&lat=${geo.lat}&kinds=interesting_places&rate=2&format=json&limit=15&apikey=${key}`,
    );

    const results = places
      .filter((p) => p.name && p.name.trim().length > 1)
      .map<SearchResult>((p) => {
        const placeName = p.name.trim();
        const kindsReadable = p.kinds
          .split(",")
          .slice(0, 3)
          .join(", ")
          .replace(/_/g, " ");
        const gygSearchUrl = `https://www.getyourguide.com.br/s/?q=${encodeURIComponent(`${placeName} ${clean}`)}`;
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${placeName} ${clean}`)}`;

        return {
          id: `otm-${p.xid}`,
          category: "tour",
          source_type: "api_partner",
          source: "OpenTripMap",
          title: placeName,
          description: `${kindsReadable} • ${(p.dist / 1000).toFixed(1)} km do centro`,
          price: null,
          currency: "BRL",
          url: gygSearchUrl,
          raw: {
            xid: p.xid,
            kinds: p.kinds,
            rate: p.rate,
            map_url: mapUrl,
            ticket_search_url: gygSearchUrl,
          },
        };
      });

    logApiTelemetry("opentripmap", "tours", "success", clean, Date.now() - t0, {
      count: results.length,
    });
    return {
      results,
      fallbackUrls: aggregatorsUrls,
    };
  } catch (err: any) {
    logApiTelemetry("opentripmap", "tours", "error", clean, Date.now() - t0, {
      error: err.message,
    });
    return {
      results: [],
      notice: `Não foi possível consultar a OpenTripMap agora. Explore passeios nos agregadores parceiros abaixo:`,
      fallbackUrls: aggregatorsUrls,
    };
  }
}

// -----------------------------------------------------------------------------
// TRANSPORTES & ROTAS TERRESTRES (Rome2Rio, ClickBus, DeÔnibus, Buser)
// -----------------------------------------------------------------------------
function transportMarket(place: string): "br" | "south-america" | "other" {
  const value = place
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/(brasil|brazil|,\s*br\b|,\s*brasil)/.test(value)) return "br";
  const southAmericanCountries = [
    "argentina",
    "bolivia",
    "chile",
    "colombia",
    "equador",
    "ecuador",
    "guiana",
    "guyana",
    "paraguai",
    "paraguay",
    "peru",
    "suriname",
    "uruguai",
    "uruguay",
    "venezuela",
  ];
  if (southAmericanCountries.some((country) => value.includes(country)))
    return "south-america";
  // State abbreviations commonly present in Brazilian autocomplete labels.
  if (
    /(,\s*(ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)\b)/.test(
      value,
    )
  )
    return "br";
  return "other";
}

// GT_PHASES_2_5_FERRY
async function searchFerryTerminals(
  destination: string,
): Promise<SearchResult[]> {
  const point = await geocode(destination);
  if (!point) return [];
  const radius = 18000;
  const query = `[out:json][timeout:12];(node[amenity=ferry_terminal](around:${radius},${point.lat},${point.lon});way[amenity=ferry_terminal](around:${radius},${point.lat},${point.lon});relation[amenity=ferry_terminal](around:${radius},${point.lat},${point.lon});node[waterway=dock](around:${radius},${point.lat},${point.lon});way[waterway=dock](around:${radius},${point.lat},${point.lon});node[leisure=boat_rental](around:${radius},${point.lat},${point.lon}););out center tags 12;`;
  try {
    const response = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "GarimpaTrip/1.0 (contato@garimpatrip.com.br)",
        },
        cache: "force-cache",
        next: { revalidate: 86400 },
      },
    );
    if (!response.ok) return [];
    const data = (await response.json()) as {
      elements?: Array<{
        id: number;
        type: string;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };
    return (data.elements || []).slice(0, 8).map((element) => {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      const tags = element.tags || {};
      const name =
        tags.name || tags["name:pt"] || "Terminal ou serviço náutico";
      const kind =
        tags.amenity === "ferry_terminal"
          ? "Terminal de balsas"
          : tags.leisure === "boat_rental"
            ? "Aluguel de barcos"
            : "Doca / terminal náutico";
      const mapUrl =
        lat != null && lon != null
          ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
          : `https://www.openstreetmap.org/search?query=${encodeURIComponent(name + " " + destination)}`;
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
        raw: {
          type: "nautical",
          latitude: lat ?? null,
          longitude: lon ?? null,
          address: tags["addr:street"] || null,
          map_url: mapUrl,
          tags,
        },
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
  const normDest = destination
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isNoronha = /fernando\s+de\s+noronha|noronha\b|\bfen\b/.test(normDest);

  if (isNoronha) {
    transportCards.push({
      id: `transport-bus-hub-${slugDest}`,
      category: "transport",
      source_type: "manual",
      source: "Transporte Terrestre",
      title: "Não há transporte de ônibus em Fernando de Noronha",
      description:
        "Fernando de Noronha é uma ilha. Consulte voos e opções náuticas locais; confirme disponibilidade diretamente com os operadores.",
      price: null,
      currency: "BRL",
      url: rome2rioUrl,
      raw: {
        type: "bus_hub",
        partnerLinks: [{ name: "Ver opções no Rome2Rio", url: rome2rioUrl }],
      },
    });
  } else if (market === "br") {
    transportCards.push({
      id: `transport-bus-hub-${slugOrig}-${slugDest}`,
      category: "transport",
      source_type: "manual",
      source: "Passagens Rodoviárias",
      title: `Pesquise passagens de ônibus de ${cleanOrig} para ${cleanDest}`,
      description:
        "Consulte empresas e buscadores rodoviários; disponibilidade e horários variam por rota.",
      price: null,
      currency: "BRL",
      url: "https://www.clickbus.com.br",
      raw: {
        type: "bus_hub",
        partnerLinks: [
          { name: "ClickBus", url: "https://www.clickbus.com.br" },
          { name: "DeÔnibus", url: "https://deonibus.com" },
          { name: "Buser", url: "https://www.buser.com.br" },
          { name: "FlixBus", url: "https://www.flixbus.com.br" },
        ],
      },
    });
  } else if (market === "south-america") {
    transportCards.push({
      id: `transport-bus-hub-${slugOrig}-${slugDest}`,
      category: "transport",
      source_type: "manual",
      source: "Passagens Rodoviárias",
      title: `Pesquise passagens de ônibus de ${cleanOrig} para ${cleanDest}`,
      description:
        "Consulte empresas e buscadores rodoviários para viagens na América do Sul.",
      price: null,
      currency: "BRL",
      url: "https://www.clickbus.com.br",
      raw: {
        type: "bus_hub",
        partnerLinks: [
          { name: "ClickBus", url: "https://www.clickbus.com.br" },
          { name: "DeÔnibus", url: "https://deonibus.com" },
          { name: "FlixBus", url: "https://www.flixbus.com.br" },
        ],
      },
    });
  } else {
    transportCards.push({
      id: `transport-bus-hub-${slugDest}`,
      category: "transport",
      source_type: "manual",
      source: "Ônibus & Trens",
      title: `Pesquise viagens intermunicipais saindo de ${cleanDest}`,
      description:
        "Consulte conexões de ônibus e trem disponíveis no destino; os sites parceiros podem pedir que você informe a rota.",
      price: null,
      currency: "BRL",
      url: "https://global.flixbus.com",
      raw: {
        type: "bus_hub",
        partnerLinks: [
          { name: "FlixBus", url: "https://global.flixbus.com" },
          { name: "Omio", url: "https://www.omio.com.br" },
        ],
      },
    });
  }

  transportCards.push({
    id: `transport-rome2rio-${slugOrig}-${slugDest}`,
    category: "transport",
    source_type: "manual",
    source: "Rome2Rio",
    title: `Rotas multimodais: ${cleanOrig} → ${cleanDest}`,
    description:
      "Compare opções e conexões multimodais. Confira os detalhes diretamente com cada operador.",
    price: null,
    currency: "BRL",
    url: rome2rioUrl,
    raw: { type: "multimodal", provider: "Rome2Rio" },
  });

  try {
    const geoPlaces = await geoapifyPlaces(
      destinationFull,
      "rental.car",
      "transport",
      "Aluguel de carros",
    );
    const rentalTerms =
      /rental\.car|rental_car|car_rental|car rental|rent a car|car hire|rental car|rentacar|aluguel de carro|aluguel de ve[ií]culo|locadora|locadora de ve[ií]culos|hertz|avis|localiza|movida|europcar|sixt|enterprise|budget/i;
    const rentalCards = (geoPlaces.results || [])
      .filter((item) =>
        rentalTerms.test(
          `${item.title} ${item.description} ${JSON.stringify(item.raw || {})}`,
        ),
      )
      .map((item) => ({ ...item, source: "Locadora de veículos" }));
    const nauticalCards = await searchFerryTerminals(destinationFull);
    return {
      results: [...transportCards, ...rentalCards, ...nauticalCards],
      fallbackUrls: { rome2rio: rome2rioUrl },
    };
  } catch {
    return { results: transportCards, fallbackUrls: { rome2rio: rome2rioUrl } };
  }
}

// GT_PHASES_2_5_WIKIVOYAGE
function wikiHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\[editar\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    const data = await getJson<{
      query?: {
        pages?: Record<
          string,
          {
            pageid?: number;
            index?: number;
            title?: string;
            extract?: string;
            canonicalurl?: string;
            fullurl?: string;
            thumbnail?: { source?: string };
          }
        >;
      };
    }>(searchUrl, {
      headers: { "User-Agent": "GarimpaTrip/1.0 (contato@garimpatrip.com.br)" },
      next: { revalidate: 86400 },
    });
    const pages = Object.values(data.query?.pages || {}).sort(
      (a, b) => (a.index ?? 99) - (b.index ?? 99),
    );
    for (const page of pages) {
      if (!page.extract || page.extract.trim().length < 30 || !page.pageid)
        continue;
      const pageTitle = page.title || city;
      const pageUrl =
        page.canonicalurl ||
        page.fullurl ||
        `https://pt.wikivoyage.org/wiki/${encodeURIComponent(pageTitle)}`;
      const exact = pageTitle
        .toLocaleLowerCase("pt-BR")
        .includes(city.toLocaleLowerCase("pt-BR"));
      if (!exact && pages.length > 1) continue;
      results.push({
        id: `wiki-${page.pageid}`,
        category: "web",
        source_type: "web_result",
        source: "Wikivoyage",
        title: `Guia de viagem: ${pageTitle}`,
        description: page.extract.replace(/\s+/g, " ").trim(),
        price: null,
        currency: "BRL",
        url: pageUrl,
        raw: {
          imageUrl: page.thumbnail?.source || null,
          wiki: true,
          place: fullPlace,
        },
      });
      seen.add(String(page.pageid));
      try {
        const sectionUrl = `https://pt.wikivoyage.org/w/api.php?action=parse&format=json&pageid=${page.pageid}&prop=sections&origin=*`;
        const sectionData = await getJson<{
          parse?: {
            sections?: Array<{ index: string; line: string; level: string }>;
          };
        }>(sectionUrl, {
          headers: {
            "User-Agent": "GarimpaTrip/1.0 (contato@garimpatrip.com.br)",
          },
          next: { revalidate: 86400 },
        });
        const groups: Array<{
          label: string;
          terms: RegExp;
          section: Array<{ index: string; line: string }>;
        }> = [
          {
            label: "Ver e conhecer",
            terms:
              /^(see|ver|atrações|atracoes|pontos turísticos|pontos turisticos|o que ver)/i,
            section: [],
          },
          {
            label: "Fazer",
            terms: /^(do|fazer|atividades|praias|trilhas)/i,
            section: [],
          },
          {
            label: "Comer",
            terms: /^(eat|comer|gastronomia|restaurantes)/i,
            section: [],
          },
          {
            label: "Dormir",
            terms: /^(sleep|dormir|hospedagem|onde ficar)/i,
            section: [],
          },
        ];
        for (const section of sectionData.parse?.sections || []) {
          const group = groups.find((candidate) =>
            candidate.terms.test(section.line.replace(/<[^>]+>/g, "").trim()),
          );
          if (group && group.section.length < 1)
            group.section.push({ index: section.index, line: section.line });
        }
        for (const group of groups) {
          const selected = group.section[0];
          if (!selected) continue;
          try {
            const detailUrl = `https://pt.wikivoyage.org/w/api.php?action=parse&format=json&pageid=${page.pageid}&section=${encodeURIComponent(selected.index)}&prop=text&origin=*`;
            const detail = await getJson<{
              parse?: { text?: { "*"?: string } };
            }>(detailUrl, {
              headers: {
                "User-Agent": "GarimpaTrip/1.0 (contato@garimpatrip.com.br)",
              },
              next: { revalidate: 86400 },
            });
            const description = wikiHtmlToText(
              detail.parse?.text?.["*"] || "",
            ).slice(0, 700);
            if (description.length < 35) continue;
            results.push({
              id: `wiki-${page.pageid}-section-${selected.index}`,
              category: "web",
              source_type: "web_result",
              source: "Wikivoyage",
              title: `${group.label} em ${pageTitle}`,
              description,
              price: null,
              currency: "BRL",
              url: pageUrl,
              raw: {
                imageUrl: page.thumbnail?.source || null,
                wiki: true,
                section: group.label,
                place: fullPlace,
              },
            });
          } catch {
            /* Se uma seção falhar, o guia principal continua disponível. */
          }
        }
      } catch {
        /* Seções são complementares: não removemos o guia principal. */
      }
    }
  } catch (err: unknown) {
    console.warn(
      "Consulta ao Wikivoyage falhou:",
      err instanceof Error ? err.message : err,
    );
  }
  // Brave permanece exclusivamente local, mediante opt-in explícito.
  const isLocalBraveEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_BRAVE_LOCAL === "true" &&
    Boolean(process.env.BRAVE_SEARCH_API_KEY) &&
    process.env.BRAVE_SIMULATE_QUOTA !== "true";
  if (isLocalBraveEnabled) {
    try {
      const data = await getJson<{
        web?: {
          results?: { title: string; url: string; description?: string }[];
        };
      }>(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&country=BR&search_lang=pt-br&count=8`,
        {
          headers: {
            "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY!,
            Accept: "application/json",
          },
        },
      );
      (data.web?.results || []).forEach((item, index) =>
        results.push({
          id: `brave-${index}-${slugifyCity(fullPlace)}`,
          category: "web",
          source_type: "web_result",
          source: "Brave Search (Local)",
          title: item.title,
          description: item.description || "",
          price: null,
          currency: "BRL",
          url: item.url,
          raw: { ...item, place: fullPlace },
        }),
      );
    } catch (err: unknown) {
      console.warn(
        "Brave local indisponível:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return { results, fallbackUrls };
}

function wmoCondition(code: number): string {
  if (code === 0) return "Céu limpo";
  if (code <= 3) return "Parcialmente nublado";
  if (code <= 48) return "Nevoeiro";
  if (code <= 55) return "Garoa leve";
  if (code <= 65) return "Chuva moderada";
  if (code <= 82) return "Pancadas de chuva";
  if (code <= 99) return "Tempestade";
  return "Clima variável";
}

function generatePackingTip(
  tempMax: number,
  tempMin: number,
  precip: number,
): string {
  const tips: string[] = [];
  if (tempMax >= 27)
    tips.push(
      "Tempo quente: leve roupas leves, protetor FPS 50 e óculos de sol.",
    );
  else if (tempMin <= 16)
    tips.push(
      "Noites frescas/frias: inclua casaco leve e calças confortáveis.",
    );
  else tips.push("Temperatura amena: ideal para caminhadas ao ar livre.");

  if (precip > 2)
    tips.push(
      "Previsão de chuva: coloque capa ou guarda-chuva dobrável na mala.",
    );
  return tips.join(" ");
}

export async function fetchWeather(
  destination: string,
): Promise<WeatherData | null> {
  const t0 = Date.now();
  try {
    const point = await geocode(destination);
    if (!point) return null;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;
    const data = await getJson<{
      current?: {
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        precipitation: number;
        weather_code: number;
      };
      daily?: {
        temperature_2m_max: number[];
        temperature_2m_min: number[];
      };
    }>(url);

    if (!data.current) return null;

    const temp = Math.round(data.current.temperature_2m);
    const appTemp = Math.round(data.current.apparent_temperature);
    const max = Math.round(data.daily?.temperature_2m_max?.[0] ?? temp);
    const min = Math.round(data.daily?.temperature_2m_min?.[0] ?? temp);
    const code = data.current.weather_code;
    const precip = data.current.precipitation;

    logApiTelemetry(
      "open_meteo",
      "weather",
      "success",
      destination,
      Date.now() - t0,
    );

    return {
      destination: cityName(destination),
      temperature: temp,
      apparentTemperature: appTemp,
      humidity: data.current.relative_humidity_2m,
      precipitation: precip,
      weatherCode: code,
      conditionLabel: wmoCondition(code),
      tempMax: max,
      tempMin: min,
      packingTip: generatePackingTip(max, min, precip),
    };
  } catch {
    logApiTelemetry(
      "open_meteo",
      "weather",
      "error",
      destination,
      Date.now() - t0,
    );
    return null;
  }
}

export interface CurrencyRates {
  USD_BRL: number | null;
  EUR_BRL: number | null;
  ARS_BRL: number | null;
  updatedAt: string | null;
}

export async function fetchCurrencyRates(): Promise<CurrencyRates> {
  const t0 = Date.now();
  try {
    const data = await getJson<
      Record<string, { bid: string; create_date: string }>
    >("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,ARS-BRL");
    const n = (k: string) => (data[k]?.bid ? Number(data[k].bid) : null);
    logApiTelemetry(
      "awesomeapi",
      "rates",
      "success",
      undefined,
      Date.now() - t0,
    );
    return {
      USD_BRL: n("USDBRL"),
      EUR_BRL: n("EURBRL"),
      ARS_BRL: n("ARSBRL"),
      updatedAt: data.USDBRL?.create_date ?? null,
    };
  } catch {
    logApiTelemetry("awesomeapi", "rates", "error", undefined, Date.now() - t0);
    return { USD_BRL: null, EUR_BRL: null, ARS_BRL: null, updatedAt: null };
  }
}
