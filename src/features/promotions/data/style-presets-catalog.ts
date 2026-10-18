import type { BusinessSegment } from "./offer-brief.schema";

export type LayoutVariant =
  | "retail-burst"
  | "fresh-organic"
  | "dark-luxury"
  | "rustic-wood"
  | "clean-minimal"
  | "neon-urban";

export interface StyleMockupSpec {
  layoutVariant: LayoutVariant;
  badgeText: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

export interface ArtDirectionDirective {
  palette: string;
  composition: string;
  lighting: string;
  atmosphere: string;
}

export interface CuratedStylePreset {
  id: string;
  segment: BusinessSegment;
  label: string;
  description: string;
  tags: string[];
  previewBadgeColor: string;
  accentColor: string;
  mockup: StyleMockupSpec;
  artDirection: ArtDirectionDirective;
}

const CANONICAL_STYLE_PRESETS: Record<
  BusinessSegment,
  [
    CuratedStylePreset,
    CuratedStylePreset,
    CuratedStylePreset,
    CuratedStylePreset,
  ]
> = {
  supermarket: [
    {
      id: "market-discount",
      segment: "supermarket",
      label: "Super Encarte Amarelo & Vermelho",
      description:
        "Estilo clássico de varejo agressivo com alto contraste, selos gráficos explosivos e destaque máximo para preço promocional.",
      tags: ["Amarelo & Vermelho", "Super Desconto", "Varejo Agressivo"],
      previewBadgeColor: "#EF4444",
      accentColor: "#FBBF24",
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "SUPER OFERTA",
        bgColor: "#EF4444",
        textColor: "#FFFFFF",
        accentColor: "#FBBF24",
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
      mockup: {
        layoutVariant: "fresh-organic",
        badgeText: "FRESCO",
        bgColor: "#047857",
        textColor: "#FFFFFF",
        accentColor: "#10B981",
      },
      artDirection: {
        palette:
          "Verde esmeralda (#10B981), Verde floresta profundo (#047857), tons terrosos suaves e Branco natural.",
        composition:
          "Composição orgânica e equilibrada, elementos botânicos sutis, tábua ou bancada de madeira clara ao fundo e produto com gotas d'água de frescor.",
        lighting:
          "Luz natural difusa da manhã, raios suaves de sol lateral simulando ambiente aberto de feira e frescor matinal.",
        atmosphere:
          "Colheita do dia, saúde, procedência garantida, hortifrúti selecionado e bem-estar.",
      },
    },
    {
      id: "market-premium",
      segment: "supermarket",
      label: "Empório Gourmet & Carnes Nobres",
      description:
        "Fundo escuro texturizado e iluminação cinematográfica quente, destacando carnes selecionadas e produtos premium.",
      tags: ["Dark Gourmet", "Carnes Nobres", "Sofisticado"],
      previewBadgeColor: "#1F2937",
      accentColor: "#F59E0B",
      mockup: {
        layoutVariant: "dark-luxury",
        badgeText: "PREMIUM",
        bgColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#F59E0B",
      },
      artDirection: {
        palette:
          "Preto carvão profundo (#111827), Grafite texturizado (#1F2937), Dourado âmbar (#F59E0B) e acentos em cobre.",
        composition:
          "Enquadramento cinematográfico, tábua de madeira escura nobre ou pedra ardósia, cortes selecionados e tipografia serifada ou geométrica de luxo.",
        lighting:
          "Iluminação dramática de baixa tonalidade (low-key) com holofote quente e pontual (rim light dourado) realçando a textura do produto.",
        atmosphere:
          "Exclusividade gastronômica, cortes nobres maturados, empório gourmet e padrão premium de açougue boutique.",
      },
    },
    {
      id: "market-daily",
      segment: "supermarket",
      label: "Ofertas do Dia & Sacolão",
      description:
        "Laranja vibrante e amarelo direto ao ponto, perfeito para ofertas diárias de sacolão e feirão da economia.",
      tags: ["Laranja Vibrante", "Oferta Diária", "Sacolão da Semana"],
      previewBadgeColor: "#F97316",
      accentColor: "#FDE047",
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "OFERTA DO DIA",
        bgColor: "#EA580C",
        textColor: "#FFFFFF",
        accentColor: "#FDE047",
      },
      artDirection: {
        palette:
          "Laranja vibrante (#F97316), Amarelo solar (#FDE047) e Branco (#FFFFFF) de alto impacto visual.",
        composition:
          "Grid claro e dinâmico de sacolão, selo circular 'Oferta do Dia' em destaque, caixa ou cesto de feira com produtos coloridos em alta nitidez.",
        lighting:
          "Luz solar quente e direta, saturação de cores vivas e alto brilho destacando o apetite e frescor diário.",
        atmosphere:
          "Economia do dia a dia, dinamismo de sacolão de bairro, oportunidade rápida e consumo consciente.",
      },
    },
  ],
  "beauty-salon": [
    {
      id: "salon-glamour",
      segment: "beauty-salon",
      label: "Glamour Rose Gold & Editorial",
      description:
        "Rose gold elegante, tipografia editorial fina e visual de revista de moda e beleza feminina.",
      tags: ["Rose Gold", "Elegância Feminina", "Editorial de Moda"],
      previewBadgeColor: "#EC4899",
      accentColor: "#F43F5E",
      mockup: {
        layoutVariant: "clean-minimal",
        badgeText: "GLAMOUR",
        bgColor: "#831843",
        textColor: "#FFFFFF",
        accentColor: "#EC4899",
      },
      artDirection: {
        palette:
          "Rose Gold perolado (#EC4899), Rosa champanhe (#F43F5E), Branco marmorizado e Dourado suave.",
        composition:
          "Composição minimalista e editorial, muito respiro visual, texturas sutis de mármore branco com veios dourados, tipografia moderna de revista de beleza.",
        lighting:
          "Iluminação de estúdio beauty softbox, sem sombras duras, reflexos cintilantes e suaves em detalhes metálicos.",
        atmosphere:
          "Transformação pessoal, sofisticação, glamour refinado, autoestima radiante e tratamento VIP.",
      },
    },
    {
      id: "barber-vintage",
      segment: "beauty-salon",
      label: "Barber Club Retrô & Couro",
      description:
        "Madeira escura, couro envelhecido, iluminação quente e estética clássica de barbearia tradicional.",
      tags: ["Vintage", "Barba & Cabelo", "Retrô Tradicional"],
      previewBadgeColor: "#78350F",
      accentColor: "#D97706",
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "RETRÔ",
        bgColor: "#78350F",
        textColor: "#FFFFFF",
        accentColor: "#D97706",
      },
      artDirection: {
        palette:
          "Marrom couro envelhecido (#78350F), Dourado âmbar (#D97706), Preto fosco e Bege vintage.",
        composition:
          "Estética vintage clássica, texturas de tijolo aparente ou madeira escura, navalha e tesoura estilizadas em marca d'água decorativa, tipografia retrô forte.",
        lighting:
          "Luz incandescente suave em tons de tungstênio, contraste quente e acolhedor típico de barbearias tradicionais.",
        atmosphere:
          "Cuidado masculino de respeito, tradição de cavalheiros, artesanato de barba e cabelo, elegância atemporal.",
      },
    },
    {
      id: "beauty-clean",
      segment: "beauty-salon",
      label: "Clean Estética & Spa",
      description:
        "Tons menta, ciano e lavanda, transmitindo pureza, higiene estrita e relaxamento de spa.",
      tags: ["Estética Avançada", "Spa & Bem-Estar", "Clean & Puro"],
      previewBadgeColor: "#6366F1",
      accentColor: "#06B6D4",
      mockup: {
        layoutVariant: "clean-minimal",
        badgeText: "CLEAN & SPA",
        bgColor: "#312E81",
        textColor: "#FFFFFF",
        accentColor: "#6366F1",
      },
      artDirection: {
        palette:
          "Índigo suave (#6366F1), Ciano cristalino (#06B6D4), Menta suave e Branco puro higiênico.",
        composition:
          "Layout arejado e geométrico, linhas finas fluidas, gotas de sérum ou folhas medicinais decorativas, foco em precisão e pureza clínica.",
        lighting:
          "Luz difusa neutra e clara, reflexos límpidos em vidro e cerâmica, transmitindo esterilização e serenidade.",
        atmosphere:
          "Clínica de estética moderna, relaxamento profundo, rejuvenescimento e saúde da pele.",
      },
    },
    {
      id: "barber-modern",
      segment: "beauty-salon",
      label: "Urban Fade & Neon Barber",
      description:
        "Fundo grafite escuro com brilhos neon roxo e ciano, visual jovem para barbearias urbanas e cortes degradê.",
      tags: ["Neon Urbano", "Fade Degradê", "Estilo Jovem"],
      previewBadgeColor: "#0F172A",
      accentColor: "#8B5CF6",
      mockup: {
        layoutVariant: "neon-urban",
        badgeText: "URBAN",
        bgColor: "#0F172A",
        textColor: "#FFFFFF",
        accentColor: "#8B5CF6",
      },
      artDirection: {
        palette:
          "Azul marinho grafite (#0F172A), Roxo elétrico (#8B5CF6), Ciano neon e Preto carvão.",
        composition:
          "Linhas geométricas angulares, brilhos de neon suave em silhuetas, tipografia display moderna com peso e corte esportivo.",
        lighting:
          "Iluminação esportiva contemporânea com luz de contorno em neon roxo e azul, sombras marcadas de estúdio urbano.",
        atmosphere:
          "Cultura urbana streetwear, cortes na régua e degradê impecável, música e dinamismo jovem.",
      },
    },
  ],
  pizzeria: [
    {
      id: "pizza-rustic-wood",
      segment: "pizzeria",
      label: "Forno a Lenha Rústico",
      description:
        "Mesa de madeira rústica, chamas do forno ao fundo, farinha polvilhada e apetite irresistível.",
      tags: ["Forno a Lenha", "Madeira Rústica", "Queijo Derretido"],
      previewBadgeColor: "#B45309",
      accentColor: "#DC2626",
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "FORNO A LENHA",
        bgColor: "#78350F",
        textColor: "#FFFFFF",
        accentColor: "#DC2626",
      },
      artDirection: {
        palette:
          "Terracota queimado (#B45309), Vermelho pomodoro (#DC2626), Madeira rústica escura e Amarelo queijo dourado.",
        composition:
          "Pizza fumegante em primeiro plano sobre tábua de madeira rústica, farinha polvilhada na bancada, queijo derretido esticado e chamas ao fundo desfocadas.",
        lighting:
          "Luz quente dourada emanando de forno a lenha, destacando o brilho do queijo borbulhante e o tostado das bordas.",
        atmosphere:
          "Tradição artesanal, calor de forno a lenha, aconchego gastronômico e sabor inconfundível.",
      },
    },
    {
      id: "pizza-artisan-craft",
      segment: "pizzeria",
      label: "Forneria Artesanal Italiana",
      description:
        "Toque clássico italiano com toalha sutil, folhas de manjericão fresco, fio de azeite e elegância.",
      tags: ["Italiana Clássica", "Manjericão Fresco", "Gourmet"],
      previewBadgeColor: "#DC2626",
      accentColor: "#15803D",
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "ARTESANAL",
        bgColor: "#991B1B",
        textColor: "#FFFFFF",
        accentColor: "#15803D",
      },
      artDirection: {
        palette:
          "Vermelho clássico italiano (#DC2626), Verde manjericão (#15803D), Dourado azeite e Ardósia preta.",
        composition:
          "Prato ou ardósia preta elegante, folhas frescas de manjericão italiano, tomatinhos cereja cortados ao redor, azeite reluzente e tipografia de cantina artesanal refinada.",
        lighting:
          "Iluminação aconchegante de bistrô italiano, luz natural morna destacando frescor dos ingredientes.",
        atmosphere:
          "Autenticidade gastronômica italiana, receita centenária, fermentação natural e sofisticação sem afetação.",
      },
    },
    {
      id: "pizza-neon-night",
      segment: "pizzeria",
      label: "Delivery Noturno Quente",
      description:
        "Contraste escuro profundo com iluminação âmbar e alaranjada, focado em agilidade e delivery noturno.",
      tags: ["Delivery Noturno", "Âmbar & Laranja", "Apetite Rápido"],
      previewBadgeColor: "#18181B",
      accentColor: "#EA580C",
      mockup: {
        layoutVariant: "neon-urban",
        badgeText: "DELIVERY",
        bgColor: "#18181B",
        textColor: "#FFFFFF",
        accentColor: "#EA580C",
      },
      artDirection: {
        palette:
          "Preto fosco noturno (#18181B), Laranja brasa (#EA580C), Amarelo mostarda e Vermelho quente.",
        composition:
          "Pizza aberta em caixa de delivery premium ou suporte moderno, fumaça quente subindo, selo vibrante de entrega rápida e whatsapp em evidência.",
        lighting:
          "Contraste dramático de iluminação noturna, luzes de cidade e lâmpada quente direcionada exatamente sobre o recheio apetitoso.",
        atmosphere:
          "Noite de pizza em casa, velocidade, praticidade de pedir no app e satisfação imediata.",
      },
    },
    {
      id: "pizza-promo-combo",
      segment: "pizzeria",
      label: "Super Combo & Borda Recheada",
      description:
        "Composição vibrante destacando pizza farta acompanhada de refrigerante e borda recheada de catupiry.",
      tags: ["Super Combo", "Refri Grátis", "Borda Recheada"],
      previewBadgeColor: "#EA580C",
      accentColor: "#FACC15",
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "COMBO",
        bgColor: "#C2410C",
        textColor: "#FFFFFF",
        accentColor: "#FACC15",
      },
      artDirection: {
        palette:
          "Laranja chamativo (#EA580C), Amarelo queijo brilhante (#FACC15), Vermelho molho e Branco de destaque.",
        composition:
          "Enquadramento em ângulo de 45 graus mostrando a pizza inteira com fatia levantada puxando queijo, garrafa de refrigerante gelada com gotas de condensação e borda transbordando.",
        lighting:
          "Luz brilhante de publicidade de fast-casual, realce de gotas geladas e queijo suculento.",
        atmosphere:
          "Comemoração com amigos e família, melhor custo-benefício, fartura e alegria gastronômica.",
      },
    },
  ],
  "burger-shop": [
    {
      id: "burger-dark-bold",
      segment: "burger-shop",
      label: "Dark Burger & Fumaça",
      description:
        "Fundo carvão dramático, fumaça quente envolvendo o burger, cheddar cremoso escorrendo e carne alta.",
      tags: ["Dark Gourmet", "Fumaça Quente", "Cheddar Escorrendo"],
      previewBadgeColor: "#111827",
      accentColor: "#F59E0B",
      mockup: {
        layoutVariant: "dark-luxury",
        badgeText: "DARK BURGER",
        bgColor: "#111827",
        textColor: "#FFFFFF",
        accentColor: "#F59E0B",
      },
      artDirection: {
        palette:
          "Preto carvão mineral (#111827), Amarelo cheddar derretido (#F59E0B), Vermelho brasa e Grafite fosco.",
        composition:
          "Close-up macro frontal com hambúrguer imponente de múltiplas carnes empilhadas, cheddar escorrendo pelas laterais, fumaça sutil subindo no fundo escuro e tipografia bold impactante.",
        lighting:
          "Iluminação dramática cinematográfica com luz de recorte dourada destacando a textura suculenta da carne e o brilho do pão brioche.",
        atmosphere:
          "Alta gastronomia de hamburgueria artesanal, poder, apetite irresistível e intensidade sensorial.",
      },
    },
    {
      id: "burger-smash-fire",
      segment: "burger-shop",
      label: "Smash na Chapa & Fogo",
      description:
        "Tons de chama, brasa viva, crostinha caramelizada na chapa de ferro e energia contagiante.",
      tags: ["Smash Burger", "Chapa Quente", "Crostinha & Bacon"],
      previewBadgeColor: "#B45309",
      accentColor: "#EF4444",
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "SMASH FIRE",
        bgColor: "#7C2D12",
        textColor: "#FFFFFF",
        accentColor: "#EF4444",
      },
      artDirection: {
        palette:
          "Terracota brasa (#B45309), Vermelho chama (#EF4444), Amarelo queijo tostado e Aço escovado escuro.",
        composition:
          "Hambúrguer smash prensado com bordas crocantes caramelizadas (Maillard), fatias de bacon crocante, labaredas ou faíscas sutis de fundo e espátula de ferro decorativa.",
        lighting:
          "Luz quente de chapa incandescente, brilho de gordura natural e queijo fundido em close-up hiper-realista.",
        atmosphere:
          "Trabalho autêntico de chapa quente, sabor defumado e caramelizado, agilidade e paixão por burger.",
      },
    },
    {
      id: "burger-urban-pop",
      segment: "burger-shop",
      label: "Street Food Pop & Grafite",
      description:
        "Estilo diner americano moderno, cores pop amarelo e vermelho vibrantes com tipografia jovem e ousada.",
      tags: ["Diner Americano", "Street Pop", "Jovem & Descolado"],
      previewBadgeColor: "#F59E0B",
      accentColor: "#DC2626",
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "STREET POP",
        bgColor: "#B45309",
        textColor: "#FFFFFF",
        accentColor: "#DC2626",
      },
      artDirection: {
        palette:
          "Amarelo mostarda retrô (#F59E0B), Vermelho ketchup vibrante (#DC2626), Branco papel manteiga e Preto.",
        composition:
          "Bandeja estilo lanchonete retrô americana com papel quadriculado, porção de batatas fritas crocantes com cheddar ao lado do burger, adesivos e tipografia pop ousada.",
        lighting:
          "Iluminação aberta, viva e saturada, inspirada em publicidade contemporânea de street food e festivais urbanos.",
        atmosphere:
          "Lanche descolado, encontro de amigos, sabor descomplicado, cultura pop e diversão.",
      },
    },
    {
      id: "burger-artisan-wood",
      segment: "burger-shop",
      label: "Gourmet na Tábua Artesanal",
      description:
        "Tábua de corte rústica, molhos artesanais servidos em ramequins de cerâmica e acompanhamentos rústicos.",
      tags: ["Tábua Rústica", "Molhos da Casa", "Gourmet Artesanal"],
      previewBadgeColor: "#78350F",
      accentColor: "#10B981",
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "GOURMET",
        bgColor: "#451A03",
        textColor: "#FFFFFF",
        accentColor: "#10B981",
      },
      artDirection: {
        palette:
          "Madeira teca escura (#78350F), Verde folha fresca (#10B981), Creme maionese da casa e Terracota.",
        composition:
          "Apresentação de restaurante sobre tábua nobre de madeira rústica, burger cortado ao meio revelando o ponto rosado da carne, batatas rústicas com alecrim e ramequim de molho especial.",
        lighting:
          "Luz natural e acolhedora de bistrô, sombras suaves e texturas palpáveis de madeira, pão e vegetais frescos.",
        atmosphere:
          "Experiência gourmet completa, receita autoral do chef, ingredientes frescos selecionados e requinte artesanal.",
      },
    },
  ],
  restaurant: [
    {
      id: "restaurant-homestyle",
      segment: "restaurant",
      label: "Comidinha Caseira & Aconchego",
      description:
        "Panela de ferro fundido, aroma de comida de vó, temperos frescos da horta e acolhimento familiar.",
      tags: ["Comida Caseira", "Fogão a Lenha", "Tempero de Família"],
      previewBadgeColor: "#D97706",
      accentColor: "#15803D",
      mockup: {
        layoutVariant: "rustic-wood",
        badgeText: "CASEIRO",
        bgColor: "#78350F",
        textColor: "#FFFFFF",
        accentColor: "#15803D",
      },
      artDirection: {
        palette:
          "Amarelo mostarda acolhedor (#D97706), Verde cheiro-verde (#15803D), Castanho cerâmica e Branco toalha de mesa.",
        composition:
          "Panela de ferro tradicional ou travessa de barro fumegante, colher de pau, folhas de louro e pimentas inteiras na bancada de apoio, tipografia calorosa e familiar.",
        lighting:
          "Luz solar acolhedora de fim de manhã entrando pela janela, vapor aromático visível subindo do prato.",
        atmosphere:
          "Afeto de família, sabor de infância, comidinha feita com carinho e tradição brasileira de mesa farta.",
      },
    },
    {
      id: "restaurant-buffet",
      segment: "restaurant",
      label: "Prato Feito Executivo Farto",
      description:
        "Arroz branco soltinho, feijão brilhante, carne macia grelhada, ovo e salada colorida impecável.",
      tags: ["Prato Feito (PF)", "Almoço do Dia", "Fartura Brasileira"],
      previewBadgeColor: "#059669",
      accentColor: "#D97706",
      mockup: {
        layoutVariant: "fresh-organic",
        badgeText: "EXECUTIVO",
        bgColor: "#065F46",
        textColor: "#FFFFFF",
        accentColor: "#D97706",
      },
      artDirection: {
        palette:
          "Verde salada fresca (#059669), Dourado feijão e carnes (#D97706), Branco arroz e Vermelho tomate.",
        composition:
          "Prato farto clássico brasileiro com montagem colorida e apetitosa (arroz, feijão brilhante em concha, bife acebolado ou frango dourado, batata frita e salada de alface e tomate frescos).",
        lighting:
          "Luz clara e natural de restaurante no almoço, destacando o brilho dos grãos de arroz e suculência da carne.",
        atmosphere:
          "Almoço reconfortante de todo dia, energia para a rotina de trabalho, qualidade sem enrolação e ótimo custo-benefício.",
      },
    },
    {
      id: "restaurant-gourmet",
      segment: "restaurant",
      label: "Bistrô & Empratado Fino",
      description:
        "Louça clara de alta gastronomia, talheres requintados, redução de molhos e apresentação artística de chef.",
      tags: ["Bistrô Fino", "Alta Gastronomia", "Menu Degustação"],
      previewBadgeColor: "#334155",
      accentColor: "#E2E8F0",
      mockup: {
        layoutVariant: "dark-luxury",
        badgeText: "BISTRÔ",
        bgColor: "#1E293B",
        textColor: "#FFFFFF",
        accentColor: "#E2E8F0",
      },
      artDirection: {
        palette:
          "Ardósia nobre (#334155), Branco porcelana (#E2E8F0), Vinho tinto profundo e Dourado azeite trufado.",
        composition:
          "Empratamento artístico moderno com gotas e riscos de redução de molho, brotos e microgreens delicados no topo, taça de vinho ao fundo levemente desfocada e tipografia com serifa fina de luxo.",
        lighting:
          "Iluminação pontual e elegante de restaurante Michelin, foco nítido na joia gastronômica e penumbra sofisticada ao redor.",
        atmosphere:
          "Jantar inesquecível, comemoração romântica ou executiva, sofisticação culinária e excelência no serviço.",
      },
    },
    {
      id: "restaurant-delivery",
      segment: "restaurant",
      label: "Marmita Express do Dia",
      description:
        "Embalagem moderna selada ou marmita tradicional farta, pronta para entrega rápida no almoço de trabalho.",
      tags: ["Marmita Delivery", "Entrega Rápida", "Almoço na Firma"],
      previewBadgeColor: "#EA580C",
      accentColor: "#F59E0B",
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "MARMITA EXPRESS",
        bgColor: "#9A3412",
        textColor: "#FFFFFF",
        accentColor: "#F59E0B",
      },
      artDirection: {
        palette:
          "Laranja entrega rápida (#EA580C), Amarelo energia (#F59E0B), Verde ervas e Branco lacre de segurança.",
        composition:
          "Embalagem box moderna de almoço ou marmitex bem estruturado aberto revelando divisórias fartas e organizadas, selo de 'Feito Hoje' e botão de pedir no WhatsApp.",
        lighting:
          "Luz comercial brilhante e transparente, transmitindo higiene impecável e refeição quente recém-preparada.",
        atmosphere:
          "Solução prática para o almoço do dia a dia, comida de verdade na comodidade do escritório ou de casa.",
      },
    },
  ],
  "local-retail": [
    {
      id: "retail-vibrant",
      segment: "local-retail",
      label: "Varejo Dinâmico & Amigável",
      description:
        "Azul e amarelo convidativo para lojas de bairro, pet shops, artigos para o lar e papelarias.",
      tags: ["Varejo Amigável", "Comércio de Bairro", "Super Novidade"],
      previewBadgeColor: "#3B82F6",
      accentColor: "#FBBF24",
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "NOVIDADE",
        bgColor: "#1D4ED8",
        textColor: "#FFFFFF",
        accentColor: "#FBBF24",
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
      mockup: {
        layoutVariant: "retail-burst",
        badgeText: "LIQUIDAÇÃO",
        bgColor: "#854D0E",
        textColor: "#FFFFFF",
        accentColor: "#18181B",
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
    },
  ],
};

