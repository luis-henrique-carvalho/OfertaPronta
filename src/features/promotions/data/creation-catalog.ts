import type { LucideIcon } from "lucide-react";
import {
  Tag,
  Sparkles,
  Calendar,
  Megaphone,
  Clock,
  PenLine,
} from "lucide-react";
import type { BusinessSegment, CardIntent } from "./offer-brief.schema";
import {
  getSegmentPresets,
  mapPresetToStyleVisualOption,
  SegmentRegistry,
  LEGACY_PRESET_ID_ALIASES,
  type LayoutType,
  type StyleVisualOption,
} from "./style-presets-catalog";

export type { LayoutType, StyleVisualOption };

export interface IntentExample {
  title: string;
  price?: string;
}

export type IntentExamplesMap = Record<CardIntent, IntentExample[]>;

export interface CreationPlaceholders {
  businessName: string;
  offerTitle: string;
  promoPrice: string;
}

export interface CreationCatalogItem {
  id: BusinessSegment;
  label: string;
  icon: LucideIcon;
  iconName: string;
  placeholders: CreationPlaceholders;
  defaultPlaceholders: CreationPlaceholders;
  intentExamples: IntentExamplesMap;
  styles: StyleVisualOption[];
}

export interface CreationCardIntentItem {
  id: CardIntent;
  label: string;
  icon: LucideIcon;
  iconName: string;
  description: string;
  hasPriceByDefault: boolean;
  offerPlaceholder: string;
}

export const CREATION_CARD_INTENTS: CreationCardIntentItem[] = [
  {
    id: "promo",
    label: "Promoção / Preço",
    icon: Tag,
    iconName: "Tag",
    description: "Destaque de produto com preço ou desconto",
    hasPriceByDefault: true,
    offerPlaceholder: "Ex: Vestido Longo Floral ou Picanha 1kg",
  },
  {
    id: "new-arrival",
    label: "Novidade / Coleção",
    icon: Sparkles,
    iconName: "Sparkles",
    description: "Chegada de mercadoria, coleção ou prato novo",
    hasPriceByDefault: false,
    offerPlaceholder: "Ex: Nova Coleção Primavera/Verão chegou!",
  },
  {
    id: "special-date",
    label: "Data Comemorativa",
    icon: Calendar,
    iconName: "Calendar",
    description: "Dia dos Pais, Mães, Natal, Aniversário",
    hasPriceByDefault: false,
    offerPlaceholder: "Ex: Especial Dia dos Pais com presentes únicos",
  },
  {
    id: "announcement",
    label: "Inauguração / Evento",
    icon: Megaphone,
    iconName: "Megaphone",
    description: "Inauguração, reinauguração ou evento especial",
    hasPriceByDefault: false,
    offerPlaceholder: "Ex: Grande Inauguração neste Sábado às 9h!",
  },
  {
    id: "schedule",
    label: "Horário / Aviso",
    icon: Clock,
    iconName: "Clock",
    description: "Horário de feriado, mudança de endereço ou recado",
    hasPriceByDefault: false,
    offerPlaceholder: "Ex: Neste feriado abriremos das 8h às 14h",
  },
  {
    id: "custom",
    label: "Outro (Digitar)",
    icon: PenLine,
    iconName: "PenLine",
    description: "Digite livremente o tipo de card que você quer",
    hasPriceByDefault: false,
    offerPlaceholder: "Ex: Descreva a mensagem principal do seu card",
  },
];

export interface QuickBrandPalette {
  name: string;
  label: string;
  primary: string;
  secondary: string;
  value: string;
  swatches: [string, string];
}

