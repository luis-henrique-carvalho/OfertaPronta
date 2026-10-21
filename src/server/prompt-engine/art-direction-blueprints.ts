import {
  type BusinessSegment,
  type CardIntent,
  REFERENCE_STYLE_PRESET_ID,
} from "@/features/promotions/data/offer-brief.schema";
import {
  resolveArtDirectionDirective,
  getPresetById,
  getSegmentPresets,
  getCommercialGuide,
  LAYOUT_VARIANT_BLUEPRINTS,
  type CuratedStylePreset,
  type LayoutVariantBlueprint,
  type LayoutVariant,
  type LayoutType,
  type ResolveArtDirectionOptions,
} from "@/features/promotions/data/style-presets-catalog";
import type { CompositionArchetype, PromptEngineInput } from "./types";

export {
  REFERENCE_STYLE_PRESET_ID,
  LAYOUT_VARIANT_BLUEPRINTS,
  resolveArtDirectionDirective,
  getPresetById,
  getSegmentPresets,
  getCommercialGuide,
  type CuratedStylePreset,
  type LayoutVariantBlueprint,
  type LayoutVariant,
  type LayoutType,
  type ResolveArtDirectionOptions,
};

export const AUTHENTIC_PHOTOGRAPHY_DIRECTIVE = [
  "--- DIRETIVA MANDATÓRIA DE AUTENTICIDADE FOTOGRÁFICA (ANTI-GENERIC AI LOOK) ---",
  "- ACABAMENTO FOTOGRÁFICO REALISTA: A cena visual DEVE simular uma fotografia comercial profissional de câmera full-frame (sensor 35mm, abertura física f/2.0 a f/2.8), com profundidade de campo ótica natural, e NÃO uma renderização 3D digital, modelo CGI plástico ou ilustração digital.",
  "- TEXTURA E IMPERFEIÇÕES NATURAIS TÁTEIS: Preserve texturas físicas reais — vapor sutil de comida quente, brilho natural de suculência sem exagero plástico, gotículas de condensação fresca, porosidade dos alimentos, fibras reais de tecidos e granulação fotográfica analógica sutil (estilo ISO 200-400).",
  "- ILUMINAÇÃO ORGÂNICA E SOMBRAS DE CONTATO: Priorize iluminação natural difusa (luz de janela lateral de estúdio, golden hour ou luz de ambiente comercial acolhedor) com oclusão de ambiente e sombras de contato suaves e realistas projetadas na base de apoio.",
  "- PROIBIÇÕES EXPRESSAS (ANTI-CLICHÊ DE IA): Proibido acabamento plástico polido, pele encerada/aerografada (airbrushed), brilho artificial excessivo de render 3D, visual de vetor cartoon ou composição de banco de imagens corporativo estéril e despersonalizado.",
  "- CONTEXTO COMERCIAL LOCAL BRASILEIRO: A ambientação visual deve refletir o comércio local real do Brasil (hamburgueria artesanal com chapa e bancada rústica, hortifrúti fresco de bairro com caixotes de madeira, pizzaria com forno e farinha sutil, salão de beleza contemporâneo brasileiro).",
].join("\n");

export const ZERO_TEXT_OCCLUSION_DIRECTIVE = [
  "--- REGRA INEGOCIÁVEL DE CAMADA E LEGIBILIDADE (ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY) ---",
  "- PRIORIDADE ABSOLUTA DE 1º PLANO (TOP Z-INDEX / FOREGROUND LAYER): Todos os textos do anúncio (título principal, nome do estabelecimento, preço promocional, selos e chamada para ação) DEVEM ser renderizados estritamente na camada frontal superior (100% em primeiro plano).",
  "- PROIBIÇÃO DE TEXTO ATRÁS DO PERSONAGEM OU PRODUTO (NO TEXT BEHIND SUBJECT): É TERMINANTEMENTE PROIBIDO posicionar letras, palavras ou títulos atrás da cabeça, rosto, cabelo, ombros, corpo de pessoas/personagens/modelos ou atrás do produto anunciado. Nenhuma parte do sujeito pode cobrir, cortar ou ocultar caracteres do texto.",
  "- ZONA DE RESPIRO OU FAIXA DE CONTRASTE FRONTAL: Se a imagem contiver uma pessoa/personagem vertical ou produto alto, posicione o sujeito levemente deslocado ou enquadrado de forma que o título ocupe uma zona negativa limpa ou uma faixa/container gráfico sólido em 1º plano absoluto com leitura 100% desobstruída.",
].join("\n");

export const SEGMENT_ART_DIRECTIVES: Record<
  BusinessSegment,
  { segmentTitle: string; visualStyle: string; atmosphere: string }
