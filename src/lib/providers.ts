import 'server-only';
import type { SearchResponse, SearchResult, WeatherData, CitySummary } from '@/types';
import { cityName, resolveIata } from '@/lib/iata';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const TIMEOUT_MS = 10_000;

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

function missingKey(name: string): SearchResponse {
  return { results: [], notice: `Configure ${name} no .env.local para ver resultados reais aqui.` };
}

function failed(provider: string): SearchResponse {
  return { results: [], notice: `Nao foi possivel consultar ${provider} agora. Tente novamente em instantes.` };
}

async function logApiTelemetry(provider: string, action: string, status: string, destination?: string, latencyMs?: number, metadata?: Record<string, unknown>) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await admin.from('api_telemetry_events').insert({
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

export async function geocode(text: string): Promise<GeoPoint | null> {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return null;
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(cityName(text))}&type=city&lang=pt&limit=1&apiKey=${key}`;
    const data = await getJson<{ features?: { properties: { lat: number; lon: number; formatted?: string } }[] }>(url);
    const p = data.features?.[0]?.properties;
    return p ? { lat: p.lat, lon: p.lon, label: p.formatted ?? text } : null;
  } catch {
    return null;
  }
}

interface GeoapifyPlace {
  properties: {
    place_id: string;
    name?: string;
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
  category: SearchResult['category'],
  label: string,
): Promise<SearchResponse> {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return missingKey('GEOAPIFY_API_KEY');
  const t0 = Date.now();
  try {
    const point = await geocode(destination);
    if (!point) return { results: [], notice: `Nao encontramos "${cityName(destination)}" no mapa.` };
    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${point.lon},${point.lat},6000&bias=proximity:${point.lon},${point.lat}&limit=12&lang=pt&apiKey=${key}`;
    const data = await getJson<{ features?: GeoapifyPlace[] }>(url);
    const results = (data.features ?? [])
      .filter((f) => f.properties.name)
      .map<SearchResult>((f) => {
        const p = f.properties;
        const map = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=17/${p.lat}/${p.lon}`;
        return {
          id: `geo-${p.place_id}`,
          category,
          source_type: 'api_partner',
          source: label,
          title: p.name as string,
          description: [p.address_line2, p.distance ? `${(p.distance / 1000).toFixed(1)} km do centro` : null].filter(Boolean).join(' - '),
          price: null,
          currency: 'BRL',
          url: p.website ?? map,
          raw: { place_id: p.place_id, lat: p.lat, lon: p.lon, categories: p.categories ?? [] },
        };
      });
    logApiTelemetry('geoapify', 'places', 'success', destination, Date.now() - t0, { count: results.length, category });
    return { results };
  } catch {
    logApiTelemetry('geoapify', 'places', 'error', destination, Date.now() - t0);
    return failed('a Geoapify');
  }
}

export function searchHotels(destination: string): Promise<SearchResponse> {
  return geoapifyPlaces(destination, 'accommodation.hotel,accommodation.guest_house,accommodation.hostel', 'hotel', 'Geoapify Places').then((r) => ({
    ...r,
    moreUrl: `https://www.booking.com/searchresults.pt-br.html?ss=${encodeURIComponent(cityName(destination))}`,
  }));
}

export function searchTransport(destination: string): Promise<SearchResponse> {
  return geoapifyPlaces(destination, 'public_transport.subway,public_transport.train,rental.car,airport', 'transport', 'Geoapify API');
}

export async function searchTours(destination: string): Promise<SearchResponse> {
  const key = process.env.OPENTRIPMAP_API_KEY;
  if (!key) return missingKey('OPENTRIPMAP_API_KEY');
  const t0 = Date.now();
  try {
    const geo = await getJson<{ lat?: number; lon?: number; status?: string }>(
      `https://api.opentripmap.com/0.1/pt/places/geoname?name=${encodeURIComponent(cityName(destination))}&apikey=${key}`,
    );
    if (geo.lat === undefined || geo.lon === undefined) {
      return { results: [], notice: `Nao encontramos "${cityName(destination)}" na OpenTripMap.` };
    }
    const places = await getJson<{ xid: string; name: string; kinds: string; dist: number; rate: number }[]>(
      `https://api.opentripmap.com/0.1/pt/places/radius?radius=10000&lon=${geo.lon}&lat=${geo.lat}&kinds=interesting_places&rate=3&format=json&limit=15&apikey=${key}`,
    );
    const results = places
      .filter((p) => p.name)
      .map<SearchResult>((p) => ({
        id: `otm-${p.xid}`,
        category: 'tour',
        source_type: 'api_partner',
        source: 'OpenTripMap',
        title: p.name,
        description: `${p.kinds.split(',').slice(0, 3).join(', ').replace(/_/g, ' ')} - ${(p.dist / 1000).toFixed(1)} km do centro`,
        price: null,
        currency: 'BRL',
        url: `https://opentripmap.com/pt/card/${p.xid}`,
        raw: { xid: p.xid, kinds: p.kinds, rate: p.rate },
      }));
    logApiTelemetry('opentripmap', 'tours', 'success', destination, Date.now() - t0, { count: results.length });
    return { results };
  } catch {
    logApiTelemetry('opentripmap', 'tours', 'error', destination, Date.now() - t0);
    return failed('a OpenTripMap');
  }
}