/**
 * Retorna exatamente os 4 estilos visuais curados para o segmento comercial informado.
 */
export function getSegmentPresets(
  segment: BusinessSegment,
): CuratedStylePreset[] {
  const presets = CANONICAL_STYLE_PRESETS[segment];
  return presets ? [...presets] : [...CANONICAL_STYLE_PRESETS.supermarket];
}

/**
 * Busca um estilo específico dentro do catálogo de um segmento.
 */
export function getPresetById(
  segment: BusinessSegment,
  presetId?: string | null,
): CuratedStylePreset | undefined {
  if (!presetId) return undefined;
  const trimmedId = presetId.trim();
  if (!trimmedId) return undefined;
  const presets = getSegmentPresets(segment);
  return presets.find((p) => p.id === trimmedId);
}

/**
 * Resolve a diretriz formatada de Direção de Arte para injeção no prompt do Gemini.
 * Se o presetId for nulo, indefinido ou inexistente, aplica graciosamente o primeiro
 * estilo padrão do segmento sem falhar.
 */
export function resolveArtDirectionDirective(
  segment: BusinessSegment,
  presetId?: string | null,
): string {
  const presets = getSegmentPresets(segment);
  const trimmedId = presetId?.trim();
  const matchedPreset = trimmedId
    ? presets.find((p) => p.id === trimmedId)
    : undefined;
  const preset = matchedPreset ?? presets[0];

  if (!preset) return "";

  return [
    `--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "${preset.label}" ---`,
    `- Paleta de Cores: ${preset.artDirection.palette}`,
    `- Composição e Layout: ${preset.artDirection.composition}`,
    `- Iluminação e Texturas: ${preset.artDirection.lighting}`,
    `- Atmosfera Visual: ${preset.artDirection.atmosphere}`,
  ].join("\n");
}