export const QUICK_BRAND_PALETTES: QuickBrandPalette[] = [
  {
    name: "red-yellow",
    label: "Vermelho & Amarelo",
    primary: "#DC2626",
    secondary: "#FACC15",
    value: "Paleta Vermelho e Amarelo",
    swatches: ["#DC2626", "#FACC15"],
  },
  {
    name: "blue-white",
    label: "Azul & Branco",
    primary: "#1D4ED8",
    secondary: "#F8FAFC",
    value: "Paleta Azul Marinho e Branco",
    swatches: ["#1D4ED8", "#F8FAFC"],
  },
  {
    name: "black-gold",
    label: "Preto & Dourado",
    primary: "#09090B",
    secondary: "#F59E0B",
    value: "Paleta Preto e Dourado",
    swatches: ["#09090B", "#F59E0B"],
  },
  {
    name: "green-cream",
    label: "Verde & Creme",
    primary: "#059669",
    secondary: "#FEF3C7",
    value: "Paleta Verde e Creme",
    swatches: ["#059669", "#FEF3C7"],
  },
  {
    name: "pink-light",
    label: "Rosa & Claro",
    primary: "#E11D48",
    secondary: "#FFF1F2",
    value: "Paleta Rosa Suave e Fundo Claro",
    swatches: ["#E11D48", "#FFF1F2"],
  },
  {
    name: "orange-dark",
    label: "Laranja & Escuro",
    primary: "#EA580C",
    secondary: "#18181B",
    value: "Paleta Laranja Vibrante e Escuro",
    swatches: ["#EA580C", "#18181B"],
  },
];

function buildCreationCatalogItem(
  segmentId: BusinessSegment,
): CreationCatalogItem {
  const segment = SegmentRegistry.getSegment(segmentId);
  return {
    id: segment.id,
    label: segment.label,
    icon: segment.icon,
    iconName: segment.iconName,
    placeholders: {
      businessName: segment.placeholders.businessName,
      offerTitle: segment.placeholders.offerTitle,
      promoPrice: segment.placeholders.promoPrice,
    },
    defaultPlaceholders: {
      businessName: segment.placeholders.businessName,
      offerTitle: segment.placeholders.offerTitle,
      promoPrice: segment.placeholders.promoPrice,
    },
    intentExamples: segment.intentExamples,
    styles: getSegmentPresets(segmentId).map(mapPresetToStyleVisualOption),
  };
}

export const CREATION_CATALOG: Record<BusinessSegment, CreationCatalogItem> = {
  fashion: buildCreationCatalogItem("fashion"),
  supermarket: buildCreationCatalogItem("supermarket"),
  pizzeria: buildCreationCatalogItem("pizzeria"),
  "burger-shop": buildCreationCatalogItem("burger-shop"),
  "beauty-salon": buildCreationCatalogItem("beauty-salon"),
  restaurant: buildCreationCatalogItem("restaurant"),
  "local-retail": buildCreationCatalogItem("local-retail"),
};

/**
 * Retorna os metadados completos de um segmento comercial.
 */
export function getCreationSegment(
  segmentId: BusinessSegment,
): CreationCatalogItem {
  const item = CREATION_CATALOG[segmentId];
  if (!item) {
    return CREATION_CATALOG.fashion;
  }
  return item;
}

/**
 * Retorna lista de todos os 7 segmentos comerciais na ordem canônica.
 */
export function getAllCreationSegments(): CreationCatalogItem[] {
  return [
    CREATION_CATALOG.fashion,
    CREATION_CATALOG.supermarket,
    CREATION_CATALOG.pizzeria,
    CREATION_CATALOG["burger-shop"],
    CREATION_CATALOG["beauty-salon"],
    CREATION_CATALOG.restaurant,
    CREATION_CATALOG["local-retail"],
  ];
}

/**
 * Retorna os estilos visuais de um segmento comercial específico.
 */
export function getSegmentStyles(
  segmentId: BusinessSegment,
): StyleVisualOption[] {
  const segment = getCreationSegment(segmentId);
  return segment.styles;
}

/**
 * Busca um estilo específico pelo seu ID em todo o catálogo, suportando aliases legados.
 */
export function getCreationStyleById(
  styleId: string,
): StyleVisualOption | undefined {
  if (!styleId) return undefined;
  const trimmed = styleId.trim();
  if (!trimmed) return undefined;

  const resolvedId = LEGACY_PRESET_ID_ALIASES[trimmed] ?? trimmed;

  for (const segment of Object.values(CREATION_CATALOG)) {
    const found = segment.styles.find((s) => s.id === resolvedId);
    if (found) {
      return found;
    }
  }
  return undefined;
}
