import { createServerLogger } from "@/server/logger";
import {
  BUSINESS_SEGMENTS,
  CARD_INTENTS,
  type BusinessSegment,
  type CardAspectRatio,
  type CardIntent,
  generatePreviewInputSchema,
  type GeneratePreviewInput,
  generatePreviewOutputSchema,
  type GeneratePreviewOutput,
  draftClientDtoSchema,
  type DraftClientDto,
} from "../../data/offer-brief.schema";
import {
  getDraftRow,
  formatDraftForClient,
  updateDraftPreviewCard,
  type OfferDraft,
  type DraftRow,
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
import {
  reservePreview,
  settlePreview,
  findLastPreviewDraftId,
} from "./free-preview-quota.service";

const log = createServerLogger("promotions.generator");

export { generatePreviewInputSchema, generatePreviewOutputSchema };
export type { GeneratePreviewInput, GeneratePreviewOutput };

export type GeneratePreviewResponse = GeneratePreviewOutput;

export interface GeneratePreviewDependencies {
  getDraft?: (draftId: string) => Promise<DraftRow | OfferDraft | null>;
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
  ) => Promise<DraftRow | OfferDraft | null>;
  storageService?: StorageService;
  database?: AppDatabase;
  geminiClient?: GoogleGenAIClient;
  quota?: {
    reservePreview: typeof reservePreview;
    settlePreview: typeof settlePreview;
    findLastPreviewDraftId: typeof findLastPreviewDraftId;
  };
  identity?: {
    visitorId: string;
    ipHash: string;
  };
  now?: Date;
  // Suporte de compatibilidade para testes com mock de watermark
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

function createTestExportEngine(
  deps: GeneratePreviewDependencies,
  storageService: StorageService,
): ExportEngine {
  return {
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
  };
}

function resolveExportEngine(
  deps: GeneratePreviewDependencies,
  storageService: StorageService,
): ExportEngine {
  if (deps.exportEngine) {
    return deps.exportEngine;
  }
  if (deps.watermark) {
    return createTestExportEngine(deps, storageService);
  }
  return getExportEngine({ storageService });
}

function resolveDependencies(deps: GeneratePreviewDependencies) {
  const getDraft =
    deps.getDraft ?? ((id: string) => getDraftRow(id, deps.database));

  const generateAdCard =
    deps.generateAdCard ??
    ((cardInput: GenerateAdCardInput) =>
      generateAdCardImage(cardInput, deps.geminiClient));

  const storageService = deps.storageService ?? getStorageService();
  const exportEngine = resolveExportEngine(deps, storageService);

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

  const quota = deps.quota ?? {
    reservePreview,
    settlePreview,
    findLastPreviewDraftId,
  };

  const identity = deps.identity ?? {
    visitorId: "default-dev-visitor",
    ipHash: "default-dev-ip-hash",
  };

  return {
    getDraft,
    generateAdCard,
    exportEngine,
    updateDraft,
    storageService,
    quota,
    identity,
  };
}

/**
 * Carrega buffers de insumos visuais persistidos no StorageService
 * e os formata como Data URLs transparentes para o compilador multimodal Gemini.
 */
export async function resolveDraftVisualInputs(
  draft: DraftRow | OfferDraft,
  storageService: StorageService,
): Promise<{
  productImageDataUrl?: string;
  referenceImageDataUrl?: string;
  logoImageDataUrl?: string;
}> {
  let productImageDataUrl = draft.productImageDataUrl || undefined;
  let referenceImageDataUrl = draft.referenceImageDataUrl || undefined;
  let logoImageDataUrl = draft.logoImageDataUrl || undefined;

  const rawDraft = draft as Record<string, unknown>;

  if (typeof rawDraft.productAssetKey === "string") {
    const asset = await storageService.getAsset(rawDraft.productAssetKey);
    if (asset) {
      productImageDataUrl = `data:${asset.contentType};base64,${asset.buffer.toString("base64")}`;
    }
  }

  if (typeof rawDraft.referenceAssetKey === "string") {
    const asset = await storageService.getAsset(rawDraft.referenceAssetKey);
    if (asset) {
      referenceImageDataUrl = `data:${asset.contentType};base64,${asset.buffer.toString("base64")}`;
    }
  }

  if (typeof rawDraft.logoAssetKey === "string") {
    const asset = await storageService.getAsset(rawDraft.logoAssetKey);
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
  draft: DraftRow | OfferDraft,
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
  draft: DraftRow | OfferDraft,
  generateAdCard: (input: GenerateAdCardInput) => Promise<GenerateAdCardResult>,
  exportEngine: ExportEngine,
  storageService: StorageService,
): Promise<
  | {
      success: true;
      previewUrl: string;
      cleanMasterDataUrl: string;
      previewAssetKey: string;
      cleanMasterAssetKey: string;
    }
  | { success: false }
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
      cleanMasterDataUrl,
      previewAssetKey: exportResult.previewAssetKey,
      cleanMasterAssetKey: exportResult.cleanMasterAssetKey,
    };
  } catch (err: unknown) {
    log.error("FALHA na síntese ou aplicação de marca d'água", err, {
      draftId: draft.id,
    });
    return { success: false };
  }
}

