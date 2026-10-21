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
 * Catálogo resiliente estático de semente contendo exemplos curados de altíssima qualidade visual
 * para os 6 principais ramos comerciais (e moda), 100% anonimizados em conformidade com a LGPD.
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
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1080&q=80",
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
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1080&q=80",
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
