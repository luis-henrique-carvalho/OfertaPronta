import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { campaigns } from './promotions'

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').references(() => campaigns.id),
  status: text('status').notNull().default('PENDING'),
  amountCents: integer('amount_cents').notNull().default(990),
  frozenSnapshot: jsonb('frozen_snapshot').notNull(),
  customerEmail: text('customer_email'),
  customerWhatsapp: text('customer_whatsapp'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export const paymentCharges = pgTable('payment_charges', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  txId: text('tx_id').notNull().unique(),
  status: text('status').notNull().default('PENDING'),
  qrCodeImageUrl: text('qr_code_image_url'),
  copiaECola: text('copia_e_cola').notNull(),
  amountCents: integer('amount_cents').notNull().default(990),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type PaymentCharge = typeof paymentCharges.$inferSelect
export type NewPaymentCharge = typeof paymentCharges.$inferInsert
