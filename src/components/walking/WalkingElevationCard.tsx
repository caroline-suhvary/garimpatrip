'use client';

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