> = {
  fashion: {
    segmentTitle: "Moda & Roupas",
    visualStyle:
      "Visual clean, moderno e refinado de vitrine de boutique ou lookbook de moda. Tons harmônicos (bege, linho, off-white, rosé ou preto premium). Iluminação suave de estúdio fotográfico, enquadramento limpo e minimalista valorizando o tecido, caimento e elegância das peças.",
    atmosphere:
      "Elegância contemporânea, estilo autêntico, tendência de moda, sofisticação e excelente custo-benefício.",
  },
  supermarket: {
    segmentTitle: "Supermercado & Hortifrúti",
    visualStyle:
      "Encarte de ofertas vibrante e dinâmico de supermercado. Cores quentes (amarelo, vermelho, verde hortifrúti). Alto contraste, selos gráficos chamativos de promoção, sensação de frescor e grande economia.",
    atmosphere:
      "Varejo comercial de alimentos, produtos frescos e apetitosos, destaque agressivo e profissional para o preço promocional.",
  },
  "beauty-salon": {
    segmentTitle: "Salão de Beleza & Barbearia",
    visualStyle:
      "Estética refinada, moderna e elegante. Tons harmônicos (dourado, preto, rose gold ou neutros sofisticados). Iluminação profissional suave de estúdio.",
    atmosphere:
      "Sofisticação, bem-estar, autoestima, higiene impecável e transformação estética de alto padrão.",
  },
  pizzeria: {
    segmentTitle: "Pizzaria Artesanal & Delivery",
    visualStyle:
      "Estilo gastronômico rústico e acolhedor. Tons quentes (vermelho pomodoro, terracota, madeira nobre, dourado do queijo). Foco em apetitosidade máxima e texturas artesanais.",
    atmosphere:
      "Fornos a lenha, ingredientes frescos italianos, queijo derretido, água na boca e agilidade de delivery.",
  },
  "burger-shop": {
    segmentTitle: "Hamburgueria Artesanal & Smash Burger",
    visualStyle:
      "Estética urbana, dark gourmet ou diner contemporâneo. Contraste marcante, luz lateral valorizando suculência, pão brioche dourado e texturas.",
    atmosphere:
      "Explosão de sabor, hambúrguer farto e artesanal, atmosfera descolada e apetite imediato.",
  },
  restaurant: {
    segmentTitle: "Restaurante Executivo & À La Carte",
    visualStyle:
      "Gastronomia elegante e profissional. Empratamento impecável, mesa arrumada, iluminação gastronômica aconchegante.",
    atmosphere:
      "Sabor autêntico, qualidade culinária de restaurante conceituado, pronto para um almoço ou jantar memorável.",
  },
  "local-retail": {
    segmentTitle: "Comércio Local & Varejo",
    visualStyle:
      "Visual publicitário direto, cativante e acolhedor de loja de bairro. Cores comerciais convidativas e selos promocionais atraentes.",
    atmosphere:
      "Oportunidade única, proximidade com a comunidade, vitrine convidativa e excelente custo-benefício.",
  },
};

/**
 * Avalia se a geração deve operar no modo puramente orientado à referência visual.
 * Retorna true se referenceImageDataUrl existe e não está vazio,
 * E (!stylePresetId ou stylePresetId.trim() === REFERENCE_STYLE_PRESET_ID).
 */
export function isReferenceDrivenMode(input: {
  referenceImageDataUrl?: string | null;
  stylePresetId?: string | null;
}): boolean {
  const hasRef = Boolean(
    input.referenceImageDataUrl &&
    input.referenceImageDataUrl.trim().length > 0,
  );
  if (!hasRef) return false;

  const presetId = input.stylePresetId?.trim();
  return !presetId || presetId === REFERENCE_STYLE_PRESET_ID;
}

/**
 * Constrói a diretriz autoritativa de direção de arte para replicação estética da imagem de referência.
 */
export function buildReferenceDrivenArtDirective(
  _input?: PromptEngineInput,
): string {
  return [
    `--- DIRETRIZ DE DIREÇÃO DE ARTE: REPLICAÇÃO ESTÉTICA DA IMAGEM DE REFERÊNCIA ---`,
    `- Papel do Modelo: Atue como diretor de arte e designer gráfico sênior encarregado de reproduzir com maestria a identidade visual do print de referência anexo.`,
    `- Estilo, Composição e Grid: Analise detalhadamente a IMAGEM DE REFERÊNCIA anexa e reproduza sua distribuição espacial, enquadramento, proporções relativas, alinhamentos, formas geométricas e padrão de respiro/bordas.`,
    `- Paleta Cromática Dominante: Extraia com fidelidade as cores de fundo, contrastes, gradientes e tons de acento presentes na IMAGEM DE REFERÊNCIA, aplicando-os à composição do anúncio sem recorrer a paletas externas genéricas.`,
    `- Tipografia e Hierarquia: Emule o estilo visual, peso das fontes (bold, condensed, elegante, etc.) e disposição de títulos e chamadas observados na IMAGEM DE REFERÊNCIA.`,
    `- Iluminação e Atmosfera: Replique o clima luminoso (luz suave, iluminação comercial, contraste dramático, estética clean ou vibrante) e as texturas da IMAGEM DE REFERÊNCIA.`,
    `- Adaptação ao Conteúdo: Combine toda essa estética do print com os dados da oferta comercial anunciada (título, preço, contato e fotos enviadas), gerando uma peça inédita que pareça pertencer à mesma campanha visual.`,
  ].join("\n");
}

export function resolvePresetAndBlueprint(
  businessSegment: BusinessSegment,
  stylePresetId?: string | null,
): { preset: CuratedStylePreset; blueprint: LayoutVariantBlueprint } {
  const presets = getSegmentPresets(businessSegment);
  const matchedPreset = getPresetById(businessSegment, stylePresetId);
  const preset = matchedPreset ?? presets[0];
  const blueprint = preset
    ? LAYOUT_VARIANT_BLUEPRINTS[preset.mockup.layoutVariant]
    : LAYOUT_VARIANT_BLUEPRINTS["retail-burst"];

  return { preset, blueprint };
}

