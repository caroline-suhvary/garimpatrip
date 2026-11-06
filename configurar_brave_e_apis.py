#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
GARIMPATRIP - SCRIPT DE ATUALIZACAO DO BRAVE SEARCH, TELEMETRIA E APIS ABERTAS
==============================================================================
Execute na raiz do projeto garimpatrip com:
    python configurar_brave_e_apis.py
==============================================================================
"""

import os
import shutil

def backup(path):
    if os.path.exists(path):
        bak = path + ".bak"
        shutil.copy2(path, bak)
        print(f"  [backup] {path} -> {bak}")

print("\nIniciando configuracao do Brave Search, Telemetria e APIs Abertas...\n")

# 1. SQL
sql_file = os.path.join("sql", "02_telemetry_and_brave_quota.sql")
os.makedirs("sql", exist_ok=True)
with open(sql_file, "w", encoding="utf-8") as f:
    f.write("""-- ==============================================================================
-- GARIMPATRIP: CONTROLE ATOMICO DE COTA DO BRAVE & TELEMETRIA DE DADOS
-- Execute este script no SQL Editor do Supabase para ativar:
-- 1. Contador mensal atomico (limite de 950 chamadas/mes)
-- 2. Tabela de telemetria analitica de APIs (FinOps & Engenharia de Dados)
-- 3. Tabela de trafego do site (visitas e conversoes)
-- ==============================================================================

-- 1. TABELA DE CONTROLE DE COTAS MENSAIS DE APIS
CREATE TABLE IF NOT EXISTS public.api_monthly_quotas (
    id SERIAL PRIMARY KEY,
    provider TEXT NOT NULL,
    year_month TEXT NOT NULL,
    request_count INT NOT NULL DEFAULT 0,
    quota_limit INT NOT NULL DEFAULT 950,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_provider_month UNIQUE (provider, year_month)
);

