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
      previewCardImageUrl: validated.previewCardImageUrl ?? null,
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
        previewCardImageUrl: validated.previewCardImageUrl ?? null,
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
): Promise<OfferDraft | null> {
  if (!id || id.trim().length === 0) {
    return null;
  }

  const now = new Date();
  const [updated] = await database
    .update(drafts)
    .set({
      previewCardImageUrl,
      aiGenerationCount: 1,
      updatedAt: now,
    })
    .where(and(eq(drafts.id, id), eq(drafts.aiGenerationCount, 0)))
    .returning();

  return updated ?? null;
}
