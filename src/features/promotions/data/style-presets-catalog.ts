import type { BusinessSegment, CardIntent } from "./offer-brief.schema";
import {
  SegmentRegistry,
  LEGACY_PRESET_ID_ALIASES,
  type LayoutVariant,
  type LayoutType,
  type StyleMockupSpec,
  type ArtDirectionDirective,
  type CommercialGuide,
  type CuratedStylePreset,
} from "./segments";

export {
  SegmentRegistry,
  LEGACY_PRESET_ID_ALIASES,
  type LayoutVariant,
  type LayoutType,
  type StyleMockupSpec,
  type ArtDirectionDirective,
  type CommercialGuide,
  type CuratedStylePreset,
};

export interface StyleVisualOption {
  id: string;
  name: string;
  tag: string;
  color: string;
  bgPreview: string;
  badgeBg: string;
  badgeText: string;
  textColor: string;
  paletteSwatches: [string, string, string];
  layoutType: LayoutType;
}

export interface LayoutVariantBlueprint {
  layoutVariant: LayoutVariant;
  layoutType: LayoutType;
  spatialGrid: string;
  descriptiveTypography: string;
  priceBadgeStyle: string;
  cameraAndLightingSetup: string;
  defaultTailwindPreview: {
    color: string;
    bgPreview: string;
    badgeBg: string;
    textColor: string;
  };
}

export const LAYOUT_VARIANT_BLUEPRINTS: Record<
  LayoutVariant,
  LayoutVariantBlueprint
