import { NextResponse } from 'next/server';

export interface PlaceSuggestion {
  id: string;
  name: string;
  subtitle: string;
  code: string;
  type: 'city' | 'airport';
  label: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const term = (searchParams.get('term') ?? '').trim();

  if (term.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(term)}&locale=pt&types[]=city&types[]=airport`;
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ results: [] });
    }

    const seen = new Set<string>();
    const results: PlaceSuggestion[] = [];

    for (const item of data) {
      if (!item.name || !item.code) continue;
      const key = `${item.code}_${item.name}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const parts = [item.state_code, item.country_name].filter(Boolean);
      const subtitle = parts.join(', ');

      const labelParts = [item.name];
      if (item.country_name) labelParts.push(item.country_name);
      const label = `${labelParts.join(', ')} (${item.code})`;

      results.push({
        id: item.id || `${item.code}-${results.length}`,
        name: item.name,
        subtitle,
        code: item.code,
        type: item.type === 'airport' ? 'airport' : 'city',
        label,
      });

      if (results.length >= 8) break;
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Autocomplete error:', err);
    return NextResponse.json({ results: [] });
  }
}
