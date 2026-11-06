# -*- coding: utf-8 -*-
"""
GARIMPATRIP - SCRIPT DE ATUALIZACAO AUTOMATICA
1. Integra OpenRouteService (Rotas a pe + perfil de elevacao/ladeiras)
2. Trava de seguranca: 1.800 chamadas/dia (reseta a cada meia-noite)
3. Telemetria e tabela de cliques para parceiros afiliados (Available 25)
4. Remove seletores de idioma da Navbar (desktop e mobile)
5. Componente visual reutilizavel de inclinacao e relevo
6. Demonstracao pronta na Vitrine e em rotas da Caixa

COMO EXECUTAR NO SEU COMPUTADOR:
1. Salve este script na raiz do projeto garimpatrip
2. Execute:
   python atualizar_garimpatrip_mapa_afiliados.py
"""

import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))

def save_file(rel_path, content):
    full_path = os.path.join(ROOT, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f" [OK] {rel_path}")

print("\n" + "=" * 60)
print("  GARIMPATRIP: ATUALIZACAO DE MAPA, ELEVACAO E PARCEIROS")
print("=" * 60 + "\n")

# -------------------------------------------------------------
# 1. SQL DE TELEMETRIA, COTAS E CLIQUES DE AFILIADOS
# -------------------------------------------------------------
sql_content = """-- ==============================================================
-- GARIMPATRIP: TELEMETRIA, CONTROLE DE COTAS E AFILIADOS
-- Execute no SQL Editor do Supabase se desejar persistencia no banco
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.api_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL,
  period text NOT NULL, -- 'YYYY-MM-DD' para cota diaria ou 'YYYY-MM' para mensal
  request_count int NOT NULL DEFAULT 0,
  max_limit int NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_api_period UNIQUE (api_name, period)
);

CREATE TABLE IF NOT EXISTS public.api_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL,
  endpoint text NOT NULL,
  status_code int NOT NULL,
  latency_ms int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name text NOT NULL,
  category text NOT NULL,
  target_url text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.check_and_increment_quota(
  p_api_name text,
  p_period text,
  p_limit int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
  v_allowed boolean;
BEGIN
  INSERT INTO public.api_quotas (api_name, period, request_count, max_limit, updated_at)
  VALUES (p_api_name, p_period, 1, p_limit, now())
  ON CONFLICT (api_name, period)
  DO UPDATE SET
    request_count = public.api_quotas.request_count + 1,
    max_limit = p_limit,
    updated_at = now()
  RETURNING request_count INTO v_count;

  IF v_count <= p_limit THEN
    v_allowed := true;
  ELSE
    v_allowed := false;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current_count', v_count,
    'limit', p_limit,
    'remaining', GREATEST(0, p_limit - v_count)
  );
END;
$$;
"""
save_file("sql/02_telemetry_quotas_and_affiliates.sql", sql_content)