export function buildProportionDirectives(isStory: boolean): {
  audienceText: string;
  proportionDirectives: string;
} {
  if (isStory) {
    return {
      audienceText:
        "redes sociais (Instagram Stories, Reels e WhatsApp Status 9:16)",
      proportionDirectives: `- Proporção Obrigatória: 9:16 vertical (master 1080x1920 para Stories e WhatsApp Status).
- SAFE ZONE OBRIGATÓRIA (Margem de Segurança para Stories/Status): Deixar 15% da altura no topo e 15% na base totalmente livres de textos importantes, preços, títulos ou logos, pois serão encobertos pela interface do Instagram/WhatsApp (foto de perfil, barra de status, caixa de resposta e navegação). Todo o conteúdo textual, título e preço DEVE estar estritamente concentrado na zona segura vertical central.`,
    };
  }

  return {
    audienceText: "redes sociais (Instagram Feed 4:5 e WhatsApp)",
    proportionDirectives:
      "- Proporção Obrigatória: 4:5 vertical (master 1080x1350 para Feed do Instagram).",
  };
}

export function resolvePriceInstructions(
  hasPrice: boolean,
  promoPrice?: string | null,
  originalPrice?: string | null,
): string {
  if (!hasPrice) {
    return "ESTE É UM CARD INSTITUCIONAL / INFORMATIVO: Não exiba nenhum preço ou valor monetário na arte gráfica. É expressamente proibido inserir 'R$ 0,00' ou valores inventados.";
  }

  if (originalPrice) {
    return `PREÇO PROMOCIONAL EM DESTAQUE MÁXIMO: Exibir claramente "De ${originalPrice} Por ${promoPrice}", garantindo que o valor promocional "${promoPrice}" tenha o maior tamanho visual, cor chamativa e contraste absoluto da peça.`;
  }

  return `PREÇO PROMOCIONAL EM DESTAQUE MÁXIMO: Exibir "${promoPrice}" em caixa alta e tamanho grande com contraste visual dominante.`;
}

export function resolveIntentDirective(
  intent?: CardIntent | null,
  customText?: string | null,
): string {
  const currentIntent = intent ?? "promo";
  switch (currentIntent) {
    case "promo":
      return "OBJETIVO DO ANÚNCIO (PROMOÇÃO): Foco absoluto em apelo promocional marcante, senso de oportunidade e alto contraste no preço.";
    case "new-arrival":
      return "OBJETIVO DO ANÚNCIO (NOVIDADE / LANÇAMENTO): Foco editorial em sofisticação, novidade e apresentação impecável de coleção ou lançamento ('Novidade!', 'Chegou!', 'Chegou Novidade!', 'Nova Coleção').";
    case "special-date":
      return "OBJETIVO DO ANÚNCIO (DATA COMEMORATIVA): Foco em ambientação temática e emotiva da data comemorativa anunciada.";
    case "announcement":
      return "OBJETIVO DO ANÚNCIO (COMUNICADO / INAUGURAÇÃO): Foco em clareza institucional, impacto visual de inauguração/evento e destaque para data/local.";
    case "schedule":
      return "OBJETIVO DO ANÚNCIO (HORÁRIO DE FUNCIONAMENTO / AVISO): Foco em legibilidade máxima do comunicado de horário de atendimento ou feriado.";
    case "custom": {
      const customDetail = customText?.trim() ? `: ${customText.trim()}` : "";
      return `OBJETIVO DO ANÚNCIO (PERSONALIZADO): Foco no objetivo e mensagem personalizada informada pelo cliente${customDetail}.`;
    }
    default:
      return "OBJETIVO DO ANÚNCIO: Foco em apelo visual e comunicação clara da oferta.";
  }
}

export function buildPromptOptionalNotes(input: PromptEngineInput): {
  ctaInstruction: string;
  whatsappInstruction: string;
  customInstructions: string;
  logoNote: string;
  productNote: string;
  referenceNote: string;
} {
  return {
    ctaInstruction: input.callToAction
      ? `CHAMADA PARA AÇÃO: Incluir selo ou faixa com "${input.callToAction}".`
      : "",
    whatsappInstruction: input.whatsapp
      ? `CONTATO COMERCIAL: Exibir "${input.whatsapp}" no rodapé do anúncio.`
      : "",
    customInstructions: input.customStyleInstructions
      ? `INSTRUÇÕES ADICIONAIS DO CLIENTE: ${input.customStyleInstructions}`
      : "",
    logoNote: input.logoImageDataUrl
      ? "- LOGOTIPO DA LOJA FORNECIDO: Posicione o logotipo no topo, canto superior ou rodapé mantendo a fidelidade, integridade e legibilidade da marca sem distorções."
      : "",
    productNote: input.productImageDataUrl
      ? "- FOTO DO PRODUTO FORNECIDA: Preserve e destaque com máxima fidelidade o produto real exibido na imagem anexa, tornando-o o ponto central do card."
      : "",
    referenceNote: input.referenceImageDataUrl
      ? "- IMAGEM DE REFERÊNCIA ESTÉTICA FORNECIDA: Inspire-se na paleta de cores, tipografia e iluminação visual da referência anexa."
      : "",
  };
}

