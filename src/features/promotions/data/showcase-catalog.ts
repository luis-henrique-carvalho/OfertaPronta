export interface ShowcaseCardMetadata {
  businessName?: string;
  promoPrice?: string;
  originalPrice?: string;
  highlights?: string[];
}

export interface ShowcaseCardItem {
  id: string;
  businessSegment: string;
  stylePresetId: string;
  cardIntent: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  aspectRatio: string;
  isFeatured: boolean;
  displayOrder: number;
  metadata?: ShowcaseCardMetadata | null;
}

/**
 * Normaliza identificadores de segmento tolerando variações com hífen ou underscore
 * (ex: 'beauty_salon' <-> 'beauty-salon', 'burger' <-> 'burger-shop', 'retail' <-> 'local-retail').
 */
export function normalizeSegment(segment: string): string {
  const s = segment.trim().toLowerCase().replace(/_/g, "-");
  if (
    s === "beauty-salon" ||
    s === "beauty" ||
    s === "salao" ||
    s === "barbearia"
  ) {
    return "beauty-salon";
  }
  if (s === "burger" || s === "burger-shop" || s === "hamburgueria") {
    return "burger-shop";
  }
  if (s === "retail" || s === "local-retail" || s === "varejo") {
    return "local-retail";
  }
  if (s === "supermarket" || s === "mercado" || s === "hortifruti") {
    return "supermarket";
  }
  if (s === "restaurant" || s === "restaurante") {
    return "restaurant";
  }
  if (s === "pizzeria" || s === "pizza") {
    return "pizzeria";
  }
  if (s === "fashion" || s === "moda") {
    return "fashion";
  }
  return s;
}

/**
 * Buffer determinístico 1x1 PNG transparente codificado em Base64 para execução
 * de testes unitários e de integração sem qualquer chamada de rede externa.
 */
export const MOCK_SHOWCASE_IMAGE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/**
 * Catálogo resiliente estático de semente contendo exemplos curados de altíssima qualidade visual
 * para os 6 principais ramos comerciais (e moda), 100% anonimizados em conformidade com a LGPD
 * e hospedados na CDN oficial Cloudflare R2 (zero ocorrências de Unsplash).
 */
