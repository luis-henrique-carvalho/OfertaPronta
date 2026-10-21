import { GoogleGenAI } from "@google/genai";
import { serverEnv } from "@/config/server-env";
import type { CardAspectRatio } from "../../data/offer-brief.schema";
import { createServerLogger } from "@/server/logger";
import {
  buildPromptText,
  buildSurgicalEditPromptText,
  buildAdaptiveEditPromptText,
  buildMultimodalPromptParts,
  buildMultimodalPromptPartsAsync,
  isReferenceDrivenMode,
  buildReferenceDrivenArtDirective,
  ZERO_TEXT_OCCLUSION_DIRECTIVE,
  SEGMENT_ART_DIRECTIVES,
  compileReferenceDrivenFourLayers,
  REFERENCE_STYLE_PRESET_ID,
  type CompileReferenceDrivenFourLayersParams,
  type PromptPlannerClient,
  type PromptEngineInput,
  type InlineDataPart,
} from "@/server/prompt-engine";

export {
  REFERENCE_STYLE_PRESET_ID,
  buildPromptText,
  buildSurgicalEditPromptText,
  buildAdaptiveEditPromptText,
  buildMultimodalPromptParts,
  buildMultimodalPromptPartsAsync,
  isReferenceDrivenMode,
  buildReferenceDrivenArtDirective,
  ZERO_TEXT_OCCLUSION_DIRECTIVE,
  SEGMENT_ART_DIRECTIVES,
  compileReferenceDrivenFourLayers,
  type CompileReferenceDrivenFourLayersParams,
  type PromptPlannerClient,
  type InlineDataPart,
};

const log = createServerLogger("promotions.ai-card-generator");

export const GEMINI_IMAGE_MODEL = "gemini-nano-banana-2.1";

export type GenerateAdCardInput = PromptEngineInput;

export interface GenerateAdCardResult {
  rawImageBuffer: Buffer;
  mimeType: string;
}

export interface GenerateAdCardOptions {
  enableDynamicPlanner?: boolean;
  plannerClient?: PromptPlannerClient;
  timeoutMs?: number;
}

export class AdCardGenerationError extends Error {
  public readonly code: string;

  constructor(message: string, code = "AI_GENERATION_FAILED") {
    super(message);
    this.name = "AdCardGenerationError";
    this.code = code;
  }
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
 * Módulo Profundo AdCardGenerator: sintetiza briefings comerciais e insumos
 * visuais opcionais em um Card Publicitário completo em proporção 4:5 ou 9:16 via Gemini Multimodal.
 * Delega a montagem de prompts e partes multimodais para o PromptEngine.
 */
export async function generateAdCardImage(
  input: GenerateAdCardInput,
  client?: GoogleGenAIClient,
  options?: GenerateAdCardOptions,
): Promise<GenerateAdCardResult> {
  const geminiClient = client ?? resolveDefaultClient();

  const shouldUseDynamicPlanner =
    options?.enableDynamicPlanner === true ||
    Boolean(options?.plannerClient) ||
    (!client && serverEnv.GEMINI_DYNAMIC_PLANNER_ENABLED);

  const promptParts = shouldUseDynamicPlanner
    ? await buildMultimodalPromptPartsAsync(input, {
        client: options?.plannerClient,
        timeoutMs: options?.timeoutMs,
        enableDynamicPlanner: true,
      })
    : buildMultimodalPromptParts(input);

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