# -------------------------------------------------------------
# 2. CLIENTE OPENROUTESERVICE (ROTA A PE + PERFIL DE ELEVACAO)
# -------------------------------------------------------------
ors_code = """import 'server-only';

export interface ElevationPoint {
  distanceM: number;
  elevationM: number;
}

export interface WalkingRouteResult {
  distanceMeters: number;
  durationMinutes: number;
  ascentMeters: number;
  descentMeters: number;
  elevationProfile: ElevationPoint[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  difficultyLabel: string;
  advice: string;
  source: 'openrouteservice' | 'fallback';
}

export async function calculateWalkingElevation(
  startLon: number,
  startLat: number,
  endLon: number,
  endLat: number
): Promise<WalkingRouteResult | null> {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    console.warn('[OpenRouteService] OPENROUTESERVICE_API_KEY nao configurada no .env.local');
    return null;
  }

  // Endereço oficial atualizado da HeiGIT / OpenRouteService
  const url = 'https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey.trim(),
        Accept: 'application/json, application/geo+json',
      },
      body: JSON.stringify({
        coordinates: [
          [startLon, startLat],
          [endLon, endLat],
        ],
        elevation: true,
        instructions: true,
        language: 'pt',
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error('[OpenRouteService] Erro HTTP:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const props = feature.properties || {};
    const summary = props.summary || {};
    const distance = Math.round(summary.distance || 0);
    const duration = Math.round((summary.duration || 0) / 60);
    const ascent = Math.round(props.ascent || 0);
    const descent = Math.round(props.descent || 0);

    const coords: [number, number, number][] = feature.geometry?.coordinates || [];
    const profile: ElevationPoint[] = [];

    if (coords.length > 0) {
      const step = Math.max(1, Math.floor(coords.length / 15));
      for (let i = 0; i < coords.length; i += step) {
        const p = coords[i];
        const distFromStart = Math.round((i / coords.length) * distance);
        profile.push({
          distanceM: distFromStart,
          elevationM: Math.round(p[2] || 0),
        });
      }
    }

    let difficulty: 'easy' | 'moderate' | 'challenging' = 'easy';
    let difficultyLabel = 'Caminhada Plana / Leve';
    let advice = 'Percurso suave, sem ladeiras pesadas. Excelente para fazer a pe.';

    if (ascent >= 45 || (distance > 0 && ascent / distance > 0.05)) {
      difficulty = 'challenging';
      difficultyLabel = 'Ladeira Ingreme / Forte Aclive';
      advice = 'Atencao: subida acentuada! Se estiver com malas ou cansado, prefira transporte ou calcado adequado.';
    } else if (ascent >= 20) {
      difficulty = 'moderate';
      difficultyLabel = 'Subida Moderada';
      advice = 'Leve inclinacao pelo caminho. Caminhada tranquila com calcado confortavel.';
    }

    return {
      distanceMeters: distance,
      durationMinutes: duration,
      ascentMeters: ascent,
      descentMeters: descent,
      elevationProfile: profile,
      difficulty,
      difficultyLabel,
      advice,
      source: 'openrouteservice',
    };
  } catch (err) {
    console.error('[OpenRouteService] Falha na requisicao:', err);
    return null;
  }
}
"""
save_file("src/lib/openrouteservice.ts", ors_code)

# -------------------------------------------------------------
# 3. GERENCIADOR DE COTAS E TELEMETRIA (1.800/DIA ORS, 950/MES BRAVE)
# -------------------------------------------------------------
quota_code = """import 'server-only';
import { createClient } from '@supabase/supabase-js';

const memoryCounters = new Map<string, number>();

export async function checkQuotaAndTrack(
  apiName: string,
  periodType: 'daily' | 'monthly',
  maxLimit: number,
  endpoint: string,
  fn: () => Promise<{ status: number; data: any }>
): Promise<{ allowed: boolean; remaining: number; data: any; status: number; quotaExceeded?: boolean }> {
  const now = new Date();
  const period =
    periodType === 'daily'
      ? now.toISOString().slice(0, 10) // 'YYYY-MM-DD'
      : now.toISOString().slice(0, 7); // 'YYYY-MM'

  const cacheKey = `${apiName}:${period}`;
  let allowed = true;
  let remaining = maxLimit;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      const { data: rpcRes, error } = await supabase.rpc('check_and_increment_quota', {
        p_api_name: apiName,
        p_period: period,
        p_limit: maxLimit,
      });

      if (!error && rpcRes) {
        allowed = rpcRes.allowed;
        remaining = rpcRes.remaining;
      } else {
        const current = (memoryCounters.get(cacheKey) || 0) + 1;
        memoryCounters.set(cacheKey, current);
        allowed = current <= maxLimit;
        remaining = Math.max(0, maxLimit - current);
      }
    } catch {
      const current = (memoryCounters.get(cacheKey) || 0) + 1;
      memoryCounters.set(cacheKey, current);
      allowed = current <= maxLimit;
      remaining = Math.max(0, maxLimit - current);
    }
  } else {
    const current = (memoryCounters.get(cacheKey) || 0) + 1;
    memoryCounters.set(cacheKey, current);
    allowed = current <= maxLimit;
    remaining = Math.max(0, maxLimit - current);
  }

  if (!allowed) {
    return {
      allowed: false,
      quotaExceeded: true,
      remaining: 0,
      status: 429,
      data: null,
    };
  }

  const startTime = Date.now();
  const result = await fn();
  const latency = Date.now() - startTime;

  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      supabase
        .from('api_telemetry')
        .insert({
          api_name: apiName,
          endpoint,
          status_code: result.status,
          latency_ms: latency,
        })
        .then(() => {})
        .catch(() => {});
    } catch {}
  }

  return {
    allowed: true,
    remaining,
    data: result.data,
    status: result.status,
  };
}
"""
save_file("src/lib/quotaManager.ts", quota_code)

