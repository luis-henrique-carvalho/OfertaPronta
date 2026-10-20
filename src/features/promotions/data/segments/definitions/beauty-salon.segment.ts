import { Sparkles } from "lucide-react";
import type { SegmentDefinition } from "../types";

export const beautySalonSegment: SegmentDefinition = {
  id: "beauty-salon",
  label: "Salão de Beleza & Barbearia",
  shortDescription:
    "Cortes, escovas, barboterapia, manicure e tratamentos estéticos.",
  icon: Sparkles,
  iconName: "Sparkles",
  placeholders: {
    businessName: "Espaço Elegance & Barber",
    offerTitle: "Combo Barba Terapia + Corte Degradê",
    promoPrice: "R$ 65,00",
    originalPrice: "R$ 90,00",
    callToAction: "Agende pelo WhatsApp!",
  },
  defaultPlaceholders: {
    businessName: "Espaço Elegance & Barber",
    offerTitle: "Combo Barba Terapia + Corte Degradê",
    promoPrice: "R$ 65,00",
  },
  intentExamples: {
    promo: [
      { title: "Combo Barba Terapia + Corte Degradê", price: "R$ 65,00" },
      { title: "Escova Progressiva + Hidratação", price: "R$ 120,00" },
    ],
    "new-arrival": [
      { title: "Novo Procedimento: Spa dos Pés com Ozonioterapia" },
      { title: "Lançamento: Coloração Vegana com Brilho Intenso" },
    ],
    "special-date": [
      { title: "Especial Dia dos Pais: Pai e Filho na Barbearia" },
      { title: "Dia da Noiva: Pacotes Especiais com Desconto" },
    ],
    announcement: [
      { title: "Inauguração da Nova Unidade no Shopping!" },
      { title: "Chegou o Novo Profissional Especialista em Loiros" },
    ],
    schedule: [
      { title: "Atendimento Especial com Hora Marcada neste Sábado" },
      { title: "Agenda Aberta para o Fim de Ano: Garanta sua Vaga" },
    ],
    custom: [{ title: "Espaço Elegance & Barber informa novidades e pacotes" }],
  },
  exampleOffers: [
    {
      title: "Combo Barba Terapia + Corte Degradê",
      promoPrice: "R$ 65,00",
      originalPrice: "R$ 90,00",
      stylePresetId: "barber-vintage",
    },
    {
      title: "Escova Progressiva Orgânica + Banho de Brilho",
      promoPrice: "R$ 139,90",
      originalPrice: "R$ 190,00",
      stylePresetId: "salon-glamour",
    },
  ],
  visualGuideline: {
    segmentTitle: "Salão de Beleza & Barbearia",
    visualStyle:
      "Estilo sofisticado e convidativo com cores elegantes (rose gold, dourado, marrom âmbar ou azul escuro), elementos gráficos geométricos refinados.",
    atmosphere:
      "Ambiente profissional, sensação de autocuidado, bem-estar, transformação e atendimento exclusivo.",
  },
  presets: [
    {
      id: "salon-glamour",
      segment: "beauty-salon",
      label: "Glamour Rose Gold & Editorial",
      description:
        "Tons delicados de rose gold, rosa champanhe e dourado, tipografia refinada e acabamento de estúdio de beleza premium.",
      tags: ["Rose Gold", "Elegância Feminina", "Estética VIP"],
      previewBadgeColor: "#EC4899",
      accentColor: "#F43F5E",
      paletteSwatches: ["#EC4899", "#F43F5E", "#FDF2F8"],
      mockup: {
        layoutVariant: "clean-minimal",
        badgeText: "VIP",
        bgColor: "#831843",
        textColor: "#FFFFFF",
        accentColor: "#F43F5E",
        footerHeadline: "ATENDIMENTO EXCLUSIVO",
        footerSubline: "AGENDE SEU HORÁRIO",
      },
      artDirection: {
        palette:
          "Rose gold refinado (#EC4899), Rosa champanhe suave (#F43F5E), Dourado fosco e Branco pérola (#FDF2F8).",
        composition:
          "Enquadramento editorial de revista de estética, moldura dourada sutil, respiro visual elegante e tipografia serifada de alto padrão.",
        lighting:
          "Luz suave de ring-light e softbox de maquiador profissional, sem reflexos duros, destacando o brilho da pele e dos cabelos.",
        atmosphere:
          "Espaço de beleza requintado, sensação de bem-estar, transformação, carinho e autoestima elevada.",
      },
      commercialGuide: {
        appearance:
          "Visual iluminado e limpo, que valoriza cada detalhe sem reflexos pesados.",
        colorsSummary: "Tons elegantes de Rosa e Dourado.",
        customerVibe:
          "Passa ar de serviço VIP e alto padrão, transmitindo confiança para cobrar mais.",
        idealFor:
          "Unhas em gel, escova, maquiagem, estética facial e datas comemorativas.",
        visualTone:
          "Visual iluminado e limpo, que valoriza cada detalhe sem reflexos pesados.",
        customerImpression:
          "Passa ar de serviço VIP e alto padrão, transmitindo confiança para cobrar mais.",
      },
    },
    {
      id: "barber-vintage",
      segment: "beauty-salon",
      label: "Barbearia Retrô Couro & Madeira",
      description:
        "Tons quentes de couro envelhecido, madeira nobre e dourado vintage, transmitindo tradição, navalha e respeito à barbearia raiz.",
      tags: ["Retrô Amadeirado", "Navalha Clássica", "Barba & Cabelo"],
      previewBadgeColor: "#D97706",
      accentColor: "#78350F",
      paletteSwatches: ["#78350F", "#D97706", "#FDE68A"],
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "TRADIÇÃO",
        bgColor: "#451A03",
        textColor: "#FFFFFF",
        accentColor: "#D97706",
        footerHeadline: "BARBEARIA CLÁSSICA",
        footerSubline: "NAVALHA & TOALHA QUENTE",
      },
      artDirection: {
        palette:
          "Marrom couro vintage (#78350F), Madeira mogno escura, Dourado envelhecido (#D97706) e Preto carvão.",
        composition:
          "Cenário de barbearia tradicional sobre madeira escura com texturas sutis de couro, navalhas vintage decorativas, tipografia robusta e selos de cavalheiro.",
        lighting:
          "Luz quente tungstênio (lâmpada retrô filamento) com sombras aconchegantes e brilho nas lâminas e vidros de loção.",
        atmosphere:
          "Tradição de cavalheiros, artesanato da navalha na toalha quente, ambiente acolhedor e confiança masculina atemporal.",
      },
      commercialGuide: {
        appearance:
          "Ambiente retrô amadeirado com navalha, tesouras vintage e aconchego clássico.",
        colorsSummary:
          "Marrom couro envelhecido, Dourado âmbar e Preto clássico.",
        customerVibe:
          "Tradição de cavalheiros, artesanato de respeito e cuidado masculino atemporal.",
        idealFor:
          "Barba na toalha quente, cortes clássicos, hidratação e combos masculinos.",
        visualTone:
          "Ambiente retrô amadeirado com navalha, tesouras vintage e aconchego clássico.",
        customerImpression:
          "Tradição de cavalheiros, artesanato de respeito e cuidado masculino atemporal.",
      },
    },
    {
      id: "beauty-clean",
      segment: "beauty-salon",
      label: "Clínica & Estética Serenity",
      description:
        "Estética clean e minimalista em azul suave e branco esterilizado, transmitindo pureza, higiene clínica e tecnologia avançada.",
      tags: ["Estética Clean", "Azul Sereno", "Clínica & Spa"],
      previewBadgeColor: "#6366F1",
      accentColor: "#06B6D4",
      paletteSwatches: ["#6366F1", "#06B6D4", "#EEF2FF"],
      mockup: {
        layoutVariant: "clean-minimal",
        badgeText: "BEM-ESTAR",
        bgColor: "#312E81",
        textColor: "#FFFFFF",
        accentColor: "#06B6D4",
        footerHeadline: "CUIDADO ESPECIALIZADO",
        footerSubline: "SAÚDE & BELEZA",
      },
      artDirection: {
        palette:
          "Azul serenity pastel (#6366F1), Ciano cristalino (#06B6D4), Branco puro impecável e Cinza neutro suave.",
        composition:
          "Grid geométrico limpo com amplo espaço em branco (respiro negativo), moldura sutil, tipografia sans-serif leve e moderna com selos de tecnologia e segurança.",
        lighting:
          "Luz clínica pura e uniforme, sem sombras duras, transmitindo assepsia, modernidade e precisão médica.",
        atmosphere:
          "Clínica de estética avançada, sensação de paz, rejuvenescimento, tratamento seguro e cuidado dermatológico impecável.",
      },
      commercialGuide: {
        appearance:
          "Composição limpa e arejada, transmitindo a serenidade de clínica moderna.",
        colorsSummary:
          "Índigo suave, Ciano cristalino e Branco puro esterilizado.",
        customerVibe:
          "Sensação de paz, relaxamento profundo, rejuvenescimento e higiene impecável.",
        idealFor:
          "Limpeza de pele, massagens relaxantes, drenagem, depilação e spa.",
        visualTone:
          "Composição limpa e arejada, transmitindo a serenidade de clínica moderna.",
        customerImpression:
          "Sensação de paz, relaxamento profundo, rejuvenescimento e higiene impecável.",
      },
    },
    {
      id: "barber-modern",
      segment: "beauty-salon",
      label: "Degradê Urbano & Streetwear",
      description:
        "Fundo azul marinho escuro com luzes de neon roxo e ciano, corte degradê na régua e atitude urbana para o público jovem.",
      tags: ["Degradê na Régua", "Neon Urbano", "Jovem & Street"],
      previewBadgeColor: "#8B5CF6",
      accentColor: "#06B6D4",
      paletteSwatches: ["#0F172A", "#8B5CF6", "#06B6D4"],
      mockup: {
        layoutVariant: "neon-urban",
        badgeText: "NO ESTILO",
        bgColor: "#0F172A",
        textColor: "#FFFFFF",
        accentColor: "#8B5CF6",
        footerHeadline: "DEGRADÊ NA RÉGUA",
        footerSubline: "ESTILO & ATITUDE",
      },
      artDirection: {
        palette:
          "Azul marinho grafite (#0F172A), Roxo neon (#8B5CF6), Ciano elétrico (#06B6D4) e Branco alto contraste.",
        composition:
          "Composição contemporânea com linhas angulares modernas, efeitos de reflexo neon nas bordas, tipografia display condensada e selos arrojados de estilo.",
        lighting:
          "Iluminação de estúdio estilizada com luzes de recorte (rim lights) em ciano e magenta, realçando a silhueta e os detalhes do corte.",
        atmosphere:
          "Barbearia urbana moderna, cultura hip-hop/street, energia jovem, atitude e visual impecável para o fim de semana.",
      },
      commercialGuide: {
        appearance:
          "Linhas modernas e esportivas com acentos de neon para público jovem e conectado.",
        colorsSummary: "Azul marinho grafite, Roxo neon e Ciano elétrico.",
        customerVibe:
          "Estilo moderno, corte alinhado e atitude urbana para o fim de semana.",
        idealFor:
          "Cortes degradê na régua, freestyle, barbearia jovem e estilo streetwear.",
        visualTone:
          "Linhas modernas e esportivas com acentos de neon para público jovem e conectado.",
        customerImpression:
          "Estilo moderno, corte alinhado e atitude urbana para o fim de semana.",
      },
    },
  ],
};
