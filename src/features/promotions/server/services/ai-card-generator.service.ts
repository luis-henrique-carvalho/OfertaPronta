import { GoogleGenAI } from "@google/genai";
import { serverEnv } from "@/config/server-env";
import {
  type BusinessSegment,
  type CardAspectRatio,
  type CardIntent,
  REFERENCE_STYLE_PRESET_ID,
} from "../../data/offer-brief.schema";
import {
  resolveArtDirectionDirective,
  getPresetById,
  getSegmentPresets,
  LAYOUT_VARIANT_BLUEPRINTS,
  type CuratedStylePreset,
  type LayoutVariantBlueprint,
} from "../../data/style-presets-catalog";
import { createServerLogger } from "@/server/logger";

export { REFERENCE_STYLE_PRESET_ID };

const log = createServerLogger("promotions.ai-card-generator");

export const GEMINI_IMAGE_MODEL = "gemini-nano-banana-2.1";

export interface GenerateAdCardInput {
  businessSegment: BusinessSegment;
  targetAspectRatio?: CardAspectRatio;
  businessName: string;
  offerTitle: string;
  promoPrice?: string | null;
  originalPrice?: string | null;
  callToAction?: string | null;
  whatsapp?: string | null;
  productImageDataUrl?: string | null;
  referenceImageDataUrl?: string | null;
  baseCardImageDataUrl?: string | null;
  stylePresetId?: string | null;
  customStyleInstructions?: string | null;
  logoImageDataUrl?: string | null;
  cardIntent?: CardIntent | null;
  customIntentText?: string | null;
}

export interface GenerateAdCardResult {
  rawImageBuffer: Buffer;
  mimeType: string;
}

export class AdCardGenerationError extends Error {
  public readonly code: string;

  constructor(message: string, code = "AI_GENERATION_FAILED") {
    super(message);
    this.name = "AdCardGenerationError";
    this.code = code;
  }
}

export interface InlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiResponseCandidate {
  finishReason?: string;
  content?: {
    parts?: Array<{
      text?: string;
      inlineData?: {
        mimeType?: string;
        data?: string;
      };
    }>;
  };
}

export interface GeminiGenerateContentResponse {
  candidates?: GeminiResponseCandidate[];
  promptFeedback?: {
    blockReason?: string;
  };
}

export interface GoogleGenAIClient {
  models: {
    generateContent(params: {
      model: string;
      contents: Array<string | InlineDataPart>;
      config?: {
        responseModalities?: string[];
        imageConfig?: {
          aspectRatio?: string;
          imageSize?: string;
        };
        responseFormat?: {
          image?: {
            aspectRatio?: string;
            imageSize?: string;
          };
        };
        [key: string]: unknown;
      };
    }): Promise<GeminiGenerateContentResponse>;
  };
}

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
export function buildReferenceDrivenArtDirective(): string {
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
 * Módulo Profundo AdCardGenerator: sintetiza briefings comerciais e insumos
 * visuais opcionais em um Card Publicitário completo em proporção 4:5 via Gemini Multimodal.
 */
export async function generateAdCardImage(
  input: GenerateAdCardInput,
  client?: GoogleGenAIClient,
): Promise<GenerateAdCardResult> {
  const geminiClient = client ?? resolveDefaultClient();
  const promptParts = buildMultimodalPromptParts(input);

  const targetAspectRatio: CardAspectRatio = input.targetAspectRatio ?? "feed";
  const geminiAspectRatio = targetAspectRatio === "story" ? "9:16" : "4:5";

  logPromptDispatch(input, targetAspectRatio, geminiAspectRatio, promptParts);

  try {
    const response = await geminiClient.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: promptParts,
      config: {
        responseModalities: ["image"],
        imageConfig: {
          aspectRatio: geminiAspectRatio,
          imageSize: "1K",
        },
      },
    });

    log.info("Resposta recebida da API Gemini com sucesso");
    return extractCandidateImage(response);
  } catch (error) {
    log.error(`Erro ao chamar ${GEMINI_IMAGE_MODEL}`, error);
    handleGeminiApiError(error);
  }
}