# -------------------------------------------------------------
# 4. ROTA DE API: /api/routes/walking
# -------------------------------------------------------------
api_walking = """import { NextResponse } from 'next/server';
import { calculateWalkingElevation } from '@/lib/openrouteservice';
import { checkQuotaAndTrack } from '@/lib/quotaManager';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startLon = parseFloat(searchParams.get('startLon') || '');
  const startLat = parseFloat(searchParams.get('startLat') || '');
  const endLon = parseFloat(searchParams.get('endLon') || '');
  const endLat = parseFloat(searchParams.get('endLat') || '');

  if (isNaN(startLon) || isNaN(startLat) || isNaN(endLon) || isNaN(endLat)) {
    return NextResponse.json(
      { error: 'Coordenadas invalidas. Informe startLon, startLat, endLon e endLat.' },
      { status: 400 }
    );
  }

  // Limite diario de 1.800 consultas para o OpenRouteService
  const quotaCheck = await checkQuotaAndTrack(
    'openrouteservice',
    'daily',
    1800,
    '/api/routes/walking',
    async () => {
      const routeData = await calculateWalkingElevation(startLon, startLat, endLon, endLat);
      return {
        status: routeData ? 200 : 502,
        data: routeData,
      };
    }
  );

  const fallbackUrl =
    'https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=' +
    startLat + '%2C' + startLon + '%3B' + endLat + '%2C' + endLon;

  if (quotaCheck.quotaExceeded) {
    return NextResponse.json({
      fallback: true,
      quotaExceeded: true,
      message: 'Limite diario de consultas do mapa atingido. Voce pode visualizar o trajeto no OpenStreetMap:',
      fallbackUrl,
    });
  }

  if (!quotaCheck.data) {
    return NextResponse.json({
      fallback: true,
      message: 'Nao foi possivel calcular o perfil exato no momento. Visualize diretamente no mapa:',
      fallbackUrl,
    });
  }

  return NextResponse.json({
    route: quotaCheck.data,
    quota: {
      remaining: quotaCheck.remaining,
      limit: 1800,
      period: 'diario',
    },
    fallbackUrl,
  });
}
"""
save_file("src/app/api/routes/walking/route.ts", api_walking)

