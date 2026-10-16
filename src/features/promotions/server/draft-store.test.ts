import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveOfferDraft,
  getOfferDraft,
  createInMemoryDraftRepo,
  type DraftRepository,
} from './draft-store'
import type { SaveOfferDraftInput } from '../data/offer-brief.schema'

describe('DraftStore (Deep Module)', () => {
  let memoryRepo: DraftRepository

  beforeEach(() => {
    memoryRepo = createInMemoryDraftRepo()
  })

  describe('saveOfferDraft', () => {
    it('creates a new draft with generated ID and default values when no ID is provided', async () => {
      const input: SaveOfferDraftInput = {
        businessSegment: 'supermarket',
        businessName: 'Super Compre Bem',
        offerTitle: 'Picanha Resfriada 1kg',
        promoPrice: 'R$ 49,90',
        originalPrice: 'R$ 69,90',
        callToAction: 'Peça já!',
      }

      const result = await saveOfferDraft(input, memoryRepo)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(typeof result.id).toBe('string')
      expect(result.id.length).toBeGreaterThan(0)
      expect(result.businessSegment).toBe('supermarket')
      expect(result.businessName).toBe('Super Compre Bem')
      expect(result.offerTitle).toBe('Picanha Resfriada 1kg')
      expect(result.promoPrice).toBe('R$ 49,90')
      expect(result.originalPrice).toBe('R$ 69,90')
      expect(result.callToAction).toBe('Peça já!')
      expect(result.aiGenerationCount).toBe(0)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('updates an existing draft when an ID is provided', async () => {
      const initial = await saveOfferDraft(
        {
          businessSegment: 'pizzeria',
          businessName: 'Pizzaria Bella',
          offerTitle: 'Pizza Calabresa',
          promoPrice: 'R$ 39,90',
        },
        memoryRepo
      )

      const updated = await saveOfferDraft(
        {
          id: initial.id,
          businessSegment: 'pizzeria',
          businessName: 'Pizzaria Bella Napoli',
          offerTitle: 'Pizza Calabresa Especial + Refri',
          promoPrice: 'R$ 49,90',
          stylePresetId: 'pizza-rustic-wood',
        },
        memoryRepo
      )

      expect(updated.id).toBe(initial.id)
      expect(updated.businessName).toBe('Pizzaria Bella Napoli')
      expect(updated.offerTitle).toBe('Pizza Calabresa Especial + Refri')
      expect(updated.promoPrice).toBe('R$ 49,90')
      expect(updated.stylePresetId).toBe('pizza-rustic-wood')
    })

    it('persists visual images and instructions correctly', async () => {
      const pngData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const saved = await saveOfferDraft(
        {
          businessSegment: 'beauty-salon',
          businessName: 'Studio Glam',
          offerTitle: 'Escova Modelada',
          promoPrice: 'R$ 80,00',
          productImageDataUrl: pngData,
          referenceImageDataUrl: pngData,
          customStyleInstructions: 'Iluminação de estúdio suave',
        },
        memoryRepo
      )

      expect(saved.productImageDataUrl).toBe(pngData)
      expect(saved.referenceImageDataUrl).toBe(pngData)
      expect(saved.customStyleInstructions).toBe('Iluminação de estúdio suave')
    })
  })

  describe('getOfferDraft', () => {
    it('returns the saved draft by ID', async () => {
      const created = await saveOfferDraft(
        {
          businessSegment: 'burger-shop',
          businessName: 'Smash Burger',
          offerTitle: 'Duplo Bacon',
          promoPrice: 'R$ 29,90',
        },
        memoryRepo
      )

      const fetched = await getOfferDraft(created.id, memoryRepo)
      expect(fetched).not.toBeNull()
      expect(fetched?.id).toBe(created.id)
      expect(fetched?.businessName).toBe('Smash Burger')
      expect(fetched?.businessSegment).toBe('burger-shop')
    })

    it('returns null when draft does not exist', async () => {
      const fetched = await getOfferDraft('non-existent-id', memoryRepo)
      expect(fetched).toBeNull()
    })
  })
})
