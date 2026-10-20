import type { LucideIcon } from "lucide-react";
import {
  ShoppingCart,
  Sparkles,
  Pizza,
  Flame,
  UtensilsCrossed,
  Store,
  Shirt,
  Tag,
  Calendar,
  Megaphone,
  Clock,
  PenLine,
} from "lucide-react";
import type { BusinessSegment, CardIntent } from "./offer-brief.schema";

export type LayoutType =
  "bold-offer" | "clean-frame" | "dark-premium" | "vibrant-pop";

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

export interface IntentExample {
  title: string;
  price?: string;
}

export type IntentExamplesMap = Record<CardIntent, IntentExample[]>;

export interface CreationPlaceholders {
  businessName: string;
  offerTitle: string;
  promoPrice: string;
}

export interface CreationCatalogItem {
  id: BusinessSegment;
  label: string;
  icon: LucideIcon;
  iconName: string;
  placeholders: CreationPlaceholders;
  defaultPlaceholders: CreationPlaceholders;
  intentExamples: IntentExamplesMap;
  styles: StyleVisualOption[];
}

export interface CreationCardIntentItem {
  id: CardIntent;
  label: string;
  icon: LucideIcon;
  iconName: string;
  description: string;
  hasPriceByDefault: boolean;
  offerPlaceholder: string;
}

export const CREATION_CARD_INTENTS: CreationCardIntentItem[] = [
  {
    id: "promo",
    label: "Promoção / Preço",
    icon: Tag,
    iconName: "Tag",
    description: "Destaque de produto com preço ou desconto",
    hasPriceByDefault: true,
    offerPlaceholder: "Ex: Vestido Longo Floral ou Picanha 1kg",
  },
  {
    id: "new-arrival",
    label: "Novidade / Coleção",
    icon: Sparkles,
    iconName: "Sparkles",
    description: "Chegada de mercadoria, coleção ou prato novo",
    hasPriceByDefault: false,
    offerPlaceholder: "Ex: Nova Coleção Primavera/Verão chegou!",
  },
  {
    id: "special-date",
    label: "Data Comemorativa",
    icon: Calendar,
    iconName: "Calendar",
    description: "Dia dos Pais, Mães, Natal, Aniversário",
    hasPriceByDefault: false,
    offerPlaceholder: "Ex: Especial Dia dos Pais com presentes únicos",
  },
  {
    id: "announcement",
    label: "Inauguração / Evento",
    icon: Megaphone,
    iconName: "Megaphone",
    description: "Inauguração, reinauguração ou evento especial",
    hasPriceByDefault: false,
    offerPlaceholder: "Ex: Grande Inauguração neste Sábado às 9h!",
  },
  {
    id: "schedule",
    label: "Horário / Aviso",
    icon: Clock,
    iconName: "Clock",
    description: "Horário de feriado, mudança de endereço ou recado",
    hasPriceByDefault: false,
    offerPlaceholder: "Ex: Neste feriado abriremos das 8h às 14h",
  },
  {
    id: "custom",
    label: "Outro (Digitar)",
    icon: PenLine,
    iconName: "PenLine",
    description: "Digite livremente o tipo de card que você quer",
    hasPriceByDefault: false,
    offerPlaceholder: "Ex: Descreva a mensagem principal do seu card",
  },
];

export interface QuickBrandPalette {
  name: string;
  label: string;
  primary: string;
  secondary: string;
  value: string;
  swatches: [string, string];
}

export const QUICK_BRAND_PALETTES: QuickBrandPalette[] = [
  {
    name: "red-yellow",
    label: "Vermelho & Amarelo",
    primary: "#DC2626",
    secondary: "#FACC15",
    value: "Paleta Vermelho e Amarelo",
    swatches: ["#DC2626", "#FACC15"],
  },
  {
    name: "blue-white",
    label: "Azul & Branco",
    primary: "#1D4ED8",
    secondary: "#F8FAFC",
    value: "Paleta Azul Marinho e Branco",
    swatches: ["#1D4ED8", "#F8FAFC"],
  },
  {
    name: "black-gold",
    label: "Preto & Dourado",
    primary: "#09090B",
    secondary: "#F59E0B",
    value: "Paleta Preto e Dourado",
    swatches: ["#09090B", "#F59E0B"],
  },
  {
    name: "green-cream",
    label: "Verde & Creme",
    primary: "#059669",
    secondary: "#FEF3C7",
    value: "Paleta Verde e Creme",
    swatches: ["#059669", "#FEF3C7"],
  },
  {
    name: "pink-light",
    label: "Rosa & Claro",
    primary: "#E11D48",
    secondary: "#FFF1F2",
    value: "Paleta Rosa Suave e Fundo Claro",
    swatches: ["#E11D48", "#FFF1F2"],
  },
  {
    name: "orange-dark",
    label: "Laranja & Escuro",
    primary: "#EA580C",
    secondary: "#18181B",
    value: "Paleta Laranja Vibrante e Escuro",
    swatches: ["#EA580C", "#18181B"],
  },
];