export interface VisualHierarchyOptions {
  layoutType?: LayoutType;
  layoutVariant?: LayoutVariant;
  cardIntent?: CardIntent | null;
  isStory?: boolean;
  compositionArchetype?: CompositionArchetype;
}

function resolveScheduleHierarchy(
  hasPrice: boolean,
  offerTitle: string,
  businessName: string,
  promoPrice?: string | null,
): string {
  if (hasPrice) {
    return `1. TRANSFORMAÇÃO & SERVIÇO EM FOCO: sujeito ou resultado do serviço demonstrado em 1º plano com iluminação profissional de salão/estúdio.
2. TÍTULO E CHAMADA DE AGENDAMENTO ("${offerTitle}"): tipografia publicitária moderna e atraente em bloco contrastante e legível.
3. CONDIÇÃO OU VALOR PROMOCIONAL ("${promoPrice}"): integrado harmonicamente em badge elegante sem poluir a estética.
4. CANAL DE ATENDIMENTO / WHATSAPP: elemento gráfico de ação rápida incentivando o agendamento imediato.
5. NOME DO ESTABELECIMENTO ("${businessName}"): assinatura refinada no topo da peça.`;
  }
  return `1. TRANSFORMAÇÃO & SERVIÇO EM FOCO: sujeito ou resultado do serviço demonstrado em 1º plano com iluminação profissional de salão/estúdio.
2. TÍTULO E CHAMADA DE AGENDAMENTO ("${offerTitle}"): tipografia publicitária moderna e atraente em bloco contrastante e legível.
3. CANAL DE ATENDIMENTO / WHATSAPP: elemento gráfico de ação rápida convidando para agendamento imediato.
4. NOME DO ESTABELECIMENTO ("${businessName}"): assinatura refinada no topo da peça.
5. CARD INSTITUCIONAL DE SERVIÇO: foco na transformação e experiência, sem nenhuma menção a preços ou valores monetários.`;
}

function resolveAnnouncementHierarchy(
  offerTitle: string,
  businessName: string,
): string {
  return `1. MENSAGEM OU COMUNICADO PRINCIPAL ("${offerTitle}"): tipografia com peso visual prioritário e leitura cristalina em 1º plano.
2. AMBIENTAÇÃO COMERCIAL AUTÊNTICA: cenário do estabelecimento acolhedor ao fundo com iluminação natural e leve desfoque óptico (bokeh), sem ofuscar os textos.
3. IDENTIFICAÇÃO DO ESTABELECIMENTO ("${businessName}"): assinatura institucional limpa no topo ou rodapé.
4. CANAIS DE CONTATO / INFORMAÇÕES: dispostos de maneira organizada e equilibrada na base.
5. CARD INFORMATIVO: foco total na clareza do comunicado, sem nenhum preço ou valor monetário na arte gráfica.`;
}

function resolveEditorialHierarchy(
  hasPrice: boolean,
  offerTitle: string,
  businessName: string,
  promoPrice?: string | null,
): string {
  if (hasPrice) {
    return `1. PRODUTO HERO EM ENQUADRAMENTO ASSIMÉTRICO: produto fotografado na regra dos terços (deslocado levemente para lateral ou terço inferior), com ampla zona negativa de respiro e sombras suaves naturais.
2. TÍTULO EDITORIAL ("${offerTitle}"): tipografia contemporânea de revista/lookbook alinhada em coluna de texto dedicada, sem sobreposição ao produto.
3. TAG GEOMÉTRICA DE PREÇO ("${promoPrice}"): badge minimalista elegante ancorado com sutileza na lateral inferior do produto.
4. ASSINATURA DA MARCA ("${businessName}"): identificação discreta e sofisticada no topo com espaçamento moderno.
5. COMPOSIÇÃO EDITORIAL EQUILIBRADA: layout refinado e harmônico, valorizando o respiro visual e a elegância.`;
  }
  return `1. PRODUTO OU SUJEITO EM ENQUADRAMENTO ASSIMÉTRICO: enquadramento sofisticado na regra dos terços com ampla zona de respiro e luz natural difusa.
2. TÍTULO EDITORIAL ("${offerTitle}"): tipografia contemporânea de revista/lookbook alinhada com respiro amplo e clareza total.
3. ASSINATURA DA MARCA ("${businessName}"): identificação discreta e sofisticada no topo.
4. CARD EDITORIAL / INSTITUCIONAL: estética minimalista impecável, sem menção a preços ou valores numéricos.`;
}

function resolveCinematicHierarchy(
  hasPrice: boolean,
  offerTitle: string,
  businessName: string,
  promoPrice?: string | null,
): string {
  if (hasPrice) {
    return `1. PRODUTO COM ILUMINAÇÃO CHIAROSCURO & APETITE MÁXIMO: produto no centro dinâmico com iluminação dramática de recorte (rim light dourada), destacando texturas artesanais nobres, fumaça suave ou brilho de superfície.
2. TÍTULO DA OFERTA COM TIPOGRAFIA SOFISTICADA ("${offerTitle}"): tipografia de prestígio com alto contraste e elegância marcante.
3. SELO ARTESANAL / BADGE PREMIUM ("${promoPrice}"): container estilizado com borda metálica ou textura artesanal na cor de destaque.
4. NOME DO ESTABELECIMENTO ("${businessName}"): assinatura premium no topo central com tracking refinado.
5. CARD COMPLETO: estética gastronômica/luxuosa imersiva e acabamento de alta gastronomia ou boutique.`;
  }
  return `1. ELEMENTO VISUAL COM ILUMINAÇÃO CHIAROSCURO: iluminação dramática de recorte destacando texturas artesanais nobres e profundidade imersiva.
2. TÍTULO PRINCIPAL ("${offerTitle}"): tipografia de prestígio com alto contraste e elegância marcante.
3. NOME DO ESTABELECIMENTO ("${businessName}"): assinatura premium no topo central com tracking refinado.
4. CARD INSTITUCIONAL PREMIUM: foco exclusivo na experiência de luxo ou artesanato, sem preços ou valores monetários.`;
}

