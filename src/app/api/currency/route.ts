// GET /api/currency — cotações do dia (AwesomeAPI, aberta e gratuita).
import { NextResponse } from 'next/server';
import { fetchCurrencyRates } from '@/lib/providers';

export async function GET() {
  return NextResponse.json(await fetchCurrencyRates());
}
