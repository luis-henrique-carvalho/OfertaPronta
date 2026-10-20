import { Store } from "lucide-react";
import type { SegmentDefinition } from "../types";

export const localRetailSegment: SegmentDefinition = {
  id: "local-retail",
  label: "Comércio & Serviços Locais",
  shortDescription:
    "Pet shop, papelaria, oficinas, óticas, eletrônicos e lojas de bairro.",
  icon: Store,
  iconName: "Store",
  placeholders: {
    businessName: "Armazém da Cidade",
    offerTitle: "Ração Premium Cães 15kg",
    promoPrice: "R$ 139,90",
    originalPrice: "R$ 179,90",
    callToAction: "Visite nossa loja!",
  },
  defaultPlaceholders: {
    businessName: "Armazém da Cidade",
    offerTitle: "Ração Premium Cães 15kg",
    promoPrice: "R$ 139,90",
  },
  intentExamples: {
    promo: [
      { title: "Ração Golden Cães Adultos 15kg", price: "R$ 139,90" },
      { title: "Troca de Óleo + Filtro Completo", price: "R$ 149,00" },
    ],
    "new-arrival": [
      { title: "Chegou Nova Linha de Brinquedos e Petiscos Pet" },
      { title: "Armações de Grau e Óculos de Sol Coleção Verão" },
    ],
    "special-date": [
      { title: "Mês do Consumidor: Descontos de até 40% na Loja Toda" },
      { title: "Volta às Aulas: Lista Completa de Material Escolar" },
    ],
    announcement: [
      { title: "Reinauguração com Pula-Pula e Pipoca Grátis!" },
      { title: "Novo Ponto de Coleta e Entrega Rápida no Bairro" },
    ],
    schedule: [
      { title: "Plantão no Feriado: Atendimento das 8h às 12h" },
      { title: "Horário Estendido neste Sábado até as 18h" },
    ],
    custom: [{ title: "Armazém da Cidade traz ofertas especiais de bairro" }],
  },
  exampleOffers: [
    {
      title: "Ração Especial Cães Adultos 15kg + Brinde",
      promoPrice: "R$ 139,90",
      originalPrice: "R$ 179,90",
      stylePresetId: "retail-vibrant",
    },
    {
      title: "Troca de Óleo Sintético 5W30 + Filtro Incluso",
      promoPrice: "R$ 149,00",
      originalPrice: "R$ 195,00",
      stylePresetId: "retail-service-pro",
    },
  ],
  visualGuideline: {
    segmentTitle: "Comércio Local, Serviços & Varejo de Bairro",
    visualStyle:
      "Composição vibrante, amigável e direta com cores acessíveis (azul royal, amarelo, verde, branco), selos claros de preço e garantia.",
    atmosphere:
      "Atendimento próximo de bairro, confiança, transparência e simpatia com o cliente local.",
  },
  presets: [
    {
      id: "retail-vibrant",
      segment: "local-retail",
      label: "Varejo Dinâmico & Amigável",
      description:
        "Azul e amarelo convidativo para lojas de bairro, pet shops, artigos para o lar e papelarias.",
      tags: ["Varejo Amigável", "Comércio de Bairro", "Super Novidade"],
      previewBadgeColor: "#3B82F6",
      accentColor: "#FBBF24",
      paletteSwatches: ["#3B82F6", "#FBBF24", "#FFFFFF"],
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "NOVIDADE",
        bgColor: "#1D4ED8",
        textColor: "#FFFFFF",
        accentColor: "#FBBF24",
        footerHeadline: "SUPER NOVIDADE",
        footerSubline: "PREÇO BAIXO",
      },
      artDirection: {
        palette:
          "Azul royal amigável (#3B82F6), Amarelo vibrante (#FBBF24), Branco luminoso e acentos neutros.",
        composition:
          "Visual alegre e acolhedor de loja de bairro, vitrine moderna com produtos organizados, selos amigáveis em formato de balão ou estrela arredondada, tipografia limpa e legível.",
        lighting:
          "Iluminação aberta, solar e convidativa de loja aberta e bem cuidada.",
        atmosphere:
          "Simpatia de vizinhança, atendimento próximo pelo dono, praticidade e variedade de produtos.",
      },
      commercialGuide: {
        appearance:
          "Visual alegre e acolhedor de vitrine de loja com selos claros de novidade.",
        colorsSummary:
          "Azul royal amigável, Amarelo vibrante e Branco luminoso.",
        customerVibe:
          "Simpatia de comércio do bairro, atendimento próximo e variedade de produtos.",
        idealFor:
          "Lojas de utilidades, pet shops, papelarias e comércio de bairro.",
        visualTone:
          "Visual alegre e acolhedor de vitrine de loja com selos claros de novidade.",
        customerImpression:
          "Simpatia de comércio do bairro, atendimento próximo e variedade de produtos.",
      },
    },
    {
      id: "retail-dynamic",
      segment: "local-retail",
      label: "Liquidação & Black Week",
      description:
        "Faixas pretas e amarelas de impacto máximo, despertando senso de urgência, queima de estoque e oportunidade.",
      tags: ["Queima de Estoque", "Preto & Amarelo", "Mega Liquidação"],
      previewBadgeColor: "#EAB308",
      accentColor: "#18181B",
      paletteSwatches: ["#EAB308", "#18181B", "#DC2626"],
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "LIQUIDAÇÃO",
        bgColor: "#854D0E",
        textColor: "#FFFFFF",
        accentColor: "#18181B",
        footerHeadline: "LIQUIDAÇÃO TOTAL",
        footerSubline: "ATÉ 50% OFF",
      },
      artDirection: {
        palette:
          "Amarelo alerta (#EAB308), Preto absoluto (#18181B), Vermelho queima e Branco contraste.",
        composition:
          "Faixas zebradas ou diagonais de liquidação total, percentuais de desconto gigantes ('ATÉ 50% OFF'), contadores de estoque limitado e produto destacado no centro.",
        lighting:
          "Alto contraste estroboscópico de varejo em liquidação, sombras duras e luz focada anunciando descontos imbatíveis.",
        atmosphere:
          "Urgência máxima de compra, oportunidade única que vai acabar hoje, euforia de economizar.",
      },
      commercialGuide: {
        appearance:
          "Faixas diagonais de alto impacto com porcentagens e contadores de estoque.",
        colorsSummary: "Amarelo alerta, Preto absoluto e Vermelho queima.",
        customerVibe:
          "Urgência máxima de oportunidade imperdível que vai acabar hoje.",
        idealFor:
          "Mega liquidações, queima de estoque, troca de estação e até 50% OFF.",
        visualTone:
          "Faixas diagonais de alto impacto com porcentagens e contadores de estoque.",
        customerImpression:
          "Urgência máxima de oportunidade imperdível que vai acabar hoje.",
      },
    },
    {
      id: "retail-clean-modern",
      segment: "local-retail",
      label: "Moderno & Tecnológico",
      description:
        "Geometrias limpas, tons azul claro e grafite, perfeito para óticas, eletrônicos, celulares e informática.",
      tags: ["Tecnologia & Inovação", "Óticas & Acessórios", "Clean Minimal"],
      previewBadgeColor: "#0EA5E9",
      accentColor: "#64748B",
      paletteSwatches: ["#0EA5E9", "#64748B", "#F8FAFC"],
      mockup: {
        layoutVariant: "clean-minimal",
        badgeText: "TECH & INOVAÇÃO",
        bgColor: "#0369A1",
        textColor: "#FFFFFF",
        accentColor: "#64748B",
      },
      artDirection: {
        palette:
          "Ciano tecnológico (#0EA5E9), Grafite neutro (#64748B), Branco polar e Cinza titânio.",
        composition:
          "Grid geométrico minimalista com bastante respiro, linhas precisas, ângulos retos e produto posicionado como objeto de design refinado com sombra projetada suave.",
        lighting:
          "Luz difusa de estúdio high-tech, reflexos controlados em superfícies de vidro e metal polido.",
        atmosphere:
          "Precisão tecnológica, modernidade, qualidade de engenharia e garantia técnica de ponta.",
      },
      commercialGuide: {
        appearance:
          "Linhas geométricas elegantes destacando o produto como peça de tecnologia.",
        colorsSummary: "Ciano tecnológico, Grafite neutro e Branco polar.",
        customerVibe:
          "Precisão tecnológica, modernidade e confiança em produto de ponta.",
        idealFor:
          "Óticas, smartphones, eletrônicos, informática, relógios e acessórios.",
        visualTone:
          "Linhas geométricas elegantes destacando o produto como peça de tecnologia.",
        customerImpression:
          "Precisão tecnológica, modernidade e confiança em produto de ponta.",
      },
    },
    {
      id: "retail-service-pro",
      segment: "local-retail",
      label: "Serviço Profissional & Confiança",
      description:
        "Azul marinho institucional e branco impecável, com selo de garantia para oficinas, assistência técnica e serviços.",
      tags: ["Serviço Especializado", "Selo de Garantia", "Confiança Total"],
      previewBadgeColor: "#1E40AF",
      accentColor: "#F8FAFC",
      paletteSwatches: ["#1E40AF", "#F8FAFC", "#F59E0B"],
      mockup: {
        layoutVariant: "clean-minimal",
        badgeText: "GARANTIA TOTAL",
        bgColor: "#1E3A8A",
        textColor: "#FFFFFF",
        accentColor: "#F8FAFC",
      },
      artDirection: {
        palette:
          "Azul marinho corporativo (#1E40AF), Branco puro (#F8FAFC), Dourado selo de qualidade e Cinza chumbo.",
        composition:
          "Disposição equilibrada e sóbria transmitindo autoridade, selo circular de certificação ou 'Garantia Comprovada', ícones de checagem nítidos e informações de contato em destaque no rodapé.",
        lighting:
          "Iluminação corporativa clara, sem distorções, transmitindo transparência e precisão profissional.",
        atmosphere:
          "Segurança absoluta, pontualidade, equipe técnica qualificada e tranquilidade para o consumidor.",
      },
      commercialGuide: {
        appearance:
          "Visual equilibrado e sóbrio com selo de garantia e transparência profissional.",
        colorsSummary:
          "Azul marinho corporativo, Branco puro e Dourado garantia.",
        customerVibe:
          "Segurança total, pontualidade, equipe qualificada e garantia comprovada.",
        idealFor:
          "Oficinas mecânicas, assistência técnica, consertos e serviços especializados.",
        visualTone:
          "Visual equilibrado e sóbrio com selo de garantia e transparência profissional.",
        customerImpression:
          "Segurança total, pontualidade, equipe qualificada e garantia comprovada.",
      },
    },
  ],
};
