// GET /api/discover/search?origin=...&destination=...&month=AAAA-MM
import { NextResponse } from 'next/server';
import {
  searchFlights,
  searchHotels,
  searchTours,
  searchTransport,
  searchWeb,
} from '@/lib/providers';
import type { SearchResponse, SearchResult } from '@/types';

function clean(value: string | null, max = 80): string {
  return (value ?? '').replace(/[<>]/g, '').trim().slice(0, max);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = clean(searchParams.get('destination'));
  const origin = clean(searchParams.get('origin')) || 'São Paulo';
  const month = clean(searchParams.get('month'), 7);

  if (destination.length < 2) {
    return NextResponse.json({ error: 'Informe o destino para pesquisar.' }, { status: 400 });
  }

  // Executa todas as buscas em paralelo para máxima velocidade
  const [flightsRes, hotelsRes, toursRes, transportRes, webRes] = await Promise.allSettled([
    searchFlights(origin, destination, month || undefined),
    searchHotels(destination),
    searchTours(destination),
    searchTransport(destination, origin),
    searchWeb(destination),
  ]);

  const flights: SearchResponse = flightsRes.status === 'fulfilled' ? flightsRes.value : { results: [] };
  const hotels: SearchResponse = hotelsRes.status === 'fulfilled' ? hotelsRes.value : { results: [] };
  const tours: SearchResponse = toursRes.status === 'fulfilled' ? toursRes.value : { results: [] };
  const transport: SearchResponse = transportRes.status === 'fulfilled' ? transportRes.value : { results: [] };
  const web: SearchResponse = webRes.status === 'fulfilled' ? webRes.value : { results: [] };

  // Combina todos os resultados mantendo lista única para compatibilidade
  const allResults: SearchResult[] = [
    ...(flights.results || []),
    ...(hotels.results || []),
    ...(tours.results || []),
    ...(transport.results || []),
    ...(web.results || []),
  ];

  return NextResponse.json({
    origin,
    destination,
    month: month || null,
    flights,
    hotels,
    tours,
    transport,
    web,
    results: allResults,
  });
}
