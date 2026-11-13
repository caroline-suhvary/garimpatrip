// Catálogo curado de destinos para Autocomplete Inteligente (Todos os Países e Estados Brasileiros)
// GarimpaTrip - Mapeamento de Países, Estados e Cidades/Aeroportos de relevância turística e comercial

export interface CuratedCity {
  id?: string;
  name: string;
  subtitle: string;
  code: string;
  type: 'city' | 'airport';
  label: string;
  lat?: number;
  lon?: number;
}

export interface CatalogGroup {
  keywords: string[];
  cities: CuratedCity[];
}

export const WORLD_DESTINATIONS_CATALOG: CatalogGroup[] = [
  {
    keywords: ["acre", "ac"],
    cities: [
      { id: 'dest-rbr-0', name: "Rio Branco", subtitle: "Acre, Brasil", code: "RBR", type: "city", label: "Rio Branco, Acre, Brasil (RBR)" },
      { id: 'dest-czs-1', name: "Cruzeiro do Sul", subtitle: "Acre, Brasil", code: "CZS", type: "city", label: "Cruzeiro do Sul, Acre, Brasil (CZS)" },
    ],
  },
  {
    keywords: ["alagoas", "al"],
    cities: [
      { id: 'dest-mcz-0', name: "Maceió", subtitle: "Alagoas, Brasil", code: "MCZ", type: "city", label: "Maceió, Alagoas, Brasil (MCZ)" },
      { id: 'dest-mcz-1', name: "Maragogi", subtitle: "Alagoas, Brasil", code: "MCZ", type: "city", label: "Maragogi, Alagoas, Brasil (MCZ)" },
    ],
  },
  {
    keywords: ["amapa", "amapá", "ap"],
    cities: [
      { id: 'dest-mcp-0', name: "Macapá", subtitle: "Amapá, Brasil", code: "MCP", type: "city", label: "Macapá, Amapá, Brasil (MCP)" },
    ],
  },
  {
    keywords: ["amazonas", "am"],
    cities: [
      { id: 'dest-mao-0', name: "Manaus", subtitle: "Amazonas, Brasil", code: "MAO", type: "city", label: "Manaus, Amazonas, Brasil (MAO)" },
      { id: 'dest-pin-1', name: "Parintins", subtitle: "Amazonas, Brasil", code: "PIN", type: "city", label: "Parintins, Amazonas, Brasil (PIN)" },
    ],
  },
  {
    keywords: ["bahia", "ba"],
    cities: [
      { id: 'dest-ssa-0', name: "Salvador", subtitle: "Bahia, Brasil", code: "SSA", type: "city", label: "Salvador, Bahia, Brasil (SSA)" },
      { id: 'dest-bps-1', name: "Porto Seguro", subtitle: "Bahia, Brasil", code: "BPS", type: "city", label: "Porto Seguro, Bahia, Brasil (BPS)" },
      { id: 'dest-ios-2', name: "Ilhéus", subtitle: "Bahia, Brasil", code: "IOS", type: "city", label: "Ilhéus, Bahia, Brasil (IOS)" },
      { id: 'dest-ssa-3', name: "Morro de São Paulo", subtitle: "Bahia, Brasil", code: "SSA", type: "city", label: "Morro de São Paulo, Bahia, Brasil (SSA)" },
      { id: 'dest-lec-4', name: "Lençóis (Chapada Diamantina)", subtitle: "Bahia, Brasil", code: "LEC", type: "city", label: "Lençóis, Bahia, Brasil (LEC)" },
    ],
  },
  {
    keywords: ["ceara", "ceará", "ce"],
    cities: [
      { id: 'dest-for-0', name: "Fortaleza", subtitle: "Ceará, Brasil", code: "FOR", type: "city", label: "Fortaleza, Ceará, Brasil (FOR)" },
      { id: 'dest-jjd-1', name: "Jericoacoara", subtitle: "Ceará, Brasil", code: "JJD", type: "city", label: "Jericoacoara, Ceará, Brasil (JJD)" },
      { id: 'dest-jdo-2', name: "Juazeiro do Norte", subtitle: "Ceará, Brasil", code: "JDO", type: "city", label: "Juazeiro do Norte, Ceará, Brasil (JDO)" },
      { id: 'dest-arx-3', name: "Canoa Quebrada (Aracati)", subtitle: "Ceará, Brasil", code: "ARX", type: "city", label: "Aracati (Canoa Quebrada), Ceará, Brasil (ARX)" },
    ],
  },
  {
    keywords: ["distrito federal", "brasilia", "brasília", "df"],
    cities: [
      { id: 'dest-bsb-0', name: "Brasília", subtitle: "Distrito Federal, Brasil", code: "BSB", type: "city", label: "Brasília, Distrito Federal, Brasil (BSB)" },
    ],
  },
  {
    keywords: ["espirito santo", "espírito santo", "es"],
    cities: [
      { id: 'dest-vix-0', name: "Vitória", subtitle: "Espírito Santo, Brasil", code: "VIX", type: "city", label: "Vitória, Espírito Santo, Brasil (VIX)" },
      { id: 'dest-vix-1', name: "Guarapari", subtitle: "Espírito Santo, Brasil", code: "VIX", type: "city", label: "Guarapari, Espírito Santo, Brasil (VIX)" },
    ],
  },
  {
    keywords: ["goias", "goiás", "go"],
    cities: [
      { id: 'dest-gyn-0', name: "Goiânia", subtitle: "Goiás, Brasil", code: "GYN", type: "city", label: "Goiânia, Goiás, Brasil (GYN)" },
      { id: 'dest-clv-1', name: "Caldas Novas", subtitle: "Goiás, Brasil", code: "CLV", type: "city", label: "Caldas Novas, Goiás, Brasil (CLV)" },
      { id: 'dest-gyn-2', name: "Pirenópolis", subtitle: "Goiás, Brasil", code: "GYN", type: "city", label: "Pirenópolis, Goiás, Brasil (GYN)" },
      { id: 'dest-bsb-3', name: "Chapada dos Veadeiros", subtitle: "Goiás, Brasil", code: "BSB", type: "city", label: "Alto Paraíso de Goiás, Goiás, Brasil (BSB)" },
    ],
  },
  {
    keywords: ["maranhao", "maranhão", "ma"],
    cities: [
      { id: 'dest-slz-0', name: "São Luís", subtitle: "Maranhão, Brasil", code: "SLZ", type: "city", label: "São Luís, Maranhão, Brasil (SLZ)" },
      { id: 'dest-slz-1', name: "Barreirinhas (Lençóis Maranhenses)", subtitle: "Maranhão, Brasil", code: "SLZ", type: "city", label: "Barreirinhas, Maranhão, Brasil (SLZ)" },
      { id: 'dest-imp-2', name: "Imperatriz", subtitle: "Maranhão, Brasil", code: "IMP", type: "city", label: "Imperatriz, Maranhão, Brasil (IMP)" },
    ],
  },
  {
    keywords: ["mato grosso", "mt"],
    cities: [
      { id: 'dest-cgb-0', name: "Cuiabá", subtitle: "Mato Grosso, Brasil", code: "CGB", type: "city", label: "Cuiabá, Mato Grosso, Brasil (CGB)" },
      { id: 'dest-cgb-1', name: "Chapada dos Guimarães", subtitle: "Mato Grosso, Brasil", code: "CGB", type: "city", label: "Chapada dos Guimarães, Mato Grosso, Brasil (CGB)" },
    ],
  },
  {
    keywords: ["mato grosso do sul", "ms"],
    cities: [
      { id: 'dest-cgr-0', name: "Campo Grande", subtitle: "Mato Grosso do Sul, Brasil", code: "CGR", type: "city", label: "Campo Grande, Mato Grosso do Sul, Brasil (CGR)" },
      { id: 'dest-byo-1', name: "Bonito", subtitle: "Mato Grosso do Sul, Brasil", code: "BYO", type: "city", label: "Bonito, Mato Grosso do Sul, Brasil (BYO)" },
      { id: 'dest-cmg-2', name: "Corumbá (Pantanal)", subtitle: "Mato Grosso do Sul, Brasil", code: "CMG", type: "city", label: "Corumbá, Mato Grosso do Sul, Brasil (CMG)" },
    ],
  },
  {
    keywords: ["minas gerais", "mg"],
    cities: [
      { id: 'dest-cnf-0', name: "Belo Horizonte", subtitle: "Minas Gerais, Brasil", code: "CNF", type: "city", label: "Belo Horizonte, Minas Gerais, Brasil (CNF)" },
      { id: 'dest-cnf-1', name: "Ouro Preto", subtitle: "Minas Gerais, Brasil", code: "CNF", type: "city", label: "Ouro Preto, Minas Gerais, Brasil (CNF)" },
      { id: 'dest-cnf-2', name: "Tiradentes", subtitle: "Minas Gerais, Brasil", code: "CNF", type: "city", label: "Tiradentes, Minas Gerais, Brasil (CNF)" },
      { id: 'dest-gru-3', name: "Monte Verde", subtitle: "Minas Gerais, Brasil", code: "GRU", type: "city", label: "Monte Verde, Minas Gerais, Brasil (GRU)" },
      { id: 'dest-udi-4', name: "Uberlândia", subtitle: "Minas Gerais, Brasil", code: "UDI", type: "city", label: "Uberlândia, Minas Gerais, Brasil (UDI)" },
    ],
  },
  {
    keywords: ["para", "pará", "pa"],
    cities: [
      { id: 'dest-bel-0', name: "Belém", subtitle: "Pará, Brasil", code: "BEL", type: "city", label: "Belém, Pará, Brasil (BEL)" },
      { id: 'dest-stm-1', name: "Santarém (Alter do Chão)", subtitle: "Pará, Brasil", code: "STM", type: "city", label: "Santarém, Pará, Brasil (STM)" },
      { id: 'dest-mab-2', name: "Marabá", subtitle: "Pará, Brasil", code: "MAB", type: "city", label: "Marabá, Pará, Brasil (MAB)" },
    ],
  },
  {
    keywords: ["paraiba", "paraíba", "pb"],
    cities: [
      { id: 'dest-jpa-0', name: "João Pessoa", subtitle: "Paraíba, Brasil", code: "JPA", type: "city", label: "João Pessoa, Paraíba, Brasil (JPA)" },
      { id: 'dest-cpv-1', name: "Campina Grande", subtitle: "Paraíba, Brasil", code: "CPV", type: "city", label: "Campina Grande, Paraíba, Brasil (CPV)" },
    ],
  },
  {
    keywords: ["parana", "paraná", "pr"],
    cities: [
      { id: 'dest-cwb-0', name: "Curitiba", subtitle: "Paraná, Brasil", code: "CWB", type: "city", label: "Curitiba, Paraná, Brasil (CWB)" },
      { id: 'dest-igu-1', name: "Foz do Iguaçu", subtitle: "Paraná, Brasil", code: "IGU", type: "city", label: "Foz do Iguaçu, Paraná, Brasil (IGU)" },
      { id: 'dest-ldb-2', name: "Londrina", subtitle: "Paraná, Brasil", code: "LDB", type: "city", label: "Londrina, Paraná, Brasil (LDB)" },
      { id: 'dest-mgf-3', name: "Maringá", subtitle: "Paraná, Brasil", code: "MGF", type: "city", label: "Maringá, Paraná, Brasil (MGF)" },
    ],
  },
  {
    keywords: ["pernambuco", "pe"],
    cities: [
      { id: 'dest-rec-0', name: "Recife", subtitle: "Pernambuco, Brasil", code: "REC", type: "city", label: "Recife, Pernambuco, Brasil (REC)" },
      { id: 'dest-fen-1', name: "Fernando de Noronha", subtitle: "Pernambuco, Brasil", code: "FEN", type: "city", label: "Fernando de Noronha, Pernambuco, Brasil (FEN)" },
      { id: 'dest-rec-2', name: "Porto de Galinhas", subtitle: "Pernambuco, Brasil", code: "REC", type: "city", label: "Porto de Galinhas, Pernambuco, Brasil (REC)" },
      { id: 'dest-pnz-3', name: "Petrolina", subtitle: "Pernambuco, Brasil", code: "PNZ", type: "city", label: "Petrolina, Pernambuco, Brasil (PNZ)" },
    ],
  },
  {
    keywords: ["piaui", "piauí", "pi"],
    cities: [
      { id: 'dest-the-0', name: "Teresina", subtitle: "Piauí, Brasil", code: "THE", type: "city", label: "Teresina, Piauí, Brasil (THE)" },
      { id: 'dest-phb-1', name: "Parnaíba (Delta do Parnaíba)", subtitle: "Piauí, Brasil", code: "PHB", type: "city", label: "Parnaíba, Piauí, Brasil (PHB)" },
      { id: 'dest-phb-2', name: "Barra Grande", subtitle: "Piauí, Brasil", code: "PHB", type: "city", label: "Barra Grande, Piauí, Brasil (PHB)" },
      { id: 'dest-nsr-3', name: "São Raimundo Nonato (Serra da Capivara)", subtitle: "Piauí, Brasil", code: "NSR", type: "city", label: "São Raimundo Nonato, Piauí, Brasil (NSR)" },
    ],
  },
  {
    keywords: ["rio de janeiro", "rj"],
    cities: [
      { id: 'dest-rio-0', name: "Rio de Janeiro", subtitle: "Rio de Janeiro, Brasil", code: "RIO", type: "city", label: "Rio de Janeiro, Rio de Janeiro, Brasil (RIO)" },
      { id: 'dest-cfb-1', name: "Búzios", subtitle: "Rio de Janeiro, Brasil", code: "CFB", type: "city", label: "Armação dos Búzios, Rio de Janeiro, Brasil (CFB)" },
      { id: 'dest-cfb-2', name: "Cabo Frio", subtitle: "Rio de Janeiro, Brasil", code: "CFB", type: "city", label: "Cabo Frio, Rio de Janeiro, Brasil (CFB)" },
      { id: 'dest-rio-3', name: "Paraty", subtitle: "Rio de Janeiro, Brasil", code: "RIO", type: "city", label: "Paraty, Rio de Janeiro, Brasil (RIO)" },
      { id: 'dest-sdu-4', name: "Petrópolis", subtitle: "Rio de Janeiro, Brasil", code: "SDU", type: "city", label: "Petrópolis, Rio de Janeiro, Brasil (SDU)" },
      { id: 'dest-gdr-5', name: "Angra dos Reis (Ilha Grande)", subtitle: "Rio de Janeiro, Brasil", code: "GDR", type: "city", label: "Angra dos Reis, Rio de Janeiro, Brasil (GDR)" },
    ],
  },
  {
    keywords: ["rio grande do norte", "rn"],
    cities: [
      { id: 'dest-nat-0', name: "Natal", subtitle: "Rio Grande do Norte, Brasil", code: "NAT", type: "city", label: "Natal, Rio Grande do Norte, Brasil (NAT)" },
      { id: 'dest-nat-1', name: "Praia da Pipa", subtitle: "Rio Grande do Norte, Brasil", code: "NAT", type: "city", label: "Tibau do Sul (Pipa), Rio Grande do Norte, Brasil (NAT)" },
      { id: 'dest-mvf-2', name: "Mossoró", subtitle: "Rio Grande do Norte, Brasil", code: "MVF", type: "city", label: "Mossoró, Rio Grande do Norte, Brasil (MVF)" },
    ],
  },
  {
    keywords: ["rio grande do sul", "rs"],
    cities: [
      { id: 'dest-poa-0', name: "Porto Alegre", subtitle: "Rio Grande do Sul, Brasil", code: "POA", type: "city", label: "Porto Alegre, Rio Grande do Sul, Brasil (POA)" },
      { id: 'dest-cxj-1', name: "Gramado / Canela", subtitle: "Rio Grande do Sul, Brasil", code: "CXJ", type: "city", label: "Gramado, Rio Grande do Sul, Brasil (CXJ)" },
      { id: 'dest-cxj-2', name: "Caxias do Sul", subtitle: "Rio Grande do Sul, Brasil", code: "CXJ", type: "city", label: "Caxias do Sul, Rio Grande do Sul, Brasil (CXJ)" },
      { id: 'dest-pet-3', name: "Pelotas", subtitle: "Rio Grande do Sul, Brasil", code: "PET", type: "city", label: "Pelotas, Rio Grande do Sul, Brasil (PET)" },
    ],
  },
  {
    keywords: ["rondonia", "rondônia", "ro"],
    cities: [
      { id: 'dest-pvh-0', name: "Porto Velho", subtitle: "Rondônia, Brasil", code: "PVH", type: "city", label: "Porto Velho, Rondônia, Brasil (PVH)" },
    ],
  },
  {
    keywords: ["roraima", "rr"],
    cities: [
      { id: 'dest-bvb-0', name: "Boa Vista", subtitle: "Roraima, Brasil", code: "BVB", type: "city", label: "Boa Vista, Roraima, Brasil (BVB)" },
    ],
  },
  {
    keywords: ["santa catarina", "sc"],
    cities: [
      { id: 'dest-fln-0', name: "Florianópolis", subtitle: "Santa Catarina, Brasil", code: "FLN", type: "city", label: "Florianópolis, Santa Catarina, Brasil (FLN)" },
      { id: 'dest-nvt-1', name: "Balneário Camboriú", subtitle: "Santa Catarina, Brasil", code: "NVT", type: "city", label: "Balneário Camboriú, Santa Catarina, Brasil (NVT)" },
      { id: 'dest-nvt-2', name: "Navegantes", subtitle: "Santa Catarina, Brasil", code: "NVT", type: "city", label: "Navegantes, Santa Catarina, Brasil (NVT)" },
      { id: 'dest-joi-3', name: "Joinville", subtitle: "Santa Catarina, Brasil", code: "JOI", type: "city", label: "Joinville, Santa Catarina, Brasil (JOI)" },
      { id: 'dest-bnu-4', name: "Blumenau", subtitle: "Santa Catarina, Brasil", code: "BNU", type: "city", label: "Blumenau, Santa Catarina, Brasil (BNU)" },
    ],
  },
  {
    keywords: ["sao paulo", "são paulo", "sp"],
    cities: [
      { id: 'dest-gru-0', name: "São Paulo (Guarulhos)", subtitle: "São Paulo, Brasil", code: "GRU", type: "city", label: "São Paulo, São Paulo, Brasil (GRU)" },
      { id: 'dest-cgh-1', name: "São Paulo (Congonhas)", subtitle: "São Paulo, Brasil", code: "CGH", type: "city", label: "São Paulo, São Paulo, Brasil (CGH)" },
      { id: 'dest-vcp-2', name: "Campinas (Viracopos)", subtitle: "São Paulo, Brasil", code: "VCP", type: "city", label: "Campinas, São Paulo, Brasil (VCP)" },
      { id: 'dest-gru-3', name: "Campos do Jordão", subtitle: "São Paulo, Brasil", code: "GRU", type: "city", label: "Campos do Jordão, São Paulo, Brasil (GRU)" },
      { id: 'dest-gru-4', name: "Ubatuba", subtitle: "São Paulo, Brasil", code: "GRU", type: "city", label: "Ubatuba, São Paulo, Brasil (GRU)" },
      { id: 'dest-gru-5', name: "Ilhabela", subtitle: "São Paulo, Brasil", code: "GRU", type: "city", label: "Ilhabela, São Paulo, Brasil (GRU)" },
      { id: 'dest-rao-6', name: "Ribeirão Preto", subtitle: "São Paulo, Brasil", code: "RAO", type: "city", label: "Ribeirão Preto, São Paulo, Brasil (RAO)" },
    ],
  },
  {
    keywords: ["sergipe", "se"],
    cities: [
      { id: 'dest-aju-0', name: "Aracaju", subtitle: "Sergipe, Brasil", code: "AJU", type: "city", label: "Aracaju, Sergipe, Brasil (AJU)" },
    ],
  },
  {
    keywords: ["tocantins", "to"],
    cities: [
      { id: 'dest-pmw-0', name: "Palmas", subtitle: "Tocantins, Brasil", code: "PMW", type: "city", label: "Palmas, Tocantins, Brasil (PMW)" },
      { id: 'dest-pmw-1', name: "Jalapão (Mateiros)", subtitle: "Tocantins, Brasil", code: "PMW", type: "city", label: "Mateiros (Jalapão), Tocantins, Brasil (PMW)" },
    ],
  },
  {
    keywords: ["brasil", "brazil"],
    cities: [
      { id: 'dest-gru-0', name: "São Paulo", subtitle: "São Paulo, Brasil", code: "GRU", type: "city", label: "São Paulo, São Paulo, Brasil (GRU)" },
      { id: 'dest-gig-1', name: "Rio de Janeiro", subtitle: "Rio de Janeiro, Brasil", code: "GIG", type: "city", label: "Rio de Janeiro, Rio de Janeiro, Brasil (GIG)" },
      { id: 'dest-ssa-2', name: "Salvador", subtitle: "Bahia, Brasil", code: "SSA", type: "city", label: "Salvador, Bahia, Brasil (SSA)" },
      { id: 'dest-bsb-3', name: "Brasília", subtitle: "Distrito Federal, Brasil", code: "BSB", type: "city", label: "Brasília, Distrito Federal, Brasil (BSB)" },
      { id: 'dest-for-4', name: "Fortaleza", subtitle: "Ceará, Brasil", code: "FOR", type: "city", label: "Fortaleza, Ceará, Brasil (FOR)" },
      { id: 'dest-fln-5', name: "Florianópolis", subtitle: "Santa Catarina, Brasil", code: "FLN", type: "city", label: "Florianópolis, Santa Catarina, Brasil (FLN)" },
    ],
  },
  {
    keywords: ["argentina"],
    cities: [
      { id: 'dest-eze-0', name: "Buenos Aires", subtitle: "Buenos Aires, Argentina", code: "EZE", type: "city", label: "Buenos Aires, Argentina (EZE)" },
      { id: 'dest-brc-1', name: "Bariloche", subtitle: "Río Negro, Argentina", code: "BRC", type: "city", label: "San Carlos de Bariloche, Argentina (BRC)" },
      { id: 'dest-mdz-2', name: "Mendoza", subtitle: "Mendoza, Argentina", code: "MDZ", type: "city", label: "Mendoza, Argentina (MDZ)" },
      { id: 'dest-ush-3', name: "Ushuaia", subtitle: "Terra do Fogo, Argentina", code: "USH", type: "city", label: "Ushuaia, Argentina (USH)" },
      { id: 'dest-cor-4', name: "Córdoba", subtitle: "Córdoba, Argentina", code: "COR", type: "city", label: "Córdoba, Argentina (COR)" },
    ],
  },
  {
    keywords: ["chile"],
    cities: [
      { id: 'dest-scl-0', name: "Santiago", subtitle: "Região Metropolitana, Chile", code: "SCL", type: "city", label: "Santiago, Chile (SCL)" },
      { id: 'dest-cjc-1', name: "San Pedro de Atacama (Calama)", subtitle: "Antofagasta, Chile", code: "CJC", type: "city", label: "Calama (Atacama), Chile (CJC)" },
      { id: 'dest-pmc-2', name: "Puerto Montt (Lagos e Vulcões)", subtitle: "Los Lagos, Chile", code: "PMC", type: "city", label: "Puerto Montt, Chile (PMC)" },
      { id: 'dest-puq-3', name: "Punta Arenas (Patagônia)", subtitle: "Magalhães, Chile", code: "PUQ", type: "city", label: "Punta Arenas, Chile (PUQ)" },
      { id: 'dest-ipc-4', name: "Ilha de Páscoa", subtitle: "Valparaíso, Chile", code: "IPC", type: "city", label: "Ilha de Páscoa, Chile (IPC)" },
    ],
  },
  {
    keywords: ["uruguai", "uruguay"],
    cities: [
      { id: 'dest-mvd-0', name: "Montevidéu", subtitle: "Montevidéu, Uruguai", code: "MVD", type: "city", label: "Montevidéu, Uruguai (MVD)" },
      { id: 'dest-pdp-1', name: "Punta del Este", subtitle: "Maldonado, Uruguai", code: "PDP", type: "city", label: "Punta del Este, Uruguai (PDP)" },
      { id: 'dest-mvd-2', name: "Colônia do Sacramento", subtitle: "Colônia, Uruguai", code: "MVD", type: "city", label: "Colônia do Sacramento, Uruguai (MVD)" },
    ],
  },
  {
    keywords: ["paraguai", "paraguay"],
    cities: [
      { id: 'dest-asu-0', name: "Assunção", subtitle: "Distrito Capital, Paraguai", code: "ASU", type: "city", label: "Assunção, Paraguai (ASU)" },
      { id: 'dest-agt-1', name: "Ciudad del Este", subtitle: "Alto Paraná, Paraguai", code: "AGT", type: "city", label: "Ciudad del Este, Paraguai (AGT)" },
    ],
  },
  {
    keywords: ["colombia", "colômbia"],
    cities: [
      { id: 'dest-bog-0', name: "Bogotá", subtitle: "Cundinamarca, Colômbia", code: "BOG", type: "city", label: "Bogotá, Colômbia (BOG)" },
      { id: 'dest-mde-1', name: "Medellín", subtitle: "Antioquia, Colômbia", code: "MDE", type: "city", label: "Medellín, Colômbia (MDE)" },
      { id: 'dest-ctg-2', name: "Cartagena das Índias", subtitle: "Bolívar, Colômbia", code: "CTG", type: "city", label: "Cartagena, Colômbia (CTG)" },
      { id: 'dest-adz-3', name: "San Andrés (Ilha)", subtitle: "San Andrés, Colômbia", code: "ADZ", type: "city", label: "San Andrés, Colômbia (ADZ)" },
      { id: 'dest-clo-4', name: "Cali", subtitle: "Valle del Cauca, Colômbia", code: "CLO", type: "city", label: "Cali, Colômbia (CLO)" },
    ],
  },
  {
    keywords: ["peru"],
    cities: [
      { id: 'dest-lim-0', name: "Lima", subtitle: "Lima, Peru", code: "LIM", type: "city", label: "Lima, Peru (LIM)" },
      { id: 'dest-cuz-1', name: "Cusco (Machu Picchu)", subtitle: "Cusco, Peru", code: "CUZ", type: "city", label: "Cusco, Peru (CUZ)" },
      { id: 'dest-aqp-2', name: "Arequipa", subtitle: "Arequipa, Peru", code: "AQP", type: "city", label: "Arequipa, Peru (AQP)" },
    ],
  },
  {
    keywords: ["bolivia", "bolívia"],
    cities: [
      { id: 'dest-lpb-0', name: "La Paz", subtitle: "La Paz, Bolívia", code: "LPB", type: "city", label: "La Paz, Bolívia (LPB)" },
      { id: 'dest-vvi-1', name: "Santa Cruz de la Sierra", subtitle: "Santa Cruz, Bolívia", code: "VVI", type: "city", label: "Santa Cruz de la Sierra, Bolívia (VVI)" },
      { id: 'dest-uyu-2', name: "Uyuni (Salar)", subtitle: "Potosí, Bolívia", code: "UYU", type: "city", label: "Uyuni, Bolívia (UYU)" },
    ],
  },
  {
    keywords: ["equador", "ecuador"],
    cities: [
      { id: 'dest-uio-0', name: "Quito", subtitle: "Pichincha, Equador", code: "UIO", type: "city", label: "Quito, Equador (UIO)" },
      { id: 'dest-gye-1', name: "Guayaquil", subtitle: "Guayas, Equador", code: "GYE", type: "city", label: "Guayaquil, Equador (GYE)" },
      { id: 'dest-gps-2', name: "Ilhas Galápagos", subtitle: "Galápagos, Equador", code: "GPS", type: "city", label: "Baltra (Galápagos), Equador (GPS)" },
      { id: 'dest-cue-3', name: "Cuenca", subtitle: "Azuay, Equador", code: "CUE", type: "city", label: "Cuenca, Equador (CUE)" },
    ],
  },
  {
    keywords: ["venezuela"],
    cities: [
      { id: 'dest-ccs-0', name: "Caracas", subtitle: "Distrito Capital, Venezuela", code: "CCS", type: "city", label: "Caracas, Venezuela (CCS)" },
      { id: 'dest-pmv-1', name: "Ilha de Margarita (Porlamar)", subtitle: "Nueva Esparta, Venezuela", code: "PMV", type: "city", label: "Porlamar (Margarita), Venezuela (PMV)" },
    ],
  },
  {
    keywords: ["guiana", "guyana"],
    cities: [
      { id: 'dest-geo-0', name: "Georgetown", subtitle: "Demerara-Mahaica, Guiana", code: "GEO", type: "city", label: "Georgetown, Guiana (GEO)" },
    ],
  },
  {
    keywords: ["suriname"],
    cities: [
      { id: 'dest-pbm-0', name: "Paramaribo", subtitle: "Paramaribo, Suriname", code: "PBM", type: "city", label: "Paramaribo, Suriname (PBM)" },
    ],
  },
  {
    keywords: ["guiana francesa", "french guiana"],
    cities: [
      { id: 'dest-cay-0', name: "Caiena", subtitle: "Guiana Francesa", code: "CAY", type: "city", label: "Caiena, Guiana Francesa (CAY)" },
    ],
  },
  {
    keywords: ["estados unidos", "eua", "usa", "united states", "america", "américa"],
    cities: [
      { id: 'dest-nyc-0', name: "Nova York", subtitle: "Nova York, Estados Unidos", code: "NYC", type: "city", label: "Nova York, Estados Unidos (NYC)" },
      { id: 'dest-mco-1', name: "Orlando", subtitle: "Flórida, Estados Unidos", code: "MCO", type: "city", label: "Orlando, Flórida, Estados Unidos (MCO)" },
      { id: 'dest-mia-2', name: "Miami", subtitle: "Flórida, Estados Unidos", code: "MIA", type: "city", label: "Miami, Flórida, Estados Unidos (MIA)" },
      { id: 'dest-lax-3', name: "Los Angeles", subtitle: "Califórnia, Estados Unidos", code: "LAX", type: "city", label: "Los Angeles, Califórnia, Estados Unidos (LAX)" },
      { id: 'dest-las-4', name: "Las Vegas", subtitle: "Nevada, Estados Unidos", code: "LAS", type: "city", label: "Las Vegas, Nevada, Estados Unidos (LAS)" },
      { id: 'dest-sfo-5', name: "San Francisco", subtitle: "Califórnia, Estados Unidos", code: "SFO", type: "city", label: "San Francisco, Califórnia, Estados Unidos (SFO)" },
      { id: 'dest-ord-6', name: "Chicago", subtitle: "Illinois, Estados Unidos", code: "ORD", type: "city", label: "Chicago, Illinois, Estados Unidos (ORD)" },
      { id: 'dest-was-7', name: "Washington D.C.", subtitle: "Distrito de Colúmbia, Estados Unidos", code: "WAS", type: "city", label: "Washington D.C., Estados Unidos (WAS)" },
    ],
  },
  {
    keywords: ["canada", "canadá"],
    cities: [
      { id: 'dest-yyz-0', name: "Toronto", subtitle: "Ontário, Canadá", code: "YYZ", type: "city", label: "Toronto, Canadá (YYZ)" },
      { id: 'dest-yvr-1', name: "Vancouver", subtitle: "Colúmbia Britânica, Canadá", code: "YVR", type: "city", label: "Vancouver, Canadá (YVR)" },
      { id: 'dest-yul-2', name: "Montreal", subtitle: "Quebec, Canadá", code: "YUL", type: "city", label: "Montreal, Canadá (YUL)" },
      { id: 'dest-yqb-3', name: "Quebec City", subtitle: "Quebec, Canadá", code: "YQB", type: "city", label: "Quebec, Canadá (YQB)" },
      { id: 'dest-yyc-4', name: "Calgary (Banff)", subtitle: "Alberta, Canadá", code: "YYC", type: "city", label: "Calgary, Canadá (YYC)" },
    ],
  },
  {
    keywords: ["mexico", "méxico"],
    cities: [
      { id: 'dest-mex-0', name: "Cidade do México", subtitle: "Distrito Federal, México", code: "MEX", type: "city", label: "Cidade do México, México (MEX)" },
      { id: 'dest-cun-1', name: "Cancún", subtitle: "Quintana Roo, México", code: "CUN", type: "city", label: "Cancún, México (CUN)" },
      { id: 'dest-gdl-2', name: "Guadalajara", subtitle: "Jalisco, México", code: "GDL", type: "city", label: "Guadalajara, México (GDL)" },
      { id: 'dest-tqo-3', name: "Tulum / Riviera Maya", subtitle: "Quintana Roo, México", code: "TQO", type: "city", label: "Tulum, México (TQO)" },
      { id: 'dest-sjd-4', name: "Los Cabos", subtitle: "Baja California Sur, México", code: "SJD", type: "city", label: "San José del Cabo, México (SJD)" },
    ],
  },
  {
    keywords: ["costa rica"],
    cities: [
      { id: 'dest-sjo-0', name: "San José", subtitle: "San José, Costa Rica", code: "SJO", type: "city", label: "San José, Costa Rica (SJO)" },
      { id: 'dest-lir-1', name: "Liberia (Guanacaste)", subtitle: "Guanacaste, Costa Rica", code: "LIR", type: "city", label: "Liberia, Costa Rica (LIR)" },
    ],
  },
  {
    keywords: ["panama", "panamá"],
    cities: [
      { id: 'dest-pty-0', name: "Cidade do Panamá", subtitle: "Panamá, Panamá", code: "PTY", type: "city", label: "Cidade do Panamá, Panamá (PTY)" },
      { id: 'dest-boc-1', name: "Bocas del Toro", subtitle: "Bocas del Toro, Panamá", code: "BOC", type: "city", label: "Bocas del Toro, Panamá (BOC)" },
    ],
  },
  {
    keywords: ["guatemala"],
    cities: [
      { id: 'dest-gua-0', name: "Cidade da Guatemala", subtitle: "Guatemala, Guatemala", code: "GUA", type: "city", label: "Cidade da Guatemala, Guatemala (GUA)" },
      { id: 'dest-gua-1', name: "Antigua Guatemala", subtitle: "Sacatepéquez, Guatemala", code: "GUA", type: "city", label: "Antigua Guatemala, Guatemala (GUA)" },
    ],
  },
  {
    keywords: ["belize"],
    cities: [
      { id: 'dest-bze-0', name: "Cidade de Belize", subtitle: "Belize, Belize", code: "BZE", type: "city", label: "Cidade de Belize, Belize (BZE)" },
    ],
  },
  {
    keywords: ["honduras"],
    cities: [
      { id: 'dest-tgu-0', name: "Tegucigalpa", subtitle: "Francisco Morazán, Honduras", code: "TGU", type: "city", label: "Tegucigalpa, Honduras (TGU)" },
      { id: 'dest-rtb-1', name: "Roatán", subtitle: "Islas de la Bahía, Honduras", code: "RTB", type: "city", label: "Roatán, Honduras (RTB)" },
    ],
  },
  {
    keywords: ["el salvador"],
    cities: [
      { id: 'dest-sal-0', name: "San Salvador", subtitle: "San Salvador, El Salvador", code: "SAL", type: "city", label: "San Salvador, El Salvador (SAL)" },
    ],
  },
  {
    keywords: ["nicaragua", "nicarágua"],
    cities: [
      { id: 'dest-mga-0', name: "Manágua", subtitle: "Manágua, Nicarágua", code: "MGA", type: "city", label: "Manágua, Nicarágua (MGA)" },
    ],
  },
  {
    keywords: ["cuba"],
    cities: [
      { id: 'dest-hav-0', name: "Havana", subtitle: "La Habana, Cuba", code: "HAV", type: "city", label: "Havana, Cuba (HAV)" },
      { id: 'dest-vra-1', name: "Varadero", subtitle: "Matanzas, Cuba", code: "VRA", type: "city", label: "Varadero, Cuba (VRA)" },
    ],
  },
  {
    keywords: ["republica dominicana", "república dominicana"],
    cities: [
      { id: 'dest-puj-0', name: "Punta Cana", subtitle: "La Altagracia, República Dominicana", code: "PUJ", type: "city", label: "Punta Cana, República Dominicana (PUJ)" },
      { id: 'dest-sdq-1', name: "Santo Domingo", subtitle: "Distrito Nacional, República Dominicana", code: "SDQ", type: "city", label: "Santo Domingo, República Dominicana (SDQ)" },
    ],
  },
  {
    keywords: ["porto rico", "puerto rico"],
    cities: [
      { id: 'dest-sju-0', name: "San Juan", subtitle: "Porto Rico", code: "SJU", type: "city", label: "San Juan, Porto Rico (SJU)" },
    ],
  },
  {
    keywords: ["jamaica"],
    cities: [
      { id: 'dest-kin-0', name: "Kingston", subtitle: "Surrey, Jamaica", code: "KIN", type: "city", label: "Kingston, Jamaica (KIN)" },
      { id: 'dest-mbj-1', name: "Montego Bay", subtitle: "Cornwall, Jamaica", code: "MBJ", type: "city", label: "Montego Bay, Jamaica (MBJ)" },
    ],
  },
  {
    keywords: ["bahamas"],
    cities: [
      { id: 'dest-nas-0', name: "Nassau", subtitle: "New Providence, Bahamas", code: "NAS", type: "city", label: "Nassau, Bahamas (NAS)" },
    ],
  },
  {
    keywords: ["aruba"],
    cities: [
      { id: 'dest-aua-0', name: "Oranjestad", subtitle: "Aruba", code: "AUA", type: "city", label: "Oranjestad, Aruba (AUA)" },
    ],
  },
  {
    keywords: ["curacao", "curaçao"],
    cities: [
      { id: 'dest-cur-0', name: "Willemstad", subtitle: "Curaçao", code: "CUR", type: "city", label: "Willemstad, Curaçao (CUR)" },
    ],
  },
  {
    keywords: ["barbados"],
    cities: [
      { id: 'dest-bgi-0', name: "Bridgetown", subtitle: "Saint Michael, Barbados", code: "BGI", type: "city", label: "Bridgetown, Barbados (BGI)" },
    ],
  },
  {
    keywords: ["trinidad e tobago", "trinidad and tobago"],
    cities: [
      { id: 'dest-pos-0', name: "Port of Spain", subtitle: "Trinidad e Tobago", code: "POS", type: "city", label: "Port of Spain, Trinidad e Tobago (POS)" },
    ],
  },
  {
    keywords: ["haiti", "haití"],
    cities: [
      { id: 'dest-pap-0', name: "Porto Príncipe", subtitle: "Oeste, Haiti", code: "PAP", type: "city", label: "Porto Príncipe, Haiti (PAP)" },
    ],
  },
  {
    keywords: ["portugal"],
    cities: [
      { id: 'dest-lis-0', name: "Lisboa", subtitle: "Distrito de Lisboa, Portugal", code: "LIS", type: "city", label: "Lisboa, Portugal (LIS)" },
      { id: 'dest-opo-1', name: "Porto", subtitle: "Distrito do Porto, Portugal", code: "OPO", type: "city", label: "Porto, Portugal (OPO)" },
      { id: 'dest-fao-2', name: "Faro (Algarve)", subtitle: "Distrito de Faro, Portugal", code: "FAO", type: "city", label: "Faro, Algarve, Portugal (FAO)" },
      { id: 'dest-fnc-3', name: "Funchal (Ilha da Madeira)", subtitle: "Madeira, Portugal", code: "FNC", type: "city", label: "Funchal, Madeira, Portugal (FNC)" },
      { id: 'dest-pdl-4', name: "Ponta Delgada (Açores)", subtitle: "Açores, Portugal", code: "PDL", type: "city", label: "Ponta Delgada, Açores, Portugal (PDL)" },
    ],
  },
  {
    keywords: ["espanha", "spain"],
    cities: [
      { id: 'dest-mad-0', name: "Madri", subtitle: "Comunidade de Madrid, Espanha", code: "MAD", type: "city", label: "Madri, Espanha (MAD)" },
      { id: 'dest-bcn-1', name: "Barcelona", subtitle: "Catalunha, Espanha", code: "BCN", type: "city", label: "Barcelona, Espanha (BCN)" },
      { id: 'dest-svq-2', name: "Sevilha", subtitle: "Andaluzia, Espanha", code: "SVQ", type: "city", label: "Sevilha, Espanha (SVQ)" },
      { id: 'dest-vlc-3', name: "Valência", subtitle: "Comunidade Valenciana, Espanha", code: "VLC", type: "city", label: "Valência, Espanha (VLC)" },
      { id: 'dest-ibz-4', name: "Ibiza", subtitle: "Ilhas Baleares, Espanha", code: "IBZ", type: "city", label: "Ibiza, Espanha (IBZ)" },
      { id: 'dest-pmi-5', name: "Maiorca (Palma)", subtitle: "Ilhas Baleares, Espanha", code: "PMI", type: "city", label: "Palma de Maiorca, Espanha (PMI)" },
    ],
  },
  {
    keywords: ["franca", "frança", "france"],
    cities: [
      { id: 'dest-par-0', name: "Paris", subtitle: "Île-de-France, França", code: "PAR", type: "city", label: "Paris, França (PAR)" },
      { id: 'dest-nce-1', name: "Nice (Costa Azul)", subtitle: "Provença-Alpes-Costa Azul, França", code: "NCE", type: "city", label: "Nice, França (NCE)" },
      { id: 'dest-lys-2', name: "Lyon", subtitle: "Auvérnia-Ródano-Alpes, França", code: "LYS", type: "city", label: "Lyon, França (LYS)" },
      { id: 'dest-mrs-3', name: "Marselha", subtitle: "Provença-Alpes-Costa Azul, França", code: "MRS", type: "city", label: "Marselha, França (MRS)" },
      { id: 'dest-bod-4', name: "Bordeaux", subtitle: "Nova Aquitânia, França", code: "BOD", type: "city", label: "Bordeaux, França (BOD)" },
      { id: 'dest-tls-5', name: "Toulouse", subtitle: "Occitânia, França", code: "TLS", type: "city", label: "Toulouse, França (TLS)" },
    ],
  },
  {
    keywords: ["italia", "itália", "italy"],
    cities: [
      { id: 'dest-rom-0', name: "Roma", subtitle: "Lácio, Itália", code: "ROM", type: "city", label: "Roma, Itália (ROM)" },
      { id: 'dest-mil-1', name: "Milão", subtitle: "Lombardia, Itália", code: "MIL", type: "city", label: "Milão, Itália (MIL)" },
      { id: 'dest-flr-2', name: "Florença (Toscana)", subtitle: "Toscana, Itália", code: "FLR", type: "city", label: "Florença, Itália (FLR)" },
      { id: 'dest-vce-3', name: "Veneza", subtitle: "Vêneto, Itália", code: "VCE", type: "city", label: "Veneza, Itália (VCE)" },
      { id: 'dest-nap-4', name: "Nápoles (Costa Amalfitana)", subtitle: "Campânia, Itália", code: "NAP", type: "city", label: "Nápoles, Itália (NAP)" },
      { id: 'dest-pmo-5', name: "Palermo (Sicília)", subtitle: "Sicília, Itália", code: "PMO", type: "city", label: "Palermo, Sicília, Itália (PMO)" },
    ],
  },
  {
    keywords: ["reino unido", "inglaterra", "uk", "great britain", "gra-bretanha", "grã-bretanha", "escocia", "escócia", "pais de gales"],
    cities: [
      { id: 'dest-lon-0', name: "Londres", subtitle: "Inglaterra, Reino Unido", code: "LON", type: "city", label: "Londres, Reino Unido (LON)" },
      { id: 'dest-edi-1', name: "Edimburgo", subtitle: "Escócia, Reino Unido", code: "EDI", type: "city", label: "Edimburgo, Escócia, Reino Unido (EDI)" },
      { id: 'dest-man-2', name: "Manchester", subtitle: "Inglaterra, Reino Unido", code: "MAN", type: "city", label: "Manchester, Reino Unido (MAN)" },
      { id: 'dest-lpl-3', name: "Liverpool", subtitle: "Inglaterra, Reino Unido", code: "LPL", type: "city", label: "Liverpool, Reino Unido (LPL)" },
      { id: 'dest-bfs-4', name: "Belfast", subtitle: "Irlanda do Norte, Reino Unido", code: "BFS", type: "city", label: "Belfast, Reino Unido (BFS)" },
    ],
  },
  {
    keywords: ["alemanha", "germany"],
    cities: [
      { id: 'dest-ber-0', name: "Berlim", subtitle: "Berlim, Alemanha", code: "BER", type: "city", label: "Berlim, Alemanha (BER)" },
      { id: 'dest-muc-1', name: "Munique", subtitle: "Baviera, Alemanha", code: "MUC", type: "city", label: "Munique, Alemanha (MUC)" },
      { id: 'dest-fra-2', name: "Frankfurt", subtitle: "Hesse, Alemanha", code: "FRA", type: "city", label: "Frankfurt, Alemanha (FRA)" },
      { id: 'dest-ham-3', name: "Hamburgo", subtitle: "Hamburgo, Alemanha", code: "HAM", type: "city", label: "Hamburgo, Alemanha (HAM)" },
      { id: 'dest-cgn-4', name: "Colônia", subtitle: "Renânia do Norte-Vestfália, Alemanha", code: "CGN", type: "city", label: "Colônia, Alemanha (CGN)" },
    ],
  },
  {
    keywords: ["holanda", "paises baixos", "países baixos", "netherlands"],
    cities: [
      { id: 'dest-ams-0', name: "Amsterdã", subtitle: "Holanda do Norte, Holanda", code: "AMS", type: "city", label: "Amsterdã, Holanda (AMS)" },
      { id: 'dest-rtm-1', name: "Roterdã", subtitle: "Holanda do Sul, Holanda", code: "RTM", type: "city", label: "Roterdã, Holanda (RTM)" },
      { id: 'dest-hag-2', name: "Haia", subtitle: "Holanda do Sul, Holanda", code: "HAG", type: "city", label: "Haia, Holanda (HAG)" },
    ],
  },
  {
    keywords: ["suica", "suíça", "switzerland"],
    cities: [
      { id: 'dest-zrh-0', name: "Zurique", subtitle: "Zurique, Suíça", code: "ZRH", type: "city", label: "Zurique, Suíça (ZRH)" },
      { id: 'dest-gva-1', name: "Genebra", subtitle: "Genebra, Suíça", code: "GVA", type: "city", label: "Genebra, Suíça (GVA)" },
      { id: 'dest-bsl-2', name: "Basileia", subtitle: "Basileia, Suíça", code: "BSL", type: "city", label: "Basileia, Suíça (BSL)" },
      { id: 'dest-brn-3', name: "Lucerna / Berna", subtitle: "Berna, Suíça", code: "BRN", type: "city", label: "Berna, Suíça (BRN)" },
    ],
  },
  {
    keywords: ["belgica", "bélgica", "belgium"],
    cities: [
      { id: 'dest-bru-0', name: "Bruxelas", subtitle: "Bruxelas, Bélgica", code: "BRU", type: "city", label: "Bruxelas, Bélgica (BRU)" },
      { id: 'dest-ost-1', name: "Bruges", subtitle: "Flandres Ocidental, Bélgica", code: "OST", type: "city", label: "Bruges, Bélgica (OST)" },
      { id: 'dest-anr-2', name: "Antuérpia", subtitle: "Antuérpia, Bélgica", code: "ANR", type: "city", label: "Antuérpia, Bélgica (ANR)" },
    ],
  },
  {
    keywords: ["austria", "áustria"],
    cities: [
      { id: 'dest-vie-0', name: "Viena", subtitle: "Viena, Áustria", code: "VIE", type: "city", label: "Viena, Áustria (VIE)" },
      { id: 'dest-szg-1', name: "Salzburgo", subtitle: "Salzburgo, Áustria", code: "SZG", type: "city", label: "Salzburgo, Áustria (SZG)" },
      { id: 'dest-inn-2', name: "Innsbruck (Alpes)", subtitle: "Tirol, Áustria", code: "INN", type: "city", label: "Innsbruck, Áustria (INN)" },
    ],
  },
  {
    keywords: ["grecia", "grécia", "greece"],
    cities: [
      { id: 'dest-ath-0', name: "Atenas", subtitle: "Ática, Grécia", code: "ATH", type: "city", label: "Atenas, Grécia (ATH)" },
      { id: 'dest-jtr-1', name: "Santorini (Tira)", subtitle: "Cíclades, Grécia", code: "JTR", type: "city", label: "Santorini, Grécia (JTR)" },
      { id: 'dest-jmk-2', name: "Mykonos", subtitle: "Cíclades, Grécia", code: "JMK", type: "city", label: "Mykonos, Grécia (JMK)" },
      { id: 'dest-her-3', name: "Creta (Heraklion)", subtitle: "Creta, Grécia", code: "HER", type: "city", label: "Heraklion (Creta), Grécia (HER)" },
      { id: 'dest-skg-4', name: "Tessalônica", subtitle: "Macedônia Central, Grécia", code: "SKG", type: "city", label: "Tessalônica, Grécia (SKG)" },
    ],
  },
  {
    keywords: ["turquia", "turkey", "türkiye"],
    cities: [
      { id: 'dest-ist-0', name: "Istambul", subtitle: "Mármara, Turquia", code: "IST", type: "city", label: "Istambul, Turquia (IST)" },
      { id: 'dest-asr-1', name: "Capadócia (Nevşehir / Kayseri)", subtitle: "Anatólia Central, Turquia", code: "ASR", type: "city", label: "Capadócia (Kayseri), Turquia (ASR)" },
      { id: 'dest-ayt-2', name: "Antália", subtitle: "Mediterrâneo, Turquia", code: "AYT", type: "city", label: "Antália, Turquia (AYT)" },
      { id: 'dest-bjv-3', name: "Bodrum", subtitle: "Egeu, Turquia", code: "BJV", type: "city", label: "Bodrum, Turquia (BJV)" },
    ],
  },
  {
    keywords: ["irlanda", "ireland"],
    cities: [
      { id: 'dest-dub-0', name: "Dublin", subtitle: "Leinster, Irlanda", code: "DUB", type: "city", label: "Dublin, Irlanda (DUB)" },
      { id: 'dest-ork-1', name: "Cork", subtitle: "Munster, Irlanda", code: "ORK", type: "city", label: "Cork, Irlanda (ORK)" },
      { id: 'dest-gwy-2', name: "Galway", subtitle: "Connacht, Irlanda", code: "GWY", type: "city", label: "Galway, Irlanda (GWY)" },
    ],
  },
  {
    keywords: ["dinamarca", "denmark"],
    cities: [
      { id: 'dest-cph-0', name: "Copenhague", subtitle: "Hovedstaden, Dinamarca", code: "CPH", type: "city", label: "Copenhague, Dinamarca (CPH)" },
    ],
  },
  {
    keywords: ["suecia", "suécia", "sweden"],
    cities: [
      { id: 'dest-arn-0', name: "Estocolmo", subtitle: "Estocolmo, Suécia", code: "ARN", type: "city", label: "Estocolmo, Suécia (ARN)" },
      { id: 'dest-got-1', name: "Gotemburgo", subtitle: "Västra Götaland, Suécia", code: "GOT", type: "city", label: "Gotemburgo, Suécia (GOT)" },
    ],
  },
  {
    keywords: ["noruega", "norway"],
    cities: [
      { id: 'dest-osl-0', name: "Oslo", subtitle: "Ostlandet, Noruega", code: "OSL", type: "city", label: "Oslo, Noruega (OSL)" },
      { id: 'dest-bgo-1', name: "Bergen (Fiordes)", subtitle: "Vestlandet, Noruega", code: "BGO", type: "city", label: "Bergen, Noruega (BGO)" },
      { id: 'dest-tos-2', name: "Tromsø (Aurora Boreal)", subtitle: "Troms, Noruega", code: "TOS", type: "city", label: "Tromsø, Noruega (TOS)" },
    ],
  },
  {
    keywords: ["finlandia", "finlândia", "finland"],
    cities: [
      { id: 'dest-hel-0', name: "Helsinque", subtitle: "Uusimaa, Finlândia", code: "HEL", type: "city", label: "Helsinque, Finlândia (HEL)" },
      { id: 'dest-rvn-1', name: "Rovaniemi (Lapônia)", subtitle: "Lapônia, Finlândia", code: "RVN", type: "city", label: "Rovaniemi (Lapônia), Finlândia (RVN)" },
    ],
  },
  {
    keywords: ["islandia", "islândia", "iceland"],
    cities: [
      { id: 'dest-kef-0', name: "Reykjavík", subtitle: "Höfuðborgarsvæði, Islândia", code: "KEF", type: "city", label: "Reykjavík, Islândia (KEF)" },
    ],
  },
  {
    keywords: ["polonia", "polônia", "poland"],
    cities: [
      { id: 'dest-waw-0', name: "Varsóvia", subtitle: "Mazóvia, Polônia", code: "WAW", type: "city", label: "Varsóvia, Polônia (WAW)" },
      { id: 'dest-krk-1', name: "Cracóvia", subtitle: "Pequena Polônia, Polônia", code: "KRK", type: "city", label: "Cracóvia, Polônia (KRK)" },
    ],
  },
  {
    keywords: ["republica tcheca", "república tcheca", "chequia", "chéquia", "czech republic"],
    cities: [
      { id: 'dest-prg-0', name: "Praga", subtitle: "Boêmia, República Tcheca", code: "PRG", type: "city", label: "Praga, República Tcheca (PRG)" },
    ],
  },
  {
    keywords: ["hungria", "hungary"],
    cities: [
      { id: 'dest-bud-0', name: "Budapeste", subtitle: "Peste, Hungria", code: "BUD", type: "city", label: "Budapeste, Hungria (BUD)" },
    ],
  },
  {
    keywords: ["croacia", "croácia", "croatia"],
    cities: [
      { id: 'dest-dbv-0', name: "Dubrovnik", subtitle: "Dubrovnik-Neretva, Croácia", code: "DBV", type: "city", label: "Dubrovnik, Croácia (DBV)" },
      { id: 'dest-spu-1', name: "Split", subtitle: "Split-Dalmácia, Croácia", code: "SPU", type: "city", label: "Split, Croácia (SPU)" },
      { id: 'dest-zag-2', name: "Zagreb", subtitle: "Zagreb, Croácia", code: "ZAG", type: "city", label: "Zagreb, Croácia (ZAG)" },
    ],
  },
  {
    keywords: ["romenia", "romênia", "romania"],
    cities: [
      { id: 'dest-otp-0', name: "Bucareste", subtitle: "Ilfov, Romênia", code: "OTP", type: "city", label: "Bucareste, Romênia (OTP)" },
      { id: 'dest-clj-1', name: "Cluj-Napoca (Transilvânia)", subtitle: "Cluj, Romênia", code: "CLJ", type: "city", label: "Cluj-Napoca, Romênia (CLJ)" },
    ],
  },
  {
    keywords: ["bulgaria", "bulgária"],
    cities: [
      { id: 'dest-sof-0', name: "Sófia", subtitle: "Sófia-Cidade, Bulgária", code: "SOF", type: "city", label: "Sófia, Bulgária (SOF)" },
    ],
  },
  {
    keywords: ["servia", "sérvia", "serbia"],
    cities: [
      { id: 'dest-beg-0', name: "Belgrado", subtitle: "Belgrado, Sérvia", code: "BEG", type: "city", label: "Belgrado, Sérvia (BEG)" },
    ],
  },
  {
    keywords: ["eslovenia", "eslovênia", "slovenia"],
    cities: [
      { id: 'dest-lju-0', name: "Liubliana", subtitle: "Eslovênia Central, Eslovênia", code: "LJU", type: "city", label: "Liubliana, Eslovênia (LJU)" },
    ],
  },
  {
    keywords: ["eslovaquia", "eslováquia", "slovakia"],
    cities: [
      { id: 'dest-bts-0', name: "Bratislava", subtitle: "Bratislava, Eslováquia", code: "BTS", type: "city", label: "Bratislava, Eslováquia (BTS)" },
    ],
  },
  {
    keywords: ["ucrania", "ucrânia", "ukraine"],
    cities: [
      { id: 'dest-kbp-0', name: "Kiev", subtitle: "Kiev, Ucrânia", code: "KBP", type: "city", label: "Kiev, Ucrânia (KBP)" },
    ],
  },
  {
    keywords: ["russia", "rússia"],
    cities: [
      { id: 'dest-mow-0', name: "Moscou", subtitle: "Distrito Central, Rússia", code: "MOW", type: "city", label: "Moscou, Rússia (MOW)" },
      { id: 'dest-led-1', name: "São Petersburgo", subtitle: "Distrito Noroeste, Rússia", code: "LED", type: "city", label: "São Petersburgo, Rússia (LED)" },
    ],
  },
  {
    keywords: ["luxemburgo", "luxembourg"],
    cities: [
      { id: 'dest-lux-0', name: "Cidade de Luxemburgo", subtitle: "Luxemburgo", code: "LUX", type: "city", label: "Luxemburgo, Luxemburgo (LUX)" },
    ],
  },
  {
    keywords: ["monaco", "mônaco"],
    cities: [
      { id: 'dest-nce-0', name: "Mônaco / Monte Carlo", subtitle: "Mônaco", code: "NCE", type: "city", label: "Mônaco (via Nice) (NCE)" },
    ],
  },
  {
    keywords: ["andorra"],
    cities: [
      { id: 'dest-bcn-0', name: "Andorra-a-Velha", subtitle: "Andorra", code: "BCN", type: "city", label: "Andorra-a-Velha (via Barcelona) (BCN)" },
    ],
  },
  {
    keywords: ["malta"],
    cities: [
      { id: 'dest-mla-0', name: "Valeta", subtitle: "Malta", code: "MLA", type: "city", label: "Valeta, Malta (MLA)" },
    ],
  },
  {
    keywords: ["chipre", "cyprus"],
    cities: [
      { id: 'dest-lca-0', name: "Nicósia / Larnaca", subtitle: "Larnaca, Chipre", code: "LCA", type: "city", label: "Larnaca, Chipre (LCA)" },
    ],
  },
  {
    keywords: ["albania", "albânia"],
    cities: [
      { id: 'dest-tia-0', name: "Tirana", subtitle: "Tirana, Albânia", code: "TIA", type: "city", label: "Tirana, Albânia (TIA)" },
    ],
  },
  {
    keywords: ["montenegro"],
    cities: [
      { id: 'dest-tgd-0', name: "Podgorica / Kotor", subtitle: "Montenegro", code: "TGD", type: "city", label: "Podgorica, Montenegro (TGD)" },
    ],
  },
  {
    keywords: ["bosnia", "bósnia", "bosnia e herzegovina", "bósnia e herzegovina"],
    cities: [
      { id: 'dest-sjj-0', name: "Sarajevo", subtitle: "Federação da Bósnia, Bósnia", code: "SJJ", type: "city", label: "Sarajevo, Bósnia (SJJ)" },
    ],
  },
  {
    keywords: ["macedonia", "macedônia", "macedonia do norte"],
    cities: [
      { id: 'dest-skp-0', name: "Skopje", subtitle: "Macedônia do Norte", code: "SKP", type: "city", label: "Skopje, Macedônia do Norte (SKP)" },
    ],
  },
  {
    keywords: ["estonia", "estônia", "estonia"],
    cities: [
      { id: 'dest-tll-0', name: "Talin", subtitle: "Harju, Estônia", code: "TLL", type: "city", label: "Talin, Estônia (TLL)" },
    ],
  },
  {
    keywords: ["letonia", "letônia", "latvia"],
    cities: [
      { id: 'dest-rix-0', name: "Riga", subtitle: "Riga, Letônia", code: "RIX", type: "city", label: "Riga, Letônia (RIX)" },
    ],
  },
  {
    keywords: ["lituania", "lituânia", "lithuania"],
    cities: [
      { id: 'dest-vno-0', name: "Vilnius", subtitle: "Vilnius, Lituânia", code: "VNO", type: "city", label: "Vilnius, Lituânia (VNO)" },
    ],
  },
  {
    keywords: ["georgia", "geórgia"],
    cities: [
      { id: 'dest-tbs-0', name: "Tbilisi", subtitle: "Tbilisi, Geórgia", code: "TBS", type: "city", label: "Tbilisi, Geórgia (TBS)" },
      { id: 'dest-bus-1', name: "Batumi", subtitle: "Adjara, Geórgia", code: "BUS", type: "city", label: "Batumi, Geórgia (BUS)" },
    ],
  },
  {
    keywords: ["armenia", "armênia"],
    cities: [
      { id: 'dest-evn-0', name: "Yerevan", subtitle: "Yerevan, Armênia", code: "EVN", type: "city", label: "Yerevan, Armênia (EVN)" },
    ],
  },
  {
    keywords: ["azerbaijao", "azerbaijão", "azerbaijan"],
    cities: [
      { id: 'dest-gyd-0', name: "Baku", subtitle: "Absheron, Azerbaijão", code: "GYD", type: "city", label: "Baku, Azerbaijão (GYD)" },
    ],
  },
  {
    keywords: ["cazaquistao", "cazaquistão", "kazakhstan", "kazakh"],
    cities: [
      { id: 'dest-nqz-0', name: "Astana", subtitle: "Akmola, Cazaquistão", code: "NQZ", type: "city", label: "Astana, Cazaquistão (NQZ)" },
      { id: 'dest-ala-1', name: "Almaty", subtitle: "Almaty, Cazaquistão", code: "ALA", type: "city", label: "Almaty, Cazaquistão (ALA)" },
      { id: 'dest-cit-2', name: "Shymkent", subtitle: "Cazaquistão do Sul, Cazaquistão", code: "CIT", type: "city", label: "Shymkent, Cazaquistão (CIT)" },
    ],
  },
  {
    keywords: ["uzbequistao", "uzbequistão", "uzbekistan"],
    cities: [
      { id: 'dest-tas-0', name: "Tashkent", subtitle: "Tashkent, Uzbequistão", code: "TAS", type: "city", label: "Tashkent, Uzbequistão (TAS)" },
      { id: 'dest-skd-1', name: "Samarcanda", subtitle: "Samarcanda, Uzbequistão", code: "SKD", type: "city", label: "Samarcanda, Uzbequistão (SKD)" },
      { id: 'dest-bhk-2', name: "Bukhara", subtitle: "Bukhara, Uzbequistão", code: "BHK", type: "city", label: "Bukhara, Uzbequistão (BHK)" },
    ],
  },
  {
    keywords: ["quirguistao", "quirguistão", "kyrgyzstan"],
    cities: [
      { id: 'dest-fru-0', name: "Bishkek", subtitle: "Chuy, Quirguistão", code: "FRU", type: "city", label: "Bishkek, Quirguistão (FRU)" },
    ],
  },
  {
    keywords: ["tajiquistao", "tajiquistão", "tajikistan"],
    cities: [
      { id: 'dest-dyu-0', name: "Dushanbe", subtitle: "Dushanbe, Tajiquistão", code: "DYU", type: "city", label: "Dushanbe, Tajiquistão (DYU)" },
    ],
  },
  {
    keywords: ["turcomenistao", "turcomenistão", "turkmenistan"],
    cities: [
      { id: 'dest-asb-0', name: "Ashgabat", subtitle: "Ahal, Turcomenistão", code: "ASB", type: "city", label: "Ashgabat, Turcomenistão (ASB)" },
    ],
  },
  {
    keywords: ["filipinas", "philippines"],
    cities: [
      { id: 'dest-mnl-0', name: "Manila", subtitle: "Metro Manila, Filipinas", code: "MNL", type: "city", label: "Manila, Filipinas (MNL)" },
      { id: 'dest-ceb-1', name: "Cebu", subtitle: "Visayas Centrais, Filipinas", code: "CEB", type: "city", label: "Cebu, Filipinas (CEB)" },
      { id: 'dest-mph-2', name: "Boracay (Caticlan)", subtitle: "Aklan, Filipinas", code: "MPH", type: "city", label: "Boracay, Filipinas (MPH)" },
      { id: 'dest-pps-3', name: "El Nido / Puerto Princesa (Palawan)", subtitle: "Palawan, Filipinas", code: "PPS", type: "city", label: "Puerto Princesa (Palawan), Filipinas (PPS)" },
    ],
  },
  {
    keywords: ["japao", "japão", "japan"],
    cities: [
      { id: 'dest-tyo-0', name: "Tóquio", subtitle: "Kanto, Japão", code: "TYO", type: "city", label: "Tóquio, Japão (TYO)" },
      { id: 'dest-kix-1', name: "Quioto", subtitle: "Kansai, Japão", code: "KIX", type: "city", label: "Quioto, Japão (KIX)" },
      { id: 'dest-osa-2', name: "Osaka", subtitle: "Kansai, Japão", code: "OSA", type: "city", label: "Osaka, Japão (OSA)" },
      { id: 'dest-cts-3', name: "Sapporo (Hokkaido)", subtitle: "Hokkaido, Japão", code: "CTS", type: "city", label: "Sapporo, Japão (CTS)" },
      { id: 'dest-hij-4', name: "Hiroshima", subtitle: "Chugoku, Japão", code: "HIJ", type: "city", label: "Hiroshima, Japão (HIJ)" },
    ],
  },
  {
    keywords: ["china"],
    cities: [
      { id: 'dest-bjs-0', name: "Pequim (Beijing)", subtitle: "Pequim, China", code: "BJS", type: "city", label: "Pequim, China (BJS)" },
      { id: 'dest-sha-1', name: "Xangai", subtitle: "Xangai, China", code: "SHA", type: "city", label: "Xangai, China (SHA)" },
      { id: 'dest-hkg-2', name: "Hong Kong", subtitle: "Hong Kong, China", code: "HKG", type: "city", label: "Hong Kong (HKG)" },
      { id: 'dest-can-3', name: "Cantão (Guangzhou)", subtitle: "Guangdong, China", code: "CAN", type: "city", label: "Guangzhou, China (CAN)" },
      { id: 'dest-xiy-4', name: "Xi'an (Guerreiros de Terracota)", subtitle: "Shaanxi, China", code: "XIY", type: "city", label: "Xi'an, China (XIY)" },
    ],
  },
  {
    keywords: ["coreia do sul", "coréia do sul", "south korea", "korea"],
    cities: [
      { id: 'dest-sel-0', name: "Seul", subtitle: "Região da Capital, Coreia do Sul", code: "SEL", type: "city", label: "Seul, Coreia do Sul (SEL)" },
      { id: 'dest-pus-1', name: "Busan", subtitle: "Gyeongsang do Sul, Coreia do Sul", code: "PUS", type: "city", label: "Busan, Coreia do Sul (PUS)" },
      { id: 'dest-cju-2', name: "Ilha de Jeju", subtitle: "Jeju, Coreia do Sul", code: "CJU", type: "city", label: "Jeju, Coreia do Sul (CJU)" },
    ],
  },
  {
    keywords: ["taiwan"],
    cities: [
      { id: 'dest-tpe-0', name: "Taipei", subtitle: "Taipei, Taiwan", code: "TPE", type: "city", label: "Taipei, Taiwan (TPE)" },
    ],
  },
  {
    keywords: ["tailandia", "tailândia", "thailand"],
    cities: [
      { id: 'dest-bkk-0', name: "Bangkok", subtitle: "Bangkok, Tailândia", code: "BKK", type: "city", label: "Bangkok, Tailândia (BKK)" },
      { id: 'dest-hkt-1', name: "Phuket", subtitle: "Phuket, Tailândia", code: "HKT", type: "city", label: "Phuket, Tailândia (HKT)" },
      { id: 'dest-cnx-2', name: "Chiang Mai", subtitle: "Chiang Mai, Tailândia", code: "CNX", type: "city", label: "Chiang Mai, Tailândia (CNX)" },
      { id: 'dest-usm-3', name: "Koh Samui", subtitle: "Surat Thani, Tailândia", code: "USM", type: "city", label: "Koh Samui, Tailândia (USM)" },
      { id: 'dest-kbv-4', name: "Krabi", subtitle: "Krabi, Tailândia", code: "KBV", type: "city", label: "Krabi, Tailândia (KBV)" },
    ],
  },
  {
    keywords: ["vietna", "vietnã", "vietnam"],
    cities: [
      { id: 'dest-han-0', name: "Hanói", subtitle: "Delta do Rio Vermelho, Vietnã", code: "HAN", type: "city", label: "Hanói, Vietnã (HAN)" },
      { id: 'dest-sgn-1', name: "Ho Chi Minh (Saigon)", subtitle: "Sudeste, Vietnã", code: "SGN", type: "city", label: "Ho Chi Minh, Vietnã (SGN)" },
      { id: 'dest-dad-2', name: "Da Nang / Hoi An", subtitle: "Costa Central do Sul, Vietnã", code: "DAD", type: "city", label: "Da Nang, Vietnã (DAD)" },
    ],
  },
  {
    keywords: ["indonesia", "indonésia", "indonesia"],
    cities: [
      { id: 'dest-dps-0', name: "Bali (Denpasar)", subtitle: "Bali, Indonésia", code: "DPS", type: "city", label: "Bali (Denpasar), Indonésia (DPS)" },
      { id: 'dest-jkt-1', name: "Jacarta", subtitle: "Java, Indonésia", code: "JKT", type: "city", label: "Jacarta, Indonésia (JKT)" },
      { id: 'dest-lop-2', name: "Lombok", subtitle: "Sonda Ocidental, Indonésia", code: "LOP", type: "city", label: "Lombok, Indonésia (LOP)" },
    ],
  },
  {
    keywords: ["malasia", "malásia", "malaysia"],
    cities: [
      { id: 'dest-kul-0', name: "Kuala Lumpur", subtitle: "Território Federal, Malásia", code: "KUL", type: "city", label: "Kuala Lumpur, Malásia (KUL)" },
      { id: 'dest-pen-1', name: "Penang (George Town)", subtitle: "Penang, Malásia", code: "PEN", type: "city", label: "Penang, Malásia (PEN)" },
    ],
  },
  {
    keywords: ["cingapura", "singapura", "singapore"],
    cities: [
      { id: 'dest-sin-0', name: "Singapura", subtitle: "Singapura", code: "SIN", type: "city", label: "Singapura, Singapura (SIN)" },
    ],
  },
  {
    keywords: ["india", "índia"],
    cities: [
      { id: 'dest-del-0', name: "Nova Delhi", subtitle: "Délhi, Índia", code: "DEL", type: "city", label: "Nova Delhi, Índia (DEL)" },
      { id: 'dest-bom-1', name: "Mumbai (Bombaim)", subtitle: "Maharashtra, Índia", code: "BOM", type: "city", label: "Mumbai, Índia (BOM)" },
      { id: 'dest-jai-2', name: "Jaipur (Rajasthan)", subtitle: "Rajasthan, Índia", code: "JAI", type: "city", label: "Jaipur, Índia (JAI)" },
      { id: 'dest-goi-3', name: "Goa", subtitle: "Goa, Índia", code: "GOI", type: "city", label: "Goa, Índia (GOI)" },
      { id: 'dest-blr-4', name: "Bangalore", subtitle: "Karnataka, Índia", code: "BLR", type: "city", label: "Bangalore, Índia (BLR)" },
    ],
  },
  {
    keywords: ["maldivas", "maldives"],
    cities: [
      { id: 'dest-mle-0', name: "Malé", subtitle: "Atol de Kaafu, Maldivas", code: "MLE", type: "city", label: "Malé, Maldivas (MLE)" },
    ],
  },
  {
    keywords: ["sri lanka"],
    cities: [
      { id: 'dest-cmb-0', name: "Colombo", subtitle: "Província Ocidental, Sri Lanka", code: "CMB", type: "city", label: "Colombo, Sri Lanka (CMB)" },
    ],
  },
  {
    keywords: ["nepal"],
    cities: [
      { id: 'dest-ktm-0', name: "Catmandu", subtitle: "Bagmati, Nepal", code: "KTM", type: "city", label: "Catmandu, Nepal (KTM)" },
      { id: 'dest-pkr-1', name: "Pokhara (Himalaia)", subtitle: "Gandaki, Nepal", code: "PKR", type: "city", label: "Pokhara, Nepal (PKR)" },
    ],
  },
  {
    keywords: ["camboja", "cambodia"],
    cities: [
      { id: 'dest-sai-0', name: "Siem Reap (Angkor Wat)", subtitle: "Siem Reap, Camboja", code: "SAI", type: "city", label: "Siem Reap (Angkor), Camboja (SAI)" },
      { id: 'dest-pnh-1', name: "Phnom Penh", subtitle: "Phnom Penh, Camboja", code: "PNH", type: "city", label: "Phnom Penh, Camboja (PNH)" },
    ],
  },
  {
    keywords: ["myanmar", "birmânia", "birmania"],
    cities: [
      { id: 'dest-rgn-0', name: "Yangon", subtitle: "Yangon, Myanmar", code: "RGN", type: "city", label: "Yangon, Myanmar (RGN)" },
      { id: 'dest-mdl-1', name: "Mandalay / Bagan", subtitle: "Mandalay, Myanmar", code: "MDL", type: "city", label: "Mandalay, Myanmar (MDL)" },
    ],
  },
  {
    keywords: ["laos"],
    cities: [
      { id: 'dest-lpq-0', name: "Luang Prabang", subtitle: "Luang Prabang, Laos", code: "LPQ", type: "city", label: "Luang Prabang, Laos (LPQ)" },
      { id: 'dest-vte-1', name: "Vientiane", subtitle: "Vientiane, Laos", code: "VTE", type: "city", label: "Vientiane, Laos (VTE)" },
    ],
  },
  {
    keywords: ["mongolia", "mongólia"],
    cities: [
      { id: 'dest-ubn-0', name: "Ulan Bator", subtitle: "Ulan Bator, Mongólia", code: "UBN", type: "city", label: "Ulan Bator, Mongólia (UBN)" },
    ],
  },
  {
    keywords: ["emirados arabes", "emirados árabes", "emirados arabes unidos", "eau", "uae", "dubai", "abu dhabi"],
    cities: [
      { id: 'dest-dxb-0', name: "Dubai", subtitle: "Dubai, Emirados Árabes Unidos", code: "DXB", type: "city", label: "Dubai, Emirados Árabes Unidos (DXB)" },
      { id: 'dest-auh-1', name: "Abu Dhabi", subtitle: "Abu Dhabi, Emirados Árabes Unidos", code: "AUH", type: "city", label: "Abu Dhabi, Emirados Árabes Unidos (AUH)" },
    ],
  },
  {
    keywords: ["catar", "qatar"],
    cities: [
      { id: 'dest-doh-0', name: "Doha", subtitle: "Ad-Dawhah, Catar", code: "DOH", type: "city", label: "Doha, Catar (DOH)" },
    ],
  },
  {
    keywords: ["arabia saudita", "arábia saudita", "saudi arabia"],
    cities: [
      { id: 'dest-ruh-0', name: "Riad", subtitle: "Província de Riad, Arábia Saudita", code: "RUH", type: "city", label: "Riad, Arábia Saudita (RUH)" },
      { id: 'dest-jed-1', name: "Jidá (Meca)", subtitle: "Meca, Arábia Saudita", code: "JED", type: "city", label: "Jidá, Arábia Saudita (JED)" },
      { id: 'dest-ulh-2', name: "AlUla", subtitle: "Medina, Arábia Saudita", code: "ULH", type: "city", label: "AlUla, Arábia Saudita (ULH)" },
    ],
  },
  {
    keywords: ["israel"],
    cities: [
      { id: 'dest-tlv-0', name: "Tel Aviv", subtitle: "Distrito de Tel Aviv, Israel", code: "TLV", type: "city", label: "Tel Aviv, Israel (TLV)" },
      { id: 'dest-tlv-1', name: "Jerusalém", subtitle: "Distrito de Jerusalém, Israel", code: "TLV", type: "city", label: "Jerusalém (via Tel Aviv) (TLV)" },
    ],
  },
  {
    keywords: ["jordania", "jordânia", "jordan"],
    cities: [
      { id: 'dest-amm-0', name: "Amã", subtitle: "Amã, Jordânia", code: "AMM", type: "city", label: "Amã, Jordânia (AMM)" },
      { id: 'dest-aqj-1', name: "Aqaba (Petra e Wadi Rum)", subtitle: "Aqaba, Jordânia", code: "AQJ", type: "city", label: "Aqaba (Petra), Jordânia (AQJ)" },
    ],
  },
  {
    keywords: ["omã", "oma", "oman"],
    cities: [
      { id: 'dest-mct-0', name: "Mascate", subtitle: "Mascate, Omã", code: "MCT", type: "city", label: "Mascate, Omã (MCT)" },
      { id: 'dest-sll-1', name: "Salalah", subtitle: "Dofar, Omã", code: "SLL", type: "city", label: "Salalah, Omã (SLL)" },
    ],
  },
  {
    keywords: ["bahrein", "bahrain"],
    cities: [
      { id: 'dest-bah-0', name: "Manama", subtitle: "Capital, Bahrein", code: "BAH", type: "city", label: "Manama, Bahrein (BAH)" },
    ],
  },
  {
    keywords: ["kuwait"],
    cities: [
      { id: 'dest-kwi-0', name: "Cidade do Kuwait", subtitle: "Al Asimah, Kuwait", code: "KWI", type: "city", label: "Cidade do Kuwait, Kuwait (KWI)" },
    ],
  },
  {
    keywords: ["libano", "líbano", "lebanon"],
    cities: [
      { id: 'dest-bey-0', name: "Beirute", subtitle: "Beirute, Líbano", code: "BEY", type: "city", label: "Beirute, Líbano (BEY)" },
    ],
  },
  {
    keywords: ["iraque", "iraq"],
    cities: [
      { id: 'dest-bgw-0', name: "Bagdá", subtitle: "Bagdá, Iraque", code: "BGW", type: "city", label: "Bagdá, Iraque (BGW)" },
      { id: 'dest-ebl-1', name: "Erbil", subtitle: "Curdistão, Iraque", code: "EBL", type: "city", label: "Erbil, Iraque (EBL)" },
    ],
  },
  {
    keywords: ["ira", "irã", "iran"],
    cities: [
      { id: 'dest-ika-0', name: "Teerã", subtitle: "Teerã, Irã", code: "IKA", type: "city", label: "Teerã, Irã (IKA)" },
      { id: 'dest-ifn-1', name: "Isfahan", subtitle: "Isfahan, Irã", code: "IFN", type: "city", label: "Isfahan, Irã (IFN)" },
    ],
  },
  {
    keywords: ["paquistao", "paquistão", "pakistan"],
    cities: [
      { id: 'dest-isb-0', name: "Islamabad", subtitle: "Território da Capital, Paquistão", code: "ISB", type: "city", label: "Islamabad, Paquistão (ISB)" },
      { id: 'dest-lhe-1', name: "Lahore", subtitle: "Punjab, Paquistão", code: "LHE", type: "city", label: "Lahore, Paquistão (LHE)" },
      { id: 'dest-khi-2', name: "Karachi", subtitle: "Sindh, Paquistão", code: "KHI", type: "city", label: "Karachi, Paquistão (KHI)" },
    ],
  },
  {
    keywords: ["bangladesh"],
    cities: [
      { id: 'dest-dac-0', name: "Daca", subtitle: "Daca, Bangladesh", code: "DAC", type: "city", label: "Daca, Bangladesh (DAC)" },
    ],
  },
  {
    keywords: ["africa do sul", "áfrica do sul", "south africa"],
    cities: [
      { id: 'dest-cpt-0', name: "Cidade do Cabo", subtitle: "Cabo Ocidental, África do Sul", code: "CPT", type: "city", label: "Cidade do Cabo, África do Sul (CPT)" },
      { id: 'dest-jnb-1', name: "Joanesburgo", subtitle: "Gauteng, África do Sul", code: "JNB", type: "city", label: "Joanesburgo, África do Sul (JNB)" },
      { id: 'dest-dur-2', name: "Durban", subtitle: "KwaZulu-Natal, África do Sul", code: "DUR", type: "city", label: "Durban, África do Sul (DUR)" },
      { id: 'dest-mqp-3', name: "Parque Kruger (Nelspruit)", subtitle: "Mpumalanga, África do Sul", code: "MQP", type: "city", label: "Kruger Park (Nelspruit), África do Sul (MQP)" },
    ],
  },
  {
    keywords: ["egito", "egypt"],
    cities: [
      { id: 'dest-cai-0', name: "Cairo (Pirâmides de Gizé)", subtitle: "Cairo, Egito", code: "CAI", type: "city", label: "Cairo, Egito (CAI)" },
      { id: 'dest-hrg-1', name: "Hurghada (Mar Vermelho)", subtitle: "Mar Vermelho, Egito", code: "HRG", type: "city", label: "Hurghada, Egito (HRG)" },
      { id: 'dest-ssh-2', name: "Sharm el-Sheikh", subtitle: "Sinai do Sul, Egito", code: "SSH", type: "city", label: "Sharm el-Sheikh, Egito (SSH)" },
      { id: 'dest-lxr-3', name: "Luxor (Templos e Vale dos Reis)", subtitle: "Luxor, Egito", code: "LXR", type: "city", label: "Luxor, Egito (LXR)" },
    ],
  },
  {
    keywords: ["marrocos", "morocco"],
    cities: [
      { id: 'dest-rak-0', name: "Marrakech", subtitle: "Marrakech-Safi, Marrocos", code: "RAK", type: "city", label: "Marrakech, Marrocos (RAK)" },
      { id: 'dest-cmn-1', name: "Casablanca", subtitle: "Casablanca-Settat, Marrocos", code: "CMN", type: "city", label: "Casablanca, Marrocos (CMN)" },
      { id: 'dest-fez-2', name: "Fez", subtitle: "Fès-Meknès, Marrocos", code: "FEZ", type: "city", label: "Fez, Marrocos (FEZ)" },
      { id: 'dest-tng-3', name: "Tânger", subtitle: "Tânger-Tetuão, Marrocos", code: "TNG", type: "city", label: "Tânger, Marrocos (TNG)" },
    ],
  },
  {
    keywords: ["tunisia", "tunísia", "tunisia"],
    cities: [
      { id: 'dest-tun-0', name: "Túnis", subtitle: "Túnis, Tunísia", code: "TUN", type: "city", label: "Túnis, Tunísia (TUN)" },
      { id: 'dest-dje-1', name: "Djerba", subtitle: "Médenine, Tunísia", code: "DJE", type: "city", label: "Djerba, Tunísia (DJE)" },
    ],
  },
  {
    keywords: ["argelia", "argélia", "algeria"],
    cities: [
      { id: 'dest-alg-0', name: "Argel", subtitle: "Argel, Argélia", code: "ALG", type: "city", label: "Argel, Argélia (ALG)" },
    ],
  },
  {
    keywords: ["quenia", "quênia", "kenya"],
    cities: [
      { id: 'dest-nbo-0', name: "Nairóbi (Safáris)", subtitle: "Nairóbi, Quênia", code: "NBO", type: "city", label: "Nairóbi, Quênia (NBO)" },
      { id: 'dest-mba-1', name: "Mombasa", subtitle: "Costa, Quênia", code: "MBA", type: "city", label: "Mombasa, Quênia (MBA)" },
    ],
  },
  {
    keywords: ["tanzania", "tanzânia", "tanzania"],
    cities: [
      { id: 'dest-znz-0', name: "Zanzibar", subtitle: "Zanzibar, Tanzânia", code: "ZNZ", type: "city", label: "Zanzibar, Tanzânia (ZNZ)" },
      { id: 'dest-jro-1', name: "Kilimanjaro / Arusha (Serengeti)", subtitle: "Arusha, Tanzânia", code: "JRO", type: "city", label: "Kilimanjaro (Serengeti), Tanzânia (JRO)" },
      { id: 'dest-dar-2', name: "Dar es Salaam", subtitle: "Dar es Salaam, Tanzânia", code: "DAR", type: "city", label: "Dar es Salaam, Tanzânia (DAR)" },
    ],
  },
  {
    keywords: ["etiopia", "etiópia", "ethiopia"],
    cities: [
      { id: 'dest-add-0', name: "Adis Abeba", subtitle: "Adis Abeba, Etiópia", code: "ADD", type: "city", label: "Adis Abeba, Etiópia (ADD)" },
    ],
  },
  {
    keywords: ["namibia", "namíbia", "namibia"],
    cities: [
      { id: 'dest-wdh-0', name: "Windhoek", subtitle: "Khomas, Namíbia", code: "WDH", type: "city", label: "Windhoek, Namíbia (WDH)" },
    ],
  },
  {
    keywords: ["botsuana", "botswana"],
    cities: [
      { id: 'dest-gbe-0', name: "Gaborone", subtitle: "Distrito Sudeste, Botsuana", code: "GBE", type: "city", label: "Gaborone, Botsuana (GBE)" },
      { id: 'dest-mub-1', name: "Maun (Delta do Okavango)", subtitle: "Noroeste, Botsuana", code: "MUB", type: "city", label: "Maun (Okavango), Botsuana (MUB)" },
    ],
  },
  {
    keywords: ["zimbabue", "zimbábue", "zimbabwe"],
    cities: [
      { id: 'dest-vfa-0', name: "Victoria Falls", subtitle: "Matabeleland Norte, Zimbábue", code: "VFA", type: "city", label: "Victoria Falls, Zimbábue (VFA)" },
      { id: 'dest-hre-1', name: "Harare", subtitle: "Harare, Zimbábue", code: "HRE", type: "city", label: "Harare, Zimbábue (HRE)" },
    ],
  },
  {
    keywords: ["zambia", "zâmbia", "zambia"],
    cities: [
      { id: 'dest-lvi-0', name: "Livingstone (Victoria Falls)", subtitle: "Província do Sul, Zâmbia", code: "LVI", type: "city", label: "Livingstone, Zâmbia (LVI)" },
      { id: 'dest-lun-1', name: "Lusaka", subtitle: "Lusaka, Zâmbia", code: "LUN", type: "city", label: "Lusaka, Zâmbia (LUN)" },
    ],
  },
  {
    keywords: ["mocambique", "moçambique", "mozambique"],
    cities: [
      { id: 'dest-mpm-0', name: "Maputo", subtitle: "Maputo, Moçambique", code: "MPM", type: "city", label: "Maputo, Moçambique (MPM)" },
      { id: 'dest-vnx-1', name: "Vilanculos (Arquipélago de Bazaruto)", subtitle: "Inhambane, Moçambique", code: "VNX", type: "city", label: "Vilanculos (Bazaruto), Moçambique (VNX)" },
    ],
  },
  {
    keywords: ["angola"],
    cities: [
      { id: 'dest-lad-0', name: "Luanda", subtitle: "Luanda, Angola", code: "LAD", type: "city", label: "Luanda, Angola (LAD)" },
    ],
  },
  {
    keywords: ["cabo verde", "cape verde"],
    cities: [
      { id: 'dest-sid-0', name: "Ilha do Sal", subtitle: "Sal, Cabo Verde", code: "SID", type: "city", label: "Ilha do Sal, Cabo Verde (SID)" },
      { id: 'dest-rai-1', name: "Praia (Ilha de Santiago)", subtitle: "Santiago, Cabo Verde", code: "RAI", type: "city", label: "Praia, Cabo Verde (RAI)" },
      { id: 'dest-vxe-2', name: "São Vicente (Mindelo)", subtitle: "São Vicente, Cabo Verde", code: "VXE", type: "city", label: "São Vicente (Mindelo), Cabo Verde (VXE)" },
    ],
  },
  {
    keywords: ["sao tome e principe", "são tomé e príncipe"],
    cities: [
      { id: 'dest-tms-0', name: "São Tomé", subtitle: "Água Grande, São Tomé e Príncipe", code: "TMS", type: "city", label: "São Tomé, São Tomé e Príncipe (TMS)" },
    ],
  },
  {
    keywords: ["mauricio", "maurício", "mauritius", "ilhas mauricio"],
    cities: [
      { id: 'dest-mru-0', name: "Port Louis / Plaisance", subtitle: "Maurício", code: "MRU", type: "city", label: "Port Louis, Maurício (MRU)" },
    ],
  },
  {
    keywords: ["seicheles", "seychelles"],
    cities: [
      { id: 'dest-sez-0', name: "Mahé / Victoria", subtitle: "Seicheles", code: "SEZ", type: "city", label: "Mahé, Seicheles (SEZ)" },
    ],
  },
  {
    keywords: ["madagascar", "madagáscar"],
    cities: [
      { id: 'dest-tnr-0', name: "Antananarivo", subtitle: "Analamanga, Madagascar", code: "TNR", type: "city", label: "Antananarivo, Madagascar (TNR)" },
      { id: 'dest-nos-1', name: "Nosy Be", subtitle: "Diana, Madagascar", code: "NOS", type: "city", label: "Nosy Be, Madagascar (NOS)" },
    ],
  },
  {
    keywords: ["gana", "ghana"],
    cities: [
      { id: 'dest-acc-0', name: "Acra", subtitle: "Grande Acra, Gana", code: "ACC", type: "city", label: "Acra, Gana (ACC)" },
    ],
  },
  {
    keywords: ["nigeria", "nigéria", "nigeria"],
    cities: [
      { id: 'dest-los-0', name: "Lagos", subtitle: "Lagos, Nigéria", code: "LOS", type: "city", label: "Lagos, Nigéria (LOS)" },
      { id: 'dest-abv-1', name: "Abuja", subtitle: "Território da Capital, Nigéria", code: "ABV", type: "city", label: "Abuja, Nigéria (ABV)" },
    ],
  },
  {
    keywords: ["senegal"],
    cities: [
      { id: 'dest-dss-0', name: "Dacar", subtitle: "Dacar, Senegal", code: "DSS", type: "city", label: "Dacar, Senegal (DSS)" },
    ],
  },
  {
    keywords: ["costa do marfim", "côte d'ivoire"],
    cities: [
      { id: 'dest-abj-0', name: "Abidjan", subtitle: "Lagunes, Costa do Marfim", code: "ABJ", type: "city", label: "Abidjan, Costa do Marfim (ABJ)" },
    ],
  },
  {
    keywords: ["camaroes", "camarões", "cameroon"],
    cities: [
      { id: 'dest-nsi-0', name: "Yaoundé", subtitle: "Centro, Camarões", code: "NSI", type: "city", label: "Yaoundé, Camarões (NSI)" },
      { id: 'dest-dla-1', name: "Douala", subtitle: "Litoral, Camarões", code: "DLA", type: "city", label: "Douala, Camarões (DLA)" },
    ],
  },
  {
    keywords: ["ruanda", "rwanda"],
    cities: [
      { id: 'dest-kgl-0', name: "Kigali", subtitle: "Kigali, Ruanda", code: "KGL", type: "city", label: "Kigali, Ruanda (KGL)" },
    ],
  },
  {
    keywords: ["uganda"],
    cities: [
      { id: 'dest-ebb-0', name: "Entebbe / Kampala", subtitle: "Região Central, Uganda", code: "EBB", type: "city", label: "Entebbe (Kampala), Uganda (EBB)" },
    ],
  },
  {
    keywords: ["australia", "austrália", "australia"],
    cities: [
      { id: 'dest-syd-0', name: "Sydney", subtitle: "Nova Gales do Sul, Austrália", code: "SYD", type: "city", label: "Sydney, Austrália (SYD)" },
      { id: 'dest-mel-1', name: "Melbourne", subtitle: "Victoria, Austrália", code: "MEL", type: "city", label: "Melbourne, Austrália (MEL)" },
      { id: 'dest-bne-2', name: "Brisbane (Gold Coast)", subtitle: "Queensland, Austrália", code: "BNE", type: "city", label: "Brisbane, Austrália (BNE)" },
      { id: 'dest-cns-3', name: "Cairns (Grande Barreira de Corais)", subtitle: "Queensland, Austrália", code: "CNS", type: "city", label: "Cairns, Austrália (CNS)" },
      { id: 'dest-per-4', name: "Perth", subtitle: "Austrália Ocidental, Austrália", code: "PER", type: "city", label: "Perth, Austrália (PER)" },
    ],
  },
  {
    keywords: ["nova zelandia", "nova zelândia", "new zealand"],
    cities: [
      { id: 'dest-akl-0', name: "Auckland", subtitle: "Auckland, Nova Zelândia", code: "AKL", type: "city", label: "Auckland, Nova Zelândia (AKL)" },
      { id: 'dest-zqn-1', name: "Queenstown (Esportes Radicais)", subtitle: "Otago, Nova Zelândia", code: "ZQN", type: "city", label: "Queenstown, Nova Zelândia (ZQN)" },
      { id: 'dest-wlg-2', name: "Wellington", subtitle: "Wellington, Nova Zelândia", code: "WLG", type: "city", label: "Wellington, Nova Zelândia (WLG)" },
      { id: 'dest-chc-3', name: "Christchurch", subtitle: "Canterbury, Nova Zelândia", code: "CHC", type: "city", label: "Christchurch, Nova Zelândia (CHC)" },
    ],
  },
  {
    keywords: ["fiji", "ilhas fiji"],
    cities: [
      { id: 'dest-nan-0', name: "Nadi", subtitle: "Divisão Ocidental, Fiji", code: "NAN", type: "city", label: "Nadi, Fiji (NAN)" },
      { id: 'dest-suv-1', name: "Suva", subtitle: "Divisão Central, Fiji", code: "SUV", type: "city", label: "Suva, Fiji (SUV)" },
    ],
  },
  {
    keywords: ["polinesia francesa", "polinésia francesa", "taiti", "tahiti", "bora bora"],
    cities: [
      { id: 'dest-ppt-0', name: "Papeete (Taiti)", subtitle: "Polinésia Francesa", code: "PPT", type: "city", label: "Papeete (Taiti), Polinésia Francesa (PPT)" },
      { id: 'dest-bob-1', name: "Bora Bora", subtitle: "Polinésia Francesa", code: "BOB", type: "city", label: "Bora Bora, Polinésia Francesa (BOB)" },
    ],
  },
  {
    keywords: ["papua nova guine", "papua-nova guiné"],
    cities: [
      { id: 'dest-pom-0', name: "Port Moresby", subtitle: "Distrito da Capital Nacional, Papua-Nova Guiné", code: "POM", type: "city", label: "Port Moresby, Papua-Nova Guiné (POM)" },
    ],
  },
  {
    keywords: ["samoa"],
    cities: [
      { id: 'dest-apw-0', name: "Apia", subtitle: "Tuamasaga, Samoa", code: "APW", type: "city", label: "Apia, Samoa (APW)" },
    ],
  },
  {
    keywords: ["vanuatu"],
    cities: [
      { id: 'dest-vli-0', name: "Port Vila", subtitle: "Shefa, Vanuatu", code: "VLI", type: "city", label: "Port Vila, Vanuatu (VLI)" },
    ],
  },
  {
    keywords: ["belarus", "bielorrussia", "bielorrússia"],
    cities: [
      { id: 'dest-msq-0', name: "Minsk", subtitle: "Minsk, Bielorrússia", code: "MSQ", type: "city", label: "Minsk, Bielorrússia (MSQ)" },
    ],
  },
  {
    keywords: ["moldavia", "moldávia", "moldova"],
    cities: [
      { id: 'dest-rmo-0', name: "Chisinau", subtitle: "Chisinau, Moldávia", code: "RMO", type: "city", label: "Chisinau, Moldávia (RMO)" },
    ],
  },
  {
    keywords: ["kosovo"],
    cities: [
      { id: 'dest-prn-0', name: "Pristina", subtitle: "Pristina, Kosovo", code: "PRN", type: "city", label: "Pristina, Kosovo (PRN)" },
    ],
  },
  {
    keywords: ["liechtenstein"],
    cities: [
      { id: 'dest-zrh-0', name: "Vaduz", subtitle: "Liechtenstein", code: "ZRH", type: "city", label: "Vaduz (via Zurique) (ZRH)" },
    ],
  },
  {
    keywords: ["san marino"],
    cities: [
      { id: 'dest-rmi-0', name: "San Marino", subtitle: "San Marino", code: "RMI", type: "city", label: "San Marino (via Rimini) (RMI)" },
    ],
  },
  {
    keywords: ["vaticano"],
    cities: [
      { id: 'dest-rom-0', name: "Cidade do Vaticano", subtitle: "Vaticano", code: "ROM", type: "city", label: "Cidade do Vaticano (via Roma) (ROM)" },
    ],
  },
  {
    keywords: ["afeganistao", "afeganistão", "afghanistan"],
    cities: [
      { id: 'dest-kbl-0', name: "Cabul", subtitle: "Cabul, Afeganistão", code: "KBL", type: "city", label: "Cabul, Afeganistão (KBL)" },
    ],
  },
  {
    keywords: ["butao", "butão", "bhutan"],
    cities: [
      { id: 'dest-pbh-0', name: "Paro / Thimphu", subtitle: "Paro, Butão", code: "PBH", type: "city", label: "Paro (Thimphu), Butão (PBH)" },
    ],
  },
  {
    keywords: ["brunei"],
    cities: [
      { id: 'dest-bwn-0', name: "Bandar Seri Begawan", subtitle: "Brunei e Muara, Brunei", code: "BWN", type: "city", label: "Bandar Seri Begawan, Brunei (BWN)" },
    ],
  },
  {
    keywords: ["timor leste", "timor-leste", "east timor"],
    cities: [
      { id: 'dest-dil-0', name: "Díli", subtitle: "Díli, Timor-Leste", code: "DIL", type: "city", label: "Díli, Timor-Leste (DIL)" },
    ],
  },
  {
    keywords: ["papua", "nova guine"],
    cities: [
      { id: 'dest-pom-0', name: "Port Moresby", subtitle: "Papua-Nova Guiné", code: "POM", type: "city", label: "Port Moresby, Papua-Nova Guiné (POM)" },
    ],
  },
  {
    keywords: ["iemen", "iêmen", "yemen"],
    cities: [
      { id: 'dest-sah-0', name: "Sana", subtitle: "Sana, Iêmen", code: "SAH", type: "city", label: "Sana, Iêmen (SAH)" },
      { id: 'dest-ade-1', name: "Aden", subtitle: "Aden, Iêmen", code: "ADE", type: "city", label: "Aden, Iêmen (ADE)" },
    ],
  },
  {
    keywords: ["siria", "síria", "syria"],
    cities: [
      { id: 'dest-dam-0', name: "Damasco", subtitle: "Damasco, Síria", code: "DAM", type: "city", label: "Damasco, Síria (DAM)" },
    ],
  },
  {
    keywords: ["palestina", "palestine"],
    cities: [
      { id: 'dest-tlv-0', name: "Ramallah", subtitle: "Cisjordânia, Palestina", code: "TLV", type: "city", label: "Ramallah (via Tel Aviv) (TLV)" },
    ],
  },
  {
    keywords: ["coreia do norte", "coréia do norte", "north korea"],
    cities: [
      { id: 'dest-fnj-0', name: "Pyongyang", subtitle: "Pyongyang, Coreia do Norte", code: "FNJ", type: "city", label: "Pyongyang, Coreia do Norte (FNJ)" },
    ],
  },
  {
    keywords: ["benin"],
    cities: [
      { id: 'dest-coo-0', name: "Cotonou", subtitle: "Littoral, Benin", code: "COO", type: "city", label: "Cotonou, Benin (COO)" },
    ],
  },
  {
    keywords: ["burkina faso"],
    cities: [
      { id: 'dest-oua-0', name: "Ouagadougou", subtitle: "Centro, Burkina Faso", code: "OUA", type: "city", label: "Ouagadougou, Burkina Faso (OUA)" },
    ],
  },
  {
    keywords: ["burundi"],
    cities: [
      { id: 'dest-bjm-0', name: "Bujumbura", subtitle: "Bujumbura Mairie, Burundi", code: "BJM", type: "city", label: "Bujumbura, Burundi (BJM)" },
    ],
  },
  {
    keywords: ["chade"],
    cities: [
      { id: 'dest-ndj-0', name: "N'Djamena", subtitle: "Chari-Baguirmi, Chade", code: "NDJ", type: "city", label: "N'Djamena, Chade (NDJ)" },
    ],
  },
  {
    keywords: ["comores", "comoros"],
    cities: [
      { id: 'dest-hah-0', name: "Moroni", subtitle: "Grande Comore, Comores", code: "HAH", type: "city", label: "Moroni, Comores (HAH)" },
    ],
  },
  {
    keywords: ["congo", "republica do congo", "república do congo", "brazzaville"],
    cities: [
      { id: 'dest-bzv-0', name: "Brazzaville", subtitle: "Brazzaville, República do Congo", code: "BZV", type: "city", label: "Brazzaville, República do Congo (BZV)" },
    ],
  },
  {
    keywords: ["republica democratica do congo", "república democrática do congo", "rdc", "kinshasa"],
    cities: [
      { id: 'dest-fih-0', name: "Kinshasa", subtitle: "Kinshasa, RD Congo", code: "FIH", type: "city", label: "Kinshasa, RD Congo (FIH)" },
    ],
  },
  {
    keywords: ["djibuti", "djibouti"],
    cities: [
      { id: 'dest-jib-0', name: "Cidade do Djibuti", subtitle: "Djibuti", code: "JIB", type: "city", label: "Cidade do Djibuti, Djibuti (JIB)" },
    ],
  },
  {
    keywords: ["guine equatorial", "guiné equatorial"],
    cities: [
      { id: 'dest-ssg-0', name: "Malabo", subtitle: "Bioko Norte, Guiné Equatorial", code: "SSG", type: "city", label: "Malabo, Guiné Equatorial (SSG)" },
    ],
  },
  {
    keywords: ["eritreia", "eritreia"],
    cities: [
      { id: 'dest-asm-0', name: "Asmara", subtitle: "Maekel, Eritreia", code: "ASM", type: "city", label: "Asmara, Eritreia (ASM)" },
    ],
  },
  {
    keywords: ["essuatini", "suazilandia", "suazilândia", "eswatini"],
    cities: [
      { id: 'dest-sho-0', name: "Mbabane / Manzini", subtitle: "Manzini, Essuatíni", code: "SHO", type: "city", label: "Manzini (Mbabane), Essuatíni (SHO)" },
    ],
  },
  {
    keywords: ["gabao", "gabão", "gabon"],
    cities: [
      { id: 'dest-lbv-0', name: "Libreville", subtitle: "Estuaire, Gabão", code: "LBV", type: "city", label: "Libreville, Gabão (LBV)" },
    ],
  },
  {
    keywords: ["gambia", "gâmbia"],
    cities: [
      { id: 'dest-bjl-0', name: "Banjul", subtitle: "Banjul, Gâmbia", code: "BJL", type: "city", label: "Banjul, Gâmbia (BJL)" },
    ],
  },
  {
    keywords: ["guine", "guiné", "guinea"],
    cities: [
      { id: 'dest-cky-0', name: "Conacri", subtitle: "Conacri, Guiné", code: "CKY", type: "city", label: "Conacri, Guiné (CKY)" },
    ],
  },
  {
    keywords: ["guine bissau", "guiné-bissau", "guiné bissau"],
    cities: [
      { id: 'dest-oxb-0', name: "Bissau", subtitle: "Bissau, Guiné-Bissau", code: "OXB", type: "city", label: "Bissau, Guiné-Bissau (OXB)" },
    ],
  },
  {
    keywords: ["lesoto", "lesotho"],
    cities: [
      { id: 'dest-msu-0', name: "Maseru", subtitle: "Maseru, Lesoto", code: "MSU", type: "city", label: "Maseru, Lesoto (MSU)" },
    ],
  },
  {
    keywords: ["liberia", "libéria"],
    cities: [
      { id: 'dest-rob-0', name: "Monróvia", subtitle: "Montserrado, Libéria", code: "ROB", type: "city", label: "Monróvia, Libéria (ROB)" },
    ],
  },
  {
    keywords: ["libia", "líbia", "libya"],
    cities: [
      { id: 'dest-tip-0', name: "Trípoli", subtitle: "Trípoli, Líbia", code: "TIP", type: "city", label: "Trípoli, Líbia (TIP)" },
    ],
  },
  {
    keywords: ["malawi", "malaui", "malauí"],
    cities: [
      { id: 'dest-llw-0', name: "Lilongwe", subtitle: "Região Central, Malawi", code: "LLW", type: "city", label: "Lilongwe, Malawi (LLW)" },
    ],
  },
  {
    keywords: ["mali"],
    cities: [
      { id: 'dest-bko-0', name: "Bamako", subtitle: "Bamako, Mali", code: "BKO", type: "city", label: "Bamako, Mali (BKO)" },
    ],
  },
  {
    keywords: ["mauritania", "mauritânia"],
    cities: [
      { id: 'dest-nkc-0', name: "Nouakchott", subtitle: "Nouakchott, Mauritânia", code: "NKC", type: "city", label: "Nouakchott, Mauritânia (NKC)" },
    ],
  },
  {
    keywords: ["niger", "níger"],
    cities: [
      { id: 'dest-nim-0', name: "Niamey", subtitle: "Niamey, Níger", code: "NIM", type: "city", label: "Niamey, Níger (NIM)" },
    ],
  },
  {
    keywords: ["republica centro africana", "república centro-africana"],
    cities: [
      { id: 'dest-bgf-0', name: "Bangui", subtitle: "Ombella-M'Poko, Rep. Centro-Africana", code: "BGF", type: "city", label: "Bangui, Rep. Centro-Africana (BGF)" },
    ],
  },
  {
    keywords: ["serra leoa", "sierra leone"],
    cities: [
      { id: 'dest-fna-0', name: "Freetown", subtitle: "Área Ocidental, Serra Leoa", code: "FNA", type: "city", label: "Freetown, Serra Leoa (FNA)" },
    ],
  },
  {
    keywords: ["somalia", "somália"],
    cities: [
      { id: 'dest-mgq-0', name: "Mogadíscio", subtitle: "Banaadir, Somália", code: "MGQ", type: "city", label: "Mogadíscio, Somália (MGQ)" },
    ],
  },
  {
    keywords: ["sudao", "sudão", "sudan"],
    cities: [
      { id: 'dest-krt-0', name: "Cartum", subtitle: "Cartum, Sudão", code: "KRT", type: "city", label: "Cartum, Sudão (KRT)" },
    ],
  },
  {
    keywords: ["sudao do sul", "sudão do sul", "south sudan"],
    cities: [
      { id: 'dest-jub-0', name: "Juba", subtitle: "Equatória Central, Sudão do Sul", code: "JUB", type: "city", label: "Juba, Sudão do Sul (JUB)" },
    ],
  },
  {
    keywords: ["togo"],
    cities: [
      { id: 'dest-lfw-0', name: "Lomé", subtitle: "Marítima, Togo", code: "LFW", type: "city", label: "Lomé, Togo (LFW)" },
    ],
  },
  {
    keywords: ["antigua e barbuda", "antígua e barbuda"],
    cities: [
      { id: 'dest-anu-0', name: "Saint John's", subtitle: "Antígua e Barbuda", code: "ANU", type: "city", label: "Saint John's, Antígua e Barbuda (ANU)" },
    ],
  },
  {
    keywords: ["dominica"],
    cities: [
      { id: 'dest-dom-0', name: "Roseau", subtitle: "Dominica", code: "DOM", type: "city", label: "Roseau, Dominica (DOM)" },
    ],
  },
  {
    keywords: ["granada", "grenada"],
    cities: [
      { id: 'dest-gnd-0', name: "Saint George's", subtitle: "Granada", code: "GND", type: "city", label: "Saint George's, Granada (GND)" },
    ],
  },
  {
    keywords: ["santa lucia", "santa lúcia", "saint lucia"],
    cities: [
      { id: 'dest-uvf-0', name: "Castries", subtitle: "Santa Lúcia", code: "UVF", type: "city", label: "Castries, Santa Lúcia (UVF)" },
    ],
  },
  {
    keywords: ["sao cristovao e nevis", "são cristóvão e neves", "saint kitts and nevis"],
    cities: [
      { id: 'dest-skb-0', name: "Basseterre", subtitle: "São Cristóvão e Neves", code: "SKB", type: "city", label: "Basseterre, São Cristóvão e Neves (SKB)" },
    ],
  },
  {
    keywords: ["sao vicente e granadinas", "são vicente e granadinas"],
    cities: [
      { id: 'dest-svd-0', name: "Kingstown", subtitle: "São Vicente e Granadinas", code: "SVD", type: "city", label: "Kingstown, São Vicente e Granadinas (SVD)" },
    ],
  },
  {
    keywords: ["ilhas marshall", "marshall islands"],
    cities: [
      { id: 'dest-maj-0', name: "Majuro", subtitle: "Ilhas Marshall", code: "MAJ", type: "city", label: "Majuro, Ilhas Marshall (MAJ)" },
    ],
  },
  {
    keywords: ["micronesia", "micronésia"],
    cities: [
      { id: 'dest-pni-0', name: "Pohnpei / Palikir", subtitle: "Micronésia", code: "PNI", type: "city", label: "Pohnpei, Micronésia (PNI)" },
    ],
  },
  {
    keywords: ["palau"],
    cities: [
      { id: 'dest-ror-0', name: "Koror", subtitle: "Palau", code: "ROR", type: "city", label: "Koror, Palau (ROR)" },
    ],
  },
  {
    keywords: ["quiribati", "kiribati"],
    cities: [
      { id: 'dest-trw-0', name: "Tarawa", subtitle: "Quiribati", code: "TRW", type: "city", label: "Tarawa, Quiribati (TRW)" },
    ],
  },
  {
    keywords: ["tonga"],
    cities: [
      { id: 'dest-tbu-0', name: "Nuku'alofa", subtitle: "Tongatapu, Tonga", code: "TBU", type: "city", label: "Nuku'alofa, Tonga (TBU)" },
    ],
  },
  {
    keywords: ["tuvalu"],
    cities: [
      { id: 'dest-fun-0', name: "Funafuti", subtitle: "Tuvalu", code: "FUN", type: "city", label: "Funafuti, Tuvalu (FUN)" },
    ],
  },
  {
    keywords: ["nauru"],
    cities: [
      { id: 'dest-inu-0', name: "Yaren", subtitle: "Nauru", code: "INU", type: "city", label: "Yaren, Nauru (INU)" },
    ],
  },
  {
    keywords: ["ilhas salomao", "ilhas salomão", "solomon islands"],
    cities: [
      { id: 'dest-hir-0', name: "Honiara", subtitle: "Guadalcanal, Ilhas Salomão", code: "HIR", type: "city", label: "Honiara, Ilhas Salomão (HIR)" },
    ],
  },
];

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca inteligente no catálogo curado:
 * - Se o usuário digita nome de país ("Cazaquistão", "Portugal", "EUA", "França", "Filipinas") ou estado ("Bahia", "Ceará", "SP"),
 *   retorna as principais cidades e polos turísticos correspondentes.
 * - Suporta busca por prefixos parciais ("caza", "port", "fran", "bahi", "cear", etc.).
 * - Também busca direto por nome de cidade curada ("Astana", "Orlando", "Salvador", etc.).
 */