> = {
  "retail-burst": {
    layoutVariant: "retail-burst",
    layoutType: "bold-offer",
    spatialGrid:
      "Cabeçalho vibrante em faixa superior; produto hero ocupando 55% centrais em primeiro plano; selo explosivo de oferta ancorado no quadrante inferior direito; barra sólida de rodapé para contato.",
    descriptiveTypography:
      "Sans-serif geométrica condensada ultra-bold (peso Black/900) em caixa alta com contorno nítido de alto contraste.",
    priceBadgeStyle:
      "Selo estrelado ou circular de alto impacto promocional com borda dupla vibrante na cor de acento.",
    cameraAndLightingSetup:
      "Lente comercial 50mm f/4, ângulo frontal levemente elevado (15°), iluminação de estúdio three-point softbox brilhante e uniforme, sombras de contato nítidas.",
    defaultTailwindPreview: {
      color: "from-red-600 to-orange-600",
      bgPreview: "bg-gradient-to-b from-red-600 to-orange-700",
      badgeBg: "bg-yellow-400 text-red-950",
      textColor: "text-white",
    },
  },
  "fresh-organic": {
    layoutVariant: "fresh-organic",
    layoutType: "vibrant-pop",
    spatialGrid:
      "Composição orgânica arejada com moldura suave; produto central banhado por luz matinal ocupando 50% da área; pill badge arredondado fluindo junto à base do produto.",
    descriptiveTypography:
      "Sans-serif humanista arredondada de peso bold combinada com subtítulo orgânico leve e altamente legível.",
    priceBadgeStyle:
      "Cápsula (pill badge) de cantos totalmente arredondados com acabamento fosco natural e tipografia limpa.",
    cameraAndLightingSetup:
      "Lente macro 85mm f/2.8, ângulo de 30° tabletop, luz solar matinal difusa lateral com bokeh suave de fundo e gotículas de frescor realistas.",
    defaultTailwindPreview: {
      color: "from-emerald-600 to-teal-700",
      bgPreview: "bg-gradient-to-b from-emerald-700 to-teal-900",
      badgeBg: "bg-lime-300 text-emerald-950",
      textColor: "text-white",
    },
  },
  "dark-luxury": {
    layoutVariant: "dark-luxury",
    layoutType: "dark-premium",
    spatialGrid:
      "Composição editorial escura com amplo respiro negativo (30% livre); moldura fina metálica interna; sujeito central iluminado por luz de recorte; tipografia alinhada ao eixo central.",
    descriptiveTypography:
      "Serifada editorial de alto contraste (estilo Didone/Bodoni) para títulos combinada com sans-serif geométrica fina espaçada (tracking amplo).",
    priceBadgeStyle:
      "Bloco retangular minimalista de luxo com filete metálico/dourado na cor de acento, sem poluição visual.",
    cameraAndLightingSetup:
      "Lente prime 85mm f/1.8 de estúdio, ângulo eye-level imponente, iluminação chiaroscuro (low-key) de 3 pontos com rim light dourada destacando contornos e texturas.",
    defaultTailwindPreview: {
      color: "from-zinc-900 to-stone-950",
      bgPreview: "bg-zinc-950",
      badgeBg: "bg-amber-500 text-black",
      textColor: "text-white",
    },
  },
  "rustic-wood": {
    layoutVariant: "rustic-wood",
    layoutType: "dark-premium",
    spatialGrid:
      "Cenário gastronômico/artesanal em superfície de madeira nobre ou pedra ardósia; faixa superior rústica para marca; produto fumegante no centro; selo tipo carimbo artesanal.",
    descriptiveTypography:
      "Slab-serif robusta de inspiração artesanal combinada com numerais bold de presença calorosa.",
    priceBadgeStyle:
      "Selo circular tipo carimbo artesanal ou etiqueta rústica preenchida na cor de acento com alto contraste.",
    cameraAndLightingSetup:
      "Lente macro gastronômica 85mm f/2.8 em ângulo elevado de 45° (tabletop), luz lateral quente (3200K) realçando brilho, suculência, vapor natural e sombras de contato suaves.",
    defaultTailwindPreview: {
      color: "from-stone-900 to-amber-950",
      bgPreview: "bg-gradient-to-b from-amber-900 to-stone-950",
      badgeBg: "bg-amber-400 text-stone-950",
      textColor: "text-white",
    },
  },
  "clean-minimal": {
    layoutVariant: "clean-minimal",
    layoutType: "clean-frame",
    spatialGrid:
      "Estética lookbook/revista com amplo espaço negativo (35% livre) e grade suíça; enquadramento limpo e simétrico; tipografia editorial equilibrada no topo e base.",
    descriptiveTypography:
      "Sans-serif grotesca moderna (peso médio no título, peso black nos numerais) com kerning equilibrado e leitura cristalina.",
    priceBadgeStyle:
      "Tag geométrica retangular limpa e discreta ancorada com elegância na lateral inferior do produto.",
    cameraAndLightingSetup:
      "Lente editorial 50mm f/2.8, ângulo frontal neutro, luz difusa suave de janela de estúdio (softbox amplo) sem sombras duras sobre superfície fosca.",
    defaultTailwindPreview: {
      color: "from-stone-200 to-rose-100",
      bgPreview: "bg-stone-100",
      badgeBg: "bg-rose-700 text-white",
      textColor: "text-stone-900",
    },
  },
  "neon-urban": {
    layoutVariant: "neon-urban",
    layoutType: "vibrant-pop",
    spatialGrid:
      "Atmosfera noturna urbana dinâmica; contrastes de luz neon nas bordas do sujeito central; cabeçalho angular moderno; badge geométrico vibrante para ação rápida.",
    descriptiveTypography:
      "Display sans-serif condensada de corte esportivo/urbano em caixa alta com forte impacto visual.",
    priceBadgeStyle:
      "Placa geométrica angular com brilho externo sutil (glow) na cor de acento e texto de contraste máximo.",
    cameraAndLightingSetup:
      "Lente 35mm f/2.0 close-up dinâmico, iluminação cruzada de estúdio com key light nítida e rim light colorida neon recortando a silhueta do sujeito.",
    defaultTailwindPreview: {
      color: "from-purple-700 to-indigo-950",
      bgPreview: "bg-gradient-to-br from-purple-800 to-slate-950",
      badgeBg: "bg-amber-400 text-slate-950",
      textColor: "text-white",
    },
  },
};

interface PresetVisualOverride {
  name?: string;
  tag?: string;
  color: string;
  bgPreview: string;
  badgeBg: string;
  textColor: string;
}

