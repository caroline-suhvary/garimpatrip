export const LOCAL_IATA: Record<string, string> = {
  "sao paulo": "SAO",
  "rio de janeiro": "RIO",
  salvador: "SSA",
  recife: "REC",
  fortaleza: "FOR",
  florianopolis: "FLN",
  "foz do iguacu": "IGU",
  brasilia: "BSB",
  "belo horizonte": "BHZ",
  "porto alegre": "POA",
  curitiba: "CWB",
  natal: "NAT",
  maceio: "MCZ",
  "joao pessoa": "JPA",
  manaus: "MAO",
  belem: "BEL",
  goiania: "GYN",
  vitoria: "VIX",
  "porto seguro": "BPS",
  "campo grande": "CGR",
  cuiaba: "CGB",
  palmas: "PMW",
  "sao luis": "SLZ",
  petrolina: "PNZ",
  "buenos aires": "BUE",
  santiago: "SCL",
  lisboa: "LIS",
  madri: "MAD",
  paris: "PAR",
  londres: "LON",
  "nova york": "NYC",
  miami: "MIA",
  orlando: "ORL",
  roma: "ROM",
  "san jose": "SJO",
};

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function cityName(input: string): string {
  return input.replace(/\([A-Za-z]{3}\)\s*$/, "").trim();
}

export function extractIata(input: string): string | null {
  const paren = input.match(/\(([A-Za-z]{3})\)/);
  if (paren) return paren[1].toUpperCase();
  const trimmed = input.trim();
  if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();
  const primaryName = cityName(trimmed).split(",")[0].trim();
  return LOCAL_IATA[normalizeText(primaryName)] ?? null;
}

export interface HubInfo {
  hasAirport: boolean;
  iata?: string;
  hubIata?: string;
  hubName?: string;
  notice?: string;
}

