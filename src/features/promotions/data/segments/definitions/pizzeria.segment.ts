import { Pizza } from "lucide-react";
import type { SegmentDefinition } from "../types";

export const pizzeriaSegment: SegmentDefinition = {
  id: "pizzeria",
  label: "Pizzaria Artesanal",
  shortDescription:
    "Pizzas no forno a lenha, combos família e rodízios artesanais.",
  icon: Pizza,
  iconName: "Pizza",
  placeholders: {
    businessName: "Pizzaria Bella Massa",
    offerTitle: "Pizza Grande Calabresa Especial",
    promoPrice: "R$ 42,90",
    originalPrice: "R$ 55,00",
    callToAction: "Peça pelo WhatsApp!",
  },
  defaultPlaceholders: {
    businessName: "Pizzaria Bella Massa",
    offerTitle: "Pizza Grande Calabresa Especial",
    promoPrice: "R$ 42,90",
  },
  intentExamples: {
    promo: [
      { title: "Pizza Grande Calabresa Especial", price: "R$ 42,90" },
      { title: "Combo 2 Pizzas Grandes + Refri 2L", price: "R$ 89,90" },
    ],
    "new-arrival": [
      { title: "Novo Sabor: Costela com Barbecue Defumado" },
      { title: "Massa Fermentação Natural 48h Chegou ao Cardápio" },
    ],
    "special-date": [
      { title: "Dia da Pizza: Qualquer Sabor Grande com 20% OFF" },
      { title: "Especial Dia dos Namorados: Pizza Coração + Vinho" },
    ],
    announcement: [
      { title: "Inauguração do Nosso Espaço com Forno a Lenha!" },
      { title: "Agora com Espaço Kids e Estacionamento Grátis" },
    ],
    schedule: [
      { title: "Funcionamento Especial de Quarta a Domingo: 18h às 23h" },
      { title: "Delivery Funcionando Normal no Feriado" },
    ],
    custom: [{ title: "Pizzaria Bella Massa convida você para saborear" }],
  },
  exampleOffers: [
    {
      title: "Pizza Grande Calabresa com Borda Recheada",
      promoPrice: "R$ 42,90",
      originalPrice: "R$ 55,00",
      stylePresetId: "pizza-rustic-wood",
    },
    {
      title: "Combo Família: 2 Pizzas Grandes + Refrigerante 2L",
      promoPrice: "R$ 89,90",
      originalPrice: "R$ 115,00",
      stylePresetId: "pizza-promo-combo",
    },
  ],
  visualGuideline: {
    segmentTitle: "Pizzaria Artesanal & Forno a Lenha",
    visualStyle:
      "Composição rústica e acolhedora com tons quentes (terracota, vermelho tomate, madeira escura, amarelo queijo), fontes encorpadas e expressivas.",
    atmosphere:
      "Cena artesanal com apetite visual, fumaça sutil, forno rústico e aconchego de cantina italiana.",
  },
  presets: [
    {
      id: "pizza-rustic-wood",
      segment: "pizzeria",
      label: "Forno a Lenha Rústico",
      description:
        "Tábua de madeira nobre, brasas incandescentes ao fundo, queijo derretendo e fumaça aromática de lenha em ambiente caloroso.",
      tags: ["Forno a Lenha", "Madeira & Brasas", "Artesanal Raiz"],
      previewBadgeColor: "#B45309",
      accentColor: "#DC2626",
      paletteSwatches: ["#B45309", "#DC2626", "#FBBF24"],
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "FORNO A LENHA",
        bgColor: "#451A03",
        textColor: "#FFFFFF",
        accentColor: "#DC2626",
        footerHeadline: "MASSA ARTESANAL",
        footerSubline: "FERMENTAÇÃO NATURAL",
      },
      artDirection: {
        palette:
          "Madeira escura queimada (#B45309), Vermelho brasa (#DC2626), Amarelo queijo dourado (#FBBF24) e Preto carvão.",
        composition:
          "Pizza fumegante com fatia puxada exibindo queijo esticando no centro, repousando sobre pá de pizza de madeira rústica, com brasas brilhando suavemente ao fundo.",
        lighting:
          "Luz lateral dourada e quente proveniente do fogo do forno, com realces brilhantes no queijo borbulhante e na borda tostada artesanal.",
        atmosphere:
          "Cantina tradicional italiana, cheiro inconfundível de forno a lenha, aconchego familiar e sabor artesanal supremo.",
      },
      commercialGuide: {
        appearance:
          "Massa dourada fumegante com queijo esticando sobre tábua rústica de madeira.",
        colorsSummary:
          "Madeira escura, Vermelho brasa e Amarelo queijo dourado.",
        customerVibe:
          "Tradição de pizzaria artesanal verdadeira, forno a lenha e apetite imediato.",
        idealFor:
          "Pizzas clássicas artesanais, bordas recheadas e delivery noturno de qualidade.",
        visualTone:
          "Massa dourada fumegante com queijo esticando sobre tábua rústica de madeira.",
        customerImpression:
          "Tradição de pizzaria artesanal verdadeira, forno a lenha e apetite imediato.",
      },
    },
    {
      id: "pizza-artisan-craft",
      segment: "pizzeria",
      label: "Cantina Tradicional Italiana",
      description:
        "Toalha xadrez clássica verde/vermelha, manjericão fresco, azeite dourado e clima acolhedor de trattoria familiar.",
      tags: ["Trattoria Italiana", "Manjericão & Azeite", "Cantina Familiar"],
      previewBadgeColor: "#15803D",
      accentColor: "#DC2626",
      paletteSwatches: ["#DC2626", "#15803D", "#FEF3C7"],
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "RECEITA ITALIANA",
        bgColor: "#14532D",
        textColor: "#FFFFFF",
        accentColor: "#DC2626",
        footerHeadline: "RECEITA ORIGINAL",
        footerSubline: "DESDE 1998",
      },
      artDirection: {
        palette:
          "Vermelho molho de tomate (#DC2626), Verde folha de manjericão (#15803D), Creme toalha rústica (#FEF3C7) e Branco farinha.",
        composition:
          "Cenário apetitoso com tomates maduros inteiros, folhas de manjericão orvalhadas, azeiteira de vidro e pizza com borda alta bem dourada e aerada.",
        lighting:
          "Iluminação aconchegante de restaurante tradicional, luz difusa e quente simulando jantar acolhedor em família.",
        atmosphere:
          "Herança gastronômica italiana, receitas secretas passadas por gerações, carinho no preparo e ingredientes frescos selecionados.",
      },
      commercialGuide: {
        appearance:
          "Cenário acolhedor com tomates maduros, folhas de manjericão e clima de cantina.",
        colorsSummary:
          "Vermelho tomate, Verde manjericão e Creme toalha rústica.",
        customerVibe:
          "Sabor autêntico, receita de família e ingredientes nobres selecionados.",
        idealFor:
          "Pizzas napolitanas, massas especiais e rodízios tradicionais de fim de semana.",
        visualTone:
          "Cenário acolhedor com tomates maduros, folhas de manjericão e clima de cantina.",
        customerImpression:
          "Sabor autêntico, receita de família e ingredientes nobres selecionados.",
      },
    },
    {
      id: "pizza-neon-night",
      segment: "pizzeria",
      label: "Pizza Delivery Noturno Neon",
      description:
        "Fundo escuro urbano com letreiro neon vermelho/laranja, alta energia e apelo visual irresistível para matar a fome da noite.",
      tags: ["Delivery Noturno", "Neon Quente", "Fome da Noite"],
      previewBadgeColor: "#EA580C",
      accentColor: "#FACC15",
      paletteSwatches: ["#18181B", "#EA580C", "#FACC15"],
      mockup: {
        layoutVariant: "neon-urban",
        badgeText: "CHEGA QUENTINHA",
        bgColor: "#18181B",
        textColor: "#FFFFFF",
        accentColor: "#EA580C",
        footerHeadline: "DELIVERY EXPRESS",
        footerSubline: "PEÇA AGORA MESMO",
      },
      artDirection: {
        palette:
          "Preto asfalto escuro (#18181B), Laranja neon pulsante (#EA580C), Amarelo queijo derretido (#FACC15) e Branco brilhante.",
        composition:
          "Pizza em ângulo aéreo dinâmico (flat lay ou 45 graus) com contraste fortíssimo sobre fundo grafite, reflexos neon nas bordas da caixa ou prato.",
        lighting:
          "Iluminação cinematográfica noturna com reflexos de neon em tons quentes banhando a pizza, gerando desejo imediato.",
        atmosphere:
          "Delivery rápido e moderno, pizza quentinha chegando em casa, maratona de séries e reunião descontraída com amigos.",
      },
      commercialGuide: {
        appearance:
          "Contraste urbano escuro com neon quente que salta aos olhos no feed do Instagram.",
        colorsSummary: "Preto asfalto, Laranja neon e Amarelo queijo.",
        customerVibe:
          "Desejo incontrolável de pedir pizza agora mesmo no sofá de casa.",
        idealFor:
          "Delivery noturno no iFood/WhatsApp, sextou e pedidos de última hora.",
        visualTone:
          "Contraste urbano escuro com neon quente que salta aos olhos no feed do Instagram.",
        customerImpression:
          "Desejo incontrolável de pedir pizza agora mesmo no sofá de casa.",
      },
    },
    {
      id: "pizza-promo-combo",
      segment: "pizzeria",
      label: "Combo Família & Super Oferta",
      description:
        "Cores quentes e vibrantes de promoção com selos de 'Pizza Grande + Refri Grátis', projetado para converter pedidos rápidos.",
      tags: ["Combo Promocional", "Família Reunida", "Mais por Menos"],
      previewBadgeColor: "#DC2626",
      accentColor: "#FACC15",
      paletteSwatches: ["#EA580C", "#FACC15", "#DC2626"],
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "SUPER COMBO",
        bgColor: "#9A3412",
        textColor: "#FFFFFF",
        accentColor: "#FACC15",
        footerHeadline: "COMBO PROMOCIONAL",
        footerSubline: "PIZZA + REFRIGERANTE",
      },
      artDirection: {
        palette:
          "Laranja apetite (#EA580C), Amarelo ouro (#FACC15), Vermelho promoção (#DC2626) e Branco para selos de preço.",
        composition:
          "Layout de alto impacto promocional mostrando a pizza ao lado de garrafa ou copos de refrigerante, selos de destaque com 'Economia Garantida'.",
        lighting:
          "Iluminação comercial clara e super vibrante, destacando a fartura do combo e a apetitosidade de cada ingrediente.",
        atmosphere:
          "Reunião de família no domingo à noite, festa com a galera, melhor custo-benefício e satisfação garantida para todos.",
      },
      commercialGuide: {
        appearance:
          "Visual promocional direto com garrafa de refri e pizza grande lado a lado.",
        colorsSummary: "Laranja apetite, Amarelo ouro e Vermelho promocional.",
        customerVibe:
          "Sensação de grande vantagem financeira e refeição farta para a família toda.",
        idealFor:
          "Combos promocionais, terças e quartas da pizza barata e ofertas familiares.",
        visualTone:
          "Visual promocional direto com garrafa de refri e pizza grande lado a lado.",
        customerImpression:
          "Sensação de grande vantagem financeira e refeição farta para a família toda.",
      },
    },
  ],
};
