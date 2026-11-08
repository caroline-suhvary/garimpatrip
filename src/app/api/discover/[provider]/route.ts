// GET /api/discover/flights|hotels|tours|transport|web?origin=...&destination=...&month=AAAA-MM
import { NextResponse } from 'next/server';
import { searchFlights, searchHotels, searchTours, searchTransport, searchWeb } from '@/lib/providers';
import type { SearchResponse } from '@/types';

const PROVIDERS = ['flights', 'hotels', 'tours', 'transport', 'web'] as const;
type Provider = (typeof PROVIDERS)[number];

function clean(value: string | null, max = 80): string {
  return (value ?? '').replace(/[<>]/g, '').trim().slice(0, max);
}

export async function GET(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (!PROVIDERS.includes(provider as Provider)) {
    return NextResponse.json({ error: 'Fonte desconhecida.' }, { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const destination = clean(searchParams.get('destination'));
  const origin = clean(searchParams.get('origin')) || 'São Paulo';
  const month = clean(searchParams.get('month'), 7);
  if (destination.length < 2) {
    return NextResponse.json({ error: 'Informe o destino.' }, { status: 400 });
  }

  let data: SearchResponse;
  switch (provider as Provider) {
    case 'flights':
      data = origin.length < 2
        ? { results: [], notice: 'Informe a cidade de origem para buscar voos.' }
        : await searchFlights(origin, destination, month || undefined);
      break;
    case 'hotels':
      data = await searchHotels(destination);
      break;
    case 'tours':
      data = await searchTours(destination);
      break;
    case 'transport':
      data = await searchTransport(destination, origin);
      break;
    case 'web':
      data = await searchWeb(destination);
      break;
  }
  return NextResponse.json(data);
}