const PRESET_VISUAL_OVERRIDES: Record<string, PresetVisualOverride> = {
  // Fashion
  "fashion-boutique": {
    name: "Vitrine Elegante",
    tag: "Bege & Vinho",
    color: "from-stone-200 to-rose-100",
    bgPreview: "bg-stone-100",
    badgeBg: "bg-rose-700 text-white",
    textColor: "text-stone-900",
  },
  "fashion-modern": {
    name: "Luxo Escuro",
    tag: "Preto & Dourado",
    color: "from-zinc-900 to-stone-950",
    bgPreview: "bg-zinc-950",
    badgeBg: "bg-amber-500 text-black",
    textColor: "text-white",
  },
  "fashion-vibrant": {
    name: "Moda Casual & Urbana",
    tag: "Pink & Amarelo",
    color: "from-pink-600 to-amber-500",
    bgPreview: "bg-gradient-to-br from-pink-600 to-rose-700",
    badgeBg: "bg-yellow-300 text-pink-950",
    textColor: "text-white",
  },
  "fashion-bazaar": {
    name: "Liquidação & Bazar Fashion",
    tag: "Vermelho & Ouro",
    color: "from-red-600 to-amber-500",
    bgPreview: "bg-gradient-to-b from-red-600 to-amber-600",
    badgeBg: "bg-amber-300 text-red-950",
    textColor: "text-white",
  },

  // Supermarket
  "market-discount": {
    name: "Super Desconto Amarelo",
    tag: "Amarelo & Vermelho",
    color: "from-yellow-400 to-red-600",
    bgPreview: "bg-gradient-to-b from-red-600 to-red-800",
    badgeBg: "bg-yellow-400 text-red-950",
    textColor: "text-white",
  },
  "market-fresh": {
    name: "Hortifrúti Natural",
    tag: "Verde Natural",
    color: "from-emerald-500 to-green-700",
    bgPreview: "bg-gradient-to-b from-emerald-600 to-green-900",
    badgeBg: "bg-emerald-400 text-emerald-950",
    textColor: "text-white",
  },
  "market-premium": {
    name: "Açougue & Empório Premium",
    tag: "Preto & Dourado",
    color: "from-zinc-900 to-stone-950",
    bgPreview: "bg-zinc-950",
    badgeBg: "bg-amber-500 text-black",
    textColor: "text-white",
  },
  "market-daily": {
    name: "Feirão & Sacolão Popular",
    tag: "Laranja Solar",
    color: "from-orange-500 to-amber-600",
    bgPreview: "bg-gradient-to-b from-orange-600 to-amber-700",
    badgeBg: "bg-amber-300 text-orange-950",
    textColor: "text-white",
  },

  // Beauty Salon
  "salon-glamour": {
    name: "Glamour Rose Gold",
    tag: "Rosa & Dourado",
    color: "from-rose-400 to-pink-600",
    bgPreview: "bg-gradient-to-b from-rose-500 to-pink-700",
    badgeBg: "bg-rose-200 text-rose-950",
    textColor: "text-white",
  },
  "barber-vintage": {
    name: "Barbearia Retrô Couro",
    tag: "Marrom & Dourado",
    color: "from-amber-800 to-stone-900",
    bgPreview: "bg-stone-900",
    badgeBg: "bg-amber-500 text-stone-950",
    textColor: "text-white",
  },
  "beauty-clean": {
    name: "Clínica & Spa Sereno",
    tag: "Azul Claro & Branco",
    color: "from-sky-300 to-indigo-400",
    bgPreview: "bg-gradient-to-b from-sky-400 to-indigo-600",
    badgeBg: "bg-sky-100 text-sky-950",
    textColor: "text-white",
  },
  "barber-modern": {
    name: "Degradê Urbano Neon",
    tag: "Azul Marinho & Roxo",
    color: "from-indigo-600 to-purple-800",
    bgPreview: "bg-gradient-to-br from-indigo-800 to-purple-950",
    badgeBg: "bg-purple-300 text-indigo-950",
    textColor: "text-white",
  },

  // Pizzeria
  "pizza-rustic-wood": {
    name: "Forno a Lenha Rústico",
    tag: "Madeira & Fogo",
    color: "from-amber-900 to-stone-950",
    bgPreview: "bg-stone-950",
    badgeBg: "bg-amber-500 text-stone-950",
    textColor: "text-white",
  },
  "pizza-artisan-craft": {
    name: "Cantina Tradicional Italiana",
    tag: "Verde, Vermelho & Branco",
    color: "from-red-600 to-emerald-700",
    bgPreview: "bg-gradient-to-b from-red-700 to-emerald-900",
    badgeBg: "bg-yellow-300 text-red-950",
    textColor: "text-white",
  },
  "pizza-neon-night": {
    name: "Pizzaria Noturna Neon",
    tag: "Preto & Laranja",
    color: "from-zinc-900 to-orange-950",
    bgPreview: "bg-zinc-950",
    badgeBg: "bg-orange-500 text-white",
    textColor: "text-white",
  },
  "pizza-promo-combo": {
    name: "Combo Promocional Família",
    tag: "Laranja & Amarelo",
    color: "from-orange-500 to-yellow-500",
    bgPreview: "bg-gradient-to-b from-orange-600 to-yellow-600",
    badgeBg: "bg-yellow-300 text-orange-950",
    textColor: "text-white",
  },

  // Burger Shop
  "burger-dark-bold": {
    name: "Dark Burger & Fumaça",
    tag: "Preto Fosco & Dourado",
    color: "from-zinc-900 to-black",
    bgPreview: "bg-zinc-950",
    badgeBg: "bg-amber-500 text-black",
    textColor: "text-white",
  },
  "burger-smash-fire": {
    name: "Smash na Chapa & Chamas",
    tag: "Laranja Fogo & Vermelho",
    color: "from-orange-600 to-red-700",
    bgPreview: "bg-gradient-to-b from-orange-700 to-red-900",
    badgeBg: "bg-yellow-300 text-orange-950",
    textColor: "text-white",
  },
  "burger-urban-pop": {
    name: "Hamburgueria Pop Urbana",
    tag: "Amarelo Mostarda & Preto",
    color: "from-yellow-400 to-amber-600",
    bgPreview: "bg-gradient-to-b from-amber-500 to-zinc-900",
    badgeBg: "bg-yellow-300 text-stone-950",
    textColor: "text-white",
  },
  "burger-artisan-wood": {
    name: "Steakhouse & Tábua de Madeira",
    tag: "Madeira Nobre & Carvão",
    color: "from-amber-950 to-stone-950",
    bgPreview: "bg-stone-950",
    badgeBg: "bg-emerald-500 text-white",
    textColor: "text-white",
  },

  // Restaurant
  "restaurant-homestyle": {
    name: "Comidinha Caseira & Aconchego",
    tag: "Terracota & Madeira",
    color: "from-amber-700 to-orange-900",
    bgPreview: "bg-gradient-to-b from-amber-800 to-stone-900",
    badgeBg: "bg-amber-300 text-stone-950",
    textColor: "text-white",
  },
  "restaurant-buffet": {
    name: "Buffet Livre & Variedade",
    tag: "Verde Frescor & Laranja",
    color: "from-emerald-600 to-teal-800",
    bgPreview: "bg-gradient-to-b from-emerald-700 to-teal-950",
    badgeBg: "bg-lime-300 text-emerald-950",
    textColor: "text-white",
  },
  "restaurant-gourmet": {
    name: "Menu Executivo & Bistrô",
    tag: "Ardósia & Vinho",
    color: "from-slate-800 to-rose-950",
    bgPreview: "bg-slate-950",
    badgeBg: "bg-rose-400 text-slate-950",
    textColor: "text-white",
  },
  "restaurant-delivery": {
    name: "Marmitex Express & Delivery",
    tag: "Laranja & Verde",
    color: "from-orange-500 to-amber-600",
    bgPreview: "bg-gradient-to-b from-orange-600 to-amber-700",
    badgeBg: "bg-amber-300 text-orange-950",
    textColor: "text-white",
  },

  // Local Retail
  "retail-vibrant": {
    name: "Varejo Dinâmico & Amigável",
    tag: "Azul Royal & Amarelo",
    color: "from-blue-600 to-indigo-700",
    bgPreview: "bg-gradient-to-b from-blue-700 to-indigo-900",
    badgeBg: "bg-yellow-400 text-blue-950",
    textColor: "text-white",
  },
  "retail-dynamic": {
    name: "Liquidação & Black Week",
    tag: "Amarelo Alerta & Preto",
    color: "from-amber-500 to-yellow-600",
    bgPreview: "bg-gradient-to-b from-amber-600 to-stone-950",
    badgeBg: "bg-yellow-400 text-black",
    textColor: "text-white",
  },
  "retail-clean-modern": {
    name: "Moderno & Tecnológico",
    tag: "Ciano & Grafite",
    color: "from-sky-500 to-slate-700",
    bgPreview: "bg-gradient-to-b from-sky-600 to-slate-900",
    badgeBg: "bg-sky-400 text-slate-950",
    textColor: "text-white",
  },
  "retail-service-pro": {
    name: "Serviço Profissional & Confiança",
    tag: "Azul Marinho & Dourado",
    color: "from-blue-800 to-slate-900",
    bgPreview: "bg-blue-950",
    badgeBg: "bg-amber-400 text-blue-950",
    textColor: "text-white",
  },
};

