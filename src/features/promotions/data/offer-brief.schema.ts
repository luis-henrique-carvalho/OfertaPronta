import { z } from "zod";
import {
  getSegmentPresets,
  type CuratedStylePreset,
} from "./style-presets-catalog";

export {
  getSegmentPresets,
  getPresetById,
  resolveArtDirectionDirective,
  type CuratedStylePreset,
  type LayoutVariant,
  type StyleMockupSpec,
  type ArtDirectionDirective,
} from "./style-presets-catalog";

/**
 * 7 Segmentos Oficiais de Microempresários atendidos pelo OfertaPronta.
 */
export const BUSINESS_SEGMENTS = [
  "fashion",
  "supermarket",
  "beauty-salon",
  "pizzeria",
  "burger-shop",
  "restaurant",
  "local-retail",
] as const;

export type BusinessSegment = (typeof BUSINESS_SEGMENTS)[number];

export const CARD_INTENTS = [
  "promo",
  "new-arrival",
  "special-date",
  "announcement",
  "schedule",
  "custom",
] as const;

export type CardIntent = (typeof CARD_INTENTS)[number];

export const CARD_ASPECT_RATIOS = ["feed", "story"] as const;
export type CardAspectRatio = (typeof CARD_ASPECT_RATIOS)[number];

export type StylePreset = CuratedStylePreset;

export interface SegmentCatalogItem {
  id: BusinessSegment;
  label: string;
  shortDescription: string;
  placeholders: {
    businessName: string;
    offerTitle: string;
    promoPrice: string;
    originalPrice: string;
    callToAction: string;
  };
  exampleOffers: Array<{
    title: string;
    promoPrice: string;
    originalPrice?: string;
    stylePresetId: string;
  }>;
  stylePresets: [
    CuratedStylePreset,
    CuratedStylePreset,
    CuratedStylePreset,
    CuratedStylePreset,
  ];
}

