import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../../../server/db'
import { drafts, type Draft } from '../../../server/db/schema/promotions'
import {
  saveOfferDraftSchema,
  type SaveOfferDraftInput,
} from '../data/offer-brief.schema'

export type OfferDraft = Draft

export interface DraftRepository {
  save(draft: OfferDraft): Promise<OfferDraft>
  findById(id: string): Promise<OfferDraft | null>
}

/**
 * Cria um repositório em memória para Drafts (usado em testes e fallback).
 */
export function createInMemoryDraftRepo(initialDrafts: OfferDraft[] = []): DraftRepository {
  const store = new Map<string, OfferDraft>(initialDrafts.map((d) => [d.id, { ...d }]))

  return {
    async save(draft: OfferDraft): Promise<OfferDraft> {
      store.set(draft.id, { ...draft })
      return { ...draft }
    },
    async findById(id: string): Promise<OfferDraft | null> {
      const found = store.get(id)
      return found ? { ...found } : null
    },
  }
}

/**
 * Adaptador Drizzle PostgreSQL oficial para produção.
 */
export function createDrizzleDraftRepo(): DraftRepository {
  return {
    async save(draft: OfferDraft): Promise<OfferDraft> {
      const existing = await db
        .select()
        .from(drafts)
        .where(eq(drafts.id, draft.id))
        .limit(1)

      if (existing.length > 0) {
        const [updated] = await db
          .update(drafts)
          .set({
            businessSegment: draft.businessSegment,
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
            previewCardImageUrl: draft.previewCardImageUrl,
            aiGenerationCount: draft.aiGenerationCount,
            updatedAt: new Date(),
          })
          .where(eq(drafts.id, draft.id))
          .returning()

        return updated
      }

      const [inserted] = await db
        .insert(drafts)
        .values({
          id: draft.id,
          businessSegment: draft.businessSegment,
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
          previewCardImageUrl: draft.previewCardImageUrl,
          aiGenerationCount: draft.aiGenerationCount,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
        })
        .returning()

      return inserted
    },

    async findById(id: string): Promise<OfferDraft | null> {
      const rows = await db.select().from(drafts).where(eq(drafts.id, id)).limit(1)
      return rows[0] ?? null
    },
  }
}

/**
 * Repositório padrão selecionado de forma resiliente.
 */
let defaultRepo: DraftRepository = createDrizzleDraftRepo()

export function setDefaultDraftRepo(repo: DraftRepository) {
  defaultRepo = repo
}

/**
 * Salva ou atualiza um rascunho de oferta com validação de entrada Zod.
 */
export async function saveOfferDraft(
  input: SaveOfferDraftInput,
  repo: DraftRepository = defaultRepo
): Promise<OfferDraft> {
  const validated = saveOfferDraftSchema.parse(input)
  const now = new Date()

  const draftId = validated.id && validated.id.trim().length > 0 ? validated.id : randomUUID()
  const existing = await repo.findById(draftId)

  const draftToPersist: OfferDraft = {
    id: draftId,
    businessSegment: validated.businessSegment,
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
    aiGenerationCount: existing ? existing.aiGenerationCount : 0,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  }

  return repo.save(draftToPersist)
}

/**
 * Busca um rascunho de oferta pelo identificador único.
 */
export async function getOfferDraft(
  id: string,
  repo: DraftRepository = defaultRepo
): Promise<OfferDraft | null> {
  if (!id || id.trim().length === 0) {
    return null
  }
  return repo.findById(id)
}