/**
 * Converte um CuratedStylePreset canônico em StyleVisualOption para a interface e wizard.
 */
export function mapPresetToStyleVisualOption(
  preset: CuratedStylePreset,
): StyleVisualOption {
  const blueprint = LAYOUT_VARIANT_BLUEPRINTS[preset.mockup.layoutVariant];
  const override = PRESET_VISUAL_OVERRIDES[preset.id];

  return {
    id: preset.id,
    name: override?.name ?? preset.label,
    tag: override?.tag ?? preset.tags[0] ?? "Destaque",
    color: override?.color ?? blueprint.defaultTailwindPreview.color,
    bgPreview:
      override?.bgPreview ?? blueprint.defaultTailwindPreview.bgPreview,
    badgeBg: override?.badgeBg ?? blueprint.defaultTailwindPreview.badgeBg,
    badgeText: preset.mockup.badgeText,
    textColor:
      override?.textColor ?? blueprint.defaultTailwindPreview.textColor,
    paletteSwatches: preset.paletteSwatches,
    layoutType: blueprint.layoutType,
  };
}

/**
 * Retorna exatamente os 4 estilos visuais curados para o segmento comercial informado.
 */
export function getSegmentPresets(
  segment: BusinessSegment,
): CuratedStylePreset[] {
  return SegmentRegistry.getSegmentPresets(segment);
}