interface TpFlight {
  origin: string;
  destination: string;
  origin_airport?: string;
  destination_airport?: string;
  price: number;
  airline: string;
  flight_number?: string | number;
  departure_at: string;
  return_at?: string;
  transfers: number;
  return_transfers?: number;
  link?: string;
}

export function affiliateLink(link: string | undefined, marker: string | undefined, origin: string, destination: string): string {
  const base = link ? `https://www.aviasales.com${link}` : `https://www.aviasales.com/search/${origin}${destination}1`;
  if (!marker) return base;
  return `${base}${base.includes('?') ? '&' : '?'}marker=${encodeURIComponent(marker)}`;
}

export async function searchFlights(origin: string, destination: string, departMonth?: string): Promise<SearchResponse> {
  const token = process.env.TRAVELPAYOUTS_TOKEN || process.env.TRAVELPAYOUTS_API_KEY;
  if (!token) return missingKey('TRAVELPAYOUTS_TOKEN');
  const [o, d] = await Promise.all([resolveIata(origin), resolveIata(destination)]);
  if (!o || !d) {
    return { results: [], notice: 'Nao identificamos o aeroporto. Digite a cidade com o codigo, ex.: "Salvador (SSA)".' };
  }
  const t0 = Date.now();
  try {
    const params = new URLSearchParams({
      origin: o,
      destination: d,
      currency: 'brl',
      sorting: 'price',
      one_way: 'false',
      direct: 'false',
      limit: '12',
    });
    if (departMonth && /^\d{4}-\d{2}$/.test(departMonth)) params.set('departure_at', departMonth);
    const data = await getJson<{ success: boolean; data?: TpFlight[] }>(
      `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${params}`,
      { headers: { 'X-Access-Token': token } },
    );
    const marker = process.env.TRAVELPAYOUTS_MARKER;
    const results = (data.data ?? []).map<SearchResult>((f, i) => {
      const dep = f.departure_at?.slice(0, 10);
      const ret = f.return_at?.slice(0, 10);
      const stops = f.transfers === 0 ? 'voo direto' : `${f.transfers} conexao(oes)`;
      return {
        id: `tp-${f.airline}-${f.flight_number ?? i}-${dep}`,
        category: 'flight',
        source_type: 'api_partner',
        source: 'Travelpayouts API',
        title: `Voo ${f.airline} ${f.origin_airport ?? o} -> ${f.destination_airport ?? d}${ret ? ' (ida e volta)' : ''}`,
        description: `Ida ${dep?.split('-').reverse().join('/')}${ret ? ` - volta ${ret.split('-').reverse().join('/')}` : ''} - ${stops}. Preco em cache, confirme no parceiro.`,
        price: f.price,
        currency: 'BRL',
        url: affiliateLink(f.link, marker, o, d),
        raw: { ...f },
      };
    });
    logApiTelemetry('travelpayouts', 'flights', 'success', `${o}->${d}`, Date.now() - t0, { count: results.length });
    return {
      results,
      notice: results.length ? undefined : `Nenhum preco em cache para ${o} -> ${d} neste periodo.`,
      moreUrl: affiliateLink(undefined, marker, o, d),
    };
  } catch {
    logApiTelemetry('travelpayouts', 'flights', 'error', `${o}->${d}`, Date.now() - t0);
    return failed('a Travelpayouts');
  }
}

