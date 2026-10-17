import { GoogleGenAI } from "@google/genai";
import { serverEnv } from "@/config/server-env";
import {
  type BusinessSegment,
  type CardAspectRatio,
  SEGMENT_CATALOG,
} from "../../data/offer-brief.schema";
import { createServerLogger } from "@/server/logger";

const log = createServerLogger("promotions.ai-card-generator");

export interface GenerateAdCardInput {
  businessSegment: BusinessSegment;
  targetAspectRatio?: CardAspectRatio;
  businessName: string;
  offerTitle: string;
  promoPrice: string;
  originalPrice?: string | null;
  callToAction?: string | null;
  whatsapp?: string | null;
  productImageDataUrl?: string | null;
  referenceImageDataUrl?: string | null;
  stylePresetId?: string | null;
  customStyleInstructions?: string | null;
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

const SEGMENT_ART_DIRECTIVES: Record<
  BusinessSegment,
  { segmentTitle: string; visualStyle: string; atmosphere: string }
> = {
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

  log.info("Enviando requisição para gemini-3.1-flash-image", {
    segment: input.businessSegment,
    targetAspectRatio,
    geminiAspectRatio,
    businessName: input.businessName,
    offerTitle: input.offerTitle,
    promoPrice: input.promoPrice,
    promptPartsCount: promptParts.length,
    hasProductImage: !!input.productImageDataUrl,
    hasReferenceImage: !!input.referenceImageDataUrl,
    hasStylePreset: !!input.stylePresetId,
  });

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: promptParts,
      config: {
        responseModalities: ["image"],
        responseFormat: {
          image: {
            aspectRatio: geminiAspectRatio,
            imageSize: "2K",
          },
        },
      },
    });

    log.info("Resposta recebida da API Gemini com sucesso");
    return extractCandidateImage(response);
  } catch (error) {
    log.error("Erro ao chamar gemini-3.1-flash-image", error);
    handleGeminiApiError(error);
  }
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
  const segmentConfig =
    SEGMENT_ART_DIRECTIVES[input.businessSegment] ??
    SEGMENT_ART_DIRECTIVES.supermarket;

  parts.push(buildPromptText(input, segmentConfig));

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

function resolvePresetDescription(
  segment: BusinessSegment,
  stylePresetId?: string | null,
): string {
  if (!stylePresetId) return "";
  const catalogItem = SEGMENT_CATALOG[segment];
  const preset = catalogItem?.stylePresets.find((p) => p.id === stylePresetId);
  return preset
    ? `Estilo visual selecionado: "${preset.label}" (${preset.description}).`
    : "";
}

function buildPromptText(
  input: GenerateAdCardInput,
  segmentConfig: (typeof SEGMENT_ART_DIRECTIVES)[BusinessSegment],
): string {
  const presetDescription = resolvePresetDescription(
    input.businessSegment,
    input.stylePresetId,
  );

  const priceInstructions = input.originalPrice
    ? `PREÇO PROMOCIONAL EM DESTAQUE MÁXIMO: Exibir claramente "De ${input.originalPrice} Por ${input.promoPrice}", garantindo que o valor promocional "${input.promoPrice}" tenha o maior tamanho visual, cor chamativa e contraste absoluto da peça.`
    : `PREÇO PROMOCIONAL EM DESTAQUE MÁXIMO: Exibir "${input.promoPrice}" em caixa alta e tamanho grande com contraste visual dominante.`;

  const ctaInstruction = input.callToAction
    ? `CHAMADA PARA AÇÃO: Incluir selo ou faixa com "${input.callToAction}".`
    : "";

  const whatsappInstruction = input.whatsapp
    ? `CONTATO COMERCIAL: Exibir "${input.whatsapp}" no rodapé do anúncio.`
    : "";

  const customInstructions = input.customStyleInstructions
    ? `INSTRUÇÕES ADICIONAIS DO CLIENTE: ${input.customStyleInstructions}`
    : "";

  const productNote = input.productImageDataUrl
    ? "- FOTO DO PRODUTO FORNECIDA: Preserve e destaque com máxima fidelidade o produto real exibido na imagem anexa, tornando-o o ponto central do card."
    : "";

  const referenceNote = input.referenceImageDataUrl
    ? "- IMAGEM DE REFERÊNCIA ESTÉTICA FORNECIDA: Inspire-se na paleta de cores, tipografia e iluminação visual da referência anexa."
    : "";

  const isStory = input.targetAspectRatio === "story";
  const audienceText = isStory
    ? "redes sociais (Instagram Stories, Reels e WhatsApp Status 9:16)"
    : "redes sociais (Instagram Feed 4:5 e WhatsApp)";

  const proportionDirectives = isStory
    ? `- Proporção Obrigatória: 9:16 vertical (master 1080x1920 para Stories e WhatsApp Status).
- SAFE ZONE OBRIGATÓRIA (Margem de Segurança para Stories/Status): Deixar 15% da altura no topo e 15% na base totalmente livres de textos importantes, preços, títulos ou logos, pois serão encobertos pela interface do Instagram/WhatsApp (foto de perfil, barra de status, caixa de resposta e navegação). Todo o conteúdo textual, título e preço DEVE estar estritamente concentrado na zona segura vertical central.`
    : `- Proporção Obrigatória: 4:5 vertical (master 1080x1350 para Feed do Instagram).`;

  return `
Você é um diretor de arte publicitário sênior especialista em anúncios e cards promocionais para ${audienceText}.
Crie um CARD PUBLICITÁRIO COMPLETO, profissional, esteticamente impecável e pronto para postagem imediata.

--- DADOS DA OFERTA COMERCIAL ---
- Segmento do Negócio: ${segmentConfig.segmentTitle}
- Nome do Estabelecimento: ${input.businessName}
- Item ou Oferta Anunciada: ${input.offerTitle}
- ${priceInstructions}
${ctaInstruction}
${whatsappInstruction}

--- DIRETRIZES DE DIREÇÃO DE ARTE E DESIGN GRÁFICO ---
${proportionDirectives}
- Estilo Visual do Segmento: ${segmentConfig.visualStyle}
- Clima e Atmosfera: ${segmentConfig.atmosphere}
${productNote ? `${productNote}\n` : ""}${referenceNote ? `${referenceNote}\n` : ""}${presetDescription ? `- ${presetDescription}\n` : ""}${customInstructions ? `- ${customInstructions}` : ""}

--- HIERARQUIA VISUAL OBRIGATÓRIA ---
1. TÍTULO DA OFERTA ("${input.offerTitle}"): tipografia publicitária moderna, legível e nítida.
2. PREÇO PROMOCIONAL ("${input.promoPrice}"): elemento mais chamativo e impactante da peça.
3. PRODUTO/SERVIÇO: renderizado no centro focal da composição com iluminação atraente e realista.
4. NOME DO ESTABELECIMENTO ("${input.businessName}"): integrado harmonicamente no topo ou rodapé.
5. CARD COMPLETO: todo o layout deve ser sintetizado como uma única peça gráfica acabada, sem bordas brancas sobressalentes ou marcas d'água artificiais.
`.trim();
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
