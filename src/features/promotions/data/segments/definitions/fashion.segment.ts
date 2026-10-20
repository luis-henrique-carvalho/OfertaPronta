import { Shirt } from "lucide-react";
import type { SegmentDefinition } from "../types";

export const fashionSegment: SegmentDefinition = {
  id: "fashion",
  label: "Moda & Roupas",
  shortDescription:
    "Roupas femininas, masculinas, moda íntima, calçados e acessórios.",
  icon: Shirt,
  iconName: "Shirt",
  placeholders: {
    businessName: "Boutique Bella Flor",
    offerTitle: "Vestido Midi Canelado Elegance",
    promoPrice: "R$ 89,90",
    originalPrice: "R$ 129,90",
    callToAction: "Garanta o seu look!",
  },
  defaultPlaceholders: {
    businessName: "Boutique Bella Flor",
    offerTitle: "Vestido Midi Canelado Elegance",
    promoPrice: "R$ 89,90",
  },
  intentExamples: {
    promo: [
      { title: "Vestido Midi Canelado", price: "R$ 89,90" },
      { title: "Conjunto Moletom Confort", price: "R$ 119,90" },
    ],
    "new-arrival": [
      { title: "Nova Coleção Primavera/Verão Chegou!" },
      { title: "Looks Exclusivos Acabaram de Chegar" },
    ],
    "special-date": [
      { title: "Especial Dia das Mães: Encontre o Look Perfeito" },
      { title: "Especial Dia dos Namorados: Elegância a Dois" },
    ],
    announcement: [
      { title: "Grande Reinauguração da Boutique Bella Flor!" },
      { title: "Novo Espaço de Moda no Centro da Cidade" },
    ],
    schedule: [
      { title: "Horário Especial de Atendimento neste Feriado" },
      { title: "Atendimento Exclusivo com Hora Marcada" },
    ],
    custom: [{ title: "Boutique Bella Flor informa novidades especiais" }],
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
  visualGuideline: {
    segmentTitle: "Moda & Roupas",
    visualStyle:
      "Composição limpa, elegante e minimalista com cores sofisticadas (bege linho, preto, dourado, vinho marsala), tipografia clean com boa leitura.",
    atmosphere:
      "Sofisticada, contemporânea, estética de revista e vitrine premium de moda.",
  },
  presets: [
    {
      id: "fashion-boutique",
      segment: "fashion",
      label: "Vitrine Elegante & Linho",
      description:
        "Estilo minimalista e sofisticado para boutiques de moda, com tons de bege, linho e vinho, transmitindo exclusividade.",
      tags: ["Bege & Vinho", "Boutique", "Minimalista"],
      previewBadgeColor: "#BE123C",
      accentColor: "#F5F5F4",
      paletteSwatches: ["#F5F5F4", "#BE123C", "#1C1917"],
      mockup: {
        layoutVariant: "clean-minimal",
        badgeText: "DESTAQUE",
        bgColor: "#F5F5F4",
        textColor: "#1C1917",
        accentColor: "#BE123C",
        footerHeadline: "NOVA COLEÇÃO",
        footerSubline: "LOOK DO DIA",
      },
      artDirection: {
        palette:
          "Bege linho (#F5F5F4), Vinho marsala (#BE123C) e Preto suave (#1C1917).",
        composition:
          "Enquadramento editorial limpo de revista de moda, espaço negativo generoso e foco na textura dos tecidos.",
        lighting:
          "Luz suave e difusa de janela de estúdio fotográfico, sombras suaves e naturais.",
        atmosphere:
          "Boutique contemporânea de moda feminina, elegância discreta e sofisticação.",
      },
      commercialGuide: {
        appearance: "Clean, elegante e editorial de revista de moda.",
        colorsSummary: "Bege linho, vinho marsala e toques de preto suave.",
        customerVibe: "Exclusividade, bom gosto e sofisticação discreta.",
        idealFor: "Boutiques femininas, alfaiataria e moda autoral.",
        visualTone: "Clean, elegante e editorial de revista de moda.",
        customerImpression: "Exclusividade, bom gosto e sofisticação discreta.",
      },
    },
    {
      id: "fashion-modern",
      segment: "fashion",
      label: "Luxo Escuro & Alta Costura",
      description:
        "Fundo escuro dramático e sofisticado com acentos dourados para peças de alta costura, alfaiataria e moda festa.",
      tags: ["Preto & Dourado", "Luxo", "Alta Costura"],
      previewBadgeColor: "#F59E0B",
      accentColor: "#F59E0B",
      paletteSwatches: ["#09090B", "#F59E0B", "#FFFFFF"],
      mockup: {
        layoutVariant: "dark-luxury",
        badgeText: "EXCLUSIVO",
        bgColor: "#09090B",
        textColor: "#FFFFFF",
        accentColor: "#F59E0B",
      },
      artDirection: {
        palette:
          "Preto acetinado (#09090B), Dourado champanhe (#F59E0B) e Branco puro (#FFFFFF).",
        composition:
          "Composição vertical elegante e dramática com iluminação de recorte e tipografia de alto padrão.",
        lighting:
          "Iluminação cinematográfica com rim light dourado destacando contorno das peças e acessórios.",
        atmosphere: "Glamour, alta costura, moda noturna e evento exclusivo.",
      },
      commercialGuide: {
        appearance: "Dramático, sofisticado e premium.",
        colorsSummary: "Preto acetinado e dourado champanhe.",
        customerVibe: "Prestígio, elegância e exclusividade.",
        idealFor: "Moda festa, alfaiataria e acessórios de luxo.",
        visualTone: "Dramático, sofisticado e premium.",
        customerImpression: "Prestígio, elegância e exclusividade.",
      },
    },
    {
      id: "fashion-vibrant",
      segment: "fashion",
      label: "Moda Casual & Urbana",
      description:
        "Cores alegres e vibrantes em gradiente pink e amarelo, transmitindo jovialidade, energia e estilo despojado.",
      tags: ["Pink & Amarelo", "Moda Jovem", "Vibrante"],
      previewBadgeColor: "#DB2777",
      accentColor: "#FDE047",
      paletteSwatches: ["#DB2777", "#FDE047", "#FFFFFF"],
      mockup: {
        layoutVariant: "neon-urban",
        badgeText: "NOVIDADE",
        bgColor: "#DB2777",
        textColor: "#FFFFFF",
        accentColor: "#FDE047",
      },
      artDirection: {
        palette:
          "Pink vibrante (#DB2777), Amarelo solar (#FDE047) e Branco fresco (#FFFFFF).",
        composition:
          "Layout moderno e dinâmico com elementos pop, grafismos contemporâneos e dinamismo jovem.",
        lighting:
          "Luz do dia ensolarada e vibrante, saturação equilibrada e alto astral.",
        atmosphere:
          "Moda jovem, streetwear moderno, tendências de verão e frescor casual.",
      },
      commercialGuide: {
        appearance: "Vibrante, alegre e despojado.",
        colorsSummary: "Pink e amarelo solar com branco fresco.",
        customerVibe: "Energia, juventude e tendências da estação.",
        idealFor: "Moda praia, casual, infantil e streetwear.",
        visualTone: "Vibrante, alegre e despojado.",
        customerImpression: "Energia, juventude e tendências da estação.",
      },
    },
    {
      id: "fashion-bazaar",
      segment: "fashion",
      label: "Liquidação & Bazar Fashion",
      description:
        "Vermelho marcante e amarelo ouro com selos fortes de desconto para queimas de estoque e promoções imperdíveis.",
      tags: ["Vermelho & Ouro", "Liquidação", "Bazar"],
      previewBadgeColor: "#DC2626",
      accentColor: "#FACC15",
      paletteSwatches: ["#DC2626", "#FACC15", "#FFFFFF"],
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "QUEIMA TOTAL",
        bgColor: "#DC2626",
        textColor: "#FFFFFF",
        accentColor: "#FACC15",
        footerHeadline: "LIQUIDAÇÃO",
        footerSubline: "ÚLTIMAS PEÇAS",
      },
      artDirection: {
        palette:
          "Vermelho cereja (#DC2626), Amarelo ouro (#FACC15) e Branco puro (#FFFFFF).",
        composition:
          "Composição promocional com selos diagonais de liquidação, impacto visual direto e urgência fashion.",
        lighting:
          "Iluminação comercial de estúdio uniforme, cores vívidas e contraste nítido.",
        atmosphere:
          "Troca de estação, liquida fashion, bazar exclusivo e grandes descontos.",
      },
      commercialGuide: {
        appearance: "Promocional direto, urgente e dinâmico.",
        colorsSummary: "Vermelho cereja e amarelo ouro.",
        customerVibe: "Oportunidade única e economia real.",
        idealFor: "Queimas de estoque, troca de coleção e black friday.",
        visualTone: "Promocional direto, urgente e dinâmico.",
        customerImpression: "Oportunidade única e economia real.",
      },
    },
  ],
};
