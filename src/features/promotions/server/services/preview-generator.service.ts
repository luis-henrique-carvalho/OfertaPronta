import { createServerLogger } from "@/server/logger";
import {
  BUSINESS_SEGMENTS,
  type BusinessSegment,
  type CardAspectRatio,
  generatePreviewInputSchema,
  type GeneratePreviewInput,
} from "../../data/offer-brief.schema";
import {
  getOfferDraft,
  updateDraftPreviewCard,
  type OfferDraft,
} from "./drafts.service";
import {
  generateAdCardImage,
  type GenerateAdCardInput,
  type GenerateAdCardResult,
  type GoogleGenAIClient,
} from "./ai-card-generator.service";
import { applyWatermark } from "@/server/export-engine";
import type { AppDatabase } from "@/server/db";

const log = createServerLogger("promotions.generator");

export { generatePreviewInputSchema };
export type { GeneratePreviewInput };

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
    deps.getDraft ?? ((id: string) => getOfferDraft(id, deps.database));

  const generateAdCard =
    deps.generateAdCard ??
    ((cardInput: GenerateAdCardInput) =>
      generateAdCardImage(cardInput, deps.geminiClient));

  const watermark =
    deps.watermark ?? ((buffer: Buffer) => applyWatermark(buffer));

  const updateDraft =
    deps.updateDraftPreview ??
    ((id: string, previewUrl: string) =>
      updateDraftPreviewCard(id, previewUrl, deps.database));

  return { getDraft, generateAdCard, watermark, updateDraft };
}

export function buildAdCardInput(draft: OfferDraft): GenerateAdCardInput {
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
    log.info("Chamando sintetizador de IA (AdCardGenerator)...", {
      draftId: draft.id,
      segment: draft.businessSegment,
    });
    const aiResult = await generateAdCard(buildAdCardInput(draft));
    log.info("Síntese de imagem concluída com sucesso", {
      draftId: draft.id,
      imageSizeBytes: aiResult.rawImageBuffer.length,
    });

    log.info("Aplicando marca d'água no ExportEngine (Sharp)...", {
      draftId: draft.id,
    });
    const watermarkResult = await watermark(aiResult.rawImageBuffer);
    log.info("Marca d'água aplicada com sucesso", { draftId: draft.id });
    return { success: true, dataUrl: watermarkResult.dataUrl };
  } catch (err: unknown) {
    log.error("FALHA na síntese ou aplicação de marca d'água", err, {
      draftId: draft.id,
    });
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
  log.info("Iniciando geração de prévia para draftId", {
    draftId: validated.draftId,
  });

  const { getDraft, generateAdCard, watermark, updateDraft } =
    resolveDependencies(deps);

  const draft = await getDraft(validated.draftId);
  if (!draft) {
    log.warn("Rascunho não encontrado no banco", {
      draftId: validated.draftId,
    });
    return {
      success: false,
      code: "NOT_FOUND",
      message: "Rascunho não encontrado.",
    };
  }

  log.info("Rascunho carregado", {
    draftId: draft.id,
    businessSegment: draft.businessSegment,
    offerTitle: draft.offerTitle,
    promoPrice: draft.promoPrice,
    aiGenerationCount: draft.aiGenerationCount,
  });

  if (draft.aiGenerationCount >= 1) {
    log.warn("Cota de prévia gratuita excedida para draftId", {
      draftId: draft.id,
      aiGenerationCount: draft.aiGenerationCount,
    });
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

  log.info("Persistindo prévia e atualizando cota no PostgreSQL...", {
    draftId: draft.id,
  });
  const updatedDraft = await updateDraft(draft.id, generated.dataUrl);
  if (!updatedDraft) {
    log.warn("Falha na atualização atômica de cota", {
      draftId: draft.id,
    });
    return {
      success: false,
      code: "AI_QUOTA_EXCEEDED",
      message:
        "Limite de 1 prévia gratuita por rascunho atingido. Conclua o pagamento Pix para liberar os arquivos e ter direito a até 3 regenerações.",
      previewUrl: draft.previewCardImageUrl,
      aiGenerationCount: 1,
    };
  }

  log.info("Concluído com sucesso para draftId", {
    draftId: draft.id,
  });
  return {
    success: true,
    previewUrl: generated.dataUrl,
    aiGenerationCount: 1,
  };
}