function resolveDynamicPopHierarchy(
  hasPrice: boolean,
  offerTitle: string,
  businessName: string,
  promoPrice?: string | null,
): string {
  if (hasPrice) {
    return `1. DINÂMICA VISUAL EM PERSPECTIVA: produto capturado em ângulo dinâmico e fresco com iluminação vibrante (luz matinal ou recorte neon expressivo), quebrando a rigidez central estática.
2. TÍTULO DE ALTO IMPACTO ("${offerTitle}"): tipografia display energética e expressiva fluindo em harmonia com o movimento da arte.
3. BADGE DE OFERTA ENERGÉTICO ("${promoPrice}"): selo com formato orgânico ou geométrico de alto contraste direcionando a atenção para a oportunidade.
4. IDENTIFICAÇÃO DA MARCA ("${businessName}"): integrada no cabeçalho ou rodapé dinâmico.
5. CARD COMPLETO: composição cheia de energia, frescor e atratividade instantânea para feed e stories.`;
  }
  return `1. DINÂMICA VISUAL EM PERSPECTIVA: sujeito capturado em ângulo dinâmico e fresco com iluminação vibrante.
2. TÍTULO DE ALTO IMPACTO ("${offerTitle}"): tipografia display energética e expressiva com leitura imediata.
3. IDENTIFICAÇÃO DA MARCA ("${businessName}"): integrada no cabeçalho ou rodapé dinâmico.
4. CARD INSTITUCIONAL DINÂMICO: atmosfera vibrante e positiva, sem nenhuma inserção de preços ou valores numéricos.`;
}

function resolveStandardRetailHierarchy(
  hasPrice: boolean,
  offerTitle: string,
  businessName: string,
  promoPrice?: string | null,
): string {
  if (hasPrice) {
    return `1. TÍTULO DA OFERTA ("${offerTitle}"): tipografia publicitária moderna, legível e nítida.
2. PREÇO PROMOCIONAL ("${promoPrice}"): elemento mais chamativo e impactante da peça.
3. PRODUTO/SERVIÇO: renderizado no centro focal da composição com iluminação atraente e realista.
4. NOME DO ESTABELECIMENTO ("${businessName}"): integrado harmonicamente no topo ou rodapé.
5. CARD COMPLETO: todo o layout deve ser sintetizado como uma única peça gráfica acabada, sem bordas brancas sobressalentes ou marcas d'água artificiais.`;
  }
  return `1. TÍTULO OU MENSAGEM PRINCIPAL ("${offerTitle}"): tipografia publicitária moderna, legível e nítida com destaque visual prioritário.
2. ELEMENTO VISUAL CENTRAL: renderizado no centro focal da composição com iluminação atraente e estética profissional.
3. NOME DO ESTABELECIMENTO ("${businessName}"): integrado harmonicamente no topo ou rodapé.
4. MENSAGEM INSTITUCIONAL / COMUNICADO: foco total na clareza informativa, sem nenhum preço ou valor monetário na arte gráfica.
5. CARD COMPLETO: todo o layout deve ser sintetizado como uma única peça gráfica acabada, sem bordas brancas sobressalentes ou marcas d'água artificiais.`;
}

function resolveHeroBottomHierarchy(
  hasPrice: boolean,
  offerTitle: string,
  businessName: string,
  promoPrice?: string | null,
): string {
  if (hasPrice) {
    return `1. PRODUTO HERO EM BASE CENOGRÁFICA: produto ocupando os 45% inferiores com sombra de contato realista, textura táctil nítida e profundidade de campo rasa (f/2.8).
2. TÍTULO PRINCIPAL EM 1º PLANO ("${offerTitle}"): tipografia imponente e cristalina ocupando o terço superior seguro sem competir com o produto.
3. SELO / TAG DE PREÇO EM DESTAQUE ("${promoPrice}"): badge geométrico nítido no terço médio ou lateral, com leitura imediata.
4. ASSINATURA DO ESTABELECIMENTO ("${businessName}"): integrada discretamente no topo.
5. HIERARQUIA VERTICAL ESTRUTURADA: transição suave do título no topo até o produto hero na base, garantindo 100% de legibilidade e impacto.`;
  }
  return `1. SUJEITO HERO EM BASE CENOGRÁFICA: produto ou sujeito ocupando os 45% inferiores com sombra de contato e profundidade de campo suave.
2. TÍTULO PRINCIPAL EM 1º PLANO ("${offerTitle}"): tipografia imponente e legível no terço superior seguro.
3. ASSINATURA DO ESTABELECIMENTO ("${businessName}"): integrada com harmonia no topo.
4. CARD INSTITUCIONAL HERO: foco na apresentação visual imersiva e presença de marca, sem preços ou valores monetários.`;
}