export const SEGMENT_CATALOG: Record<BusinessSegment, SegmentCatalogItem> = {
  fashion: {
    id: "fashion",
    label: "Moda & Roupas",
    shortDescription:
      "Roupas femininas, masculinas, moda íntima, calçados e acessórios.",
    placeholders: {
      businessName: "Boutique Bella Flor",
      offerTitle: "Vestido Midi Canelado Elegance",
      promoPrice: "R$ 89,90",
      originalPrice: "R$ 129,90",
      callToAction: "Garanta o seu look!",
    },
    exampleOffers: [
      {
        title: "Vestido Midi Canelado Elegance",
        promoPrice: "R$ 89,90",
        originalPrice: "R$ 129,90",
        stylePresetId: "fashion-boutique",
      },
      {
        title: "Conjunto Moletom Casual Confort",
        promoPrice: "R$ 119,90",
        originalPrice: "R$ 159,90",
        stylePresetId: "fashion-modern",
      },
    ],
    stylePresets: getSegmentPresets("fashion") as [
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
    ],
  },
  supermarket: {
    id: "supermarket",
    label: "Supermercado & Hortifrúti",
    shortDescription:
      "Ofertas da semana, hortifrúti fresco e encartes de supermercado.",
    placeholders: {
      businessName: "Supermercado Compre Bem",
      offerTitle: "Picanha Bovina Fatiada 1kg",
      promoPrice: "R$ 49,90",
      originalPrice: "R$ 69,90",
      callToAction: "Aproveite hoje mesmo!",
    },
    exampleOffers: [
      {
        title: "Picanha Fatiada Resfriada 1kg",
        promoPrice: "R$ 49,90",
        originalPrice: "R$ 69,90",
        stylePresetId: "market-fresh",
      },
      {
        title: "Dúzia de Ovos Brancos Grandes",
        promoPrice: "R$ 9,99",
        originalPrice: "R$ 14,90",
        stylePresetId: "market-discount",
      },
    ],
    stylePresets: getSegmentPresets("supermarket") as [
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
    ],
  },
  "beauty-salon": {
    id: "beauty-salon",
    label: "Salão de Beleza & Barbearia",
    shortDescription:
      "Cortes, escovas, barboterapia, manicure e tratamentos estéticos.",
    placeholders: {
      businessName: "Espaço Elegance & Barber",
      offerTitle: "Combo Barba Terapia + Corte Degradê",
      promoPrice: "R$ 65,00",
      originalPrice: "R$ 90,00",
      callToAction: "Agende pelo WhatsApp!",
    },
    exampleOffers: [
      {
        title: "Combo Escova Modelada + Hidratação",
        promoPrice: "R$ 79,90",
        originalPrice: "R$ 120,00",
        stylePresetId: "salon-glamour",
      },
      {
        title: "Corte Degradê Navalhado + Barba",
        promoPrice: "R$ 60,00",
        originalPrice: "R$ 85,00",
        stylePresetId: "barber-vintage",
      },
    ],
    stylePresets: getSegmentPresets("beauty-salon") as [
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
    ],
  },
  pizzeria: {
    id: "pizzeria",
    label: "Pizzaria",
    shortDescription:
      "Pizzas artesanais, fornos a lenha, combos com refrigerante e bordas recheadas.",
    placeholders: {
      businessName: "Pizzaria Bella Forneria",
      offerTitle: "Pizza Grande Calabresa + Borda Catupiry",
      promoPrice: "R$ 44,90",
      originalPrice: "R$ 58,00",
      callToAction: "Peça no Delivery agora!",
    },
    exampleOffers: [
      {
        title: "Pizza Grande Calabresa Especial",
        promoPrice: "R$ 39,90",
        originalPrice: "R$ 52,00",
        stylePresetId: "pizza-rustic-wood",
      },
      {
        title: "Combo 2 Pizzas Grandes + Refri 2L",
        promoPrice: "R$ 79,90",
        originalPrice: "R$ 99,00",
        stylePresetId: "pizza-artisan-craft",
      },
    ],
    stylePresets: getSegmentPresets("pizzeria") as [
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
    ],
  },
  "burger-shop": {
    id: "burger-shop",
    label: "Hamburgueria",
    shortDescription:
      "Burgers smash, artesanais, bacon crocante, batata frita e molhos especiais.",
    placeholders: {
      businessName: "Monster Smash Burger",
      offerTitle: "Duplo Cheddar Bacon + Batata Frita",
      promoPrice: "R$ 34,90",
      originalPrice: "R$ 44,90",
      callToAction: "Peça antes que acabe!",
    },
    exampleOffers: [
      {
        title: "Duplo Smash Burger + Queijo Cheddar",
        promoPrice: "R$ 29,90",
        originalPrice: "R$ 38,00",
        stylePresetId: "burger-dark-bold",
      },
      {
        title: "Combo Monster: Burger + Batata + Refri",
        promoPrice: "R$ 42,90",
        originalPrice: "R$ 54,00",
        stylePresetId: "burger-smash-fire",
      },
    ],
    stylePresets: getSegmentPresets("burger-shop") as [
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
    ],
  },
  restaurant: {
    id: "restaurant",
    label: "Restaurante & Marmitaria",
    shortDescription:
      "Pratos executivos, comida caseira, self-service, buffets e almoço diário.",
    placeholders: {
      businessName: "Restaurante Sabor & Prosa",
      offerTitle: "Prato Feito Executivo: Filé de Frango Grelhado",
      promoPrice: "R$ 22,90",
      originalPrice: "R$ 28,00",
      callToAction: "Almoce bem hoje!",
    },
    exampleOffers: [
      {
        title: "Marmitex Especial Carne de Panela",
        promoPrice: "R$ 24,90",
        originalPrice: "R$ 30,00",
        stylePresetId: "restaurant-homestyle",
      },
      {
        title: "Buffet Livre de Almoço de Domingo",
        promoPrice: "R$ 49,90",
        originalPrice: "R$ 59,90",
        stylePresetId: "restaurant-gourmet",
      },
    ],
    stylePresets: getSegmentPresets("restaurant") as [
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
    ],
  },
  "local-retail": {
    id: "local-retail",
    label: "Comércio & Serviços Locais",
    shortDescription:
      "Moda, óticas, eletrônicos, pet shops, oficinas e lojas de bairro.",
    placeholders: {
      businessName: "Ótica Visão Perfeita",
      offerTitle: "Armação de Grau Completa com Lentes Antirreflexo",
      promoPrice: "R$ 199,00",
      originalPrice: "R$ 299,00",
      callToAction: "Visite nossa loja!",
    },
    exampleOffers: [
      {
        title: "Troca de Óleo + Filtro + Checkup 10 Itens",
        promoPrice: "R$ 149,90",
        originalPrice: "R$ 199,00",
        stylePresetId: "retail-dynamic",
      },
      {
        title: "Banho & Tosa Completa Pet Porte Médio",
        promoPrice: "R$ 69,90",
        originalPrice: "R$ 90,00",
        stylePresetId: "retail-vibrant",
      },
    ],
    stylePresets: getSegmentPresets("local-retail") as [
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
      CuratedStylePreset,
    ],
  },
};

