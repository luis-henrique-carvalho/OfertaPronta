import { pgTable, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core'

export const drafts = pgTable('drafts', {
  id: text('id').primaryKey(),
  businessSegment: text('business_segment').notNull().default('supermarket'),
  businessName: text('business_name').notNull().default(''),
  offerTitle: text('offer_title').notNull().default(''),
  promoPrice: text('promo_price').notNull().default(''),
  originalPrice: text('original_price'),
  callToAction: text('call_to_action'),
  whatsapp: text('whatsapp'),
  productImageDataUrl: text('product_image_data_url'),
  referenceImageDataUrl: text('reference_image_data_url'),
  stylePresetId: text('style_preset_id'),
  customStyleInstructions: text('custom_style_instructions'),
  previewCardImageUrl: text('preview_card_image_url'),
  aiGenerationCount: integer('ai_generation_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Draft = typeof drafts.$inferSelect
export type NewDraft = typeof drafts.$inferInsert

export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  draftId: text('draft_id').references(() => drafts.id),
  templateId: text('template_id').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  status: text('status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert
