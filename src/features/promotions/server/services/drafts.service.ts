import { eq, and } from "drizzle-orm";
import { db, type AppDatabase } from "../../../../server/db";
import { drafts, type Draft } from "../../../../server/db/schema/promotions";
import {
  saveOfferDraftSchema,
  type SaveOfferDraftInput,
} from "../../data/offer-brief.schema";

export type OfferDraft = Draft;

/**
 * Salva ou atualiza um rascunho de briefing no banco de dados via Upsert Atômico.
 */
export async function saveOfferDraft(
  input: SaveOfferDraftInput,
  database: AppDatabase = db,
): Promise<OfferDraft> {
  const validated = saveOfferDraftSchema.parse(input);
  const now = new Date();
  const draftId =
    validated.id && validated.id.trim().length > 0
      ? validated.id
      : crypto.randomUUID();

  const [persisted] = await database
    .insert(drafts)
    .values({
      id: draftId,
      businessSegment: validated.businessSegment,
      targetAspectRatio: validated.targetAspectRatio ?? "feed",
      businessName: validated.businessName,
      offerTitle: validated.offerTitle,
      promoPrice: validated.promoPrice,
      originalPrice: validated.originalPrice ?? null,
      callToAction: validated.callToAction ?? null,
      whatsapp: validated.whatsapp ?? null,
      productImageDataUrl: validated.productImageDataUrl ?? null,
      referenceImageDataUrl: validated.referenceImageDataUrl ?? null,
      stylePresetId: validated.stylePresetId ?? null,
      customStyleInstructions: validated.customStyleInstructions ?? null,
      cleanMasterImageDataUrl: validated.cleanMasterImageDataUrl ?? null,
      previewCardImageUrl: validated.previewCardImageUrl ?? null,
      cardIntent: validated.cardIntent ?? "promo",
      customIntentText: validated.customIntentText ?? null,
      logoImageDataUrl: validated.logoImageDataUrl ?? null,
      previewAssetKey: validated.previewAssetKey ?? null,
      cleanMasterAssetKey: validated.cleanMasterAssetKey ?? null,
      aiGenerationCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: drafts.id,
      set: {
        businessSegment: validated.businessSegment,
        targetAspectRatio: validated.targetAspectRatio ?? "feed",
        businessName: validated.businessName,
        offerTitle: validated.offerTitle,
        promoPrice: validated.promoPrice,
        originalPrice: validated.originalPrice ?? null,
        callToAction: validated.callToAction ?? null,
        whatsapp: validated.whatsapp ?? null,
        productImageDataUrl: validated.productImageDataUrl ?? null,
        referenceImageDataUrl: validated.referenceImageDataUrl ?? null,
        stylePresetId: validated.stylePresetId ?? null,
        customStyleInstructions: validated.customStyleInstructions ?? null,
        cleanMasterImageDataUrl: validated.cleanMasterImageDataUrl ?? null,
        previewCardImageUrl: validated.previewCardImageUrl ?? null,
        cardIntent: validated.cardIntent ?? "promo",
        customIntentText: validated.customIntentText ?? null,
        logoImageDataUrl: validated.logoImageDataUrl ?? null,
        previewAssetKey: validated.previewAssetKey ?? null,
        cleanMasterAssetKey: validated.cleanMasterAssetKey ?? null,
        updatedAt: now,
      },
    })
    .returning();

  return persisted;
}

/**
 * Busca um rascunho de briefing pelo ID.
 */
export async function getOfferDraft(
  id: string,
  database: AppDatabase = db,
): Promise<OfferDraft | null> {
  if (!id || id.trim().length === 0) {
    return null;
  }

  const rows = await database
    .select()
    .from(drafts)
    .where(eq(drafts.id, id))
    .limit(1);
  return rows[0] ?? null;
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

  return updated ?? null;
}
