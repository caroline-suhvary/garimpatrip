// As 10 macrocategorias do Pacote Oficial (o id é o mesmo gravado em package_items.category_id).
import type { DiscoveryCategory, PackageCategory } from "@/types";

export interface CategoryStyle extends PackageCategory {
  bg: string;
  border: string;
  color: string;
}

export const PACKAGE_CATEGORIES: CategoryStyle[] = [
  {
    id: 1,
    code: "flight",
    title: "Transporte Principal",
    description: "Passagens aéreas, rodoviário e tendências históricas.",
    badge: "Travelpayouts API",
    bg: "var(--cat-flight-bg)",
    border: "var(--cat-flight-border)",
    color: "var(--cat-flight-text)",
  },
  {
    id: 2,
    code: "hotel",
    title: "Hospedagem & Pousadas",
    description: "Diárias com cancelamento grátis e localização estratégica.",
    badge: "Geoapify Places",
    bg: "var(--cat-hotel-bg)",
    border: "var(--cat-hotel-border)",
    color: "var(--cat-hotel-text)",
  },
  {
    id: 3,
    code: "tour",
    title: "Passeios & Atrações",
    description: "Tours guiados, museus e pontos turísticos oficiais.",
    badge: "OpenTripMap",
    bg: "var(--cat-tour-bg)",
    border: "var(--cat-tour-border)",
    color: "var(--cat-tour-text)",
  },
  {
    id: 4,
    code: "transport",
    title: "Deslocamento Local",
    description: "Metrô, transfers, aluguel de carros e distâncias.",
    badge: "Geoapify API",
    bg: "var(--cat-transport-bg)",
    border: "var(--cat-transport-border)",
    color: "var(--cat-transport-text)",
  },
  {
    id: 5,
    code: "doc",
    title: "Documentação & Saúde",
    description: "Passaporte, vacinas obrigatórias e exigências oficiais.",
    badge: "Órgãos Oficiais",
    bg: "var(--cat-doc-bg)",
    border: "var(--cat-doc-border)",
    color: "var(--cat-doc-text)",
  },
  {
    id: 6,
    code: "food",
    title: "Alimentação & Gastos",
    description: "Estimativa média por dia e custos de refeições.",
    badge: "Média Colaborativa",
    bg: "var(--cat-food-bg)",
    border: "var(--cat-food-border)",
    color: "var(--cat-food-text)",
  },
  {
    id: 7,
    code: "money",
    title: "Câmbio & Dinheiro",
    description: "Cotação do dia de dólar, euro e peso argentino.",
    badge: "AwesomeAPI",
    bg: "var(--cat-money-bg)",
    border: "var(--cat-money-border)",
    color: "var(--cat-money-text)",
  },
  {
    id: 8,
    code: "schedule",
    title: "Cronograma Diário",
    description: "Roteiro dia a dia, com plano B para dias de chuva.",
    badge: "Seu Roteiro",
    bg: "var(--cat-schedule-bg)",
    border: "var(--cat-schedule-border)",
    color: "var(--cat-schedule-text)",
  },
  {
    id: 9,
    code: "budget",
    title: "Orçamento Consolidado",
    description: "Estimado x pago, comparado ao seu teto de gastos.",
    badge: "Controle Total",
    bg: "var(--cat-budget-bg)",
    border: "var(--cat-budget-border)",
    color: "var(--cat-budget-text)",
  },
  {
    id: 10,
    code: "checklist",
    title: "Checklist Final",
    description: "Tudo que falta resolver antes de embarcar.",
    badge: "Antes de Ir",
    bg: "var(--cat-checklist-bg)",
    border: "var(--cat-checklist-border)",
    color: "var(--cat-checklist-text)",
  },
];

/** Áreas que guardam itens com custo (8 = cronograma e 9 = orçamento são telas próprias). */
export const ITEM_CATEGORY_IDS = [1, 2, 3, 4, 5, 6, 7, 10];

/** Para qual área do pacote cada tipo de descoberta vai por padrão. */
export const DEFAULT_PACKAGE_CATEGORY: Record<DiscoveryCategory, number> = {
  flight: 1,
  hotel: 2,
  tour: 3,
  transport: 4,
  doc: 5,
  food: 6,
  web_idea: 3,
};

export function categoryById(id: number): CategoryStyle | undefined {
  return PACKAGE_CATEGORIES.find((c) => c.id === id);
}
