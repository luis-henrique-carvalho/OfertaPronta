import { ShoppingCart } from "lucide-react";
import type { SegmentDefinition } from "../types";

export const supermarketSegment: SegmentDefinition = {
  id: "supermarket",
  label: "Supermercado & Hortifrúti",
  shortDescription:
    "Ofertas da semana, hortifrúti fresco e encartes de supermercado.",
  icon: ShoppingCart,
  iconName: "ShoppingCart",
  placeholders: {
    businessName: "Supermercado Compre Bem",
    offerTitle: "Picanha Bovina Fatiada 1kg",
    promoPrice: "R$ 49,90",
    originalPrice: "R$ 69,90",
    callToAction: "Aproveite hoje mesmo!",
  },
  defaultPlaceholders: {
    businessName: "Supermercado Compre Bem",
    offerTitle: "Picanha Bovina Fatiada 1kg",
    promoPrice: "R$ 49,90",
  },
  intentExamples: {
    promo: [
      { title: "Picanha Bovina Fatiada 1kg", price: "R$ 49,90" },
      { title: "Arroz Tipo 1 Pacote 5kg", price: "R$ 23,90" },
    ],
    "new-arrival": [
      { title: "Chegou Queijo Artesanal da Serra da Canastra" },
      { title: "Novo Lote de Frutas Frescas Direto do Produtor" },
    ],
    "special-date": [
      { title: "Especial Páscoa: Ovos de Chocolate e Bacalhau" },
      { title: "Ceia de Natal Completa com Descontos Especiais" },
    ],
    announcement: [
      { title: "Grande Reinauguração com Degustação Grátis!" },
      { title: "Nova Seção de Importados e Vinhos Especiais" },
    ],
    schedule: [
      { title: "Horário Especial de Domingo: 7h às 13h" },
      { title: "Aberto no Feriado com Ofertas Especiais" },
    ],
    custom: [{ title: "Supermercado Compre Bem informa ofertas exclusivas" }],
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
  visualGuideline: {
    segmentTitle: "Supermercado, Hortifrúti e Mercearia",
    visualStyle:
      "Composição promocional com cores vivas e quentes (vermelho, amarelo, branco), selos com cantos arredondados, fontes bold e dinâmicas.",
    atmosphere:
      "Clara, limpa, iluminada, transmitindo frescor, economia e urgência de oferta da semana.",
  },
  presets: [
    {
      id: "market-discount",
      segment: "supermarket",
      label: "Super Encarte Amarelo & Vermelho",
      description:
        "Estilo clássico de varejo agressivo com alto contraste, selos gráficos explosivos e destaque máximo para preço promocional.",
      tags: ["Amarelo & Vermelho", "Super Desconto", "Varejo Agressivo"],
      previewBadgeColor: "#EF4444",
      accentColor: "#FBBF24",
      paletteSwatches: ["#EF4444", "#FBBF24", "#FFFFFF"],
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "SUPER OFERTA",
        bgColor: "#EF4444",
        textColor: "#FFFFFF",
        accentColor: "#FBBF24",
        footerHeadline: "SUPER DESCONTO",
        footerSubline: "OFERTA DO DIA",
      },
      artDirection: {
        palette:
          "Vermelho primário vibrante (#EF4444), Amarelo ouro (#FBBF24) e Branco puro (#FFFFFF) para contrastes e faixas de preço.",
        composition:
          "Layout dinâmico de encarte promocional de varejo, selos explosivos com bordas recortadas, faixas diagonais de desconto e produto em primeiro plano dominante.",
        lighting:
          "Iluminação de estúdio comercial clara, uniforme e brilhante, eliminando sombras pesadas para destacar o produto e embalagens.",
        atmosphere:
          "Urgência promocional de supermercado, varejo agressivo, sensação de grande economia e liquidação imediata.",
      },
      commercialGuide: {
        appearance:
          "Estilo folheto promocional de grandes redes com preço em destaque dominante.",
        colorsSummary:
          "Vermelho vibrante, Amarelo ouro e Branco de alto contraste.",
        customerVibe:
          "Urgência máxima de compra e sensação imediata de economia imperdível.",
        idealFor:
          "Grandes ofertas da semana, queima de estoque e produtos populares de alto giro.",
        visualTone:
          "Estilo folheto promocional de grandes redes com preço em destaque dominante.",
        customerImpression:
          "Urgência máxima de compra e sensação imediata de economia imperdível.",
      },
    },
    {
      id: "market-fresh",
      segment: "supermarket",
      label: "Feira & Hortifrúti Natural",
      description:
        "Tons verdes e acentos naturais de madeira, foco em frescor da horta, procedência saudável e qualidade.",
      tags: ["Verde Natural", "Frescor da Horta", "Saudável"],
      previewBadgeColor: "#10B981",
      accentColor: "#047857",
      paletteSwatches: ["#10B981", "#047857", "#A7F3D0"],
      mockup: {
        layoutVariant: "fresh-organic",
        badgeText: "FRESCO",
        bgColor: "#047857",
        textColor: "#FFFFFF",
        accentColor: "#10B981",
        footerHeadline: "DIRETO DO PRODUTOR",
        footerSubline: "COLHEITA DO DIA",
      },
      artDirection: {
        palette:
          "Verde esmeralda fresco (#10B981), Verde floresta profundo (#047857), Madeira clara (#A7F3D0) e Branco natural.",
        composition:
          "Composição orgânica com textura de caixote de feira ou tábua de madeira rústica, folhagens verdes decorativas nas bordas e produto fresco no centro com gotículas d'água.",
        lighting:
          "Luz natural difusa matinal suave, destacando o viço e as cores vibrantes dos alimentos frescos.",
        atmosphere:
          "Frescor do campo, horta, feira livre de qualidade, procedência saudável e produtos recém-colhidos.",
      },
      commercialGuide: {
        appearance:
          "Cenário claro e arejado de horta com elementos naturais acolhedores.",
        colorsSummary:
          "Verde esmeralda, Verde floresta e tons naturais da terra.",
        customerVibe:
          "Frescor de colheita do dia, saúde e procedência garantida de qualidade.",
        idealFor:
          "Frutas, verduras, legumes frescos, feira natural e produtos orgânicos da horta.",
        visualTone:
          "Cenário claro e arejado de horta com elementos naturais acolhedores.",
        customerImpression:
          "Frescor de colheita do dia, saúde e procedência garantida de qualidade.",
      },
    },
    {
      id: "market-premium",
      segment: "supermarket",
      label: "Açougue & Empório Premium",
      description:
        "Fundo escuro elegante (ardósia/carvão), iluminação dramática de bistrô, acentos dourados e foco em cortes nobres e vinhos.",
      tags: ["Dark Premium", "Cortes Nobres", "Empório Gourmet"],
      previewBadgeColor: "#F59E0B",
      accentColor: "#D97706",
      paletteSwatches: ["#111827", "#F59E0B", "#FDE68A"],
      mockup: {
        layoutVariant: "dark-luxury",
        badgeText: "PREMIUM",
        bgColor: "#111827",
        textColor: "#FFFFFF",
        accentColor: "#F59E0B",
        footerHeadline: "QUALIDADE SUPERIOR",
        footerSubline: "SELEÇÃO ESPECIAL",
      },
      artDirection: {
        palette:
          "Preto carvão profundo (#111827), Dourado âmbar metálico (#F59E0B), Cinza ardósia e Branco puro para tipografia refinada.",
        composition:
          "Cenário gastronômico sofisticado sobre bancada de ardósia ou tábua de corte nobre com ervas aromáticas (alecrim, pimenta em grãos) decorando o cenário ao redor do corte.",
        lighting:
          "Iluminação direcional de estúdio (spotlight) com chiaroscuro elegante, realçando o brilho, marmoreio e textura da carne ou garrafa de vinho.",
        atmosphere:
          "Boutique de carnes nobres, empório requintado, alta gastronomia e qualidade gourmet inquestionável.",
      },
      commercialGuide: {
        appearance:
          "Fundo escuro elegante com iluminação focada que valoriza a textura do produto.",
        colorsSummary:
          "Preto carvão profundo, Dourado âmbar e toques acobreados.",
        customerVibe:
          "Qualidade de açougue boutique, exclusividade e sabor gourmet requintado.",
        idealFor:
          "Cortes nobres de carne, picanha, vinhos, queijos especiais e empório.",
        visualTone:
          "Fundo escuro elegante com iluminação focada que valoriza a textura do produto.",
        customerImpression:
          "Qualidade de açougue boutique, exclusividade e sabor gourmet requintado.",
      },
    },
    {
      id: "market-daily",
      segment: "supermarket",
      label: "Feirão & Sacolão Popular",
      description:
        "Laranja vibrante e amarelo solar, estilo acessível e convidativo para ofertas cotidianas da mercearia e feirinha.",
      tags: ["Laranja Solar", "Feirão Popular", "Economia Diária"],
      previewBadgeColor: "#F97316",
      accentColor: "#EA580C",
      paletteSwatches: ["#F97316", "#FDE047", "#EA580C"],
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "PREÇO BAIXO",
        bgColor: "#EA580C",
        textColor: "#FFFFFF",
        accentColor: "#FDE047",
        footerHeadline: "FEIRÃO DA ECONOMIA",
        footerSubline: "OFERTAS IMBATÍVEIS",
      },
      artDirection: {
        palette:
          "Laranja cítrico vibrante (#F97316), Amarelo solar (#FDE047), Vermelho tomate e Branco nítido.",
        composition:
          "Composição festiva e acolhedora com selos circulares amigáveis, grafismos geométricos modernos e produto em posição central convidativa.",
        lighting:
          "Iluminação aberta, solar e bem distribuída, transmitindo calor humano, acolhimento e energia de feirão.",
        atmosphere:
          "Mercado de vizinhança simpático, economia real para a família, praticidade e compras inteligentes do dia a dia.",
      },
      commercialGuide: {
        appearance:
          "Cores vivas e apetitosas de sacolão de bairro convidativo e dinâmico.",
        colorsSummary: "Laranja vibrante, Amarelo solar e Branco nítido.",
        customerVibe:
          "Economia garantida no bolso para as compras cotidianas da família.",
        idealFor:
          "Ofertas diárias, feirão da economia e preços imbatíveis do dia a dia.",
        visualTone:
          "Cores vivas e apetitosas de sacolão de bairro convidativo e dinâmico.",
        customerImpression:
          "Economia garantida no bolso para as compras cotidianas da família.",
      },
    },
  ],
};