function toClientDto(
  draft: DraftRow | OfferDraft,
  storageService: StorageService,
): DraftClientDto {
  if ("productAssetKey" in (draft as Record<string, unknown>)) {
    return formatDraftForClient(draft as DraftRow, storageService);
  }
  return draft as DraftClientDto;
}

interface QuotaReservationContext {
  quota: {
    reservePreview: typeof reservePreview;
    findLastPreviewDraftId: typeof findLastPreviewDraftId;
  };
  identity: {
    visitorId: string;
    ipHash: string;
  };
  now: Date;
  database?: AppDatabase;
  storageService: StorageService;
  getDraft: (draftId: string) => Promise<DraftRow | OfferDraft | null>;
}

async function handleQuotaReservation(
  draft: DraftRow | OfferDraft,
  ctx: QuotaReservationContext,
): Promise<
  | { ok: true; reservationId: string }
  | { ok: false; response: GeneratePreviewOutput }
> {
  const reservation = await ctx.quota.reservePreview(
    {
      visitorId: ctx.identity.visitorId,
      ipHash: ctx.identity.ipHash,
      draftId: draft.id,
      now: ctx.now,
    },
    ctx.database,
  );

  if (reservation.ok) {
    return { ok: true, reservationId: reservation.reservationId };
  }

  log.warn("Cota de prévia gratuita atingida", {
    reason: reservation.reason,
    visitorId: ctx.identity.visitorId,
  });

  let lastDraft: DraftClientDto | null = null;
  const lastDraftId = await ctx.quota.findLastPreviewDraftId(
    { visitorId: ctx.identity.visitorId },
    ctx.database,
  );

  if (lastDraftId) {
    const lastRow = await ctx.getDraft(lastDraftId);
    if (lastRow) {
      lastDraft = draftClientDtoSchema.parse(
        toClientDto(lastRow, ctx.storageService),
      );
    }
  }

  return {
    ok: false,
    response: {
      status: "LIMIT_REACHED",
      reason: reservation.reason,
      lastDraft,
    },
  };
}

interface GenerateAndPersistContext {
  draft: DraftRow | OfferDraft;
  reservationId: string;
  generateAdCard: (input: GenerateAdCardInput) => Promise<GenerateAdCardResult>;
  exportEngine: ExportEngine;
  updateDraft: (
    draftId: string,
    previewUrl: string,
    cleanMasterDataUrl?: string | null,
    previewAssetKey?: string | null,
    cleanMasterAssetKey?: string | null,
  ) => Promise<DraftRow | OfferDraft | null>;
  storageService: StorageService;
  quota: {
    settlePreview: typeof settlePreview;
  };
  now: Date;
  database?: AppDatabase;
}

