export interface AffiliatePartner {
  id: string;
  name: string;
  category: 'tickets' | 'tours' | 'connectivity' | 'transfers' | 'flights' | 'luggage';
  badge: string;
  description: string;
  fallbackUrl: string;
}

// Parceiros confirmados na sua aba Available do Travelpayouts
export const AVAILABLE_PARTNERS: Record<string, AffiliatePartner> = {
  tiqets: {
    id: 'tiqets',
    name: 'Tiqets',
    category: 'tickets',
    badge: 'Ingressos Oficiais',
    description: 'Compre ingressos para museus, mirantes e monumentos sem filas.',
    fallbackUrl: 'https://www.tiqets.com/?partner=596330',
  },
  klook: {
    id: 'klook',
    name: 'Klook',
    category: 'tours',
    badge: 'Passeios & Experiencias',
    description: 'Passeios guiados, day trips e atracoes com confirmacao imediata.',
    fallbackUrl: 'https://www.klook.com/?aff_id=596330',
  },
  gocity: {
    id: 'gocity',
    name: 'Go City',
    category: 'tickets',
    badge: 'Passe Turistico Tudo-em-1',
    description: 'Pague um valor unico e visite dezenas de atracoes da cidade.',
    fallbackUrl: 'https://gocity.com/?partner=596330',
  },
  airalo: {
    id: 'airalo',
    name: 'Airalo',
    category: 'connectivity',
    badge: 'eSIM Internet Internacional',
    description: 'Internet 4G/5G sem trocar o chip fisico. Ativacao no celular.',
    fallbackUrl: 'https://www.airalo.com/?ref=596330',
  },
  yesim: {
    id: 'yesim',
    name: 'Yesim',
    category: 'connectivity',
    badge: 'eSIM Conectividade',
    description: 'Internet global rapida e flexivel para viagens.',
    fallbackUrl: 'https://yesim.app/?partner=596330',
  },
  kiwitaxi: {
    id: 'kiwitaxi',
    name: 'Kiwitaxi',
    category: 'transfers',
    badge: 'Transfer Aeroporto',
    description: 'Motorista esperando no desembarque com preco fechado.',
    fallbackUrl: 'https://kiwitaxi.com/?partner=596330',
  },
  radicalstorage: {
    id: 'radicalstorage',
    name: 'Radical Storage',
    category: 'luggage',
    badge: 'Guarda-Volumes',
    description: 'Deixe as malas com seguranca perto da estacao ou hotel.',
    fallbackUrl: 'https://radicalstorage.com/?partner=596330',
  },
  airhelp: {
    id: 'airhelp',
    name: 'AirHelp',
    category: 'flights',
    badge: 'Compensacao de Voos',
    description: 'Voo cancelado ou atrasado? Verifique direito a indenizacao.',
    fallbackUrl: 'https://www.airhelp.com/?partner=596330',
  },
};