-- FUNCAO ATOMICA ACID: Checa e reserva 1 requisicao em uma unica transacao
-- Se request_count < p_limit: incrementa e devolve allowed = true
-- Se request_count >= p_limit: NAO incrementa e devolve allowed = false
CREATE OR REPLACE FUNCTION public.check_and_increment_api_quota(
    p_provider TEXT,
    p_limit INT DEFAULT 950
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cur_month TEXT := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM');
    v_count INT;
    v_allowed BOOLEAN;
BEGIN
    -- Garante que o registro do mes atual exista
    INSERT INTO public.api_monthly_quotas (provider, year_month, request_count, quota_limit)
    VALUES (p_provider, v_cur_month, 0, p_limit)
    ON CONFLICT (provider, year_month) DO NOTHING;

    -- Tenta incrementar atomicamente apenas se estiver abaixo do teto
    UPDATE public.api_monthly_quotas
    SET request_count = request_count + 1,
        updated_at = NOW()
    WHERE provider = p_provider
      AND year_month = v_cur_month
      AND request_count < p_limit
    RETURNING request_count INTO v_count;

    IF v_count IS NOT NULL THEN
        v_allowed := TRUE;
    ELSE
        -- Limite de seguranca atingido no mes vigente
        SELECT request_count INTO v_count
        FROM public.api_monthly_quotas
        WHERE provider = p_provider AND year_month = v_cur_month;
        v_allowed := FALSE;
    END IF;

    RETURN jsonb_build_object(
        'allowed', v_allowed,
        'current_count', COALESCE(v_count, p_limit),
        'quota_limit', p_limit,
        'year_month', v_cur_month
    );
END;
$$;

-- 2. TELEMETRIA ANALITICA DE APIS (Para o Pipeline Python e Looker Studio)
CREATE TABLE IF NOT EXISTS public.api_telemetry_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,             -- 'brave_search', 'geoapify', 'opentripmap', 'travelpayouts', 'awesomeapi', 'open_meteo', 'wikipedia'
    action TEXT NOT NULL,               -- 'search', 'click_partner', 'save_to_box', 'quota_exceeded'
    status TEXT DEFAULT 'success',      -- 'success', 'error', 'degraded_fallback'
    destination TEXT,
    latency_ms INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_telemetry_provider ON public.api_telemetry_events(provider, created_at);
CREATE INDEX IF NOT EXISTS idx_api_telemetry_action ON public.api_telemetry_events(action);

-- 3. TELEMETRIA DE TRAFEGO E AUDIENCIA DO SITE
CREATE TABLE IF NOT EXISTS public.site_traffic_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    page_path TEXT NOT NULL,
    referrer TEXT,
    device_type TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_traffic_created ON public.site_traffic_events(created_at);
""")
print(f"[OK] Criado: {sql_file}")

# 2. Admin client
admin_file = os.path.join("src", "lib", "supabase", "admin.ts")
os.makedirs(os.path.dirname(admin_file), exist_ok=True)
with open(admin_file, "w", encoding="utf-8") as f:
    f.write("""import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
""")
print(f"[OK] Criado: {admin_file}")

# 3. Tipos
types_file = os.path.join("src", "types", "index.ts")
backup(types_file)
with open(types_file, "r", encoding="utf-8") as f:
    content = f.read()

if "degraded?: boolean;" not in content:
    content = content.replace(
        "export interface SearchResponse {",
        "export interface SearchResponse {\n  degraded?: boolean;\n  fallbackUrls?: { google?: string; brave?: string };"
    )

if "export interface WeatherData" not in content:
    content += """

export interface WeatherData {
  destination: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  conditionLabel: string;
  tempMax: number;
  tempMin: number;
  packingTip: string;
}

export interface CitySummary {
  title: string;
  extract: string;
  thumbnailUrl?: string;
  pageUrl?: string;
}
"""

with open(types_file, "w", encoding="utf-8") as f:
    f.write(content)
print(f"[OK] Atualizado: {types_file}")

# 4. Providers
prov_file = os.path.join("src", "lib", "providers.ts")
backup(prov_file)
with open(prov_file, "w", encoding="utf-8") as f:
    f.write("""import 'server-only';
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
""")
print(f"[OK] Atualizado: {prov_file}")

# 5. Weather route
wr_file = os.path.join("src", "app", "api", "weather", "route.ts")
os.makedirs(os.path.dirname(wr_file), exist_ok=True)
with open(wr_file, "w", encoding="utf-8") as f:
    f.write("""import { NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/providers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = (searchParams.get('destination') ?? '').trim();
  if (destination.length < 2) {
    return NextResponse.json({ error: 'Informe o destino.' }, { status: 400 });
  }

  const weather = await fetchWeather(destination);
  if (!weather) {
    return NextResponse.json({ error: 'Nao foi possivel obter o clima para este destino.' }, { status: 404 });
  }

  return NextResponse.json(weather);
}
""")
print(f"[OK] Criado: {wr_file}")

# 6. Telemetry route
tr_file = os.path.join("src", "app", "api", "telemetry", "route.ts")
os.makedirs(os.path.dirname(tr_file), exist_ok=True)
with open(tr_file, "w", encoding="utf-8") as f:
    f.write("""import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, action, status = 'success', destination, latency_ms, metadata } = body;
    const admin = getSupabaseAdmin();
    if (!admin || !provider || !action) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await admin.from('api_telemetry_events').insert({
      provider,
      action,
      status,
      destination,
      latency_ms,
      metadata: metadata ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
""")
print(f"[OK] Criado: {tr_file}")

# 7. DiscoverClient.tsx
disc_file = os.path.join("src", "components", "discover", "DiscoverClient.tsx")
backup(disc_file)
with open(disc_file, "w", encoding="utf-8") as f:
    f.write("""'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Building2, Ticket, Car, Globe, Search, ExternalLink, Plus, Check, Loader2, BookmarkPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { TripPicker } from '@/components/TripPicker';
import { cityName, extractIata } from '@/lib/iata';
import { formatBRL, parseMoney } from '@/lib/format';
import type { SearchResponse, SearchResult } from '@/types';
import styles from '@/styles/Discover.module.css';

const SECTIONS = [
  { key: 'flights', title: 'Voos (Travelpayouts)', icon: Plane, color: 'var(--cat-flight-text)', bg: 'var(--cat-flight-bg)' },
  { key: 'hotels', title: 'Hospedagens proximas', icon: Building2, color: 'var(--cat-hotel-text)', bg: 'var(--cat-hotel-bg)' },
  { key: 'tours', title: 'Passeios & Atracoes', icon: Ticket, color: 'var(--cat-tour-text)', bg: 'var(--cat-tour-bg)' },
  { key: 'transport', title: 'Deslocamento Local', icon: Car, color: 'var(--cat-transport-text)', bg: 'var(--cat-transport-bg)' },
  { key: 'web', title: 'Ideias da Web & Garimpo Livre', icon: Globe, color: 'var(--cat-food-text)', bg: 'var(--cat-food-bg)' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];
type SectionState = { loading: boolean; data?: SearchResponse; error?: string };

interface Props {
  initialOrigin: string;
  initialDestination: string;
  initialBudget: string;
  initialMonth: string;
}

export function DiscoverClient({ initialOrigin, initialDestination, initialBudget, initialMonth }: Props) {
  const router = useRouter();
  const { supabase, user, signIn } = useAuth();
  const { trips, selectedTrip, selectedId, setSelectedId, reload, loading: tripsLoading } = useTrips(supabase, user);

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [budget, setBudget] = useState(initialBudget);
  const [month, setMonth] = useState(initialMonth);
  const [searched, setSearched] = useState({ origin: initialOrigin, destination: initialDestination, month: initialMonth });
  const [sections, setSections] = useState<Record<SectionKey, SectionState>>({} as Record<SectionKey, SectionState>);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  const budgetNumber = parseMoney(budget);

  const trackOutboundClick = (provider: string, url: string, title?: string) => {
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        action: 'click_partner',
        destination: searched.destination || destination,
        metadata: { url, title },
      }),
    }).catch(() => {});
  };

  const runSearch = useCallback(async (o: string, d: string, m: string) => {
    if (!d) return;
    setMessage(null);
    const params = new URLSearchParams({ origin: o, destination: d });
    if (m) params.set('month', m);

    setSections(Object.fromEntries(SECTIONS.map((s) => [s.key, { loading: true }])) as Record<SectionKey, SectionState>);
    await Promise.all(
      SECTIONS.map(async (s) => {
        try {
          const res = await fetch(`/api/discover/${s.key}?${params}`);
          const data = (await res.json()) as SearchResponse & { error?: string };
          setSections((prev) => ({
            ...prev,
            [s.key]: res.ok ? { loading: false, data } : { loading: false, error: data.error ?? 'Erro na busca.' },
          }));
        } catch {
          setSections((prev) => ({ ...prev, [s.key]: { loading: false, error: 'Falha de conexao.' } }));
        }
      }),
    );
  }, []);

  useEffect(() => {
    if (initialDestination) runSearch(initialOrigin, initialDestination, initialMonth);
  }, [initialOrigin, initialDestination, initialMonth, runSearch]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ origin, destination, budget });
    if (month) params.set('month', month);
    router.replace(`/discover?${params}`, { scroll: false });
    setSearched({ origin, destination, month });
    runSearch(origin, destination, month);
  };

  const createTrip = async () => {
    if (!supabase || !user) return signIn();
    const dest = searched.destination || destination;
    if (!dest.trim()) return setMessage({ type: 'error', text: 'Informe um destino antes de criar a viagem.' });
    setCreatingTrip(true);
    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        title: `Viagem para ${cityName(dest)}`,
        origin_city: cityName(searched.origin || origin) || 'A definir',
        origin_iata: extractIata(searched.origin || origin),
        destination_city: cityName(dest),
        destination_iata: extractIata(dest),
        budget_limit: parseMoney(budget) ?? 0,
      })
      .select('id')
      .single();
    setCreatingTrip(false);
    if (error) return setMessage({ type: 'error', text: error.message });
    await reload();
    setSelectedId(data.id);
    setMessage({ type: 'ok', text: `Viagem para ${cityName(dest)} criada! Agora e so guardar os achados.` });
  };

  const saveResult = async (r: SearchResult) => {
    if (!supabase || !user) return signIn();
    if (!selectedTrip) return setMessage({ type: 'error', text: 'Crie ou escolha uma viagem antes de guardar itens.' });
    const { error } = await supabase.from('discoveries').insert({
      trip_id: selectedTrip.id,
      user_id: user.id,
      title: r.title,
      category: r.category,
      description: r.description,
      source_type: r.source_type,
      external_url: r.url,
      estimated_price: r.price,
      currency: r.currency,
      raw_payload: r.raw,
    });
    if (error) return setMessage({ type: 'error', text: error.message });
    setSaved((prev) => ({ ...prev, [r.id]: true }));
    setMessage({ type: 'ok', text: `"${r.title}" foi para a sua Caixa de Descobertas!` });
  };

  const saveManualWebIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return signIn();
    if (!selectedTrip) return setMessage({ type: 'error', text: 'Escolha uma viagem acima antes de guardar itens.' });
    if (!manualTitle.trim()) return setMessage({ type: 'error', text: 'De um titulo ou nome para o que voce encontrou.' });

    setManualSaving(true);
    const manualItem: SearchResult = {
      id: `manual-${Date.now()}`,
      category: 'web_idea',
      source_type: 'manual',
      source: 'Garimpo Livre',
      title: manualTitle.trim(),
      description: manualUrl ? `Link salvo da web: ${manualUrl}` : 'Anotacao de garimpo livre na web',
      price: null,
      currency: 'BRL',
      url: manualUrl.trim() || null,
      raw: { manual: true, url: manualUrl.trim() },
    };

    await saveResult(manualItem);
    setManualTitle('');
    setManualUrl('');
    setManualSaving(false);
  };

  return (
    <main className="gt-page">
      <div className="gt-container">
        <div className={styles.header}>
          <span className="gt-badge" style={{ background: 'var(--cat-flight-bg)', borderColor: 'var(--cat-flight-border)', color: 'var(--cat-flight-text)' }}>
            Search, Look and Redirect
          </span>
          <h1 className="gt-title">Descobrir Destinos{searched.destination ? `: ${cityName(searched.destination)}` : ''}</h1>
          <p className="gt-subtitle">
            Consultamos parceiros e fontes oficiais ao mesmo tempo. Guarde o que gostar na Caixa de Descobertas e reserve sempre no site do parceiro.
          </p>
        </div>

        <form className={styles.searchForm} onSubmit={onSubmit}>
          <label className="gt-label">Origem<input className="gt-input" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Sao Paulo (GRU)" /></label>
          <label className="gt-label">Destino<input className="gt-input" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Salvador (SSA)" required /></label>
          <label className="gt-label">Mes da ida<input className="gt-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
          <label className="gt-label">Teto (R$)<input className="gt-input" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="3500" /></label>
          <button type="submit" className="gt-btn gt-btn-dark"><Search size={16} /> Garimpar</button>
        </form>

        <div className={styles.tripBar}>
          {user ? (
            <>
              <TripPicker trips={trips} selectedId={selectedId} onChange={setSelectedId} loading={tripsLoading} />
              {searched.destination && (
                <button type="button" className="gt-btn gt-btn-yellow" onClick={createTrip} disabled={creatingTrip}>
                  <Plus size={16} /> Criar viagem para {cityName(searched.destination)}
                </button>
              )}
            </>
          ) : (
            <div className="gt-notice">
              Voce pode pesquisar a vontade. Para guardar itens na Caixa de Descobertas,{' '}
              <button type="button" className={styles.inlineLink} onClick={signIn}>entre com Google</button>.
            </div>
          )}
        </div>

        {message && <div className={message.type === 'ok' ? 'gt-success' : 'gt-error'} style={{ marginBottom: '1.5rem' }}>{message.text}</div>}

        {!searched.destination && <div className="gt-notice">Digite um destino e clique em Garimpar para comecar.</div>}

        {searched.destination && (
          <div className={styles.sections}>
            {SECTIONS.map((s) => {
              const st = sections[s.key];
              const Icon = s.icon;
              const isWeb = s.key === 'web';
              const isDegraded = isWeb && (st?.data?.degraded || (st?.data?.results?.length === 0 && !st?.loading));

              return (
                <section key={s.key} className={styles.section}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionIcon} style={{ background: s.bg, color: s.color }}><Icon size={18} /></span>
                    <h2 className={styles.sectionTitle}>{s.title}</h2>
                    {st?.data?.moreUrl && (
                      <a
                        href={st.data.moreUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className={styles.moreLink}
                        onClick={() => trackOutboundClick(s.key, st.data!.moreUrl!)}
                      >
                        Ver mais no parceiro <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {st?.loading && <div className={styles.loading}><Loader2 size={18} className={styles.spin} /> Garimpando...</div>}
                  {st?.error && <div className="gt-error">{st.error}</div>}
                  {st?.data?.notice && <div className="gt-notice">{st.data.notice}</div>}

                  {isWeb && isDegraded && (
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--bg-sand-300)',
                      borderRadius: 'var(--radius-bento)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--brand-dark)' }}>
                          Pesquise agora em nova aba e cole o link do que gostar:
                        </strong>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          <a
                            href={st?.data?.fallbackUrls?.google ?? `https://www.google.com/search?q=o+que+fazer+em+${encodeURIComponent(cityName(searched.destination))}+dicas`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gt-btn gt-btn-light gt-btn-sm"
                            onClick={() => trackOutboundClick('google_fallback', 'https://google.com')}
                          >
                            Abrir no Google <ExternalLink size={12} />
                          </a>
                          <a
                            href={st?.data?.fallbackUrls?.brave ?? `https://search.brave.com/search?q=o+que+fazer+em+${encodeURIComponent(cityName(searched.destination))}+dicas`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gt-btn gt-btn-light gt-btn-sm"
                            onClick={() => trackOutboundClick('brave_fallback', 'https://search.brave.com')}
                          >
                            Abrir no Brave <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>

                      {user ? (
                        <form onSubmit={saveManualWebIdea} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                          <label className="gt-label" style={{ margin: 0 }}>
                            Nome do lugar ou dica
                            <input
                              className="gt-input"
                              placeholder="Ex.: Sorveteria da Ribeira ou Museu de Arte"
                              value={manualTitle}
                              onChange={(e) => setManualTitle(e.target.value)}
                              required
                            />
                          </label>
                          <label className="gt-label" style={{ margin: 0 }}>
                            Link encontrado (opcional)
                            <input
                              className="gt-input"
                              placeholder="https://exemplo.com/dica"
                              value={manualUrl}
                              onChange={(e) => setManualUrl(e.target.value)}
                            />
                          </label>
                          <button type="submit" className="gt-btn gt-btn-dark" disabled={manualSaving}>
                            {manualSaving ? <Loader2 size={14} className={styles.spin} /> : <BookmarkPlus size={14} />}
                            Guardar na Caixa
                          </button>
                        </form>
                      ) : (
                        <div className="gt-notice" style={{ margin: 0 }}>
                          Entre com o Google acima para colar seus links e notas direto na Caixa de Descobertas.
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.results}>
                    {st?.data?.results.map((r) => {
                      const overBudget = budgetNumber !== null && budgetNumber > 0 && r.price !== null && r.price > budgetNumber;
                      return (
                        <article key={r.id} className={styles.result}>
                          <span className={styles.source}>{r.source}</span>
                          <h3 className={styles.resultTitle}>{r.title}</h3>
                          {r.description && <p className={styles.resultDesc}>{r.description}</p>}
                          <div className={styles.resultFooter}>
                            <span className={overBudget ? styles.priceOver : styles.price}>
                              {r.price !== null ? formatBRL(r.price) : 'Consultar'}
                              {overBudget && <small> acima do teto</small>}
                            </span>
                            <div className="gt-row" style={{ gap: '0.4rem' }}>
                              {r.url && (
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer sponsored"
                                  className="gt-btn gt-btn-light gt-btn-sm"
                                  aria-label="Abrir no site original"
                                  onClick={() => trackOutboundClick(r.source, r.url!, r.title)}
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                              <button type="button" className="gt-btn gt-btn-dark gt-btn-sm" onClick={() => saveResult(r)} disabled={saved[r.id]}>
                                {saved[r.id] ? <><Check size={13} /> Guardado</> : <><Plus size={13} /> Caixa</>}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
""")
print(f"[OK] Atualizado: {disc_file}")

print("\n[SUCESSO] Configuracao concluida!")
print("Proximos passos:")
print("1. No Supabase (SQL Editor), execute o arquivo: sql/02_telemetry_and_brave_quota.sql")
print("2. Reinicie o servidor local: npm run dev")