export function getAirportAndHubInfo(destination: string): HubInfo {
  const norm = normalizeText(destination);
  const clean = cityName(destination).split(",")[0].trim();

  const directIata = extractIata(destination);
  if (directIata) {
    return { hasAirport: true, iata: directIata };
  }

  if (norm.includes("bonito")) {
    const isMs =
      norm.includes("mato grosso") ||
      norm.includes(" ms") ||
      (!norm.includes("bahia") && !norm.includes("pernambuco"));
    if (isMs) {
      return {
        hasAirport: false,
        hubIata: "CGR",
        hubName: "Campo Grande (CGR) ou Bonito (BYO)",
        notice:
          '"Bonito (MS)" conta com voos sazonais no aeroporto regional (BYO) e tem Campo Grande (CGR) como principal hub aéreo com transfers regulares (aprox. 4h de viagem). Recomendamos voar até Campo Grande (CGR) ou Bonito (BYO) e seguir de transfer ou ônibus.',
      };
    }
  }

  if (norm.includes("paraty")) {
    return {
      hasAirport: false,
      hubIata: "RIO",
      hubName: "Rio de Janeiro (GIG/SDU) ou São Paulo (GRU/CGH)",
      notice:
        '"Paraty (RJ)" não possui aeroporto com voos comerciais regulares. Recomendamos voar até o Rio de Janeiro (GIG/SDU) ou São Paulo (GRU/CGH) e seguir de ônibus, transfer ou carro pela Rodovia Rio-Santos.',
    };
  }

  if (norm.includes("cabrobo")) {
    return {
      hasAirport: false,
      hubIata: "PNZ",
      hubName: "Petrolina (PNZ) ou Recife (REC)",
      notice:
        '"Cabrobó (PE)" não possui aeroporto comercial de grande porte. O aeroporto com voos regulares mais próximo é Petrolina (PNZ, aprox. 180 km) ou Recife (REC). Recomendamos voar até Petrolina e seguir por via rodoviária.',
    };
  }

  if (norm.includes("gramado") || norm.includes("canela")) {
    return {
      hasAirport: false,
      hubIata: "CXJ",
      hubName: "Caxias do Sul (CXJ) ou Porto Alegre (POA)",
      notice:
        '"Gramado/Canela" não possui aeroporto comercial próprio. Recomendamos voar até Caxias do Sul (CXJ, 70 km) ou Porto Alegre (POA, 115 km) e seguir de transfer ou ônibus.',
    };
  }

  if (norm.includes("jericoacoara") || norm.includes("jeri")) {
    return {
      hasAirport: true,
      iata: "JJD",
      hubIata: "FOR",
      hubName: "Jericoacoara (JJD) ou Fortaleza (FOR)",
      notice:
        '"Jericoacoara" possui o aeroporto regional de Cruz/Jeri (JJD). Como alternativa com maior frequência de voos, pode-se voar até Fortaleza (FOR) e seguir de transfer 4x4.',
    };
  }

  if (norm.includes("maragogi") || norm.includes("sao miguel dos milagres")) {
    return {
      hasAirport: false,
      hubIata: "MCZ",
      hubName: "Maceió (MCZ) ou Recife (REC)",
      notice:
        "A Costa dos Corais fica localizada entre Maceió (MCZ, aprox. 125 km) e Recife (REC, aprox. 130 km). Recomendamos voar até Maceió ou Recife e seguir de transfer ou carro.",
    };
  }

  if (norm.includes("pipa") || norm.includes("gostoso")) {
    return {
      hasAirport: false,
      hubIata: "NAT",
      hubName: "Natal (NAT)",
      notice:
        "O aeroporto mais próximo é o Aeroporto Internacional de Natal (NAT, aprox. 90 km). Recomendamos voar até Natal e seguir de transfer ou carro.",
    };
  }

  if (norm.includes("lencois maranhenses") || norm.includes("barreirinhas")) {
    return {
      hasAirport: false,
      hubIata: "SLZ",
      hubName: "São Luís (SLZ)",
      notice:
        "A principal porta de entrada para os Lençóis Maranhenses é São Luís (SLZ, aprox. 260 km de Barreirinhas). Recomendamos voar até São Luís e seguir de transfer.",
    };
  }

  if (norm.includes("chapada diamantina") || norm.includes("lencois")) {
    return {
      hasAirport: false,
      hubIata: "SSA",
      hubName: "Lençóis (LEC) ou Salvador (SSA)",
      notice:
        "A Chapada Diamantina é atendida pelo aeroporto de Lençóis (LEC) com voos regionais limitados, ou por Salvador (SSA, aprox. 400 km) com ônibus e transfers frequentes.",
    };
  }

  if (norm.includes("jalapao") || norm.includes("mateiros")) {
    return {
      hasAirport: false,
      hubIata: "PMW",
      hubName: "Palmas (PMW)",
      notice:
        "O ponto de partida para o Jalapão é Palmas (PMW). Recomendamos voar até o Aeroporto de Palmas e contratar expedições 4x4.",
    };
  }

  if (norm.includes("pernambuco") || norm.includes(" pe")) {
    return {
      hasAirport: false,
      hubIata: "REC",
      hubName: "Recife (REC) ou Petrolina (PNZ)",
      notice: `"${clean}" não possui aeroporto com voos comerciais regulares diretos. Recomendamos voar até Recife (REC) ou Petrolina (PNZ) e seguir via transporte rodoviário.`,
    };
  }

  if (norm.includes("bahia") || norm.includes(" ba")) {
    return {
      hasAirport: false,
      hubIata: "SSA",
      hubName: "Salvador (SSA), Ilhéus (IOS) ou Porto Seguro (BPS)",
      notice: `"${clean}" não possui aeroporto direto regular de grande porte. Recomendamos pesquisar voos até o aeroporto polo mais próximo (ex.: Salvador, Ilhéus ou Porto Seguro) e seguir por terra.`,
    };
  }

  if (norm.includes("ceara") || norm.includes(" ce")) {
    return {
      hasAirport: false,
      hubIata: "FOR",
      hubName: "Fortaleza (FOR) ou Juazeiro do Norte (JDO)",
      notice: `"${clean}" não possui aeroporto comercial de grande porte. Recomendamos voar até Fortaleza (FOR) ou Juazeiro do Norte (JDO) e seguir de ônibus ou carro.`,
    };
  }

  if (norm.includes("minas gerais") || norm.includes(" mg")) {
    return {
      hasAirport: false,
      hubIata: "CNF",
      hubName: "Belo Horizonte (CNF)",
      notice: `"${clean}" não possui aeroporto comercial direto de grande porte. Recomendamos voar até Belo Horizonte (CNF) ou o polo regional mineiro mais próximo e seguir por via terrestre.`,
    };
  }

  if (norm.includes("rio de janeiro") || norm.includes(" rj")) {
    return {
      hasAirport: false,
      hubIata: "RIO",
      hubName: "Rio de Janeiro (GIG/SDU)",
      notice: `"${clean}" não possui aeroporto com voos regulares diretos. Recomendamos voar até o Rio de Janeiro (GIG/SDU) e seguir de ônibus ou carro.`,
    };
  }

  if (norm.includes("sao paulo") || norm.includes(" sp")) {
    return {
      hasAirport: false,
      hubIata: "SAO",
      hubName: "São Paulo (GRU/CGH) ou Campinas (VCP)",
      notice: `"${clean}" não possui aeroporto comercial direto de grande porte. Recomendamos voar até os aeroportos de São Paulo (GRU/CGH) ou Viracopos (VCP) e seguir de ônibus ou carro.`,
    };
  }

  if (norm.includes("mato grosso do sul") || norm.includes(" ms")) {
    return {
      hasAirport: false,
      hubIata: "CGR",
      hubName: "Campo Grande (CGR)",
      notice: `"${clean}" não possui aeroporto de grande porte. Recomendamos voar até Campo Grande (CGR) e seguir por terra.`,
    };
  }

  return {
    hasAirport: false,
    notice: `"${clean}" não possui aeroporto com voos comerciais regulares diretos. Recomendamos pesquisar voos até a capital ou aeroporto polo mais próximo da região e seguir de ônibus, transfer ou carro (veja as opções terrestres abaixo).`,
  };
}

export async function resolveIata(input: string): Promise<string | null> {
  const local = extractIata(input);
  if (local) return local;

  // Search the selected city only, but never trust a fuzzy first result.
  // Travelpayouts can return Bangkok (BKK) for "Macaé"; reject that mismatch.
  const selectedCity = cityName(input).split(",")[0].trim();
  if (selectedCity.length < 2) return null;

  try {
    const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(selectedCity)}&locale=pt&types[]=city&types[]=airport`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { code?: string; name?: string; type?: string }[];
    const norm = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const exact = data.find((item) => item.name && norm(item.name) === norm(selectedCity));
    const code = exact?.code;
    return code && /^[A-Z]{3}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}
export function cleanCity(input: string): string {
  if (!input) return "";
  let val = input.replace(/\([A-Za-z]{3}\)\s*$/, "").trim();
  if (val.includes(",")) val = val.split(",")[0].trim();
  return val;
}

export function slugifyCity(input: string): string {
  const city = cleanCity(input);
  return (city || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