export async function searchWeb(destination: string): Promise<SearchResponse> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  const admin = getSupabaseAdmin();
  const cleanCity = cityName(destination);

  const fallbackUrls = {
    google: `https://www.google.com/search?q=${encodeURIComponent(`o que fazer em ${cleanCity} dicas turismo roteiro`)}`,
    brave: `https://search.brave.com/search?q=${encodeURIComponent(`o que fazer em ${cleanCity} dicas turismo roteiro`)}`,
  };

  if (!key) {
    return {
      results: [],
      notice: 'Garimpo Livre ativado: pesquise diretamente no Google ou Brave nos botoes abaixo e guarde o link do que encontrar na sua Caixa.',
      degraded: true,
      fallbackUrls,
    };
  }

  let allowed = true;
  if (admin) {
    try {
      const { data, error } = await admin.rpc('check_and_increment_api_quota', {
        p_provider: 'brave_search',
        p_limit: 950,
      });
      if (!error && data && typeof data === 'object' && 'allowed' in data) {
        allowed = Boolean((data as { allowed: boolean }).allowed);
      }
    } catch {
      allowed = true;
    }
  }

  if (!allowed) {
    logApiTelemetry('brave_search', 'search', 'degraded_fallback', destination, 0, { reason: 'monthly_quota_reached' });
    return {
      results: [],
      notice: 'Garimpo Livre ativado: pesquise diretamente no Google ou Brave nos botoes abaixo e cole o link do que encontrar para guardar no seu roteiro.',
      degraded: true,
      fallbackUrls,
    };
  }

  const t0 = Date.now();
  try {
    const q = `o que fazer em ${cleanCity} dicas eventos`;
    const data = await getJson<{ web?: { results?: { title: string; url: string; description?: string }[] } }>(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&country=BR&search_lang=pt-br&count=10`,
      { headers: { Accept: 'application/json', 'X-Subscription-Token': key } },
    );
    const results = (data.web?.results ?? []).map<SearchResult>((r, i) => ({
      id: `brave-${i}-${r.url}`,
      category: 'web_idea',
      source_type: 'web_result',
      source: 'Brave Search',
      title: r.title.replace(/<[^>]+>/g, ''),
      description: (r.description ?? '').replace(/<[^>]+>/g, ''),
      price: null,
      currency: 'BRL',
      url: r.url,
      raw: { url: r.url },
    }));

    logApiTelemetry('brave_search', 'search', 'success', destination, Date.now() - t0, { count: results.length });
    return { results, fallbackUrls };
  } catch {
    logApiTelemetry('brave_search', 'search', 'error', destination, Date.now() - t0);
    return {
      results: [],
      notice: 'Garimpo Livre: a consulta web externa esta oscilando no momento. Voce pode pesquisar diretamente nos atalhos abaixo.',
      degraded: true,
      fallbackUrls,
    };
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
    const data = await getJson<Record<string, { bid: string; create_date: string }>>(
      'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,ARS-BRL',
    );
    const n = (k: string) => (data[k]?.bid ? Number(data[k].bid) : null);
    logApiTelemetry('awesomeapi', 'rates', 'success', undefined, Date.now() - t0);
    return { USD_BRL: n('USDBRL'), EUR_BRL: n('EURBRL'), ARS_BRL: n('ARSBRL'), updatedAt: data.USDBRL?.create_date ?? null };
  } catch {
    logApiTelemetry('awesomeapi', 'rates', 'error', undefined, Date.now() - t0);
    return { USD_BRL: null, EUR_BRL: null, ARS_BRL: null, updatedAt: null };
  }
}

function wmoCondition(code: number): string {
  if (code === 0) return 'Ceu limpo';
  if (code <= 3) return 'Parcialmente nublado';
  if (code <= 48) return 'Nevoeiro';
  if (code <= 55) return 'Garoa leve';
  if (code <= 65) return 'Chuva moderada';
  if (code <= 82) return 'Pancadas de chuva';
  if (code <= 99) return 'Tempestade';
  return 'Clima variavel';
}

function generatePackingTip(tempMax: number, tempMin: number, precip: number): string {
  const tips: string[] = [];
  if (tempMax >= 27) tips.push('Tempo quente: leve roupas leves, protetor FPS 50 e oculos de sol.');
  else if (tempMin <= 16) tips.push('Noites frescas/frias: inclua casaco leve e calcas confortaveis.');
  else tips.push('Temperatura amena: ideal para caminhadas ao ar livre.');

  if (precip > 2) tips.push('Previsao de chuva: coloque capa ou guarda-chuva dobravel na mala.');
  return tips.join(' ');
}

export async function fetchWeather(destination: string): Promise<WeatherData | null> {
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

    logApiTelemetry('open_meteo', 'weather', 'success', destination, Date.now() - t0);

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
    logApiTelemetry('open_meteo', 'weather', 'error', destination, Date.now() - t0);
    return null;
  }
}

export async function fetchCitySummary(destination: string): Promise<CitySummary | null> {
  const t0 = Date.now();
  const city = cityName(destination);
  try {
    const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`;
    const data = await getJson<{
      title: string;
      extract?: string;
      thumbnail?: { source: string };
      content_urls?: { desktop?: { page?: string } };
    }>(url, { headers: { 'User-Agent': 'GarimpaTrip/1.0 (contato@garimpatrip.com.br)' } });

    if (!data.extract) return null;

    logApiTelemetry('wikipedia', 'summary', 'success', destination, Date.now() - t0);

    return {
      title: data.title,
      extract: data.extract,
      thumbnailUrl: data.thumbnail?.source,
      pageUrl: data.content_urls?.desktop?.page,
    };
  } catch {
    logApiTelemetry('wikipedia', 'summary', 'error', destination, Date.now() - t0);
    return null;
  }
}