function resolveOverheadFlatlayHierarchy(
  hasPrice: boolean,
  offerTitle: string,
  businessName: string,
  promoPrice?: string | null,
): string {
  if (hasPrice) {
    return `1. COMPOSIÇÃO ZENITAL FLAT-LAY (90° BIRD'S EYE): visão aérea sofisticada com elementos distribuídos harmonicamente sobre superfície rústica ou texturizada com iluminação natural uniforme.
2. TÍTULO DA OFERTA ("${offerTitle}"): tipografia publicitária nítida ancorada em cartão, bloco sólido ou espaço negativo de alto contraste.
3. SELO DE PREÇO DESTACADO ("${promoPrice}"): container geométrico de alto impacto visual posicionado estrategicamente no grid.
4. IDENTIFICAÇÃO DA MARCA ("${businessName}"): assinatura elegante no topo ou rodapé da cena.
5. COMPOSIÇÃO MULTI-ITEM HARMÔNICA: equilíbrio visual impecável entre o arranjo aéreo dos produtos e a clareza da oferta comercial.`;
  }
  return `1. COMPOSIÇÃO ZENITAL FLAT-LAY (90° BIRD'S EYE): visão aérea sofisticada com elementos distribuídos harmonicamente sobre superfície texturizada e luz natural difusa.
2. TÍTULO OU COMUNICADO ("${offerTitle}"): tipografia nítida posicionada em bloco ou área de respiro com alto contraste.
3. IDENTIFICAÇÃO DA MARCA ("${businessName}"): assinatura elegante na composição.
4. CARD INSTITUCIONAL FLAT-LAY: foco no arranjo estético e experiência do cardápio/coleção, sem menção a preços.`;
}

function resolveMinimalNegativeSpaceHierarchy(
  hasPrice: boolean,
  offerTitle: string,
  businessName: string,
  promoPrice?: string | null,
): string {
  if (hasPrice) {
    return `1. ESPAÇO NEGATIVO DOMINANTE (60%+ DE RESPIRO): fundo limpo e minimalista com iluminação difusa suave, transmitindo requinte e exclusividade.
2. TÍTULO EDITORIAL REFINADO ("${offerTitle}"): tipografia de prestígio com espaçamento generoso e leitura cristalina.
3. ETIQUETA MINIMALISTA DE VALOR ("${promoPrice}"): valor promocional integrado discretamente com sofisticação gráfica.
4. PRODUTO HERO COMPACTO & NÍTIDO: renderizado com foco óptico impecável sem sobrecarregar a tela.
5. ASSINATURA DA MARCA ("${businessName}"): posicionada com máxima elegância e respiro.`;
  }
  return `1. ESPAÇO NEGATIVO DOMINANTE (60%+ DE RESPIRO): atmosfera minimalista limpa e sofisticada com iluminação natural suave.
2. TÍTULO EDITORIAL REFINADO ("${offerTitle}"): tipografia de prestígio com espaçamento generoso.
3. PRODUTO OU SUJEITO COMPACTO & NÍTIDO: enquadramento harmônico e discreto com foco óptico impecável.
4. ASSINATURA DA MARCA ("${businessName}"): posicionada com máxima elegância e respiro, sem valores monetários.`;
}

function resolveArchetypeHierarchy(
  archetype: CompositionArchetype,
  hasPrice: boolean,
  offerTitle: string,
  businessName: string,
  promoPrice?: string | null,
): string {
  switch (archetype) {
    case "split-editorial":
      return resolveEditorialHierarchy(
        hasPrice,
        offerTitle,
        businessName,
        promoPrice,
      );
    case "hero-bottom-staged":
      return resolveHeroBottomHierarchy(
        hasPrice,
        offerTitle,
        businessName,
        promoPrice,
      );
    case "diagonal-dynamic":
      return resolveDynamicPopHierarchy(
        hasPrice,
        offerTitle,
        businessName,
        promoPrice,
      );
    case "overhead-flatlay":
      return resolveOverheadFlatlayHierarchy(
        hasPrice,
        offerTitle,
        businessName,
        promoPrice,
      );
    case "center-showcase":
      return resolveCinematicHierarchy(
        hasPrice,
        offerTitle,
        businessName,
        promoPrice,
      );
    case "minimal-negative-space":
      return resolveMinimalNegativeSpaceHierarchy(
        hasPrice,
        offerTitle,
        businessName,
        promoPrice,
      );
    default:
      return resolveStandardRetailHierarchy(
        hasPrice,
        offerTitle,
        businessName,
        promoPrice,
      );
  }
}