# -------------------------------------------------------------
# 5. PARCEIROS AFILIADOS DISPONIVEIS (ABA AVAILABLE)
# -------------------------------------------------------------
affiliates_code = """export interface AffiliatePartner {
  id: string;
  name: string;
  category: 'tickets' | 'tours' | 'connectivity' | 'transfers' | 'flights' | 'luggage';
  badge: string;
  description: string;
  fallbackUrl: string;
}

// Parceiros confirmados na sua aba Available do Travelpayouts
export const AVAILABLE_PARTNERS: Record<string, AffiliatePartner> = {
  tiqets: {
    id: 'tiqets',
    name: 'Tiqets',
    category: 'tickets',
    badge: 'Ingressos Oficiais',
    description: 'Compre ingressos para museus, mirantes e monumentos sem filas.',
    fallbackUrl: 'https://www.tiqets.com/?partner=596330',
  },
  klook: {
    id: 'klook',
    name: 'Klook',
    category: 'tours',
    badge: 'Passeios & Experiencias',
    description: 'Passeios guiados, day trips e atracoes com confirmacao imediata.',
    fallbackUrl: 'https://www.klook.com/?aff_id=596330',
  },
  gocity: {
    id: 'gocity',
    name: 'Go City',
    category: 'tickets',
    badge: 'Passe Turistico Tudo-em-1',
    description: 'Pague um valor unico e visite dezenas de atracoes da cidade.',
    fallbackUrl: 'https://gocity.com/?partner=596330',
  },
  airalo: {
    id: 'airalo',
    name: 'Airalo',
    category: 'connectivity',
    badge: 'eSIM Internet Internacional',
    description: 'Internet 4G/5G sem trocar o chip fisico. Ativacao no celular.',
    fallbackUrl: 'https://www.airalo.com/?ref=596330',
  },
  yesim: {
    id: 'yesim',
    name: 'Yesim',
    category: 'connectivity',
    badge: 'eSIM Conectividade',
    description: 'Internet global rapida e flexivel para viagens.',
    fallbackUrl: 'https://yesim.app/?partner=596330',
  },
  kiwitaxi: {
    id: 'kiwitaxi',
    name: 'Kiwitaxi',
    category: 'transfers',
    badge: 'Transfer Aeroporto',
    description: 'Motorista esperando no desembarque com preco fechado.',
    fallbackUrl: 'https://kiwitaxi.com/?partner=596330',
  },
  radicalstorage: {
    id: 'radicalstorage',
    name: 'Radical Storage',
    category: 'luggage',
    badge: 'Guarda-Volumes',
    description: 'Deixe as malas com seguranca perto da estacao ou hotel.',
    fallbackUrl: 'https://radicalstorage.com/?partner=596330',
  },
  airhelp: {
    id: 'airhelp',
    name: 'AirHelp',
    category: 'flights',
    badge: 'Compensacao de Voos',
    description: 'Voo cancelado ou atrasado? Verifique direito a indenizacao.',
    fallbackUrl: 'https://www.airhelp.com/?partner=596330',
  },
};
"""
save_file("src/lib/affiliates.ts", affiliates_code)

# -------------------------------------------------------------
# 6. ROTA DE REDIRECIONAMENTO COM TELEMETRIA DE CLIQUES
# -------------------------------------------------------------
redirect_route = """import { NextResponse } from 'next/server';
import { AVAILABLE_PARTNERS } from '@/lib/affiliates';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: { partner: string } }
) {
  const partnerId = params.partner?.toLowerCase();
  const partner = AVAILABLE_PARTNERS[partnerId];

  if (!partner) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Registra clique no Supabase para Engenharia de Dados
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      await supabase.from('affiliate_clicks').insert({
        partner_name: partner.name,
        category: partner.category,
        target_url: partner.fallbackUrl,
      });
    } catch {}
  }

  return NextResponse.redirect(partner.fallbackUrl, 302);
}
"""
save_file("src/app/api/redirect/[partner]/route.ts", redirect_route)

