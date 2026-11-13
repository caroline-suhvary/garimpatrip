import { NextResponse } from 'next/server';
import { WORLD_DESTINATIONS_CATALOG } from '@/lib/destinationsCatalog';

export interface PlaceSuggestion {
  id: string;
  name: string;
  subtitle: string;
  code: string;
  type: 'city' | 'airport';
  label: string;
  lat?: number;
  lon?: number;
}

const QUICK_IATA: Record<string, { name: string; subtitle: string; code: string }> = {
  GRU: { name: 'São Paulo (Guarulhos)', subtitle: 'São Paulo, Brasil', code: 'GRU' },
  CGH: { name: 'São Paulo (Congonhas)', subtitle: 'São Paulo, Brasil', code: 'CGH' },
  VCP: { name: 'Campinas (Viracopos)', subtitle: 'São Paulo, Brasil', code: 'VCP' },
  GIG: { name: 'Rio de Janeiro (Galeão)', subtitle: 'Rio de Janeiro, Brasil', code: 'GIG' },
  SDU: { name: 'Rio de Janeiro (Santos Dumont)', subtitle: 'Rio de Janeiro, Brasil', code: 'SDU' },
  SSA: { name: 'Salvador', subtitle: 'Bahia, Brasil', code: 'SSA' },
  BSB: { name: 'Brasília', subtitle: 'Distrito Federal, Brasil', code: 'BSB' },
  FOR: { name: 'Fortaleza', subtitle: 'Ceará, Brasil', code: 'FOR' },
  REC: { name: 'Recife', subtitle: 'Pernambuco, Brasil', code: 'REC' },
  POA: { name: 'Porto Alegre', subtitle: 'Rio Grande do Sul, Brasil', code: 'POA' },
  CWB: { name: 'Curitiba', subtitle: 'Paraná, Brasil', code: 'CWB' },
  FLN: { name: 'Florianópolis', subtitle: 'Santa Catarina, Brasil', code: 'FLN' },
  CNF: { name: 'Belo Horizonte (Confins)', subtitle: 'Minas Gerais, Brasil', code: 'CNF' },
  BYO: { name: 'Bonito (Regional)', subtitle: 'Mato Grosso do Sul, Brasil', code: 'BYO' },
  CGR: { name: 'Campo Grande', subtitle: 'Mato Grosso do Sul, Brasil', code: 'CGR' },
  PNZ: { name: 'Petrolina', subtitle: 'Pernambuco, Brasil', code: 'PNZ' },
  SJO: { name: 'San José', subtitle: 'San José, Costa Rica', code: 'SJO' },
  BUE: { name: 'Buenos Aires', subtitle: 'Buenos Aires, Argentina', code: 'BUE' },
  SCL: { name: 'Santiago', subtitle: 'Região Metropolitana, Chile', code: 'SCL' },
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const term = (searchParams.get('term') ?? '').trim();
  if (term.length < 2) return NextResponse.json({ results: [] });

  const normalizedTerm = normalize(term);
  const upper = term.toUpperCase();
  const results: PlaceSuggestion[] = [];
  const seen = new Set<string>();
  const add = (suggestion: PlaceSuggestion) => {
    const key = normalize(suggestion.label);
    if (seen.has(key) || results.length >= 8) return;
    seen.add(key);
    results.push(suggestion);
  };

  if (QUICK_IATA[upper]) {
    const q = QUICK_IATA[upper];
    add({ id: `iata-${q.code}`, name: q.name, subtitle: q.subtitle, code: q.code, type: 'airport', label: `${q.name}, ${q.subtitle} (${q.code})` });
  }

  // Correspondência por país/estado primeiro, para não deixar homônimos vencerem.
  for (const [groupIndex, group] of WORLD_DESTINATIONS_CATALOG.entries()) {
    const matched = group.keywords.some((keyword) => {
      const key = normalize(keyword);
      return key === normalizedTerm || (normalizedTerm.length >= 3 && key.startsWith(normalizedTerm));
    });
    if (!matched) continue;
    for (const [cityIndex, city] of group.cities.entries()) {
      add({ ...city, id: city.id || `curated-${groupIndex}-${cityIndex}` });
    }
    if (results.length >= 8) break;
  }

  // Fallback para cidades não listadas no catálogo curado.
  if (results.length < 8) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=12&language=pt&format=json`;
      const res = await fetch(url, { headers: { 'User-Agent': 'GarimpaTrip/1.0', Accept: 'application/json' }, next: { revalidate: 86400 } });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.results) ? data.results : [];
        items.sort((a: any, b: any) => (a.country_code === 'BR' ? -1 : 0) - (b.country_code === 'BR' ? -1 : 0) || (b.population || 0) - (a.population || 0));
        for (const item of items) {
          const name = item.name || '';
          const subtitle = [item.admin1, item.country].filter(Boolean).join(', ');
          add({ id: `geo-${item.id}`, name, subtitle, code: item.country_code || '', type: 'city', label: subtitle ? `${name}, ${subtitle}` : name, lat: item.latitude, lon: item.longitude });
          if (results.length >= 8) break;
        }
      }
    } catch (err) {
      console.error('Erro no autocomplete Geocoding:', err);
    }
  }
  return NextResponse.json({ results });
}