export function buildVisualHierarchy(
  hasPrice: boolean,
  offerTitle: string,
  businessName: string,
  promoPrice?: string | null,
  options?: VisualHierarchyOptions,
): string {
  const intent = options?.cardIntent;
  const layoutType = options?.layoutType;
  const layoutVariant = options?.layoutVariant;

  if (intent === "schedule") {
    return resolveScheduleHierarchy(
      hasPrice,
      offerTitle,
      businessName,
      promoPrice,
    );
  }
  if (intent === "announcement") {
    return resolveAnnouncementHierarchy(offerTitle, businessName);
  }

  if (options?.compositionArchetype) {
    return resolveArchetypeHierarchy(
      options.compositionArchetype,
      hasPrice,
      offerTitle,
      businessName,
      promoPrice,
    );
  }
  if (layoutType === "clean-frame" || layoutVariant === "clean-minimal") {
    return resolveEditorialHierarchy(
      hasPrice,
      offerTitle,
      businessName,
      promoPrice,
    );
  }
  if (
    layoutType === "dark-premium" ||
    layoutVariant === "dark-luxury" ||
    layoutVariant === "rustic-wood"
  ) {
    return resolveCinematicHierarchy(
      hasPrice,
      offerTitle,
      businessName,
      promoPrice,
    );
  }
  if (
    layoutType === "vibrant-pop" ||
    layoutVariant === "neon-urban" ||
    layoutVariant === "fresh-organic"
  ) {
    return resolveDynamicPopHierarchy(
      hasPrice,
      offerTitle,
      businessName,
      promoPrice,
    );
  }

  return resolveStandardRetailHierarchy(
    hasPrice,
    offerTitle,
    businessName,
    promoPrice,
  );
}

export interface CompileFourLayersParams {
  input: PromptEngineInput;
  segmentAtmosphere: string;
  preset?: CuratedStylePreset;
  blueprint: LayoutVariantBlueprint;
  hasPrice: boolean;
  hasReferenceImage: boolean;
  hasCustomPalette: boolean;
  isStory: boolean;
}