export function searchCuratedDestinations(term: string): CuratedCity[] {
  const t = normalizeText(term);
  if (t.length < 2) return [];

  const candidates = new Map<string, { score: number; city: CuratedCity }>();

  for (const group of WORLD_DESTINATIONS_CATALOG) {
    let bestRegionScore = 0;

    for (const kw of group.keywords) {
      const kNorm = normalizeText(kw);
      if (kNorm === t) {
        bestRegionScore = Math.max(bestRegionScore, 100);
      } else if (t.length >= 3 && kNorm.startsWith(t)) {
        // O usuário digitou um prefixo do país/estado (ex: 'caza' -> 'cazaquistao')
        const proximity = Math.max(0, 15 - Math.abs(kNorm.length - t.length));
        bestRegionScore = Math.max(bestRegionScore, 80 + proximity);
      }
    }

    if (bestRegionScore > 0) {
      group.cities.forEach((city, idx) => {
        const key = `${city.name.toLowerCase()}_${city.code.toLowerCase()}`;
        const score = bestRegionScore * 10 - idx;
        const existing = candidates.get(key);
        if (!existing || existing.score < score) {
          candidates.set(key, { score, city });
        }
      });
    }

    // Busca também no nome da cidade
    group.cities.forEach((city, idx) => {
      const cNorm = normalizeText(city.name);
      const key = `${city.name.toLowerCase()}_${city.code.toLowerCase()}`;
      let cityScore = 0;

      if (cNorm === t) {
        cityScore = 98;
      } else if (cNorm.startsWith(t)) {
        const proximity = Math.max(0, 12 - Math.abs(cNorm.length - t.length));
        cityScore = 82 + proximity;
      } else if (t.length >= 3 && cNorm.includes(t)) {
        cityScore = 45;
      }

      if (cityScore > 0) {
        const finalScore = cityScore * 10 - idx;
        const existing = candidates.get(key);
        if (!existing || existing.score < finalScore) {
          candidates.set(key, { score: finalScore, city });
        }
      }
    });
  }

  return Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.city);
}
