import { NextResponse } from 'next/server';
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