export function compileFourLayersNarrative(
  params: CompileFourLayersParams,
): [string, string, string, string] {
  const {
    input,
    segmentAtmosphere,
    preset,
    blueprint,
    hasPrice,
    hasReferenceImage,
    hasCustomPalette,
    isStory,
  } = params;

  // CAMADA 1: Fundo Full-Bleed & Atmosfera
  const swatchesList = preset?.paletteSwatches?.join(", ") ?? "";
  const chromaticAdaptation =
    hasReferenceImage || hasCustomPalette
      ? `Prioridade cromática: adaptar e priorizar a paleta de cores da Imagem de Referência ou Paleta Personalizada indicada pelo cliente, mantendo o enquadramento e harmonia do estilo "${preset?.label ?? "Padrão"}". Cores de base do preset: Fundo ${preset?.mockup.bgColor ?? "#000000"} | Destaque ${preset?.mockup.accentColor ?? "#E11D48"} | Texto ${preset?.mockup.textColor ?? "#FFFFFF"} | Swatches (${swatchesList}).`
      : `Paleta cromática do preset (HEX): Fundo ${preset?.mockup.bgColor ?? "#000000"} | Destaque ${preset?.mockup.accentColor ?? "#E11D48"} | Texto ${preset?.mockup.textColor ?? "#FFFFFF"} | Swatches (${swatchesList}).`;

  const layer1 = `CAMADA 1 — FUNDO FULL-BLEED & ATMOSFERA: Enquadramento positivo full-bleed edge-to-edge preenchendo 100% do canvas até as 4 extremidades sem bordas ou margens externas vazias. Atmosfera visual do segmento: ${segmentAtmosphere}. ${chromaticAdaptation}`;

  // CAMADA 2: Sujeito Hero & Óptica Fotográfica Comercial
  const productFidelity = input.productImageDataUrl
    ? `Preservar e destacar com máxima fidelidade visual a FOTO DO PRODUTO FORNECIDA, posicionando o produto real no centro focal da composição.`
    : `Renderizar "${input.offerTitle}" com iluminação comercial atraente e acabamento realista impecável.`;

  const layer2 = `CAMADA 2 — SUJEITO HERO & ÓPTICA FOTOGRÁFICA COMERCIAL: Setup óptico e físico: ${blueprint.cameraAndLightingSetup}. Iluminação de estúdio 3 pontos e sombras de contato realistas sobre a base de apoio. Destaque central para "${input.offerTitle}". ${productFidelity}`;

  // CAMADA 3: Geometria de Grid, Safe Zone & Tipografia Descritiva
  const logoPlacement = input.logoImageDataUrl
    ? `Inclusão do LOGOTIPO DA LOJA FORNECIDO posicionado no topo, canto superior ou rodapé com fidelidade à identidade da marca e sem distorções.`
    : `Identificação visual clara com o nome do estabelecimento "${input.businessName}".`;

  const safeZoneNote = isStory
    ? `SAFE ZONE OBRIGATÓRIA: 15% da altura no topo e 15% na base livres de elementos gráficos críticos. Título "${input.offerTitle}" e dados comerciais estritamente posicionados na zona segura central.`
    : `Respiro balanceado e alinhamento geométrico perfeito respeitando o formato 4:5.`;

  const layer3 = `CAMADA 3 — GEOMETRIA DE GRID, SAFE ZONE & TIPOGRAFIA DESCRITIVA: Grid espacial do layout: ${blueprint.spatialGrid}. Família tipográfica descritiva: ${blueprint.descriptiveTypography}. Renderização de título legível para "${input.offerTitle}" e estabelecimento "${input.businessName}". ${logoPlacement} ${safeZoneNote}`;

  // CAMADA 4: Ancoragem de Preço & Rodapé Comercial
  let layer4Price: string;
  if (hasPrice) {
    const priceDetail = input.originalPrice
      ? `com originalPrice tachado ("De ${input.originalPrice}") e valor promocional "${input.promoPrice}" em destaque`
      : `com valor promocional "${input.promoPrice}" em tamanho dominante`;
    layer4Price = `Container de preço promocional em destaque (${blueprint.priceBadgeStyle}) na cor de destaque ${preset?.mockup.accentColor ?? "#E11D48"}, ${priceDetail}.`;
  } else {
    layer4Price = `Diretriz de card institucional sem nenhum container de preço e proibindo expressamente "R$ 0,00" ou valores monetários.`;
  }

  const footerDirectives = [
    input.callToAction ? `Chamada para ação: "${input.callToAction}".` : "",
    input.whatsapp ? `Rodapé comercial: "${input.whatsapp}".` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const layer4 =
    `CAMADA 4 — ANCORAGEM DE PREÇO & RODAPÉ COMERCIAL: ${layer4Price} ${footerDirectives || "Rodapé limpo e equilibrado."}`.trim();

  return [layer1, layer2, layer3, layer4];
}

export interface CompileReferenceDrivenFourLayersParams {
  input: PromptEngineInput;
  hasPrice: boolean;
  isStory: boolean;
}

export function compileReferenceDrivenFourLayers(
  params: CompileReferenceDrivenFourLayersParams,
): [string, string, string, string] {
  const { input, hasPrice, isStory } = params;

  // CAMADA 1: Fundo Full-Bleed & Atmosfera
  const layer1 = `CAMADA 1 — FUNDO FULL-BLEED & ATMOSFERA: Enquadramento positivo full-bleed edge-to-edge preenchendo 100% do canvas até as 4 extremidades sem bordas ou margens externas vazias. Paleta cromática dominante, texturas de fundo, gradientes e atmosfera visual extraídos 100% com fidelidade da IMAGEM DE REFERÊNCIA anexa sem recorrer a paletas ou cores de presets externos.`;

  // CAMADA 2: Sujeito Hero & Óptica Fotográfica Comercial
  const productFidelity = input.productImageDataUrl
    ? `Preservar e destacar com máxima fidelidade visual a FOTO DO PRODUTO FORNECIDA, posicionando o produto real no centro focal da composição.`
    : `Renderizar "${input.offerTitle}" com iluminação comercial atraente e acabamento realista impecável inspirado no tratamento visual da IMAGEM DE REFERÊNCIA anexa.`;

  const layer2 = `CAMADA 2 — SUJEITO HERO & ÓPTICA FOTOGRÁFICA COMERCIAL: Tratamento óptico, ângulo de câmera e iluminação inspirados diretamente no acabamento estético da IMAGEM DE REFERÊNCIA anexa, com iluminação de estúdio comercial e sombras de contato naturais. Destaque central para "${input.offerTitle}". ${productFidelity}`;

  // CAMADA 3: Geometria de Grid, Safe Zone & Tipografia Descritiva
  const logoPlacement = input.logoImageDataUrl
    ? `Inclusão do LOGOTIPO DA LOJA FORNECIDO posicionado no topo, canto superior ou rodapé com fidelidade à identidade da marca e sem distorções.`
    : `Identificação visual clara com o nome do estabelecimento "${input.businessName}".`;

  const safeZoneNote = isStory
    ? `SAFE ZONE OBRIGATÓRIA: 15% da altura no topo e 15% na base livres de elementos gráficos críticos. Título "${input.offerTitle}" e dados comerciais estritamente posicionados na zona segura central.`
    : `Respiro balanceado e alinhamento geométrico perfeito respeitando o formato 4:5.`;

  const layer3 = `CAMADA 3 — GEOMETRIA DE GRID, SAFE ZONE & TIPOGRAFIA DESCRITIVA: Distribuição espacial, grid de diagramação e proporções espelhando a composição da IMAGEM DE REFERÊNCIA anexa. Família tipográfica e hierarquia de títulos emulando o peso visual e estilo observados na referência. Renderização de título legível para "${input.offerTitle}" e estabelecimento "${input.businessName}". ${logoPlacement} ${safeZoneNote}`;

  // CAMADA 4: Ancoragem de Preço & Rodapé Comercial
  let layer4Price: string;
  if (hasPrice) {
    const priceDetail = input.originalPrice
      ? `com originalPrice tachado ("De ${input.originalPrice}") e valor promocional "${input.promoPrice}" em destaque`
      : `com valor promocional "${input.promoPrice}" em tamanho dominante`;
    layer4Price = `Container e destaque de preço promocional harmonizados com a linguagem visual e selos da IMAGEM DE REFERÊNCIA anexa, ${priceDetail}.`;
  } else {
    layer4Price = `Diretriz de card institucional sem nenhum container de preço e proibindo expressamente "R$ 0,00" ou valores monetários.`;
  }

  const footerDirectives = [
    input.callToAction ? `Chamada para ação: "${input.callToAction}".` : "",
    input.whatsapp ? `Rodapé comercial: "${input.whatsapp}".` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const layer4 =
    `CAMADA 4 — ANCORAGEM DE PREÇO & RODAPÉ COMERCIAL: ${layer4Price} ${footerDirectives || "Rodapé limpo e equilibrado."}`.trim();

  return [layer1, layer2, layer3, layer4];
}

export function parseDataUrl(
  dataUrl: string,
): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
}