export const CREATION_CATALOG: Record<BusinessSegment, CreationCatalogItem> = {
  fashion: {
    id: "fashion",
    label: "Moda & Roupas",
    icon: Shirt,
    iconName: "Shirt",
    placeholders: {
      businessName: "Boutique Bella Flor",
      offerTitle: "Vestido Midi Canelado Elegance",
      promoPrice: "R$ 89,90",
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
    styles: [
      {
        id: "fashion-boutique",
        name: "Vitrine Elegante",
        tag: "Bege & Vinho",
        color: "from-stone-200 to-rose-100",
        bgPreview: "bg-stone-100",
        badgeBg: "bg-rose-700 text-white",
        badgeText: "DESTAQUE",
        textColor: "text-stone-900",
        paletteSwatches: ["#F5F5F4", "#BE123C", "#1C1917"],
        layoutType: "clean-frame",
      },
      {
        id: "fashion-modern",
        name: "Luxo Escuro",
        tag: "Preto & Dourado",
        color: "from-zinc-900 to-stone-950",
        bgPreview: "bg-zinc-950",
        badgeBg: "bg-amber-500 text-black",
        badgeText: "EXCLUSIVO",
        textColor: "text-white",
        paletteSwatches: ["#09090B", "#F59E0B", "#FFFFFF"],
        layoutType: "dark-premium",
      },
      {
        id: "fashion-vibrant",
        name: "Moda Vibrante",
        tag: "Pink & Amarelo",
        color: "from-pink-500 to-purple-600",
        bgPreview: "bg-gradient-to-br from-pink-600 to-purple-700",
        badgeBg: "bg-yellow-300 text-purple-950",
        badgeText: "NOVIDADE",
        textColor: "text-white",
        paletteSwatches: ["#DB2777", "#FDE047", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
      {
        id: "fashion-bazaar",
        name: "Super Liquidação",
        tag: "Vermelho & Ouro",
        color: "from-red-600 to-orange-500",
        bgPreview: "bg-gradient-to-br from-red-600 to-orange-600",
        badgeBg: "bg-yellow-400 text-red-950",
        badgeText: "QUEIMA TOTAL",
        textColor: "text-white",
        paletteSwatches: ["#DC2626", "#FACC15", "#FFFFFF"],
        layoutType: "bold-offer",
      },
      {
        id: "fashion-terracotta",
        name: "Terracota & Linho",
        tag: "Tons Terrosos",
        color: "from-orange-800 to-amber-900",
        bgPreview: "bg-gradient-to-b from-amber-800 to-stone-900",
        badgeBg: "bg-amber-200 text-stone-950",
        badgeText: "COLEÇÃO",
        textColor: "text-white",
        paletteSwatches: ["#92400E", "#FDE68A", "#FFFFFF"],
        layoutType: "dark-premium",
      },
      {
        id: "fashion-denim",
        name: "Azul Casual",
        tag: "Azul & Branco",
        color: "from-blue-800 to-indigo-950",
        bgPreview: "bg-gradient-to-b from-blue-800 to-slate-900",
        badgeBg: "bg-sky-300 text-slate-950",
        badgeText: "ESTILO",
        textColor: "text-white",
        paletteSwatches: ["#1E40AF", "#7DD3FC", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
    ],
  },

  supermarket: {
    id: "supermarket",
    label: "Supermercado & Feira",
    icon: ShoppingCart,
    iconName: "ShoppingCart",
    placeholders: {
      businessName: "Supermercado Compre Bem",
      offerTitle: "Picanha Fatiada Resfriada 1kg",
      promoPrice: "R$ 49,90",
    },
    defaultPlaceholders: {
      businessName: "Supermercado Compre Bem",
      offerTitle: "Picanha Fatiada Resfriada 1kg",
      promoPrice: "R$ 49,90",
    },
    intentExamples: {
      promo: [
        { title: "Picanha Fatiada Resfriada 1kg", price: "R$ 49,90" },
        { title: "Leite Integral UHT 1L", price: "R$ 4,29" },
      ],
      "new-arrival": [
        { title: "Chegou Queijo Minas Frescal da Canastra" },
        { title: "Frutas Selecionadas Acabaram de Chegar" },
      ],
      "special-date": [
        { title: "Festival de Páscoa: Ovos & Chocolates com Super Desconto" },
        { title: "Especial de Natal: Aves Natalinas e Panetones" },
      ],
      announcement: [
        { title: "Inauguração Nova Unidade Bairro Central" },
        { title: "Novo Setor de Hortifrúti Orgânico Aberto!" },
      ],
      schedule: [
        { title: "Neste feriado abriremos das 8h às 14h" },
        { title: "Atendimento Normal no Fim de Semana" },
      ],
      custom: [{ title: "Supermercado Compre Bem informa aos clientes" }],
    },
    styles: [
      {
        id: "market-red",
        name: "Encarte de Oferta",
        tag: "Vermelho & Amarelo",
        color: "from-red-600 to-red-800",
        bgPreview: "bg-gradient-to-b from-red-600 to-red-800",
        badgeBg: "bg-yellow-400 text-red-950",
        badgeText: "OFERTA DO DIA",
        textColor: "text-white",
        paletteSwatches: ["#DC2626", "#FACC15", "#FFFFFF"],
        layoutType: "bold-offer",
      },
      {
        id: "market-fresh",
        name: "Feira & Hortifrúti",
        tag: "Verde & Lima",
        color: "from-emerald-600 to-teal-700",
        bgPreview: "bg-gradient-to-b from-emerald-700 to-teal-900",
        badgeBg: "bg-lime-300 text-emerald-950",
        badgeText: "FRESQUINHO",
        textColor: "text-white",
        paletteSwatches: ["#047857", "#BEF264", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
      {
        id: "market-clean",
        name: "Empório & Padaria",
        tag: "Creme & Café",
        color: "from-amber-100 to-orange-100",
        bgPreview: "bg-amber-50",
        badgeBg: "bg-amber-800 text-white",
        badgeText: "ESPECIAL",
        textColor: "text-amber-950",
        paletteSwatches: ["#FFFBEB", "#92400E", "#451A03"],
        layoutType: "clean-frame",
      },
      {
        id: "market-dark",
        name: "Açougue & Churrasco",
        tag: "Preto & Brasa",
        color: "from-stone-900 to-zinc-950",
        bgPreview: "bg-stone-950",
        badgeBg: "bg-orange-500 text-white",
        badgeText: "PREMIUM",
        textColor: "text-white",
        paletteSwatches: ["#0C0A09", "#F97316", "#FFFFFF"],
        layoutType: "dark-premium",
      },
      {
        id: "market-blue",
        name: "Atacadão Azul",
        tag: "Azul & Amarelo",
        color: "from-blue-700 to-blue-950",
        bgPreview: "bg-gradient-to-b from-blue-700 to-blue-950",
        badgeBg: "bg-yellow-400 text-blue-950",
        badgeText: "PREÇO BAIXO",
        textColor: "text-white",
        paletteSwatches: ["#1D4ED8", "#FACC15", "#FFFFFF"],
        layoutType: "bold-offer",
      },
      {
        id: "market-orange",
        name: "Oferta Relâmpago",
        tag: "Laranja & Branco",
        color: "from-orange-500 to-red-600",
        bgPreview: "bg-gradient-to-br from-orange-500 to-red-700",
        badgeBg: "bg-white text-red-700",
        badgeText: "SÓ HOJE",
        textColor: "text-white",
        paletteSwatches: ["#F97316", "#FFFFFF", "#991B1B"],
        layoutType: "vibrant-pop",
      },
    ],
  },

  pizzeria: {
    id: "pizzeria",
    label: "Pizzaria",
    icon: Pizza,
    iconName: "Pizza",
    placeholders: {
      businessName: "Pizzaria Forno a Lenha",
      offerTitle: "Pizza Grande Calabresa + Refri 2L",
      promoPrice: "R$ 49,90",
    },
    defaultPlaceholders: {
      businessName: "Pizzaria Forno a Lenha",
      offerTitle: "Pizza Grande Calabresa + Refri 2L",
      promoPrice: "R$ 49,90",
    },
    intentExamples: {
      promo: [
        { title: "Pizza Grande Calabresa + Refri 2L", price: "R$ 49,90" },
        { title: "Combo 2 Pizzas Grandes + Borda Recheada", price: "R$ 89,90" },
      ],
      "new-arrival": [
        { title: "Novo Sabor: Pizza de Burrata com Pesto e Tomate Confit" },
        { title: "Borda Vulcão de Catupiry Original Já Disponível" },
      ],
      "special-date": [
        { title: "Dia dos Namorados: Noite Romântica da Pizza" },
        { title: "Dia da Pizza: Rodízio com Preço Promocional" },
      ],
      announcement: [
        { title: "Novo Salão Climatizado Aberto para Famílias!" },
        { title: "Inauguração do Espaço Kids na Pizzaria" },
      ],
      schedule: [
        { title: "Horário de Carnaval: Aberto a partir das 18h" },
        { title: "Delivery Funcionando Normal no Domingo" },
      ],
      custom: [{ title: "Pizzaria Forno a Lenha comunica novidades" }],
    },
    styles: [
      {
        id: "pizza-rustic",
        name: "Forno a Lenha",
        tag: "Preto & Âmbar",
        color: "from-stone-900 to-amber-950",
        bgPreview: "bg-stone-950",
        badgeBg: "bg-amber-500 text-black",
        badgeText: "ARTESANAL",
        textColor: "text-white",
        paletteSwatches: ["#0C0A09", "#F59E0B", "#FFFFFF"],
        layoutType: "dark-premium",
      },
      {
        id: "pizza-italian",
        name: "Cantina Italiana",
        tag: "Vermelho & Verde",
        color: "from-red-700 to-stone-800",
        bgPreview: "bg-gradient-to-b from-red-700 to-red-950",
        badgeBg: "bg-emerald-500 text-white",
        badgeText: "DELIVERY",
        textColor: "text-white",
        paletteSwatches: ["#B91C1C", "#10B981", "#FFFFFF"],
        layoutType: "bold-offer",
      },
      {
        id: "pizza-clean",
        name: "Cardápio Claro",
        tag: "Creme & Vermelho",
        color: "from-orange-50 to-amber-100",
        bgPreview: "bg-orange-50",
        badgeBg: "bg-red-600 text-white",
        badgeText: "HOJE TEM",
        textColor: "text-stone-900",
        paletteSwatches: ["#FFF7ED", "#DC2626", "#1C1917"],
        layoutType: "clean-frame",
      },
      {
        id: "pizza-party",
        name: "Super Combo",
        tag: "Laranja & Amarelo",
        color: "from-orange-500 to-red-600",
        bgPreview: "bg-gradient-to-br from-orange-500 to-red-600",
        badgeBg: "bg-yellow-300 text-red-950",
        badgeText: "COMBO",
        textColor: "text-white",
        paletteSwatches: ["#F97316", "#FDE047", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
      {
        id: "pizza-wine",
        name: "Noite da Pizza",
        tag: "Vinho & Dourado",
        color: "from-rose-950 to-stone-950",
        bgPreview: "bg-gradient-to-b from-rose-950 to-stone-950",
        badgeBg: "bg-amber-400 text-rose-950",
        badgeText: "ESPECIAL",
        textColor: "text-white",
        paletteSwatches: ["#4C0519", "#FBBF24", "#FFFFFF"],
        layoutType: "dark-premium",
      },
      {
        id: "pizza-basil",
        name: "Manjericão Fresco",
        tag: "Verde & Ouro",
        color: "from-emerald-900 to-stone-950",
        bgPreview: "bg-gradient-to-b from-emerald-900 to-stone-950",
        badgeBg: "bg-amber-300 text-emerald-950",
        badgeText: "FORNADA",
        textColor: "text-white",
        paletteSwatches: ["#064E3B", "#FDE68A", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
    ],
  },

  "burger-shop": {
    id: "burger-shop",
    label: "Hamburgueria",
    icon: Flame,
    iconName: "Flame",
    placeholders: {
      businessName: "Bravo Burger Artesanal",
      offerTitle: "Duplo Cheddar Bacon + Batata",
      promoPrice: "R$ 34,90",
    },
    defaultPlaceholders: {
      businessName: "Bravo Burger Artesanal",
      offerTitle: "Duplo Cheddar Bacon + Batata",
      promoPrice: "R$ 34,90",
    },
    intentExamples: {
      promo: [
        { title: "Duplo Cheddar Bacon + Batata", price: "R$ 34,90" },
        {
          title: "Combo Família: 3 Burgers + Batata Rústica",
          price: "R$ 79,90",
        },
      ],
      "new-arrival": [
        { title: "Novo Smash Burger com Molho Trufado" },
        { title: "Chegou o Monster Bacon com 3 Carnes Artesanais" },
      ],
      "special-date": [
        { title: "Semana do Hambúrguer com Brinde Exclusivo" },
        { title: "Dia dos Pais: Ganhe Chopp na Compra do Combo" },
      ],
      announcement: [
        { title: "Nova Hamburgueria no Centro da Cidade!" },
        { title: "Agora com Delivery Próprio sem Taxa de Entrega" },
      ],
      schedule: [
        { title: "Horário de Funcionamento: Terça a Domingo a partir das 18h" },
        { title: "Aberto Especialmente no Feriado" },
      ],
      custom: [{ title: "Bravo Burger Artesanal comunica aos clientes" }],
    },
    styles: [
      {
        id: "burger-dark",
        name: "Artesanal Dark",
        tag: "Preto & Cheddar",
        color: "from-stone-900 to-black",
        bgPreview: "bg-zinc-950",
        badgeBg: "bg-amber-500 text-black",
        badgeText: "SMASH BURGER",
        textColor: "text-white",
        paletteSwatches: ["#09090B", "#F59E0B", "#FFFFFF"],
        layoutType: "dark-premium",
      },
      {
        id: "burger-fire",
        name: "Brasa & Fogo",
        tag: "Laranja & Amarelo",
        color: "from-orange-600 to-red-800",
        bgPreview: "bg-gradient-to-b from-orange-600 to-red-900",
        badgeBg: "bg-yellow-400 text-black",
        badgeText: "MATADOR",
        textColor: "text-white",
        paletteSwatches: ["#EA580C", "#FACC15", "#FFFFFF"],
        layoutType: "bold-offer",
      },
      {
        id: "burger-neon",
        name: "Urbano & Jovem",
        tag: "Roxo & Pink",
        color: "from-purple-700 to-indigo-950",
        bgPreview: "bg-gradient-to-br from-purple-800 to-slate-950",
        badgeBg: "bg-pink-500 text-white",
        badgeText: "NOVO",
        textColor: "text-white",
        paletteSwatches: ["#6B21A8", "#EC4899", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
      {
        id: "burger-retro",
        name: "Lanchonete Clássica",
        tag: "Creme & Vermelho",
        color: "from-amber-50 to-orange-100",
        bgPreview: "bg-amber-50",
        badgeBg: "bg-red-600 text-white",
        badgeText: "COMBO",
        textColor: "text-stone-900",
        paletteSwatches: ["#FFFBEB", "#DC2626", "#1C1917"],
        layoutType: "clean-frame",
      },
      {
        id: "burger-mustard",
        name: "Cheddar & Ketchup",
        tag: "Amarelo & Vermelho",
        color: "from-amber-400 to-orange-500",
        bgPreview: "bg-gradient-to-b from-amber-400 to-orange-500",
        badgeBg: "bg-red-700 text-white",
        badgeText: "SUPER COMBO",
        textColor: "text-stone-950",
        paletteSwatches: ["#FBBF24", "#B91C1C", "#1C1917"],
        layoutType: "bold-offer",
      },
      {
        id: "burger-texas",
        name: "Texas Defumado",
        tag: "Marrom & Brasa",
        color: "from-amber-950 to-stone-950",
        bgPreview: "bg-gradient-to-b from-amber-950 to-stone-950",
        badgeBg: "bg-orange-500 text-white",
        badgeText: "BBQ",
        textColor: "text-white",
        paletteSwatches: ["#451A03", "#F97316", "#FFFFFF"],
        layoutType: "dark-premium",
      },
    ],
  },

  "beauty-salon": {
    id: "beauty-salon",
    label: "Salão & Barbearia",
    icon: Sparkles,
    iconName: "Sparkles",
    placeholders: {
      businessName: "Espaço Bella & Barber",
      offerTitle: "Corte + Barboterapia ou Escova",
      promoPrice: "R$ 65,00",
    },
    defaultPlaceholders: {
      businessName: "Espaço Bella & Barber",
      offerTitle: "Corte + Barboterapia ou Escova",
      promoPrice: "R$ 65,00",
    },
    intentExamples: {
      promo: [
        { title: "Corte + Barboterapia ou Escova", price: "R$ 65,00" },
        { title: "Cronograma Capilar Completo", price: "R$ 120,00" },
      ],
      "new-arrival": [
        { title: "Nova Técnica de Mechas Iluminadas sem Danos" },
        { title: "Tratamento de Ozonioterapia Capilar Já Disponível" },
      ],
      "special-date": [
        { title: "Dia da Noiva e Debutante: Pacote Especial" },
        { title: "Dia dos Pais: Combo Pai e Filho no Barber" },
      ],
      announcement: [
        { title: "Inauguração do Nosso Novo Espaço VIP Climatizado" },
        { title: "Nova Profissional Especialista em Loiros no Salão" },
      ],
      schedule: [
        { title: "Agenda Aberta para o Fim de Ano — Garanta seu Horário" },
        { title: "Atendimento Especial aos Domingos de Dezembro" },
      ],
      custom: [{ title: "Espaço Bella & Barber comunica aos clientes" }],
    },
    styles: [
      {
        id: "beauty-rose",
        name: "Estética & Suavidade",
        tag: "Rose & Vinho",
        color: "from-rose-100 to-pink-50",
        bgPreview: "bg-rose-50",
        badgeBg: "bg-rose-600 text-white",
        badgeText: "BELEZA",
        textColor: "text-rose-950",
        paletteSwatches: ["#FFF1F2", "#E11D48", "#4C0519"],
        layoutType: "clean-frame",
      },
      {
        id: "beauty-gold",
        name: "Salão & Barber VIP",
        tag: "Preto & Dourado",
        color: "from-stone-900 to-zinc-950",
        bgPreview: "bg-zinc-950",
        badgeBg: "bg-amber-500 text-black",
        badgeText: "AGENDA ABERTA",
        textColor: "text-white",
        paletteSwatches: ["#09090B", "#F59E0B", "#FFFFFF"],
        layoutType: "dark-premium",
      },
      {
        id: "beauty-vibrant",
        name: "Moderno & Colorido",
        tag: "Pink & Branco",
        color: "from-fuchsia-600 to-rose-600",
        bgPreview: "bg-gradient-to-br from-fuchsia-600 to-rose-600",
        badgeBg: "bg-white text-fuchsia-900",
        badgeText: "PROMO",
        textColor: "text-white",
        paletteSwatches: ["#C026D3", "#FFFFFF", "#F43F5E"],
        layoutType: "vibrant-pop",
      },
      {
        id: "beauty-promo",
        name: "Destaque Quente",
        tag: "Âmbar & Amarelo",
        color: "from-amber-600 to-red-700",
        bgPreview: "bg-gradient-to-b from-amber-600 to-red-800",
        badgeBg: "bg-yellow-300 text-black",
        badgeText: "ESPECIAL",
        textColor: "text-white",
        paletteSwatches: ["#D97706", "#FDE047", "#FFFFFF"],
        layoutType: "bold-offer",
      },
      {
        id: "beauty-barber-navy",
        name: "Barbearia Clássica",
        tag: "Azul Marinho & Ouro",
        color: "from-slate-900 to-blue-950",
        bgPreview: "bg-gradient-to-b from-slate-900 to-blue-950",
        badgeBg: "bg-amber-400 text-slate-950",
        badgeText: "BARBER SHOP",
        textColor: "text-white",
        paletteSwatches: ["#0F172A", "#FBBF24", "#FFFFFF"],
        layoutType: "dark-premium",
      },
      {
        id: "beauty-spa",
        name: "Spa & Bem-Estar",
        tag: "Verde & Menta",
        color: "from-teal-800 to-emerald-950",
        bgPreview: "bg-gradient-to-b from-teal-800 to-emerald-950",
        badgeBg: "bg-emerald-200 text-teal-950",
        badgeText: "CUIDADO",
        textColor: "text-white",
        paletteSwatches: ["#115E59", "#A7F3D0", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
    ],
  },

  restaurant: {
    id: "restaurant",
    label: "Restaurante & Marmitex",
    icon: UtensilsCrossed,
    iconName: "UtensilsCrossed",
    placeholders: {
      businessName: "Restaurante Sabor Caseiro",
      offerTitle: "Prato Executivo Filé de Frango",
      promoPrice: "R$ 22,90",
    },
    defaultPlaceholders: {
      businessName: "Restaurante Sabor Caseiro",
      offerTitle: "Prato Executivo Filé de Frango",
      promoPrice: "R$ 22,90",
    },
    intentExamples: {
      promo: [
        { title: "Prato Executivo Filé de Frango", price: "R$ 22,90" },
        { title: "Marmitex Grande com 2 Carnes", price: "R$ 24,90" },
      ],
      "new-arrival": [
        { title: "Novo Cardápio de Massas Artesanais da Nonna" },
        { title: "Chegou Sobremesa Especial: Pudim de Leite Ninho" },
      ],
      "special-date": [
        { title: "Almoço Especial de Dia dos Pais com Música ao Vivo" },
        { title: "Ceia de Réveillon: Faça sua Encomenda" },
      ],
      announcement: [
        { title: "Agora com Buffet de Saladas e Pratos Quentes por Quilo!" },
        { title: "Inauguração do Espaço Externo com Jardim" },
      ],
      schedule: [
        { title: "Horário de Atendimento no Feriado: 11h às 15h" },
        { title: "Almoço Executivo de Segunda a Sábado" },
      ],
      custom: [{ title: "Restaurante Sabor Caseiro comunica aos clientes" }],
    },
    styles: [
      {
        id: "rest-homestyle",
        name: "Sabor Caseiro",
        tag: "Laranja & Amarelo",
        color: "from-amber-600 to-orange-800",
        bgPreview: "bg-gradient-to-b from-amber-700 to-orange-900",
        badgeBg: "bg-yellow-400 text-amber-950",
        badgeText: "ALMOÇO DE HOJE",
        textColor: "text-white",
        paletteSwatches: ["#B45309", "#FACC15", "#FFFFFF"],
        layoutType: "bold-offer",
      },
      {
        id: "rest-clean",
        name: "Cardápio Limpo",
        tag: "Claro & Verde",
        color: "from-stone-100 to-amber-50",
        bgPreview: "bg-stone-100",
        badgeBg: "bg-emerald-700 text-white",
        badgeText: "FRESQUINHO",
        textColor: "text-stone-900",
        paletteSwatches: ["#F5F5F4", "#047857", "#1C1917"],
        layoutType: "clean-frame",
      },
      {
        id: "rest-dark",
        name: "Gourmet & Jantar",
        tag: "Preto & Dourado",
        color: "from-zinc-900 to-stone-950",
        bgPreview: "bg-zinc-950",
        badgeBg: "bg-amber-500 text-black",
        badgeText: "CHEF",
        textColor: "text-white",
        paletteSwatches: ["#09090B", "#F59E0B", "#FFFFFF"],
        layoutType: "dark-premium",
      },
      {
        id: "rest-buffet",
        name: "Delivery Rápido",
        tag: "Vermelho & Ouro",
        color: "from-red-600 to-orange-500",
        bgPreview: "bg-gradient-to-br from-red-600 to-orange-500",
        badgeBg: "bg-yellow-300 text-red-950",
        badgeText: "PEÇA JÁ",
        textColor: "text-white",
        paletteSwatches: ["#DC2626", "#FDE047", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
      {
        id: "rest-herbs",
        name: "Temperos & Ervas",
        tag: "Verde & Laranja",
        color: "from-green-800 to-emerald-950",
        bgPreview: "bg-gradient-to-b from-green-800 to-emerald-950",
        badgeBg: "bg-orange-400 text-stone-950",
        badgeText: "CASEIRO",
        textColor: "text-white",
        paletteSwatches: ["#166534", "#FB923C", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
      {
        id: "rest-bistro",
        name: "Bistrô Acolhedor",
        tag: "Vinho & Creme",
        color: "from-red-900 to-stone-950",
        bgPreview: "bg-gradient-to-b from-red-950 to-stone-950",
        badgeBg: "bg-amber-200 text-red-950",
        badgeText: "ESPECIAL",
        textColor: "text-white",
        paletteSwatches: ["#7F1D1D", "#FDE68A", "#FFFFFF"],
        layoutType: "dark-premium",
      },
    ],
  },

  "local-retail": {
    id: "local-retail",
    label: "Outros Comércios",
    icon: Store,
    iconName: "Store",
    placeholders: {
      businessName: "Comércio Central",
      offerTitle: "Grande Oferta da Semana",
      promoPrice: "R$ 49,90",
    },
    defaultPlaceholders: {
      businessName: "Comércio Central",
      offerTitle: "Grande Oferta da Semana",
      promoPrice: "R$ 49,90",
    },
    intentExamples: {
      promo: [
        { title: "Grande Oferta da Semana", price: "R$ 49,90" },
        { title: "Desconto Especial de 30% em Toda a Loja", price: "R$ 69,90" },
      ],
      "new-arrival": [
        { title: "Novidades em Estoque Chegando Hoje!" },
        { title: "Novos Produtos Acabaram de Chegar na Loja" },
      ],
      "special-date": [
        { title: "Semana do Consumidor com Descontos Especiais" },
        { title: "Aniversário da Loja com Prêmios e Ofertas" },
      ],
      announcement: [
        { title: "Reinauguração com Coquetel Especial neste Sábado!" },
        { title: "Mudança de Endereço para Novo Ponto Central" },
      ],
      schedule: [
        { title: "Horário Especial de Atendimento neste Feriado" },
        { title: "Atendimento aos Sábados das 9h às 18h" },
      ],
      custom: [{ title: "Comércio Central comunica aos seus clientes" }],
    },
    styles: [
      {
        id: "retail-clean",
        name: "Institucional Limpo",
        tag: "Fundo Claro & Azul",
        color: "from-slate-100 to-blue-50",
        bgPreview: "bg-slate-100",
        badgeBg: "bg-blue-700 text-white",
        badgeText: "COMUNICADO",
        textColor: "text-slate-900",
        paletteSwatches: ["#F1F5F9", "#1D4ED8", "#0F172A"],
        layoutType: "clean-frame",
      },
      {
        id: "retail-promo",
        name: "Varejo de Impacto",
        tag: "Vermelho & Amarelo",
        color: "from-red-600 to-orange-600",
        bgPreview: "bg-gradient-to-b from-red-600 to-orange-700",
        badgeBg: "bg-yellow-400 text-red-950",
        badgeText: "SUPER OFERTA",
        textColor: "text-white",
        paletteSwatches: ["#DC2626", "#FACC15", "#FFFFFF"],
        layoutType: "bold-offer",
      },
      {
        id: "retail-modern",
        name: "Moderno Escuro",
        tag: "Preto & Celeste",
        color: "from-slate-900 to-zinc-950",
        bgPreview: "bg-slate-950",
        badgeBg: "bg-sky-400 text-slate-950",
        badgeText: "DESTAQUE",
        textColor: "text-white",
        paletteSwatches: ["#020617", "#38BDF8", "#FFFFFF"],
        layoutType: "dark-premium",
      },
      {
        id: "retail-festive",
        name: "Comemorativo & Vibrante",
        tag: "Roxo & Amarelo",
        color: "from-indigo-600 to-purple-700",
        bgPreview: "bg-gradient-to-br from-indigo-600 to-purple-700",
        badgeBg: "bg-amber-300 text-indigo-950",
        badgeText: "NOVIDADE",
        textColor: "text-white",
        paletteSwatches: ["#4F46E5", "#FCD34D", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
      {
        id: "retail-trust",
        name: "Azul Confiança",
        tag: "Azul Marinho & Ouro",
        color: "from-blue-800 to-blue-950",
        bgPreview: "bg-gradient-to-b from-blue-800 to-blue-950",
        badgeBg: "bg-yellow-400 text-blue-950",
        badgeText: "QUALIDADE",
        textColor: "text-white",
        paletteSwatches: ["#1E40AF", "#FACC15", "#FFFFFF"],
        layoutType: "bold-offer",
      },
      {
        id: "retail-green",
        name: "Verde Economia",
        tag: "Verde & Amarelo",
        color: "from-emerald-700 to-teal-900",
        bgPreview: "bg-gradient-to-b from-emerald-700 to-teal-900",
        badgeBg: "bg-yellow-300 text-emerald-950",
        badgeText: "OPORTUNIDADE",
        textColor: "text-white",
        paletteSwatches: ["#047857", "#FDE047", "#FFFFFF"],
        layoutType: "vibrant-pop",
      },
    ],
  },
};

/**
 * Retorna os metadados completos de um segmento comercial.
 */
export function getCreationSegment(
  segmentId: BusinessSegment,
): CreationCatalogItem {
  const item = CREATION_CATALOG[segmentId];
  if (!item) {
    return CREATION_CATALOG.fashion;
  }
  return item;
}

/**
 * Retorna lista de todos os 7 segmentos comerciais na ordem canônica.
 */
export function getAllCreationSegments(): CreationCatalogItem[] {
  return Object.values(CREATION_CATALOG);
}

/**
 * Retorna os 6 estilos visuais de um segmento comercial específico.
 */
export function getSegmentStyles(
  segmentId: BusinessSegment,
): StyleVisualOption[] {
  const segment = getCreationSegment(segmentId);
  return segment.styles;
}

/**
 * Busca um estilo específico pelo seu ID em todo o catálogo.
 */
export function getCreationStyleById(
  styleId: string,
): StyleVisualOption | undefined {
  for (const segment of Object.values(CREATION_CATALOG)) {
    const found = segment.styles.find((s) => s.id === styleId);
    if (found) {
      return found;
    }
  }
  return undefined;
}
