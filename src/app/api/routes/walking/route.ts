import { NextResponse } from 'next/server';
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
