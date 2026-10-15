import { describe, it, expect } from 'vitest'
import * as schema from './schema'
import { createDbClient } from './index'
import { getTableColumns } from 'drizzle-orm'

describe('Database Schema & Module', () => {
  describe('Schema exports', () => {
    it('should export all domain tables', () => {
      expect(schema.drafts).toBeDefined()
      expect(schema.campaigns).toBeDefined()
      expect(schema.orders).toBeDefined()
      expect(schema.paymentCharges).toBeDefined()
      expect(schema.exports).toBeDefined()
    })

    it('should have required columns on drafts table', () => {
      const columns = getTableColumns(schema.drafts)
      expect(columns.id).toBeDefined()
      expect(columns.businessName).toBeDefined()
      expect(columns.productName).toBeDefined()
      expect(columns.promoPrice).toBeDefined()
      expect(columns.selectedTemplateId).toBeDefined()
      expect(columns.createdAt).toBeDefined()
      expect(columns.updatedAt).toBeDefined()
    })

    it('should have required columns on campaigns table', () => {
      const columns = getTableColumns(schema.campaigns)
      expect(columns.id).toBeDefined()
      expect(columns.draftId).toBeDefined()
      expect(columns.templateId).toBeDefined()
      expect(columns.snapshot).toBeDefined()
      expect(columns.status).toBeDefined()
      expect(columns.createdAt).toBeDefined()
      expect(columns.updatedAt).toBeDefined()
    })

    it('should have required columns on orders table', () => {
      const columns = getTableColumns(schema.orders)
      expect(columns.id).toBeDefined()
      expect(columns.campaignId).toBeDefined()
      expect(columns.status).toBeDefined()
      expect(columns.amountCents).toBeDefined()
      expect(columns.frozenSnapshot).toBeDefined()
      expect(columns.createdAt).toBeDefined()
      expect(columns.updatedAt).toBeDefined()
    })

    it('should have required columns on payment_charges table', () => {
      const columns = getTableColumns(schema.paymentCharges)
      expect(columns.id).toBeDefined()
      expect(columns.orderId).toBeDefined()
      expect(columns.txId).toBeDefined()
      expect(columns.status).toBeDefined()
      expect(columns.copiaECola).toBeDefined()
      expect(columns.amountCents).toBeDefined()
      expect(columns.expiresAt).toBeDefined()
      expect(columns.createdAt).toBeDefined()
      expect(columns.updatedAt).toBeDefined()
    })

    it('should have required columns on exports table', () => {
      const columns = getTableColumns(schema.exports)
      expect(columns.id).toBeDefined()
      expect(columns.orderId).toBeDefined()
      expect(columns.feedUrl).toBeDefined()
      expect(columns.storyUrl).toBeDefined()
      expect(columns.expiresAt).toBeDefined()
      expect(columns.createdAt).toBeDefined()
      expect(columns.updatedAt).toBeDefined()
    })
    it('should export deliveryExports alias identical to exports', () => {
      expect(schema.deliveryExports).toBeDefined()
      expect(schema.deliveryExports).toBe(schema.exports)
    })
  })

  describe('createDbClient', () => {
    it('should create a drizzle db instance with connection string', () => {
      const testDb = createDbClient('postgresql://test:test@localhost:5432/testdb')
      expect(testDb).toBeDefined()
      expect(testDb.query).toBeDefined()
      expect(testDb.select).toBeDefined()
    })

    it('should create a drizzle db instance with injected mock pool', () => {
      // Mock pool interface adhering to pg.Pool surface needed by drizzle
      const mockPool = {
        connect: async () => ({
          query: async () => ({ rows: [] }),
          release: () => {},
        }),
        query: async () => ({ rows: [] }),
        on: () => mockPool,
        end: async () => {},
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testDb = createDbClient(mockPool as any)
      expect(testDb).toBeDefined()
      expect(testDb.query).toBeDefined()
      expect(testDb.select).toBeDefined()
    })
  })
})
