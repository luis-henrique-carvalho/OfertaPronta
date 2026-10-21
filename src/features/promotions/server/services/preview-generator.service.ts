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
import { applyWatermark, type WatermarkResult } from "@/server/export-engine";
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
  watermark?: (
    buffer: Buffer,
  ) => Promise<
    { dataUrl: string; watermarkedBuffer?: Buffer } | WatermarkResult
  >;
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

  const storageService = deps.storageService ?? getStorageService();

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
      ));

  return { getDraft, generateAdCard, watermark, updateDraft, storageService };
}

export function buildAdCardInput(draft: OfferDraft): GenerateAdCardInput {
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
    productImageDataUrl: draft.productImageDataUrl,
    referenceImageDataUrl: draft.referenceImageDataUrl,
    stylePresetId: draft.stylePresetId,
    customStyleInstructions: draft.customStyleInstructions,
    logoImageDataUrl: draft.logoImageDataUrl,
    cardIntent,
    customIntentText: draft.customIntentText,
  };
}

/**
 * Executa a orquestração de geração de prévia protegida por marca d'água
 * com controle rígido de cota gratuita (exatamente 1 por rascunho).
 */
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

async function uploadPreviewAndMaster(
  storageService: StorageService,
  draftId: string,
  watermarkedBuffer: Buffer,
  rawImageBuffer: Buffer,
  mimeType: string,
): Promise<{
  previewUrl: string;
  previewAssetKey: string;
  cleanMasterAssetKey: string;
}> {
  const timestamp = Date.now();
  const previewKey = `previews/${draftId}/${timestamp}.png`;
  const masterKey = `masters/${draftId}/${timestamp}.png`;

  log.info("Persistindo prévia e master no StorageService...", {
    draftId,
    previewKey,
    masterKey,
  });

  const [previewUpload, masterUpload] = await Promise.all([
    storageService.uploadAsset({
      key: previewKey,
      buffer: watermarkedBuffer,
      contentType: "image/png",
      isPublic: true,
    }),
    storageService.uploadAsset({
      key: masterKey,
      buffer: rawImageBuffer,
      contentType: mimeType,
      isPublic: false,
    }),
  ]);

  return {
    previewUrl: previewUpload.url,
    previewAssetKey: previewUpload.key,
    cleanMasterAssetKey: masterUpload.key,
  };
}

/**
 * Executa a orquestração de geração de prévia protegida por marca d'água
 * com controle rígido de cota gratuita (exatamente 1 por rascunho).
 */
async function generateAndWatermarkAdCard(
  draft: OfferDraft,
  generateAdCard: (input: GenerateAdCardInput) => Promise<GenerateAdCardResult>,
  watermark: (
    buffer: Buffer,
  ) => Promise<
    { dataUrl: string; watermarkedBuffer?: Buffer } | WatermarkResult
  >,
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
    const aiResult = await generateAdCard(buildAdCardInput(draft));
    log.info("Síntese de imagem concluída com sucesso", {
      draftId: draft.id,
      imageSizeBytes: aiResult.rawImageBuffer.length,
    });

    const mimeType = aiResult.mimeType || "image/png";
    const cleanMasterDataUrl = `data:${mimeType};base64,${aiResult.rawImageBuffer.toString("base64")}`;

    log.info("Aplicando marca d'água no ExportEngine (Sharp)...", {
      draftId: draft.id,
    });
    const watermarkResult = await watermark(aiResult.rawImageBuffer);
    log.info("Marca d'água aplicada com sucesso", { draftId: draft.id });

    const watermarkedBuffer = resolveWatermarkedBuffer(watermarkResult);
    const uploaded = await uploadPreviewAndMaster(
      storageService,
      draft.id,
      watermarkedBuffer,
      aiResult.rawImageBuffer,
      mimeType,
    );

    return {
      success: true,
      previewUrl: uploaded.previewUrl,
      dataUrl: watermarkResult.dataUrl,
      cleanMasterDataUrl,
      previewAssetKey: uploaded.previewAssetKey,
      cleanMasterAssetKey: uploaded.cleanMasterAssetKey,
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

  const { getDraft, generateAdCard, watermark, updateDraft, storageService } =
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

  const quotaError = validateDraftQuota(draft);
  if (quotaError) {
    return quotaError;
  }

  const generated = await generateAndWatermarkAdCard(
    draft,
    generateAdCard,
    watermark,
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