# -------------------------------------------------------------
# 7. COMPONENTE VISUAL WALKING ELEVATION CARD
# -------------------------------------------------------------
walking_component = """'use client';

import React, { useState } from 'react';
import { Footprints, AlertTriangle, CheckCircle2, TrendingUp, Navigation, ExternalLink } from 'lucide-react';

interface ElevationPoint {
  distanceM: number;
  elevationM: number;
}

interface WalkingElevationCardProps {
  originName: string;
  destinationName: string;
  startLon: number;
  startLat: number;
  endLon: number;
  endLat: number;
  initialRoute?: {
    distanceMeters: number;
    durationMinutes: number;
    ascentMeters: number;
    descentMeters: number;
    difficulty: 'easy' | 'moderate' | 'challenging';
    difficultyLabel: string;
    advice: string;
    elevationProfile: ElevationPoint[];
  };
}

export function WalkingElevationCard({
  originName,
  destinationName,
  startLon,
  startLat,
  endLon,
  endLat,
  initialRoute,
}: WalkingElevationCardProps) {
  const [route, setRoute] = useState(initialRoute);
  const [loading, setLoading] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  async function loadLiveRoute() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/routes/walking?startLon=${startLon}&startLat=${startLat}&endLon=${endLon}&endLat=${endLat}`
      );
      const data = await res.json();
      if (data.route) {
        setRoute(data.route);
      }
      if (data.fallbackUrl) {
        setFallbackUrl(data.fallbackUrl);
      }
    } catch (e) {
      console.error('Erro ao consultar rota a pe:', e);
    } finally {
      setLoading(false);
    }
  }

  const profile = route?.elevationProfile || [];
  const minElev = profile.length > 0 ? Math.min(...profile.map((p) => p.elevationM)) : 0;
  const maxElev = profile.length > 0 ? Math.max(...profile.map((p) => p.elevationM)) : 100;
  const rangeElev = Math.max(15, maxElev - minElev);

  const svgPoints = profile
    .map((p, idx) => {
      const x = profile.length > 1 ? (idx / (profile.length - 1)) * 300 : 150;
      const y = 90 - ((p.elevationM - minElev) / rangeElev) * 70;
      return `${x},${y}`;
    })
    .join(' ');

  const isChallenging = route?.difficulty === 'challenging';
  const isModerate = route?.difficulty === 'moderate';

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #e8e3d9',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <Footprints size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
              {originName} ➔ {destinationName}
            </h4>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Trajeto a pe com analise de ladeiras
            </span>
          </div>
        </div>

        {route && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '20px',
              background: isChallenging ? '#fee2e2' : isModerate ? '#fef3c7' : '#dcfce7',
              color: isChallenging ? '#b91c1c' : isModerate ? '#b45309' : '#15803d',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isChallenging ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {route.difficultyLabel}
          </span>
        )}
      </div>

      {route ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              background: '#faf8f5',
              padding: '12px',
              borderRadius: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Distancia</span>
              <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                {route.distanceMeters >= 1000
                  ? `${(route.distanceMeters / 1000).toFixed(1)} km`
                  : `${route.distanceMeters} m`}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Tempo</span>
              <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                ~{route.durationMinutes} min
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#b91c1c' }}>Subida (Aclive)</span>
              <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '14px', color: '#b91c1c' }}>
                +{route.ascentMeters} m
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#15803d' }}>Descida</span>
              <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '14px', color: '#15803d' }}>
                -{route.descentMeters} m
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: isChallenging ? '#fff1f2' : '#f8fafc',
              borderLeft: isChallenging ? '4px solid #f43f5e' : '4px solid #10b981',
              fontSize: '13px',
              color: '#374151',
            }}
          >
            <strong>Dica do Garimpeiro:</strong> {route.advice}
          </div>

          {profile.length > 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={12} /> Perfil do terreno (elevacao)
                </span>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  Min: {minElev}m | Max: {maxElev}m
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '100px',
                  background: '#fcfbf9',
                  borderRadius: '10px',
                  border: '1px solid #eee',
                  padding: '8px',
                  boxSizing: 'border-box',
                }}
              >
                <svg viewBox="0 0 300 100" width="100%" height="100%" preserveAspectRatio="none">
                  <polygon
                    points={`0,95 ${svgPoints} 300,95`}
                    fill={isChallenging ? 'rgba(239, 68, 68, 0.15)' : 'rgba(217, 119, 6, 0.15)'}
                  />
                  <polyline
                    fill="none"
                    stroke={isChallenging ? '#ef4444' : '#d97706'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    points={svgPoints}
                  />
                </svg>
              </div>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={loadLiveRoute}
          disabled={loading}
          style={{
            padding: '12px',
            background: '#d97706',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Navigation size={16} />
          {loading ? 'Calculando relevo da rota...' : 'Calcular relevo e inclinacao a pe'}
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
        <a
          href={
            fallbackUrl ||
            `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${startLat}%2C${startLon}%3B${endLat}%2C${endLon}`
          }
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '12px',
            color: '#6b7280',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          Abrir rota no mapa aberto <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
"""
save_file("src/components/walking/WalkingElevationCard.tsx", walking_component)