function logPromptDispatch(
  input: GenerateAdCardInput,
  targetAspectRatio: CardAspectRatio,
  geminiAspectRatio: string,
  promptParts: Array<string | InlineDataPart>,
): void {
  const textDirectives = promptParts.filter(
    (part): part is string => typeof part === "string",
  );
  const compiledPromptText = textDirectives.join("\n\n---\n\n");

  log.info(`Enviando requisição para ${GEMINI_IMAGE_MODEL}`, {
    segment: input.businessSegment,
    targetAspectRatio,
    geminiAspectRatio,
    businessName: input.businessName,
    offerTitle: input.offerTitle,
    promoPrice: input.promoPrice,
    promptPartsCount: promptParts.length,
    hasProductImage: !!input.productImageDataUrl,
    hasReferenceImage: !!input.referenceImageDataUrl,
    hasBaseCardImage: !!input.baseCardImageDataUrl,
    hasStylePreset: !!input.stylePresetId,
    hasLogoImage: !!input.logoImageDataUrl,
    isReferenceDriven: isReferenceDrivenMode(input),
    cardIntent: input.cardIntent,
    promptLengthChars: compiledPromptText.length,
  });

  log.info(
    `Prompt textual compilado para ${GEMINI_IMAGE_MODEL}:\n${compiledPromptText}`,
    {
      compiledPromptText,
    },
  );
}

function extractCandidateImage(
  response: GeminiGenerateContentResponse,
): GenerateAdCardResult {
  const candidate = response.candidates?.[0];

  if (!candidate) {
    throw new AdCardGenerationError(
      "Nenhum candidato retornado pelo modelo de IA.",
      "NO_CANDIDATE",
    );
  }

  if (candidate.finishReason === "SAFETY") {
    throw new AdCardGenerationError(
      "A geração do card foi bloqueada pelos filtros de segurança da IA.",
      "SAFETY_BLOCK",
    );
  }

  const imagePart = candidate.content?.parts?.find(
    (part) => part.inlineData?.data,
  );

  if (!imagePart?.inlineData?.data) {
    throw new AdCardGenerationError(
      "O modelo de IA não retornou bytes de imagem válidos.",
      "NO_IMAGE_RETURNED",
    );
  }

  return {
    rawImageBuffer: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}

function handleGeminiApiError(error: unknown): never {
  if (error instanceof AdCardGenerationError) {
    throw error;
  }

  const rawMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = rawMessage.toLowerCase();

  if (
    lowerMessage.includes("429") ||
    lowerMessage.includes("quota") ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("exhausted")
  ) {
    throw new AdCardGenerationError(
      "Limite temporário de requisições do Gemini atingido. Tente novamente em instantes.",
      "RATE_LIMIT",
    );
  }

  if (
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("etimedout") ||
    lowerMessage.includes("deadline")
  ) {
    throw new AdCardGenerationError(
      "Tempo limite esgotado ao sintetizar card com a IA. Tente novamente.",
      "TIMEOUT",
    );
  }

  if (
    lowerMessage.includes("safety") ||
    lowerMessage.includes("blocked") ||
    lowerMessage.includes("filter")
  ) {
    throw new AdCardGenerationError(
      "A geração do card foi impedida pelos filtros de conteúdo da IA.",
      "SAFETY_BLOCK",
    );
  }

  throw new AdCardGenerationError(
    `Falha na síntese do card publicitário: ${rawMessage}`,
    "AI_GENERATION_FAILED",
  );
}

function resolveDefaultClient(): GoogleGenAIClient {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    (process.env.NODE_ENV !== "test" ? serverEnv.GEMINI_API_KEY : undefined);
  if (!apiKey) {
    log.error(
      "ERRO DE CONFIGURAÇÃO: GEMINI_API_KEY não está definida nas variáveis de ambiente (.env.local)",
    );
    throw new AdCardGenerationError(
      "A chave GEMINI_API_KEY não está configurada no servidor.",
      "CONFIG_ERROR",
    );
  }

  log.info("GEMINI_API_KEY detectada. Inicializando cliente GoogleGenAI...");
  const ai = new GoogleGenAI({ apiKey });
  return ai as unknown as GoogleGenAIClient;
}

function buildMultimodalPromptParts(
  input: GenerateAdCardInput,
): Array<string | InlineDataPart> {
  const parts: Array<string | InlineDataPart> = [];

  if (input.baseCardImageDataUrl) {
    parts.push(buildSurgicalEditPromptText(input));
    appendInlineInputPart(
      parts,
      input.baseCardImageDataUrl,
      "IMAGEM BASE DO CARD PUBLICITÁRIO (ARTE MESTRE APROVADA): Use esta imagem como base gráfica principal. Mantenha rigorosamente todos os elementos visuais idênticos, aplicando EXCLUSIVAMENTE a alteração solicitada.",
    );

    if (input.logoImageDataUrl) {
      appendInlineInputPart(
        parts,
        input.logoImageDataUrl,
        "LOGOTIPO DA LOJA FORNECIDO: Mantenha a fidelidade absoluta ao logotipo oficial.",
      );
    }

    if (input.productImageDataUrl) {
      appendInlineInputPart(
        parts,
        input.productImageDataUrl,
        "FOTO DO PRODUTO REAL ORIGINAL: Mantenha a fidelidade absoluta a este produto exatamente como renderizado na imagem base.",
      );
    }

    return parts;
  }

  const segmentConfig =
    SEGMENT_ART_DIRECTIVES[input.businessSegment] ??
    SEGMENT_ART_DIRECTIVES.supermarket;

  parts.push(buildPromptText(input, segmentConfig));

  if (input.logoImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.logoImageDataUrl,
      "LOGOTIPO DA LOJA FORNECIDO: Incorpore fielmente este logotipo no anúncio (posicionado no topo, canto superior ou no rodapé do card). Preserve rigorosamente suas cores, proporção, contraste e legibilidade sem distorções.",
    );
  }

  if (input.productImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.productImageDataUrl,
      "FOTO DO PRODUTO REAL FORNECIDA PELO CLIENTE: Preserve e destaque com máxima fidelidade o produto exibido nesta imagem de referência. Ele deve ser o elemento central anunciado na composição do card.",
    );
  }

  if (input.referenceImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.referenceImageDataUrl,
      "IMAGEM DE REFERÊNCIA ESTÉTICA: Inspire-se na paleta de cores, tipografia, iluminação e atmosfera visual desta referência para guiar o estilo geral da composição do card.",
    );
  }

  return parts;
}

