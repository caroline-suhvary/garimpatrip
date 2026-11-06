// Descobre o código IATA (3 letras) a partir do texto digitado pelo usuário.
// Ordem: "(GRU)" no texto -> código puro "gru" -> tabela local -> autocomplete da Travelpayouts.

const LOCAL_IATA: Record<string, string> = {
  'sao paulo': 'SAO', 'rio de janeiro': 'RIO', 'salvador': 'SSA', 'recife': 'REC', 'fortaleza': 'FOR',
  'florianopolis': 'FLN', 'foz do iguacu': 'IGU', 'brasilia': 'BSB', 'belo horizonte': 'BHZ',
  'porto alegre': 'POA', 'curitiba': 'CWB', 'natal': 'NAT', 'maceio': 'MCZ', 'joao pessoa': 'JPA',
  'manaus': 'MAO', 'belem': 'BEL', 'goiania': 'GYN', 'vitoria': 'VIX', 'porto seguro': 'BPS',
  'buenos aires': 'BUE', 'santiago': 'SCL', 'lisboa': 'LIS', 'madri': 'MAD', 'paris': 'PAR',
  'londres': 'LON', 'nova york': 'NYC', 'miami': 'MIA', 'orlando': 'ORL', 'roma': 'ROM',
};

export function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Remove o "(GRU)" do final: "São Paulo (GRU)" -> "São Paulo". */
export function cityName(input: string): string {
  return input.replace(/\([A-Za-z]{3}\)\s*$/, '').trim();
}

/** Tenta resolver sem rede. Devolve null quando precisa consultar a API. */
export function extractIata(input: string): string | null {
  const paren = input.match(/\(([A-Za-z]{3})\)/);
  if (paren) return paren[1].toUpperCase();
  const trimmed = input.trim();
  if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();
  return LOCAL_IATA[normalizeText(cityName(trimmed))] ?? null;
}

export async function resolveIata(input: string): Promise<string | null> {
  const local = extractIata(input);
  if (local) return local;
  const term = cityName(input);
  if (term.length < 2) return null;
  try {
    const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(term)}&locale=pt&types[]=city&types[]=airport`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { code?: string }[];
    const code = data[0]?.code;
    return code && /^[A-Z]{3}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}