# -------------------------------------------------------------
# 8. REMOVER BOTOES DE IDIOMA E GLOBE NA NAVBAR
# -------------------------------------------------------------
navbar_path = os.path.join(ROOT, "src/components/layout/Navbar.tsx")
if os.path.exists(navbar_path):
    with open(navbar_path, "r", encoding="utf-8") as f:
        nav = f.read()

    # Remove import Globe
    nav = re.sub(r',?\s*Globe\s*,?', '', nav)
    # Remove botao PT-BR desktop
    nav = re.sub(r'<button[^>]*>\s*<Globe[^>]*\/>\s*<span>\s*PT-BR\s*<\/span>\s*<\/button>', '', nav)
    # Remove botao PT-BR mobile
    nav = re.sub(r'<button[^>]*>\s*<Globe[^>]*\/>\s*PT-BR\s*<\/button>', '', nav)

    with open(navbar_path, "w", encoding="utf-8") as f:
        f.write(nav)
    print(" [OK] src/components/layout/Navbar.tsx (botoes de idioma removidos)")


# -------------------------------------------------------------
# 9. INTEGRAR O CARD DE CAMINHADA NA PAGINA VITRINE
# -------------------------------------------------------------
vitrine_path = os.path.join(ROOT, "src/app/vitrine/page.tsx")
if os.path.exists(vitrine_path):
    with open(vitrine_path, "r", encoding="utf-8") as f:
        vit = f.read()

    if "WalkingElevationCard" not in vit:
        vit = "import { WalkingElevationCard } from '@/components/walking/WalkingElevationCard';\n" + vit
    if "Footprints" not in vit:
        vit = vit.replace("import {", "import {\n  Footprints,")

    marker = "<h3>Área 8: Cronograma Inteligente & Plano de Chuva</h3>"
    insertion_block = """
        {/* Secao de Caminhada Inteligente & Relevo (OpenRouteService) */}
        <div className={styles.intelCard} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.intelHeader}>
            <Footprints size={22} className={styles.intelIcon} />
            <h3>Área 8 & 9: Caminhada Inteligente & Alerta de Ladeiras</h3>
          </div>
          <div className={styles.intelBody}>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
              Cálculo de rota a pé via <strong>OpenRouteService</strong> com telemetria de elevação e aclives em tempo real.
            </p>
            {destination === 'ssa' ? (
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
                  difficulty: 'challenging',
                  difficultyLabel: 'Ladeira Íngreme / Forte Declive',
                  advice: 'Descida acentuada pelas ladeiras históricas (-58m). Para a volta, utilize o Elevador Lacerda para evitar subir a pé com cansaço.',
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
                  difficulty: 'easy',
                  difficultyLabel: 'Caminhada Plana / Leve',
                  advice: 'Trajeto amplo e plano pela Avenida de Mayo. Ideal para fazer a pé apreciando os cafés e a arquitetura clássica.',
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
"""
    if marker in vit and "Área 8 & 9: Caminhada Inteligente" not in vit:
        pos = vit.find(marker)
        # encontra o fim da div intelBody e intelCard
        idx = pos
        div_count = 0
        while idx < len(vit):
            if vit[idx:idx+6] == "</div>":
                div_count += 1
                if div_count == 2:
                    vit = vit[:idx+6] + "\n" + insertion_block + vit[idx+6:]
                    break
            idx += 1

    with open(vitrine_path, "w", encoding="utf-8") as f:
        f.write(vit)
    print(" [OK] src/app/vitrine/page.tsx (caminhada integrada na Vitrine)")

print("\n" + "=" * 60)
print("  ATUALIZACAO CONCLUIDA COM SUCESSO! ")
print("======================================================")
print("Prontos para rodar no seu computador!")
