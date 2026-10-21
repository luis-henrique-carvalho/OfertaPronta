import { eq, and } from "drizzle-orm";
import { db, type AppDatabase } from "../../../../server/db";
import { drafts, type Draft } from "../../../../server/db/schema/promotions";
import {
  saveOfferDraftSchema,
  type SaveOfferDraftInput,
} from "../../data/offer-brief.schema";
import {
  getStorageService,
  type StorageService,
} from "../../../../server/storage";
import { createServerLogger } from "../../../../server/logger";

const log = createServerLogger("promotions.drafts.service");

export type OfferDraft = Draft;

function parseDataUrl(
  dataUrl: string,
): { buffer: Buffer; contentType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || !match[1] || !match[2]) {
    return null;
  }
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

interface ProcessAssetResult {
  assetKey: string | null;
  dataUrl: string | null;
}

async function processVisualAsset(
  draftId: string,
  assetType: "product" | "reference" | "logo",
  inputDataUrl: string | null | undefined,
  inputAssetKey: string | null | undefined,
  existingAssetKey: string | null | undefined,
  existingDataUrl: string | null | undefined,
  storageService: StorageService,
): Promise<ProcessAssetResult> {
  // 1. Remoção explícita: usuário enviou null
  if (inputDataUrl === null) {
    if (existingAssetKey) {
      try {
        await storageService.deleteAsset(existingAssetKey);
      } catch (err) {
        log.warn("Erro ao deletar asset no storage durante remoção", {
          key: existingAssetKey,
          err,
        });
      }
    }
    return { assetKey: null, dataUrl: null };
  }

  // 2. Upload de Base64 Data URL -> converte para buffer, faz upload no storage, grava chave e zera dataUrl no DB
  if (
    typeof inputDataUrl === "string" &&
    inputDataUrl.startsWith("data:image/")
  ) {
    const parsed = parseDataUrl(inputDataUrl);
    if (parsed) {
      const key = `drafts/${draftId}/${assetType}.png`;
      await storageService.uploadAsset({
        key,
        buffer: parsed.buffer,
        contentType: parsed.contentType,
        isPublic: true,
      });
      return { assetKey: key, dataUrl: null };
    }
  }

  // 3. Chave de asset já fornecida diretamente no payload
  if (inputAssetKey) {
    return { assetKey: inputAssetKey, dataUrl: null };
  }

  // 4. URL pública já persistida (não data:), mantém a chave sem re-upload
  if (typeof inputDataUrl === "string" && !inputDataUrl.startsWith("data:")) {
    const key = existingAssetKey ?? `drafts/${draftId}/${assetType}.png`;
    return { assetKey: key, dataUrl: null };
  }

  // 5. Undefined: preserva chave existente ou dados legados em base64 se houver
  if (inputDataUrl === undefined) {
    return {
      assetKey: existingAssetKey ?? null,
      dataUrl: existingAssetKey ? null : (existingDataUrl ?? null),
    };
  }

  return { assetKey: null, dataUrl: null };
}

/**
 * Resolve transparência de URLs para o frontend (Step3VisualAssets):
 * Se as colunas de chaves leves estiverem preenchidas, resolve as URLs públicas via StorageService.
 * Registros legados sem chave de storage têm suas Data URLs originais preservadas.
 */
export function formatDraftForClient(
  draft: Draft,
  storageService: StorageService = getStorageService(),
): OfferDraft {
  const resolvedProduct = draft.productAssetKey
    ? storageService.getPublicUrl(draft.productAssetKey)
    : draft.productImageDataUrl;

  const resolvedReference = draft.referenceAssetKey
    ? storageService.getPublicUrl(draft.referenceAssetKey)
    : draft.referenceImageDataUrl;

  const resolvedLogo = draft.logoAssetKey
    ? storageService.getPublicUrl(draft.logoAssetKey)
    : draft.logoImageDataUrl;

  return {
    ...draft,
    productImageDataUrl: resolvedProduct,
    referenceImageDataUrl: resolvedReference,
    logoImageDataUrl: resolvedLogo,
  };
}

function buildDraftRowValues(
  draftId: string,
  validated: SaveOfferDraftInput,
  assets: {
    product: { assetKey: string | null; dataUrl: string | null };
    reference: { assetKey: string | null; dataUrl: string | null };
    logo: { assetKey: string | null; dataUrl: string | null };
  },
  now: Date,
) {
  return {
    id: draftId,
    businessSegment: validated.businessSegment,
    targetAspectRatio: validated.targetAspectRatio ?? "feed",
    businessName: validated.businessName,
    offerTitle: validated.offerTitle,
    promoPrice: validated.promoPrice,
    originalPrice: validated.originalPrice ?? null,
    callToAction: validated.callToAction ?? null,
    whatsapp: validated.whatsapp ?? null,
    productImageDataUrl: assets.product.dataUrl,
    referenceImageDataUrl: assets.reference.dataUrl,
    logoImageDataUrl: assets.logo.dataUrl,
    productAssetKey: assets.product.assetKey,
    referenceAssetKey: assets.reference.assetKey,
    logoAssetKey: assets.logo.assetKey,
    stylePresetId: validated.stylePresetId ?? null,
    customStyleInstructions: validated.customStyleInstructions ?? null,
    cleanMasterImageDataUrl: validated.cleanMasterImageDataUrl ?? null,
    previewCardImageUrl: validated.previewCardImageUrl ?? null,
    cardIntent: validated.cardIntent ?? "promo",
    customIntentText: validated.customIntentText ?? null,
    previewAssetKey: validated.previewAssetKey ?? null,
    cleanMasterAssetKey: validated.cleanMasterAssetKey ?? null,
    updatedAt: now,
  };
}

