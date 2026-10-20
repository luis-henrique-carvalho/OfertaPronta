import { Flame } from "lucide-react";
import type { SegmentDefinition } from "../types";

export const burgerShopSegment: SegmentDefinition = {
  id: "burger-shop",
  label: "Hamburgueria Artesanal",
  shortDescription:
    "Smash burgers, blends artesanais, combos com batata e bacon crocante.",
  icon: Flame,
  iconName: "Flame",
  placeholders: {
    businessName: "Burger Artesanal & Grill",
    offerTitle: "Smash Burger Duplo Cheddar",
    promoPrice: "R$ 29,90",
    originalPrice: "R$ 38,00",
    callToAction: "Peça no Delivery!",
  },
  defaultPlaceholders: {
    businessName: "Burger Artesanal & Grill",
    offerTitle: "Smash Burger Duplo Cheddar",
    promoPrice: "R$ 29,90",
  },
  intentExamples: {
    promo: [
      { title: "Smash Burger Duplo Cheddar + Batata", price: "R$ 29,90" },
      { title: "Combo 2 Artesanais + Batata Grande", price: "R$ 59,90" },
    ],
    "new-arrival": [
      { title: "Lançamento: Burger com Geleia de Bacon e Queijo Brie" },
      { title: "Novo Pão Australiano com Blend de Costela 180g" },
    ],
    "special-date": [
      { title: "Dia do Hambúrguer: Compre 1 Leve o 2º com 50% OFF" },
      { title: "Especial Copa do Mundo: Combo Torcedor com Refri" },
    ],
    announcement: [
      { title: "Inauguração da Nova Loja no Centro com Chopp em Dobro!" },
      { title: "Novo Cardápio de Milk-shakes Artesanais Disponível" },
    ],
    schedule: [
      { title: "Aberto nesta Terça de Feriado a partir das 17h" },
      { title: "Delivery Funcionando até 01h na Sexta e Sábado" },
    ],
    custom: [{ title: "Burger Artesanal & Grill traz uma novidade especial" }],
  },
  exampleOffers: [
    {
      title: "Smash Burger Duplo Cheddar Cremoso + Batata Frita",
      promoPrice: "R$ 29,90",
      originalPrice: "R$ 38,00",
      stylePresetId: "burger-dark-bold",
    },
    {
      title: "Combo Monstro: 2 Burgers Artesanais + Batata Rústica",
      promoPrice: "R$ 59,90",
      originalPrice: "R$ 76,00",
      stylePresetId: "burger-smash-fire",
    },
  ],
  visualGuideline: {
    segmentTitle: "Hamburgueria Artesanal & Smash Burger",
    visualStyle:
      "Composição moderna e marcante com tons escuros (preto fosco, carvão, madeira rústica, amarelo cheddar, vermelho ketchup), tipografia de impacto.",
    atmosphere:
      "Cena urbana e apetitosa com queijo derretendo, fumaça sutil de grelha e textura artesanal irresistível.",
  },
  presets: [
    {
      id: "burger-dark-bold",
      segment: "burger-shop",
      label: "Dark Burger & Fumaça",
      description:
        "Fundo preto carvão e ardósia, fumaça sutil de grelha, queijo cheddar derretendo em cascata e acabamento premium irresistível.",
      tags: ["Dark Premium", "Fumaça de Grelha", "Cheddar Cascata"],
      previewBadgeColor: "#F59E0B",
      accentColor: "#DC2626",
      paletteSwatches: ["#111827", "#F59E0B", "#DC2626"],
      mockup: {
        layoutVariant: "dark-luxury",
        badgeText: "BLEND ARTESANAL",
        bgColor: "#111827",
        textColor: "#FFFFFF",
        accentColor: "#F59E0B",
        footerHeadline: "CARNE 100% ANGUS",
        footerSubline: "GRELHADO NO FOGO",
      },
      artDirection: {
        palette:
          "Preto carvão profundo (#111827), Amarelo cheddar derretido (#F59E0B), Vermelho brasa (#DC2626) e Branco puro para tipografia marcante.",
        composition:
          "Hambúrguer em close-up dramático ocupando o centro da cena, camadas visíveis com bacon crocante, cheddar escorrendo pelas laterais e fumaça sutil subindo da carne.",
        lighting:
          "Iluminação pontual de estúdio gastronômico de alta intensidade, destacando a suculência da carne grelhada e o brilho do queijo.",
        atmosphere:
          "Hamburgueria artesanal premium, clima urbano sofisticado, sabor defumado autêntico e desejo gastronômico incontrolável.",
      },
      commercialGuide: {
        appearance:
          "Hambúrguer imponente em close com queijo cheddar escorrendo pelas laterais da carne.",
        colorsSummary:
          "Preto carvão, Amarelo cheddar derretido e Vermelho brasa.",
        customerVibe:
          "Suculência máxima de carne artesanal de verdade que dá água na boca na hora.",
        idealFor:
          "Burgers com blend 100% Angus, smash artesanais e noites de quinta a domingo.",
        visualTone:
          "Hambúrguer imponente em close com queijo cheddar escorrendo pelas laterais da carne.",
        customerImpression:
          "Suculência máxima de carne artesanal de verdade que dá água na boca na hora.",
      },
    },
    {
      id: "burger-smash-fire",
      segment: "burger-shop",
      label: "Smash na Chapa & Chamas",
      description:
        "Tons quentes de laranja brasa e vermelho fogo, crostinha perfeita do smash na chapa e clima acelerado de burger joint.",
      tags: ["Smash na Chapa", "Fogo & Brasa", "Crostinha Perfeita"],
      previewBadgeColor: "#EF4444",
      accentColor: "#FBBF24",
      paletteSwatches: ["#B45309", "#EF4444", "#FBBF24"],
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "SMASH NA CHAPA",
        bgColor: "#7C2D12",
        textColor: "#FFFFFF",
        accentColor: "#FBBF24",
        footerHeadline: "CROSTINHA PERFEITA",
        footerSubline: "PÃO BRIOCHE TOSTADO",
      },
      artDirection: {
        palette:
          "Laranja brasa intensa (#B45309), Vermelho fogo (#EF4444), Amarelo mostarda (#FBBF24) e Branco contraste.",
        composition:
          "Burger smash duplo prensado na chapa com crostinha crocante em destaque, batatas fritas crocantes com páprica ao redor e faixas de dinamismo visual.",
        lighting:
          "Luz quente e contrastada evidenciando a textura crocante da crostinha do smash e o tostado dourado do pão brioche amanteigado.",
        atmosphere:
          "Burger joint moderna, energia acelerada, comida de rua americana de altíssima qualidade e crocância viciante.",
      },
      commercialGuide: {
        appearance:
          "Cores quentes de fogo e chapa quente destacando a crostinha do smash prensado.",
        colorsSummary: "Laranja brasa, Vermelho fogo e Amarelo mostarda.",
        customerVibe:
          "Crocância, sabor potente de chapa e vontade de comer dois sem culpa.",
        idealFor:
          "Smash burgers duplos e triplos, batatas com cheddar/bacon e combos promocionais.",
        visualTone:
          "Cores quentes de fogo e chapa quente destacando a crostinha do smash prensado.",
        customerImpression:
          "Crocância, sabor potente de chapa e vontade de comer dois sem culpa.",
      },
    },
    {
      id: "burger-urban-pop",
      segment: "burger-shop",
      label: "Hamburgueria Pop Urbana",
      description:
        "Amarelo mostarda e vermelho ketchup vibrantes, estilo retrô-pop americano moderno, acessível, alegre e super fotogênico.",
      tags: ["Pop Americano", "Mostarda & Ketchup", "Jovem & Descolado"],
      previewBadgeColor: "#DC2626",
      accentColor: "#F59E0B",
      paletteSwatches: ["#F59E0B", "#DC2626", "#FFFFFF"],
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "SUPER COMBO",
        bgColor: "#B91C1C",
        textColor: "#FFFFFF",
        accentColor: "#F59E0B",
        footerHeadline: "COMBO BATATA + REFRI",
        footerSubline: "MELHOR PREÇO DA CIDADE",
      },
      artDirection: {
        palette:
          "Amarelo mostarda clássico (#F59E0B), Vermelho ketchup vibrante (#DC2626), Branco puro e Cinza asfalto suave.",
        composition:
          "Layout vibrante com referências à pop art americana, selos geométricos modernos, burger montado com perfeição simétrica e copo de refrigerante ou shake ao lado.",
        lighting:
          "Luz de estúdio comercial brilhante, alegre e uniformemente distribuída, realçando as cores naturais dos ingredientes.",
        atmosphere:
          "Diner moderno, encontro descontraído de amigos, nostalgia saborosa e experiência divertida de comer com as mãos.",
      },
      commercialGuide: {
        appearance:
          "Estilo retrô pop americano bem colorido e alegre com combo completo batata e refri.",
        colorsSummary: "Amarelo mostarda, Vermelho ketchup e Branco brilhante.",
        customerVibe:
          "Diversão entre amigos, comida prática e deliciosa que agrada todo mundo.",
        idealFor:
          "Combos com milkshake, promoções de almoço e público jovem universitário.",
        visualTone:
          "Estilo retrô pop americano bem colorido e alegre com combo completo batata e refri.",
        customerImpression:
          "Diversão entre amigos, comida prática e deliciosa que agrada todo mundo.",
      },
    },
    {
      id: "burger-artisan-wood",
      segment: "burger-shop",
      label: "Steakhouse & Tábua de Madeira",
      description:
        "Tábua de corte de madeira nobre, folhas de rúcula fresca, molho especial artesanal e clima de steakhouse refinada.",
      tags: ["Steakhouse", "Tábua Nobre", "Gourmet Especial"],
      previewBadgeColor: "#78350F",
      accentColor: "#10B981",
      paletteSwatches: ["#78350F", "#10B981", "#FEF3C7"],
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "GOURMET",
        bgColor: "#451A03",
        textColor: "#FFFFFF",
        accentColor: "#10B981",
        footerHeadline: "RECEITA DO CHEF",
        footerSubline: "INGREDIENTES SELECIONADOS",
      },
      artDirection: {
        palette:
          "Marrom madeira nobre rústica (#78350F), Verde rúcula fresco (#10B981), Creme maionese da casa (#FEF3C7) e Preto ardósia.",
        composition:
          "Burger artesanal alto e imponente servido sobre tábua rústica de madeira com faca artesanal cravada ou molheira ao lado, transmitindo preparo de chef.",
        lighting:
          "Luz natural lateral suave e quente, destacando a textura do pão artesanal com gergelim e a cor viva dos vegetais frescos.",
        atmosphere:
          "Steakhouse refinada, gastronomia artesanal autoral, cuidado minucioso em cada detalhe e experiência gastronômica memorável.",
      },
      commercialGuide: {
        appearance:
          "Burger artesanal alto servido sobre tábua rústica de madeira nobre com molheira do chef.",
        colorsSummary:
          "Marrom madeira rústica, Verde rúcula e Creme maionese da casa.",
        customerVibe:
          "Experiência gastronômica de chef, ingredientes nobres e valor agregado superior.",
        idealFor:
          "Burgers com queijos especiais (gorgonzola, brie), geleias artesanais e chopp artesanal.",
        visualTone:
          "Burger artesanal alto servido sobre tábua rústica de madeira nobre com molheira do chef.",
        customerImpression:
          "Experiência gastronômica de chef, ingredientes nobres e valor agregado superior.",
      },
    },
  ],
};
