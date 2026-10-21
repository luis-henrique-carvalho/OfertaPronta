import { createServerLogger } from "@/server/logger";
import {
  BUSINESS_SEGMENTS,
  CARD_INTENTS,
  type BusinessSegment,
  type CardAspectRatio,
  type CardIntent,
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
import {
  getExportEngine,
  type ExportEngine,
  type ExportPreviewCardInput,
  type WatermarkResult,
} from "@/server/export-engine";
import type { AppDatabase } from "@/server/db";
import { getStorageService, type StorageService } from "@/server/storage";

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
  exportEngine?: ExportEngine;
  updateDraftPreview?: (
    draftId: string,
    previewUrl: string,
    cleanMasterDataUrl?: string | null,
    previewAssetKey?: string | null,
    cleanMasterAssetKey?: string | null,
  ) => Promise<OfferDraft | null>;
  storageService?: StorageService;
  database?: AppDatabase;
  geminiClient?: GoogleGenAIClient;
  // Suporte de compatibilidade para testes legados com mock de watermark
  watermark?: (
    buffer: Buffer,
  ) => Promise<
    { dataUrl: string; watermarkedBuffer?: Buffer } | WatermarkResult
  >;
}

function resolveWatermarkedBuffer(
  watermarkResult:
    { dataUrl: string; watermarkedBuffer?: Buffer } | WatermarkResult,
): Buffer {
  if (
    "watermarkedBuffer" in watermarkResult &&
    watermarkResult.watermarkedBuffer &&
    Buffer.isBuffer(watermarkResult.watermarkedBuffer)
  ) {
    return watermarkResult.watermarkedBuffer;
  }
  const match = watermarkResult.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match && match[1]
    ? Buffer.from(match[1], "base64")
    : Buffer.from(watermarkResult.dataUrl, "base64");
}

function resolveDependencies(deps: GeneratePreviewDependencies) {
  const getDraft =
    deps.getDraft ?? ((id: string) => getOfferDraft(id, deps.database));

  const generateAdCard =
    deps.generateAdCard ??
    ((cardInput: GenerateAdCardInput) =>
      generateAdCardImage(cardInput, deps.geminiClient));

  const storageService = deps.storageService ?? getStorageService();

  const exportEngine: ExportEngine =
    deps.exportEngine ??
    (deps.watermark
      ? {
          exportPreviewCard: async (input: ExportPreviewCardInput) => {
            const wmResult = await deps.watermark!(input.rawImageBuffer);
            const watermarkedBuffer = resolveWatermarkedBuffer(wmResult);
            const timestamp = Date.now();
            const previewAssetKey = `drafts/${input.draftId}/preview.webp`;
            const cleanMasterAssetKey = `drafts/${input.draftId}/private-master-${timestamp}.png`;
            const [pUpload] = await Promise.all([
              storageService.uploadAsset({
                key: previewAssetKey,
                buffer: watermarkedBuffer,
                contentType: "image/webp",
                isPublic: true,
              }),
              storageService.uploadAsset({
                key: cleanMasterAssetKey,
                buffer: input.rawImageBuffer,
                contentType: input.mimeType || "image/png",
                isPublic: false,
              }),
            ]);
            return {
              previewUrl: pUpload.url,
              previewAssetKey,
              cleanMasterAssetKey,
              watermarkedBuffer,
            };
          },
          exportFinalCampaign: async () => {
            throw new Error("Not implemented in test adapter");
          },
          saveCleanMaster: async () => {
            throw new Error("Not implemented in test adapter");
          },
        }
      : getExportEngine({ storageService }));

  const updateDraft =
    deps.updateDraftPreview ??
    ((
      id: string,
      previewUrl: string,
      cleanMasterDataUrl?: string | null,
      previewAssetKey?: string | null,
      cleanMasterAssetKey?: string | null,
    ) =>
      updateDraftPreviewCard(
        id,
        previewUrl,
        deps.database,
        cleanMasterDataUrl,
        previewAssetKey,
        cleanMasterAssetKey,
        storageService,
      ));

  return {
    getDraft,
    generateAdCard,
    exportEngine,
    updateDraft,
    storageService,
  };
}

/**
 * Carrega buffers de insumos visuais persistidos no StorageService
 * e os formata como Data URLs transparentes para o compilador multimodal Gemini.
 * Suporta retrocompatibilidade transparente com registros legados em Base64.
 */
export async function resolveDraftVisualInputs(
  draft: OfferDraft,
  storageService: StorageService,
): Promise<{
  productImageDataUrl?: string;
  referenceImageDataUrl?: string;
  logoImageDataUrl?: string;
}> {
  let productImageDataUrl = draft.productImageDataUrl || undefined;
  let referenceImageDataUrl = draft.referenceImageDataUrl || undefined;
  let logoImageDataUrl = draft.logoImageDataUrl || undefined;

  if (draft.productAssetKey) {
    const asset = await storageService.getAsset(draft.productAssetKey);
    if (asset) {
      productImageDataUrl = `data:${asset.contentType};base64,${asset.buffer.toString("base64")}`;
    }
  }

  if (draft.referenceAssetKey) {
    const asset = await storageService.getAsset(draft.referenceAssetKey);
    if (asset) {
      referenceImageDataUrl = `data:${asset.contentType};base64,${asset.buffer.toString("base64")}`;
    }
  }

  if (draft.logoAssetKey) {
    const asset = await storageService.getAsset(draft.logoAssetKey);
    if (asset) {
      logoImageDataUrl = `data:${asset.contentType};base64,${asset.buffer.toString("base64")}`;
    }
  }

  return {
    productImageDataUrl,
    referenceImageDataUrl,
    logoImageDataUrl,
  };
}