/**
 * Salva ou atualiza um rascunho de briefing no banco de dados via Upsert Atômico.
 * Insumos visuais em Base64 são interceptados, persistidos no StorageService sob drafts/{draftId}/...
 * e salvos no PostgreSQL exclusivamente como chaves leves, eliminando bloat na tabela TOAST.
 */
export async function saveOfferDraft(
  input: SaveOfferDraftInput,
  database: AppDatabase = db,
  storageService: StorageService = getStorageService(),
): Promise<OfferDraft> {
  const validated = saveOfferDraftSchema.parse(input);
  const now = new Date();
  const draftId =
    validated.id && validated.id.trim().length > 0
      ? validated.id
      : crypto.randomUUID();

  // Carrega rascunho existente para detecção de chaves anteriores e remoções
  let existingDraft: Draft | null = null;
  if (validated.id) {
    const rows = await database
      .select()
      .from(drafts)
      .where(eq(drafts.id, draftId))
      .limit(1);
    existingDraft = rows[0] ?? null;
  }

  const [product, reference, logo] = await Promise.all([
    processVisualAsset(
      draftId,
      "product",
      validated.productImageDataUrl,
      validated.productAssetKey,
      existingDraft?.productAssetKey,
      existingDraft?.productImageDataUrl,
      storageService,
    ),
    processVisualAsset(
      draftId,
      "reference",
      validated.referenceImageDataUrl,
      validated.referenceAssetKey,
      existingDraft?.referenceAssetKey,
      existingDraft?.referenceImageDataUrl,
      storageService,
    ),
    processVisualAsset(
      draftId,
      "logo",
      validated.logoImageDataUrl,
      validated.logoAssetKey,
      existingDraft?.logoAssetKey,
      existingDraft?.logoImageDataUrl,
      storageService,
    ),
  ]);

  const rowValues = buildDraftRowValues(
    draftId,
    validated,
    { product, reference, logo },
    now,
  );

  const [persisted] = await database
    .insert(drafts)
    .values({
      ...rowValues,
      aiGenerationCount: 0,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: drafts.id,
      set: rowValues,
    })
    .returning();

  return formatDraftForClient(persisted, storageService);
}

/**
 * Busca um rascunho de briefing pelo ID e formata para o cliente com transparência.
 */
export async function getOfferDraft(
  id: string,
  database: AppDatabase = db,
  storageService: StorageService = getStorageService(),
): Promise<OfferDraft | null> {
  if (!id || id.trim().length === 0) {
    return null;
  }

  const rows = await database
    .select()
    .from(drafts)
    .where(eq(drafts.id, id))
    .limit(1);

  if (!rows[0]) {
    return null;
  }

  return formatDraftForClient(rows[0], storageService);
}

/**
 * Atualiza atomicamente a prévia com marca d'água e consome exatamente 1 cota de IA.
 * Condição atômica estrita: a atualização só ocorre se aiGenerationCount for exatamente 0.
 * Retorna o rascunho atualizado ou null em caso de falha de concorrência / cota já consumida.
 */
export async function updateDraftPreviewCard(
  id: string,
  previewCardImageUrl: string,
  database: AppDatabase = db,
  cleanMasterImageDataUrl?: string | null,
  previewAssetKey?: string | null,
  cleanMasterAssetKey?: string | null,
  storageService: StorageService = getStorageService(),
): Promise<OfferDraft | null> {
  if (!id || id.trim().length === 0) {
    return null;
  }

  const now = new Date();
  const updatePayload: Record<string, unknown> = {
    previewCardImageUrl,
    aiGenerationCount: 1,
    updatedAt: now,
  };

  if (cleanMasterImageDataUrl !== undefined) {
    updatePayload.cleanMasterImageDataUrl = cleanMasterImageDataUrl;
  }
  if (previewAssetKey !== undefined) {
    updatePayload.previewAssetKey = previewAssetKey;
  }
  if (cleanMasterAssetKey !== undefined) {
    updatePayload.cleanMasterAssetKey = cleanMasterAssetKey;
  }

  const [updated] = await database
    .update(drafts)
    .set(updatePayload)
    .where(and(eq(drafts.id, id), eq(drafts.aiGenerationCount, 0)))
    .returning();

  return updated ? formatDraftForClient(updated, storageService) : null;
}
