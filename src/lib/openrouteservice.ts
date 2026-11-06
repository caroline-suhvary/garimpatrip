import 'server-only';

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
