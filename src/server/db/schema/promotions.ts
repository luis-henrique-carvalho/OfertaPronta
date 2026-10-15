import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const drafts = pgTable('drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessName: text('business_name').notNull().default(''),
  productName: text('product_name').notNull().default(''),
  promoPrice: text('promo_price').notNull().default(''),
  originalPrice: text('original_price'),
  productImageUrl: text('product_image_url'),
  logoUrl: text('logo_url'),
  callToAction: text('call_to_action').notNull().default('Peça já!'),
  whatsapp: text('whatsapp'),
  selectedTemplateId: text('selected_template_id').notNull().default('classic-burger'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Draft = typeof drafts.$inferSelect
export type NewDraft = typeof drafts.$inferInsert

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  draftId: uuid('draft_id').references(() => drafts.id),
  templateId: text('template_id').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  status: text('status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert
