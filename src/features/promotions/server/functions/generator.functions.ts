import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  BUSINESS_SEGMENTS,
  type BusinessSegment,
  type CardAspectRatio,
} from "../../data/offer-brief.schema";
import type { OfferDraft } from "../services/drafts.service";
import type {
  GenerateAdCardInput,
  GenerateAdCardResult,
  GoogleGenAIClient,
} from "../services/ai-card-generator.service";
import type { AppDatabase } from "../../../../server/db";

export const generatePreviewInputSchema = z.object({
  draftId: z.string().trim().min(1, "draftId é obrigatório"),
});

export type GeneratePreviewInput = z.infer<typeof generatePreviewInputSchema>;

export type GeneratePreviewResponse =
  | {
      success: true;
      previewUrl: string;
      aiGenerationCount: 1;
    }
  | {
      success: false;
      code: "AI_QUOTA_EXCEEDED";
      message: string;
      previewUrl?: string | null;
      aiGenerationCount?: number;
    }
  | {
      success: false;
      code: "AI_GENERATION_FAILED";
      message: string;
      aiGenerationCount: 0;
    }
  | {
      success: false;
      code: "NOT_FOUND";
      message: string;
    };

export interface GeneratePreviewDependencies {
  getDraft?: (draftId: string) => Promise<OfferDraft | null>;
  generateAdCard?: (
    input: GenerateAdCardInput,
  ) => Promise<GenerateAdCardResult>;
  watermark?: (buffer: Buffer) => Promise<{ dataUrl: string }>;
  updateDraftPreview?: (
    draftId: string,
    previewUrl: string,
  ) => Promise<OfferDraft | null>;
  database?: AppDatabase;
  geminiClient?: GoogleGenAIClient;
}

function resolveDependencies(deps: GeneratePreviewDependencies) {
  const getDraft =
    deps.getDraft ??
    (async (id: string) => {
      const { getOfferDraft } = await import("../services/drafts.service");
      return getOfferDraft(id, deps.database);
    });

  const generateAdCard =
    deps.generateAdCard ??
    (async (cardInput: GenerateAdCardInput) => {
      const { generateAdCardImage } =
        await import("../services/ai-card-generator.service");
      return generateAdCardImage(cardInput, deps.geminiClient);
    });

  const watermark =
    deps.watermark ??
    (async (buffer: Buffer) => {
      const { applyWatermark } =
        await import("../../../../server/export-engine");
      return applyWatermark(buffer);
    });

  const updateDraft =
    deps.updateDraftPreview ??
    (async (id: string, previewUrl: string) => {
      const { updateDraftPreviewCard } =
        await import("../services/drafts.service");
      return updateDraftPreviewCard(id, previewUrl, deps.database);
    });

  return { getDraft, generateAdCard, watermark, updateDraft };
}

function buildAdCardInput(draft: OfferDraft): GenerateAdCardInput {
  const validSegments: readonly string[] = BUSINESS_SEGMENTS;
  const businessSegment: BusinessSegment = validSegments.includes(
    draft.businessSegment,
  )
    ? (draft.businessSegment as BusinessSegment)
    : "supermarket";

  return {
    businessSegment,
    targetAspectRatio: (draft.targetAspectRatio as CardAspectRatio) || "feed",
    businessName: draft.businessName,
    offerTitle: draft.offerTitle,
    promoPrice: draft.promoPrice,
    originalPrice: draft.originalPrice,
    callToAction: draft.callToAction,
    whatsapp: draft.whatsapp,
    productImageDataUrl: draft.productImageDataUrl,
    referenceImageDataUrl: draft.referenceImageDataUrl,
    stylePresetId: draft.stylePresetId,
    customStyleInstructions: draft.customStyleInstructions,
  };
}

/**
 * Executa a orquestração de geração de prévia protegida por marca d'água
 * com controle rígido de cota gratuita (exatamente 1 por rascunho).
 */
async function generateAndWatermarkAdCard(
  draft: OfferDraft,
  generateAdCard: (input: GenerateAdCardInput) => Promise<GenerateAdCardResult>,
  watermark: (buffer: Buffer) => Promise<{ dataUrl: string }>,
): Promise<
  | { success: true; dataUrl: string }
  | { success: false; response: GeneratePreviewResponse }
> {
  try {
    console.warn(
      "[generatePreviewFn] Chamando sintetizador de IA (AdCardGenerator)...",
    );
    const aiResult = await generateAdCard(buildAdCardInput(draft));
    console.warn(
      "[generatePreviewFn] Síntese de imagem concluída com sucesso. Tamanho:",
      aiResult.rawImageBuffer.length,
      "bytes.",
    );

    console.warn(
      "[generatePreviewFn] Aplicando marca d'água no ExportEngine (Sharp)...",
    );
    const watermarkResult = await watermark(aiResult.rawImageBuffer);
    console.warn("[generatePreviewFn] Marca d'água aplicada com sucesso.");
    return { success: true, dataUrl: watermarkResult.dataUrl };
  } catch (err: unknown) {
    console.error(
      "[generatePreviewFn] FALHA na síntese ou aplicação de marca d'água:",
      err,
    );
    return {
      success: false,
      response: {
        success: false,
        code: "AI_GENERATION_FAILED",
        message:
          "Não foi possível gerar a arte no momento. Nenhuma cota foi consumida. Por favor, tente novamente.",
        aiGenerationCount: 0,
      },
    };
  }
}

/**
 * Executa a orquestração de geração de prévia protegida por marca d'água
 * com controle rígido de cota gratuita (exatamente 1 por rascunho).
 */
export async function executeGeneratePreview(
  input: GeneratePreviewInput,
  deps: GeneratePreviewDependencies = {},
): Promise<GeneratePreviewResponse> {
  const validated = generatePreviewInputSchema.parse(input);
  console.warn(
    "[generatePreviewFn] Iniciando geração de prévia para draftId:",
    validated.draftId,
  );

  const { getDraft, generateAdCard, watermark, updateDraft } =
    resolveDependencies(deps);

  const draft = await getDraft(validated.draftId);
  if (!draft) {
    console.warn(
      "[generatePreviewFn] Rascunho não encontrado no banco:",
      validated.draftId,
    );
    return {
      success: false,
      code: "NOT_FOUND",
      message: "Rascunho não encontrado.",
    };
  }

  console.warn("[generatePreviewFn] Rascunho carregado:", {
    id: draft.id,
    businessSegment: draft.businessSegment,
    offerTitle: draft.offerTitle,
    promoPrice: draft.promoPrice,
    aiGenerationCount: draft.aiGenerationCount,
  });

  if (draft.aiGenerationCount >= 1) {
    console.warn(
      "[generatePreviewFn] Cota de prévia gratuita excedida para draftId:",
      draft.id,
    );
    return {
      success: false,
      code: "AI_QUOTA_EXCEEDED",
      message:
        "Limite de 1 prévia gratuita por rascunho atingido. Conclua o pagamento Pix para liberar os arquivos e ter direito a até 3 regenerações.",
      previewUrl: draft.previewCardImageUrl,
      aiGenerationCount: draft.aiGenerationCount,
    };
  }

  const generated = await generateAndWatermarkAdCard(
    draft,
    generateAdCard,
    watermark,
  );
  if (!generated.success) {
    return generated.response;
  }

  console.warn(
    "[generatePreviewFn] Persistindo prévia e atualizando cota no PostgreSQL...",
  );
  const updatedDraft = await updateDraft(draft.id, generated.dataUrl);
  if (!updatedDraft) {
    console.warn(
      "[generatePreviewFn] Falha na atualização atômica de cota:",
      draft.id,
    );
    return {
      success: false,
      code: "AI_QUOTA_EXCEEDED",
      message:
        "Limite de 1 prévia gratuita por rascunho atingido. Conclua o pagamento Pix para liberar os arquivos e ter direito a até 3 regenerações.",
      previewUrl: draft.previewCardImageUrl,
      aiGenerationCount: 1,
    };
  }

  console.warn(
    "[generatePreviewFn] Concluído com sucesso para draftId:",
    draft.id,
  );
  return {
    success: true,
    previewUrl: generated.dataUrl,
    aiGenerationCount: 1,
  };
}

/**
 * Server Function RPC TanStack Start: expõe a geração de prévia protegida
 * com validação Zod no boundary e isolamento Server-Only.
 */
export const generatePreviewFn = createServerFn({ method: "POST" })
  .validator((input: unknown): GeneratePreviewInput =>
    generatePreviewInputSchema.parse(input),
  )
  .handler(
    async ({
      data,
    }: {
      data: GeneratePreviewInput;
    }): Promise<GeneratePreviewResponse> => {
      return executeGeneratePreview(data);
    },
  );