export const SHOWCASE_SEED_CATALOG: readonly ShowcaseCardItem[] = [
  // ==========================================
  // SUPERMERCADO & HORTIFRÚTI (supermarket)
  // ==========================================
  {
    id: "seed-supermarket-01",
    businessSegment: "supermarket",
    stylePresetId: "market-discount",
    cardIntent: "promo",
    title: "Super Encarte da Semana",
    description:
      "Layout vibrante com selos explosivos e alto contraste de preço promocional.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/supermarket/market-discount-encarte.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 1,
    metadata: {
      businessName: "Supermercado Compre Bem",
      promoPrice: "R$ 19,90",
      originalPrice: "R$ 29,90",
      highlights: ["Encarte Semanal", "Economia Garantida", "Preço Baixo"],
    },
  },
  {
    id: "seed-supermarket-02",
    businessSegment: "supermarket",
    stylePresetId: "market-fresh",
    cardIntent: "promo",
    title: "Feirão de Hortifrúti Fresco",
    description:
      "Cenário verde e orgânico com frutas e legumes direto do produtor.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/supermarket/market-fresh-hortifruti.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 2,
    metadata: {
      businessName: "Hortifrúti Sabor da Terra",
      promoPrice: "R$ 4,99/kg",
      originalPrice: "R$ 7,99/kg",
      highlights: ["Colheita do Dia", "100% Fresco", "Quarta da Feira"],
    },
  },
  {
    id: "seed-supermarket-03",
    businessSegment: "supermarket",
    stylePresetId: "market-premium",
    cardIntent: "promo",
    title: "Festival de Carnes Nobres",
    description:
      "Composição premium em fundo escuro ardósia com foco em cortes nobres de churrasco.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/supermarket/market-premium-carnes.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 3,
    metadata: {
      businessName: "Empório & Açougue Prime",
      promoPrice: "R$ 54,90/kg",
      originalPrice: "R$ 79,90/kg",
      highlights: ["Corte Angus", "Sexta do Churrasco", "Qualidade Ouro"],
    },
  },

  // ==========================================
  // SALÃO DE BELEZA & BARBEARIA (beauty_salon / beauty-salon)
  // ==========================================
  {
    id: "seed-beauty-01",
    businessSegment: "beauty-salon",
    stylePresetId: "barber-vintage",
    cardIntent: "promo",
    title: "Corte Masculino Premium & Barba",
    description:
      "Atmosfera retrô de barbearia tradicional sobre madeira escura e navalha clássica.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/beauty-salon/barber-vintage-corte.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 1,
    metadata: {
      businessName: "Barbearia Dom navalha",
      promoPrice: "R$ 65,00",
      originalPrice: "R$ 85,00",
      highlights: ["Toalha Quente", "Cerveja Cortesia", "Navalha Clássica"],
    },
  },
  {
    id: "seed-beauty-02",
    businessSegment: "beauty-salon",
    stylePresetId: "salon-glamour",
    cardIntent: "special-date",
    title: "Especial Dia da Noiva & Debutantes",
    description:
      "Elegância editorial em tons rose gold, brilho champanhe e acabamento sofisticado.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/beauty-salon/salon-glamour-noiva.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 2,
    metadata: {
      businessName: "Studio Glamour & Hair",
      promoPrice: "R$ 490,00",
      originalPrice: "R$ 650,00",
      highlights: ["Pacote Completo", "Maquiagem HD", "Penteado Exclusivo"],
    },
  },
  {
    id: "seed-beauty-03",
    businessSegment: "beauty-salon",
    stylePresetId: "beauty-clean",
    cardIntent: "promo",
    title: "Estética Facial & Limpeza Profunda",
    description:
      "Composição clean em azul serenity e branco cirúrgico transmitindo higiene e tecnologia.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/beauty-salon/beauty-clean-facial.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 3,
    metadata: {
      businessName: "Clínica Dermovita",
      promoPrice: "R$ 120,00",
      originalPrice: "R$ 180,00",
      highlights: ["Peeling Suave", "Hidratação Máxima", "Pele Renovada"],
    },
  },

  // ==========================================
  // PIZZARIA (pizzeria)
  // ==========================================
  {
    id: "seed-pizzeria-01",
    businessSegment: "pizzeria",
    stylePresetId: "pizza-rustic-wood",
    cardIntent: "promo",
    title: "Terça da Pizza em Dobro",
    description:
      "Massa fumegante e queijo esticando sobre tábua rústica com brasas do forno a lenha.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/pizzeria/pizza-rustic-wood-terca.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 1,
    metadata: {
      businessName: "Forneria Bella Itália",
      promoPrice: "R$ 59,90",
      originalPrice: "R$ 89,90",
      highlights: ["Compre 1 Leve 2", "Forno a Lenha", "Fermentação Natural"],
    },
  },
  {
    id: "seed-pizzeria-02",
    businessSegment: "pizzeria",
    stylePresetId: "pizza-artisan-craft",
    cardIntent: "promo",
    title: "Combo Família com Borda Recheada",
    description:
      "Visual aconchegante de cantina italiana com ingredientes selecionados e manjericão fresco.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/pizzeria/pizza-artisan-craft-familia.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 2,
    metadata: {
      businessName: "Pizzaria Mamma Mia",
      promoPrice: "R$ 79,90",
      originalPrice: "R$ 105,00",
      highlights: [
        "Pizza Grande + Refri",
        "Borda Vulcão Grátis",
        "Entrega Rápida",
      ],
    },
  },
  {
    id: "seed-pizzeria-03",
    businessSegment: "pizzeria",
    stylePresetId: "pizza-neon-night",
    cardIntent: "promo",
    title: "Delivery Noturno Express",
    description:
      "Contraste moderno de neon pulsante e alta energia para delivery na madrugada.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/pizzeria/pizza-neon-night-delivery.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 3,
    metadata: {
      businessName: "Pizza Night Express",
      promoPrice: "R$ 49,90",
      originalPrice: "R$ 69,90",
      highlights: ["Chega Quentinha", "Em até 35 min", "Taxa Grátis"],
    },
  },

  // ==========================================
  // HAMBURGUERIA (burger / burger-shop)
  // ==========================================
  {
    id: "seed-burger-01",
    businessSegment: "burger-shop",
    stylePresetId: "burger-dark-bold",
    cardIntent: "promo",
    title: "Smash Burger Suculento em Chamas",
    description:
      "Close-up dramático com fumaça de grelha e cascata de queijo cheddar derretido.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/burger-shop/burger-dark-bold-smash.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 1,
    metadata: {
      businessName: "Black Angus Burgers",
      promoPrice: "R$ 29,90",
      originalPrice: "R$ 38,90",
      highlights: ["Blend 160g", "Bacon Artesanal", "Pão Brioche Tostado"],
    },
  },
  {
    id: "seed-burger-02",
    businessSegment: "burger-shop",
    stylePresetId: "burger-urban-pop",
    cardIntent: "promo",
    title: "Combo Smash com Batata Rústica",
    description:
      "Cores pop vibrantes de mostarda e ketchup em estilo descontraído e urbano.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/burger-shop/burger-urban-pop-combo.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 2,
    metadata: {
      businessName: "Pop Smash Joint",
      promoPrice: "R$ 39,90",
      originalPrice: "R$ 52,00",
      highlights: [
        "Burger + Fritas + Refri",
        "Molho da Casa",
        "Crocância Máxima",
      ],
    },
  },
  {
    id: "seed-burger-03",
    businessSegment: "burger-shop",
    stylePresetId: "burger-smash-fire",
    cardIntent: "promo",
    title: "Terça do Burger Artesanal",
    description:
      "Tons quentes de fogo e chapa quente destacando a crostinha perfeita do smash duplo.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/burger-shop/burger-smash-fire-chapa.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 3,
    metadata: {
      businessName: "Fire Smash Burger",
      promoPrice: "R$ 24,90",
      originalPrice: "R$ 34,90",
      highlights: ["Duplo Smash", "Crostinha Perfeita", "Só Hoje"],
    },
  },

  // ==========================================
  // RESTAURANTE & GASTRONOMIA (restaurant)
  // ==========================================
  {
    id: "seed-restaurant-01",
    businessSegment: "restaurant",
    stylePresetId: "restaurant-homestyle",
    cardIntent: "promo",
    title: "Almoço Executivo com Sabor Caseiro",
    description:
      "Comida caseira apetitosa fumegante servida em travessa com tempero brasileiro de mãe.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/restaurant/restaurant-homestyle-almoco.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 1,
    metadata: {
      businessName: "Restaurante Sabor de Casa",
      promoPrice: "R$ 22,90",
      originalPrice: "R$ 28,90",
      highlights: [
        "Prato Comercial",
        "Acompanha Sobremesa",
        "Almoço de Verdade",
      ],
    },
  },
  {
    id: "seed-restaurant-02",
    businessSegment: "restaurant",
    stylePresetId: "restaurant-homestyle",
    cardIntent: "special-date",
    title: "Tradicional Feijoada aos Sábados",
    description:
      "Prato farto servido em panela de barro com couve refogada, vinagrete e torresmo crocante.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/restaurant/restaurant-homestyle-feijoada.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 2,
    metadata: {
      businessName: "Botequim & Cozinha Brasil",
      promoPrice: "R$ 39,90",
      originalPrice: "R$ 55,00",
      highlights: ["Feijoada Completa", "Torresmo Sequinho", "Música ao Vivo"],
    },
  },
  {
    id: "seed-restaurant-03",
    businessSegment: "restaurant",
    stylePresetId: "restaurant-gourmet",
    cardIntent: "promo",
    title: "Festival Gastronômico do Chef",
    description:
      "Empratamento de bistrô refinado com iluminação acolhedora e toque gourmet.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/restaurant/restaurant-gourmet-bistro.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 3,
    metadata: {
      businessName: "Bistrô Jardim Gourmet",
      promoPrice: "R$ 58,00",
      originalPrice: "R$ 82,00",
      highlights: [
        "Entrada + Prato Principal",
        "Toque de Chef",
        "Ambiente Climatizado",
      ],
    },
  },

  // ==========================================
  // VAREJO LOCAL & LOJAS (retail / local-retail)
  // ==========================================
  {
    id: "seed-retail-01",
    businessSegment: "local-retail",
    stylePresetId: "retail-dynamic",
    cardIntent: "promo",
    title: "Mega Queima de Estoque",
    description:
      "Faixas pretas e amarelas de alto impacto com porcentagens e contadores de urgência.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/local-retail/retail-dynamic-queima.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 1,
    metadata: {
      businessName: "Mega Varejo Brasil",
      promoPrice: "Até 50% OFF",
      originalPrice: "Preço Normal",
      highlights: ["Últimas Peças", "Desconto Real", "Liquidação Total"],
    },
  },
  {
    id: "seed-retail-02",
    businessSegment: "local-retail",
    stylePresetId: "retail-vibrant",
    cardIntent: "promo",
    title: "Grande Liquidação de Calçados",
    description:
      "Visual alegre e amigável em azul e amarelo convidando os vizinhos para aproveitar.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/local-retail/retail-vibrant-calcados.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 2,
    metadata: {
      businessName: "Passo Certo Calçados",
      promoPrice: "R$ 89,90",
      originalPrice: "R$ 139,90",
      highlights: [
        "Todos os Tamanhos",
        "Parcelamento em 3x",
        "Estoque Limitado",
      ],
    },
  },
  {
    id: "seed-retail-03",
    businessSegment: "local-retail",
    stylePresetId: "retail-clean-modern",
    cardIntent: "new-arrival",
    title: "Novidades da Estação Tech & Casa",
    description:
      "Grid moderno de linhas limpas em ciano e grafite destacando produtos de utilidade e tecnologia.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/local-retail/retail-clean-modern-novidades.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 3,
    metadata: {
      businessName: "Inova Casa & Tech",
      promoPrice: "A partir de R$ 39,90",
      originalPrice: "R$ 59,90",
      highlights: ["Chegou Lançamento", "Garantia 1 Ano", "Pronta Entrega"],
    },
  },

  // ==========================================
  // MODA & ACESSÓRIOS (fashion)
  // ==========================================
  {
    id: "seed-fashion-01",
    businessSegment: "fashion",
    stylePresetId: "fashion-editorial",
    cardIntent: "new-arrival",
    title: "Coleção Outono & Inverno Exclusiva",
    description:
      "Enquadramento editorial de revista de moda com paleta refinada e tipografia moderna.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/fashion/fashion-editorial-outono.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 1,
    metadata: {
      businessName: "Boutique Elegance",
      promoPrice: "R$ 149,90",
      originalPrice: "R$ 219,90",
      highlights: ["Nova Coleção", "Tecido Nobre", "Edição Limitada"],
    },
  },
  {
    id: "seed-fashion-02",
    businessSegment: "fashion",
    stylePresetId: "fashion-bold",
    cardIntent: "promo",
    title: "Liquidação de Jeans & Básicos",
    description:
      "Cores contrastadas com destaque absoluto para preço promocional de moda.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/fashion/fashion-bold-jeans.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 2,
    metadata: {
      businessName: "Urban Jeans Store",
      promoPrice: "R$ 99,90",
      originalPrice: "R$ 159,90",
      highlights: ["Jeans Premium", "Caimento Perfeito", "Tamanhos 36 ao 48"],
    },
  },
  {
    id: "seed-fashion-03",
    businessSegment: "fashion",
    stylePresetId: "fashion-minimal",
    cardIntent: "promo",
    title: "Vestidos de Festa & Eventos",
    description:
      "Respiro visual sofisticado e acabamento minimalista elegante.",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/fashion/fashion-minimal-vestidos.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 3,
    metadata: {
      businessName: "Ateliê Belle Robe",
      promoPrice: "R$ 199,00",
      originalPrice: "R$ 280,00",
      highlights: ["Pronta Entrega", "Ajuste Grátis", "Cores da Moda"],
    },
  },
];
