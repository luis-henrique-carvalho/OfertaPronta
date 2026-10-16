import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  saveOfferDraftSchema,
  type SaveOfferDraftInput,
} from '../data/offer-brief.schema'
import type { OfferDraft } from './draft-store'

export interface SaveDraftResponse {
  success: boolean
  draftId: string
  draft: OfferDraft
}

export interface GetDraftResponse {
  success: boolean
  draft: OfferDraft | null
}

export const getDraftInputSchema = z.object({
  draftId: z.string().min(1, 'draftId é obrigatório'),
})

/**
 * Server Function: Salva ou atualiza um rascunho de briefing no banco.
 * Utiliza dynamic import para garantir Zero Server Leaks no bundle cliente.
 */
export const saveDraftFn = createServerFn({ method: 'POST' })
  .validator((input: unknown): SaveOfferDraftInput => saveOfferDraftSchema.parse(input))
  .handler(async ({ data }: { data: SaveOfferDraftInput }): Promise<SaveDraftResponse> => {
    const { saveOfferDraft } = await import('./draft-store')
    const draft = await saveOfferDraft(data)
    return {
      success: true,
      draftId: draft.id,
      draft,
    }
  })

/**
 * Server Function: Busca um rascunho existente pelo ID.
 * Utiliza dynamic import para garantir Zero Server Leaks no bundle cliente.
 */
export const getDraftFn = createServerFn({ method: 'GET' })
  .validator((input: unknown): { draftId: string } => getDraftInputSchema.parse(input))
  .handler(async ({ data }: { data: { draftId: string } }): Promise<GetDraftResponse> => {
    const { getOfferDraft } = await import('./draft-store')
    const draft = await getOfferDraft(data.draftId)
    return {
      success: true,
      draft,
    }
  })