function resolveIntentDirective(
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

function buildSurgicalEditPromptText(input: GenerateAdCardInput): string {
  const isStory = input.targetAspectRatio === "story";
  const proportionDirectives = isStory
    ? "- Proporção Obrigatória: 9:16 vertical (master 1080x1920)."
    : "- Proporção Obrigatória: 4:5 vertical (master 1080x1350).";

  const requestedAdjustment = input.customStyleInstructions?.trim()
    ? input.customStyleInstructions.trim()
    : "Atualizar os dados da oferta preservando a identidade visual.";

  const hasPrice = Boolean(
    input.promoPrice && input.promoPrice.trim().length > 0,
  );
  const priceLine = hasPrice
    ? `- Preço Promocional: "${input.promoPrice}"${input.originalPrice ? ` (De: "${input.originalPrice}")` : ""}`
    : "- Preço: Nenhum (Card Institucional / Informativo sem valor monetário)";

  return `
Você é um diretor de arte e designer gráfico sênior executando uma EDIÇÃO CIRÚRGICA DE IMAGEM EXISTENTE.
Uma IMAGEM BASE DO CARD PUBLICITÁRIO já aprovada pelo cliente está anexa.

--- DIRETRIZ FUNDAMENTAL: PRESERVAÇÃO ESTRITA ---
1. PRESERVAÇÃO TOTAL DO DESIGN: Mantenha 100% da estrutura, cenário, iluminação, produto anunciado, acompanhamentos, paleta de cores, tipografia, fontes, faixas e posições da IMAGEM BASE rigorosamente inalterados.
2. PROIBIDO REINVENTAR: É TERMINANTEMENTE PROIBIDO gerar um novo cenário, mudar a aparência do produto, trocar recipientes/bandejas ou recriar a estrutura do anúncio do zero.
3. AJUSTE CIRÚRGICO SOLICITADO: Modifique EXCLUSIVAMENTE o elemento pontual especificado a seguir:
"${requestedAdjustment}"
4. DADOS DA OFERTA A MANTER:
- Estabelecimento: "${input.businessName}"
- Título da Oferta: "${input.offerTitle}"
${priceLine}${input.callToAction ? `\n- Chamada para Ação: "${input.callToAction}"` : ""}${input.whatsapp ? `\n- Contato Comercial: "${input.whatsapp}"` : ""}

${proportionDirectives}
Todo o restante da imagem original deve permanecer visualmente idêntico à imagem base fornecida.
`.trim();
}

function appendInlineInputPart(
  parts: Array<string | InlineDataPart>,
  dataUrl: string,
  instructionText: string,
): void {
  const parsed = parseDataUrl(dataUrl);
  if (parsed) {
    parts.push({
      inlineData: {
        mimeType: parsed.mimeType,
        data: parsed.data,
      },
    });
    parts.push(instructionText);
  }
}

function buildProportionDirectives(isStory: boolean): {
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

function resolvePriceInstructions(
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

function buildPromptOptionalNotes(input: GenerateAdCardInput): {
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

interface CompileFourLayersParams {
  input: GenerateAdCardInput;
  segmentAtmosphere: string;
  preset?: CuratedStylePreset;
  blueprint: LayoutVariantBlueprint;
  hasPrice: boolean;
  hasReferenceImage: boolean;
  hasCustomPalette: boolean;
  isStory: boolean;
}

function compileFourLayersNarrative(
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
  input: GenerateAdCardInput;
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

function buildVisualHierarchy(
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

function resolvePresetAndBlueprint(
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

interface AssemblePromptParams {
  audienceText: string;
  segmentConfig: (typeof SEGMENT_ART_DIRECTIVES)[BusinessSegment];
  businessName: string;
  offerTitle: string;
  priceInstructions: string;
  notes: ReturnType<typeof buildPromptOptionalNotes>;
  intentText: string;
  proportionDirectives: string;
  artDirectiveText: string;
  layers: [string, string, string, string];
  visualHierarchy: string;
}

function assemblePromptText(params: AssemblePromptParams): string {
  const {
    audienceText,
    segmentConfig,
    businessName,
    offerTitle,
    priceInstructions,
    notes,
    intentText,
    proportionDirectives,
    artDirectiveText,
    layers: [layer1, layer2, layer3, layer4],
    visualHierarchy,
  } = params;

  return `
Você é um diretor de arte publicitário sênior especialista em anúncios e cards promocionais para ${audienceText}.
Crie um CARD PUBLICITÁRIO COMPLETO, profissional, esteticamente impecável e pronto para postagem imediata.

--- DADOS DA OFERTA COMERCIAL ---
- Segmento do Negócio: ${segmentConfig.segmentTitle}
- Nome do Estabelecimento: ${businessName}
- Item ou Oferta Anunciada: ${offerTitle}
- ${priceInstructions}
${notes.ctaInstruction}
${notes.whatsappInstruction}
- ${intentText}

--- DIRETRIZES DE DIREÇÃO DE ARTE E DESIGN GRÁFICO ---
${proportionDirectives}
- Estilo Visual do Segmento: ${segmentConfig.visualStyle}
- Clima e Atmosfera Geral: ${segmentConfig.atmosphere}
${artDirectiveText ? `\n${artDirectiveText}\n` : ""}
${notes.logoNote ? `${notes.logoNote}\n` : ""}${notes.productNote ? `${notes.productNote}\n` : ""}${notes.referenceNote ? `${notes.referenceNote}\n` : ""}${notes.customInstructions ? `- ${notes.customInstructions}` : ""}

--- ARQUITETURA DE COMPOSIÇÃO EM 4 CAMADAS (STEP-BY-STEP) ---
- ${layer1}
- ${layer2}
- ${layer3}
- ${layer4}

--- HIERARQUIA VISUAL OBRIGATÓRIA ---
${visualHierarchy}
`.trim();
}

function resolveArtAndLayers(
  input: GenerateAdCardInput,
  resolvedSegmentConfig: (typeof SEGMENT_ART_DIRECTIVES)[BusinessSegment],
  options: {
    isReferenceDriven: boolean;
    hasPrice: boolean;
    hasReferenceImage: boolean;
    hasCustomPalette: boolean;
    isStory: boolean;
  },
): {
  artDirectiveText: string;
  layers: [string, string, string, string];
} {
  if (options.isReferenceDriven) {
    return {
      artDirectiveText: buildReferenceDrivenArtDirective(),
      layers: compileReferenceDrivenFourLayers({
        input,
        hasPrice: options.hasPrice,
        isStory: options.isStory,
      }),
    };
  }

  const { preset, blueprint } = resolvePresetAndBlueprint(
    input.businessSegment,
    input.stylePresetId,
  );

  const artDirectiveText = resolveArtDirectionDirective(
    input.businessSegment,
    input.stylePresetId,
    {
      hasReferenceImage: options.hasReferenceImage,
      hasCustomPalette: options.hasCustomPalette,
      cardIntent: input.cardIntent,
      hasPromoPrice: options.hasPrice,
    },
  );

  const layers = compileFourLayersNarrative({
    input,
    segmentAtmosphere: resolvedSegmentConfig.atmosphere,
    preset,
    blueprint,
    hasPrice: options.hasPrice,
    hasReferenceImage: options.hasReferenceImage,
    hasCustomPalette: options.hasCustomPalette,
    isStory: options.isStory,
  });

  return { artDirectiveText, layers };
}

export function buildPromptText(
  input: GenerateAdCardInput,
  segmentConfig?: (typeof SEGMENT_ART_DIRECTIVES)[BusinessSegment],
): string {
  const resolvedSegmentConfig =
    segmentConfig ??
    SEGMENT_ART_DIRECTIVES[input.businessSegment] ??
    SEGMENT_ART_DIRECTIVES.supermarket;

  const isReferenceDriven = isReferenceDrivenMode(input);
  const hasPrice = Boolean(
    input.promoPrice && input.promoPrice.trim().length > 0,
  );
  const hasReferenceImage = Boolean(
    input.referenceImageDataUrl &&
    input.referenceImageDataUrl.trim().length > 0,
  );
  const hasCustomPalette = Boolean(
    input.customStyleInstructions &&
    input.customStyleInstructions.trim().length > 0,
  );
  const isStory = input.targetAspectRatio === "story";

  const { audienceText, proportionDirectives } =
    buildProportionDirectives(isStory);
  const priceInstructions = resolvePriceInstructions(
    hasPrice,
    input.promoPrice,
    input.originalPrice,
  );
  const notes = buildPromptOptionalNotes(input);
  const visualHierarchy = buildVisualHierarchy(
    hasPrice,
    input.offerTitle,
    input.businessName,
    input.promoPrice,
  );

  const { artDirectiveText, layers } = resolveArtAndLayers(
    input,
    resolvedSegmentConfig,
    {
      isReferenceDriven,
      hasPrice,
      hasReferenceImage,
      hasCustomPalette,
      isStory,
    },
  );

  return assemblePromptText({
    audienceText,
    segmentConfig: resolvedSegmentConfig,
    businessName: input.businessName,
    offerTitle: input.offerTitle,
    priceInstructions,
    notes,
    intentText: resolveIntentDirective(
      input.cardIntent,
      input.customIntentText,
    ),
    proportionDirectives,
    artDirectiveText,
    layers,
    visualHierarchy,
  });
}

function parseDataUrl(
  dataUrl: string,
): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
}
