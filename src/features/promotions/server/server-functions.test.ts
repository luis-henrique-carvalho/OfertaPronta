import { describe, it, expect } from 'vitest'
import {
  saveDraftFn,
  getDraftFn,
  getDraftInputSchema,
} from './server-functions'
import { saveOfferDraftSchema } from '../data/offer-brief.schema'

describe('Promotions Server Functions', () => {
  describe('Contract and ServerFn definitions', () => {
    it('defines saveDraftFn with POST method and RPC structure', () => {
      expect(saveDraftFn).toBeDefined()
      expect(typeof saveDraftFn).toBe('function')
      expect(saveDraftFn.method).toBe('POST')
    })

    it('defines getDraftFn with GET method and RPC structure', () => {
      expect(getDraftFn).toBeDefined()
      expect(typeof getDraftFn).toBe('function')
      expect(getDraftFn.method).toBe('GET')
    })
  })

  describe('Input validation schemas', () => {
    it('saveOfferDraftSchema validates valid briefing payload', () => {
      const parsed = saveOfferDraftSchema.safeParse({
        businessSegment: 'pizzeria',
        businessName: 'Pizzaria Da Mamma',
        offerTitle: 'Pizza Margherita',
        promoPrice: 'R$ 42,00',
      })
      expect(parsed.success).toBe(true)
    })

    it('saveOfferDraftSchema rejects invalid segments', () => {
      const parsed = saveOfferDraftSchema.safeParse({
        businessSegment: 'invalid-segment',
      })
      expect(parsed.success).toBe(false)
    })

    it('getDraftInputSchema validates presence of draftId', () => {
      const valid = getDraftInputSchema.safeParse({ draftId: 'draft-123' })
      expect(valid.success).toBe(true)

      const invalid = getDraftInputSchema.safeParse({ draftId: '' })
      expect(invalid.success).toBe(false)
    })
  })
})