export function buildAdCardInput(
  draft: OfferDraft,
  visualInputs?: {
    productImageDataUrl?: string;
    referenceImageDataUrl?: string;
    logoImageDataUrl?: string;
  },
): GenerateAdCardInput {
  const validSegments: readonly string[] = BUSINESS_SEGMENTS;
  const businessSegment: BusinessSegment = validSegments.includes(
    draft.businessSegment,
  )
    ? (draft.businessSegment as BusinessSegment)
    : "supermarket";

  const validIntents: readonly string[] = CARD_INTENTS;
  const cardIntent: CardIntent | undefined =
    draft.cardIntent && validIntents.includes(draft.cardIntent)
      ? (draft.cardIntent as CardIntent)
      : undefined;

  return {
    businessSegment,
    targetAspectRatio: (draft.targetAspectRatio as CardAspectRatio) || "feed",
    businessName: draft.businessName,
    offerTitle: draft.offerTitle,
    promoPrice: draft.promoPrice,
    originalPrice: draft.originalPrice,
    callToAction: draft.callToAction,
    whatsapp: draft.whatsapp,
    productImageDataUrl:
      visualInputs?.productImageDataUrl ?? draft.productImageDataUrl,
    referenceImageDataUrl:
      visualInputs?.referenceImageDataUrl ?? draft.referenceImageDataUrl,
    stylePresetId: draft.stylePresetId,
    customStyleInstructions: draft.customStyleInstructions,
    logoImageDataUrl: visualInputs?.logoImageDataUrl ?? draft.logoImageDataUrl,
    cardIntent,
    customIntentText: draft.customIntentText,
  };
}

/**
 * Executa a síntese de imagem pelo Gemini e delega a proteção de marca d'água
 * e persistência ao ExportEngine profundo.
 */
async function generateAndWatermarkAdCard(
  draft: OfferDraft,
  generateAdCard: (input: GenerateAdCardInput) => Promise<GenerateAdCardResult>,
  exportEngine: ExportEngine,
  storageService: StorageService,
): Promise<
  | {
      success: true;
      previewUrl: string;
      dataUrl: string;
      cleanMasterDataUrl: string;
      previewAssetKey: string;
      cleanMasterAssetKey: string;
    }
  | { success: false; response: GeneratePreviewResponse }
> {
  try {
    log.info("Chamando sintetizador de IA (AdCardGenerator)...", {
      draftId: draft.id,
      segment: draft.businessSegment,
    });
    const visualInputs = await resolveDraftVisualInputs(draft, storageService);
    const aiResult = await generateAdCard(
      buildAdCardInput(draft, visualInputs),
    );
    log.info("Síntese de imagem concluída com sucesso", {
      draftId: draft.id,
      imageSizeBytes: aiResult.rawImageBuffer.length,
    });

    const mimeType = aiResult.mimeType || "image/png";
    const cleanMasterDataUrl = `data:${mimeType};base64,${aiResult.rawImageBuffer.toString("base64")}`;

    log.info("Delegando geração de prévia protegida ao ExportEngine...", {
      draftId: draft.id,
    });
    const exportResult = await exportEngine.exportPreviewCard({
      draftId: draft.id,
      rawImageBuffer: aiResult.rawImageBuffer,
      mimeType,
    });
    log.info("Prévia protegida exportada com sucesso via ExportEngine", {
      draftId: draft.id,
      previewAssetKey: exportResult.previewAssetKey,
      cleanMasterAssetKey: exportResult.cleanMasterAssetKey,
    });

    return {
      success: true,
      previewUrl: exportResult.previewUrl,
      dataUrl: `data:image/webp;base64,${exportResult.watermarkedBuffer.toString("base64")}`,
      cleanMasterDataUrl,
      previewAssetKey: exportResult.previewAssetKey,
      cleanMasterAssetKey: exportResult.cleanMasterAssetKey,
    };
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

function validateDraftQuota(draft: OfferDraft): GeneratePreviewResponse | null {
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
  return null;
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

  const {
    getDraft,
    generateAdCard,
    exportEngine,
    updateDraft,
    storageService,
  } = resolveDependencies(deps);

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

  const quotaError = validateDraftQuota(draft);
  if (quotaError) {
    return quotaError;
  }

  const generated = await generateAndWatermarkAdCard(
    draft,
    generateAdCard,
    exportEngine,
    storageService,
  );
  if (!generated.success) {
    return generated.response;
  }

  log.info("Persistindo prévia e atualizando cota no PostgreSQL...", {
    draftId: draft.id,
    previewAssetKey: generated.previewAssetKey,
    cleanMasterAssetKey: generated.cleanMasterAssetKey,
  });
  const updatedDraft = await updateDraft(
    draft.id,
    generated.previewUrl,
    generated.cleanMasterDataUrl,
    generated.previewAssetKey,
    generated.cleanMasterAssetKey,
  );
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
    previewUrl: generated.previewUrl,
    aiGenerationCount: 1,
  };
}
