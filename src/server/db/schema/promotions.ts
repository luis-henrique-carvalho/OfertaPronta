import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const drafts = pgTable("drafts", {
  id: text("id").primaryKey(),
  businessSegment: text("business_segment").notNull().default("supermarket"),
  targetAspectRatio: text("target_aspect_ratio").notNull().default("feed"),
  businessName: text("business_name").notNull().default(""),
  offerTitle: text("offer_title").notNull().default(""),
  promoPrice: text("promo_price").notNull().default(""),
  originalPrice: text("original_price"),
  callToAction: text("call_to_action"),
  whatsapp: text("whatsapp"),
  productImageDataUrl: text("product_image_data_url"),
  referenceImageDataUrl: text("reference_image_data_url"),
  stylePresetId: text("style_preset_id"),
  customStyleInstructions: text("custom_style_instructions"),
  cleanMasterImageDataUrl: text("clean_master_image_data_url"),
  previewCardImageUrl: text("preview_card_image_url"),
  aiGenerationCount: integer("ai_generation_count").notNull().default(0),

  // === NOVAS COLUNAS DO ÉPICO 6 ===
  cardIntent: text("card_intent").notNull().default("promo"),
  customIntentText: text("custom_intent_text"),
  logoImageDataUrl: text("logo_image_data_url"),

  // === COLUNAS DE ASSETS DE INSUMOS (DRAFTS INTAKE) ===
  productAssetKey: text("product_asset_key"),
  referenceAssetKey: text("reference_asset_key"),
  logoAssetKey: text("logo_asset_key"),

  // === COLUNAS DE ARMAZENAMENTO R2 ===
  previewAssetKey: text("preview_asset_key"),
  cleanMasterAssetKey: text("clean_master_asset_key"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;

export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  draftId: text("draft_id").references(() => drafts.id),
  templateId: text("template_id").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  status: text("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