/**
 * Limite de 4MB de imagem em bytes para envio à IA.
 * Em base64, 4MB * 1.37 = ~5.746.000 caracteres.
 */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES * 1.37) + 100;

export const imageDataUrlSchema = z
  .string()
  .max(MAX_BASE64_LENGTH, "A imagem não pode ultrapassar 4MB")
  .regex(
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/,
    "A imagem deve estar no formato Data URL JPEG, PNG ou WebP válido",
  );

export type VisualInputMode =
  | "product_and_reference"
  | "product_only"
  | "reference_only"
  | "preset_only"
  | "free_style";

export function deriveVisualInputMode(input: {
  hasProductImage: boolean;
  hasReferenceImage: boolean;
  hasStylePreset: boolean;
}): VisualInputMode {
  if (input.hasProductImage && input.hasReferenceImage) {
    return "product_and_reference";
  }
  if (input.hasProductImage) {
    return "product_only";
  }
  if (input.hasReferenceImage) {
    return "reference_only";
  }
  if (input.hasStylePreset) {
    return "preset_only";
  }
  return "free_style";
}

/**
 * Validação rigorosa do briefing para geração com verificação condicional de preço.
 */
export const offerBriefSchema = z
  .object({
    businessSegment: z.enum(BUSINESS_SEGMENTS),
    targetAspectRatio: z.enum(CARD_ASPECT_RATIOS).default("feed"),
    cardIntent: z.enum(CARD_INTENTS).default("promo"),
    customIntentText: z.string().trim().optional(),
    businessName: z
      .string()
      .trim()
      .min(1, "Nome do estabelecimento é obrigatório"),
    offerTitle: z
      .string()
      .trim()
      .min(1, "Título ou mensagem da oferta é obrigatório"),
    promoPrice: z.string().trim().optional(),
    originalPrice: z.string().trim().optional(),
    callToAction: z.string().trim().optional(),
    whatsapp: z.string().trim().optional(),
    productImageDataUrl: imageDataUrlSchema.optional(),
    referenceImageDataUrl: imageDataUrlSchema.optional(),
    logoImageDataUrl: imageDataUrlSchema.optional(),
    stylePresetId: z.string().trim().optional(),
    customStyleInstructions: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    // 1. Preço obrigatório exclusivamente se intent === "promo"
    if (
      data.cardIntent === "promo" &&
      (!data.promoPrice || data.promoPrice.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["promoPrice"],
        message: "Preço promocional é obrigatório para anúncios de promoção",
      });
    }

    // 2. Se intent === "custom", texto do objetivo personalizado é obrigatório
    if (
      data.cardIntent === "custom" &&
      (!data.customIntentText || data.customIntentText.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customIntentText"],
        message: "Descreva o tipo de card que você deseja criar",
      });
    }
  });

export type OfferBrief = z.infer<typeof offerBriefSchema>;

/**
 * Schema flexível para salvar drafts em qualquer estágio (incluindo drafts parciais).
 */
export const saveOfferDraftSchema = z.object({
  id: z.string().optional(),
  businessSegment: z.enum(BUSINESS_SEGMENTS).default("fashion"),
  targetAspectRatio: z.enum(CARD_ASPECT_RATIOS).default("feed"),
  businessName: z.string().default(""),
  offerTitle: z.string().default(""),
  promoPrice: z.string().default(""),
  originalPrice: z.string().optional().nullable(),
  callToAction: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  productImageDataUrl: imageDataUrlSchema.optional().nullable(),
  referenceImageDataUrl: imageDataUrlSchema.optional().nullable(),
  stylePresetId: z.string().optional().nullable(),
  customStyleInstructions: z.string().optional().nullable(),
  cleanMasterImageDataUrl: z.string().optional().nullable(),
  previewCardImageUrl: z.string().optional().nullable(),

  // Novos campos do Épico 6
  cardIntent: z.enum(CARD_INTENTS).default("promo"),
  customIntentText: z.string().optional().nullable(),
  logoImageDataUrl: imageDataUrlSchema.optional().nullable(),
});

export type SaveOfferDraftInput = z.input<typeof saveOfferDraftSchema>;
export type SavedOfferDraft = z.infer<typeof saveOfferDraftSchema>;

export const generatePreviewInputSchema = z.object({
  draftId: z.string().trim().min(1, "draftId é obrigatório"),
});

export type GeneratePreviewInput = z.infer<typeof generatePreviewInputSchema>;