async function generateAndPersistPreview(
  ctx: GenerateAndPersistContext,
): Promise<GeneratePreviewOutput> {
  const {
    draft,
    reservationId,
    generateAdCard,
    exportEngine,
    updateDraft,
    storageService,
    quota,
    now,
    database,
  } = ctx;

  try {
    const generated = await generateAndWatermarkAdCard(
      draft,
      generateAdCard,
      exportEngine,
      storageService,
    );

    if (!generated.success) {
      await quota.settlePreview(reservationId, "FAILED", now, database);
      return {
        status: "ERROR",
        code: "AI_GENERATION_FAILED",
        message:
          "Não foi possível gerar a arte no momento. Nenhuma cota foi consumida. Por favor, tente novamente.",
      };
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
      log.warn("Falha na atualização atômica de cota do rascunho", {
        draftId: draft.id,
      });
      await quota.settlePreview(reservationId, "FAILED", now, database);
      return {
        status: "ERROR",
        code: "AI_GENERATION_FAILED",
        message:
          "Não foi possível atualizar o rascunho com a prévia gerada. Tente novamente.",
      };
    }

    await quota.settlePreview(reservationId, "CONSUMED", now, database);

    log.info("Geração de prévia concluída com sucesso para draftId", {
      draftId: draft.id,
    });

    const finalDto = toClientDto(updatedDraft, storageService);
    return {
      status: "OK",
      draft: draftClientDtoSchema.parse(finalDto),
    };
  } catch (err: unknown) {
    log.error("Exceção imprevista durante síntese de prévia", err, {
      draftId: draft.id,
      reservationId,
    });
    await quota.settlePreview(reservationId, "FAILED", now, database);
    return {
      status: "ERROR",
      code: "AI_GENERATION_FAILED",
      message:
        "Não foi possível gerar a arte no momento. Nenhuma cota foi consumida. Por favor, tente novamente.",
    };
  }
}

/**
 * Executa a orquestração de geração de prévia protegida por marca d'água
 * com controle rígido de cota gratuita (Deep Module FreePreviewQuota).
 * Regras:
 * 1. Rascunho com aiGenerationCount >= 1 retorna LIMIT_REACHED(reason: visitor) sem consumir ledger.
 * 2. Cota reservada atômica ANTES do Gemini.
 * 3. Sucesso settle CONSUMED; falha settle FAILED.
 */
export async function executeGeneratePreview(
  input: GeneratePreviewInput,
  deps: GeneratePreviewDependencies = {},
): Promise<GeneratePreviewOutput> {
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
    quota,
    identity,
  } = resolveDependencies(deps);

  const now = deps.now ?? new Date();

  const draft = await getDraft(validated.draftId);
  if (!draft) {
    log.warn("Rascunho não encontrado no banco", {
      draftId: validated.draftId,
    });
    return {
      status: "ERROR",
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

  // Regra P0: Se o draft já teve prévia gerada, retorna LIMIT_REACHED com o próprio draft sem tocar no ledger
  if (draft.aiGenerationCount >= 1) {
    log.warn(
      "Rascunho já possui prévia gerada. Retornando LIMIT_REACHED sem consumir ledger.",
      {
        draftId: draft.id,
        aiGenerationCount: draft.aiGenerationCount,
      },
    );
    const clientDto = toClientDto(draft, storageService);
    return {
      status: "LIMIT_REACHED",
      reason: "visitor",
      lastDraft: draftClientDtoSchema.parse(clientDto),
    };
  }

  const reservationResult = await handleQuotaReservation(draft, {
    quota,
    identity,
    now,
    database: deps.database,
    storageService,
    getDraft,
  });

  if (!reservationResult.ok) {
    return reservationResult.response;
  }

  return generateAndPersistPreview({
    draft,
    reservationId: reservationResult.reservationId,
    generateAdCard,
    exportEngine,
    updateDraft,
    storageService,
    quota,
    now,
    database: deps.database,
  });
}
