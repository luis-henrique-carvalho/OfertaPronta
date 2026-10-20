import { UtensilsCrossed } from "lucide-react";
import type { SegmentDefinition } from "../types";

export const restaurantSegment: SegmentDefinition = {
  id: "restaurant",
  label: "Restaurante & Buffet",
  shortDescription:
    "Almoço executivo, marmitas caseiras, buffets por quilo e jantares especiais.",
  icon: UtensilsCrossed,
  iconName: "UtensilsCrossed",
  placeholders: {
    businessName: "Restaurante Sabor & Prosa",
    offerTitle: "Prato Executivo Filé de Frango",
    promoPrice: "R$ 24,90",
    originalPrice: "R$ 32,00",
    callToAction: "Almoce com a gente!",
  },
  defaultPlaceholders: {
    businessName: "Restaurante Sabor & Prosa",
    offerTitle: "Prato Executivo Filé de Frango",
    promoPrice: "R$ 24,90",
  },
  intentExamples: {
    promo: [
      { title: "Prato Feito Especial: Picanha + Fritas", price: "R$ 28,90" },
      { title: "Marmitex Grande com 3 Carnes", price: "R$ 21,90" },
    ],
    "new-arrival": [
      { title: "Cardápio de Inverno: Caldos e Sopas Especiais" },
      { title: "Novo Prato: Salmão Grelhado com Legumes na Manteiga" },
    ],
    "special-date": [
      { title: "Almoço Especial de Dia das Mães: Buffet Livre" },
      { title: "Jantar Romântico de Dia dos Namorados com Vinho" },
    ],
    announcement: [
      { title: "Reinauguração com Novo Salão Climatizado!" },
      { title: "Agora com Espaço Happy Hour de Quinta a Sábado" },
    ],
    schedule: [
      { title: "Almoço de Segunda a Sábado: 11h às 15h" },
      { title: "Aberto no Feriado com Feijoada Tradicional" },
    ],
    custom: [
      { title: "Restaurante Sabor & Prosa convida para uma refeição especial" },
    ],
  },
  exampleOffers: [
    {
      title: "Almoço Executivo: Filé Mignon com Arroz e Fritas",
      promoPrice: "R$ 34,90",
      originalPrice: "R$ 45,00",
      stylePresetId: "restaurant-gourmet",
    },
    {
      title: "Marmitex Especial com Contrafilé e Mandioca Frita",
      promoPrice: "R$ 22,90",
      originalPrice: "R$ 28,00",
      stylePresetId: "restaurant-homestyle",
    },
  ],
  visualGuideline: {
    segmentTitle: "Restaurante, Buffet & Marmitaria",
    visualStyle:
      "Composição convidativa e calorosa com tons naturais (verde oliva, terracota, madeira nobre, branco toalha de mesa), tipografia acolhedora.",
    atmosphere:
      "Comida caseira apetitosa, fumegante, ingredientes frescos, hospitalidade e sabor irresistível.",
  },
  presets: [
    {
      id: "restaurant-homestyle",
      segment: "restaurant",
      label: "Comidinha Caseira & Aconchego",
      description:
        "Tons quentes de panela de barro, temperos frescos na mesa de madeira e aroma de comida de mãe feita na hora.",
      tags: ["Comida Caseira", "Panela de Barro", "Tempero de Mãe"],
      previewBadgeColor: "#D97706",
      accentColor: "#B45309",
      paletteSwatches: ["#D97706", "#15803D", "#78350F"],
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "FEITO NA HORA",
        bgColor: "#78350F",
        textColor: "#FFFFFF",
        accentColor: "#D97706",
        footerHeadline: "TEMPERO CASEIRO",
        footerSubline: "ALMOÇO DE VERDADE",
      },
      artDirection: {
        palette:
          "Terracota panela de barro (#D97706), Verde cheiro-verde fresco (#15803D), Marrom madeira acolhedora (#78350F) e Creme arroz soltinho.",
        composition:
          "Prato fundo ou travessa de cerâmica com comida fumegante apetitosa (feijão encorpado, arroz soltinho, carne dourada), cumbuca com vinagrete e farofa ao fundo em mesa de madeira rústica.",
        lighting:
          "Luz natural da tarde de janela suave e aconchegante, transmitindo paz, acolhimento de casa de avó e tranquilidade na hora do almoço.",
        atmosphere:
          "Comida de verdade feita com amor, aconchego de família, tempero brasileiro autêntico e sustância para a jornada de trabalho.",
      },
      commercialGuide: {
        appearance:
          "Prato farto e fumegante servido em cerâmica caseira sobre mesa acolhedora de madeira.",
        colorsSummary:
          "Terracota panela de barro, Verde cheiro-verde e Marrom madeira.",
        customerVibe:
          "Aconchego de casa de mãe, comida farta e sem frescura que sustenta o dia a dia.",
        idealFor:
          "Pratos comerciais, PFs do meio-dia, feijoadas de sábado e comida caseira no almoço.",
        visualTone:
          "Prato farto e fumegante servido em cerâmica caseira sobre mesa acolhedora de madeira.",
        customerImpression:
          "Aconchego de casa de mãe, comida farta e sem frescura que sustenta o dia a dia.",
      },
    },
    {
      id: "restaurant-buffet",
      segment: "restaurant",
      label: "Buffet Livre & Variedade",
      description:
        "Cores frescas e convidativas de buffet variado, saladas coloridas crocantes e travessas fartas de carnes e massas.",
      tags: ["Buffet Livre", "Muita Variedade", "Saladas & Carnes"],
      previewBadgeColor: "#059669",
      accentColor: "#D97706",
      paletteSwatches: ["#059669", "#D97706", "#FFFFFF"],
      mockup: {
        layoutVariant: "fresh-organic",
        badgeText: "BUFFET LIVRE",
        bgColor: "#065F46",
        textColor: "#FFFFFF",
        accentColor: "#D97706",
        footerHeadline: "MAIS DE 30 OPÇÕES",
        footerSubline: "ALMOÇO COMPLETO",
      },
      artDirection: {
        palette:
          "Verde salada fresca (#059669), Laranja apetite (#D97706), Amarelo mostarda e Branco toalha impecável.",
        composition:
          "Visão generosa com múltiplas travessas apetitosas em linha harmônica, saladas coloridas crocantes em primeiro plano e carnes suculentas ao fundo, com selo de variedade 'Coma à Vontade'.",
        lighting:
          "Iluminação ampla e clara de salão bem ventilado, valorizando a vivacidade das cores de cada ingrediente do buffet.",
        atmosphere:
          "Restaurante movimentado, fartura sem limites, opções saudáveis e deliciosas para todos os gostos e agilidade no almoço corporativo.",
      },
      commercialGuide: {
        appearance:
          "Exibição apetitosa de prato com salada colorida fresca e carnes suculentas.",
        colorsSummary:
          "Verde salada fresca, Laranja apetite e Branco toalha limpa.",
        customerVibe:
          "Fartura sem limites, liberdade de escolher o que gosta e equilíbrio no prato.",
        idealFor:
          "Restaurantes por quilo, buffet livre executivo e self-service de meio-dia.",
        visualTone:
          "Exibição apetitosa de prato com salada colorida fresca e carnes suculentas.",
        customerImpression:
          "Fartura sem limites, liberdade de escolher o que gosta e equilíbrio no prato.",
      },
    },
    {
      id: "restaurant-gourmet",
      segment: "restaurant",
      label: "Menu Executivo & Bistrô",
      description:
        "Elegância moderna em tons de ardósia, vinho e branco, empratamento de chef cuidadoso e sofisticação gastronômica acessível.",
      tags: ["Menu Executivo", "Bistrô Elegante", "Toque de Chef"],
      previewBadgeColor: "#334155",
      accentColor: "#991B1B",
      paletteSwatches: ["#334155", "#E2E8F0", "#991B1B"],
      mockup: {
        layoutVariant: "dark-luxury",
        badgeText: "MENU DO CHEF",
        bgColor: "#0F172A",
        textColor: "#FFFFFF",
        accentColor: "#991B1B",
        footerHeadline: "EXPERIÊNCIA GASTRONÔMICA",
        footerSubline: "SOFISTICAÇÃO & SABOR",
      },
      artDirection: {
        palette:
          "Cinza ardósia nobre (#334155), Branco porcelana fina (#E2E8F0), Vinho tinto profundo (#991B1B) e Ouro champanhe suave.",
        composition:
          "Empratamento artístico moderno com risquinhos de molho reduzido, guarnição perfeitamente posicionada sobre prato de cerâmica fosca, taça de vinho ao lado e talheres nobres nas laterais.",
        lighting:
          "Luz direcional focada de bistrô contemporâneo com sombras suaves, destacando a arquitetura do prato e o brilho do molho.",
        atmosphere:
          "Almoço executivo refinado, jantar especial a dois, gastronomia contemporânea de autor e ambiente tranquilo e acolhedor.",
      },
      commercialGuide: {
        appearance:
          "Empratamento artístico de chef com riscos de molho reduzido e talheres nobres.",
        colorsSummary:
          "Ardósia nobre, Branco porcelana e Vinho tinto profundo.",
        customerVibe:
          "Sofisticação gastronômica, momentos inesquecíveis e excelência culinária.",
        idealFor:
          "Jantares especiais, menus executivos, ocasiões a dois e pratos refinados.",
        visualTone:
          "Empratamento artístico de chef com riscos de molho reduzido e talheres nobres.",
        customerImpression:
          "Sofisticação gastronômica, momentos inesquecíveis e excelência culinária.",
      },
    },
    {
      id: "restaurant-delivery",
      segment: "restaurant",
      label: "Marmitex Express & Delivery",
      description:
        "Embalagem prática e vedada impecável, cores dinâmicas de almoço pontual, fumaça quente e comodidade de receber na empresa.",
      tags: ["Marmitex na Hora", "Entrega Rápida", "Almoço na Firma"],
      previewBadgeColor: "#EA580C",
      accentColor: "#15803D",
      paletteSwatches: ["#EA580C", "#F59E0B", "#15803D"],
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "CHEGA QUENTE",
        bgColor: "#9A3412",
        textColor: "#FFFFFF",
        accentColor: "#F59E0B",
        footerHeadline: "ENTREGA EXPRESS",
        footerSubline: "PEÇA PELO WHATSAPP",
      },
      artDirection: {
        palette:
          "Laranja entrega rápida (#EA580C), Amarelo energia (#F59E0B), Verde salada (#15803D) e Branco lacre seguro.",
        composition:
          "Box ou marmita moderna aberta exibindo divisórias organizadas e fartas, com fumaça subindo, lacre de segurança visível ao lado e ícones rápidos de entrega rápida.",
        lighting:
          "Luz comercial clara e convidativa, transmitindo higiene impecável, organização dos alimentos e pontualidade na entrega.",
        atmosphere:
          "Praticidade para quem trabalha, pausa merecida do almoço, comida quentinha entregue no horário exato e refeição reconfortante.",
      },
      commercialGuide: {
        appearance:
          "Box moderna aberta exibindo divisórias fartas e organizadas com comida fresca.",
        colorsSummary:
          "Laranja entrega rápida, Amarelo energia e Branco lacre seguro.",
        customerVibe:
          "Comida de verdade na comodidade do escritório ou em casa.",
        idealFor:
          "Marmitas para empresas, entregas na hora do almoço e refeições práticas de trabalho.",
        visualTone:
          "Box moderna aberta exibindo divisórias fartas e organizadas com comida fresca.",
        customerImpression:
          "Comida de verdade na comodidade do escritório ou em casa.",
      },
    },
  ],
};