/**
 * Busca um estilo específico dentro do catálogo de um segmento, suportando aliases legados.
 */
export function getPresetById(
  segment: BusinessSegment,
  presetId?: string | null,
): CuratedStylePreset | undefined {
  return SegmentRegistry.getPresetById(segment, presetId);
}

/**
 * Opções adaptativas para resolução da diretriz de direção de arte.
 */
export interface ResolveArtDirectionOptions {
  hasReferenceImage?: boolean;
  hasCustomPalette?: boolean;
  cardIntent?: CardIntent | null;
  hasPromoPrice?: boolean;
}

/**
 * Resolve a diretriz formatada de Direção de Arte para injeção no prompt do Gemini.
 * Se o presetId for nulo, indefinido ou inexistente, aplica graciosamente o primeiro
 * estilo padrão do segmento sem falhar.
 */
export function resolveArtDirectionDirective(
  segment: BusinessSegment,
  presetId?: string | null,
  options?: ResolveArtDirectionOptions,
): string {
  const presets = getSegmentPresets(segment);
  const matchedPreset = getPresetById(segment, presetId);
  const preset = matchedPreset ?? presets[0];

  if (!preset) return "";

  const blueprint = LAYOUT_VARIANT_BLUEPRINTS[preset.mockup.layoutVariant];
  const guide = getCommercialGuide(preset);
  const swatchesJoined = preset.paletteSwatches.join(", ");

  const chromaticSpec =
    options?.hasReferenceImage || options?.hasCustomPalette
      ? `Manter estrutura de grid e tipografia do preset, mas adaptar a paleta cromática priorizando os tons extraídos da Imagem de Referência ou Paleta Personalizada (Cores canônicas do preset: Fundo ${preset.mockup.bgColor} | Texto ${preset.mockup.textColor} | Destaque ${preset.mockup.accentColor} | Swatches: ${swatchesJoined})`
      : `Fundo ${preset.mockup.bgColor} | Texto ${preset.mockup.textColor} | Destaque/Acento ${preset.mockup.accentColor} | Swatches (${swatchesJoined})`;

  const badgeSpec =
    options?.hasPromoPrice === false
      ? "Selo institucional editorial discreto sem conotação de preço"
      : `${blueprint.priceBadgeStyle} (Selo sugerido: "${preset.mockup.badgeText}")`;

  return [
    `--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "${preset.label}" ---`,
    `- Paleta de Cores: ${preset.artDirection.palette}`,
    `- Composição e Layout: ${preset.artDirection.composition}`,
    `- Iluminação e Texturas: ${preset.artDirection.lighting}`,
    `- Atmosfera Visual: ${preset.artDirection.atmosphere}`,
    `- Variante de Arquitetura Gráfica (LayoutVariant): ${preset.mockup.layoutVariant}`,
    `- Grid Espacial e Posicionamento: ${blueprint.spatialGrid}`,
    `- Família e Estilo Tipográfico: ${blueprint.descriptiveTypography}`,
    `- Óptica Fotográfica e Setup de Estúdio: ${blueprint.cameraAndLightingSetup}`,
    `- Especificação Cromática HEX: ${chromaticSpec}`,
    `- Estilo de Badge / Ancoragem: ${badgeSpec}`,
    `- Percepção Comercial para o Cliente: ${guide.appearance} ${guide.customerVibe}`,
  ].join("\n");
}

/**
 * Retorna o guia comercial em linguagem humana e acessível para o comerciante.
 */
export function getCommercialGuide(
  preset: CuratedStylePreset,
): CommercialGuide {
  const guide = preset.commercialGuide;
  const appearance =
    guide?.appearance ?? guide?.visualTone ?? preset.artDirection.composition;
  const customerVibe =
    guide?.customerVibe ??
    guide?.customerImpression ??
    preset.artDirection.atmosphere;
  const colorsSummary = guide?.colorsSummary ?? preset.tags.join(", ");
  const idealFor = guide?.idealFor ?? preset.description;

  return {
    appearance,
    colorsSummary,
    customerVibe,
    idealFor,
    visualTone: appearance,
    customerImpression: customerVibe,
  };
}
