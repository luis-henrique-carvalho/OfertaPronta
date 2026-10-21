import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { campaigns, drafts } from "./promotions";

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: text("campaign_id").references(() => campaigns.id),
  draftId: text("draft_id").references(() => drafts.id),
  planId: text("plan_id").notNull().default("single_campaign"),
  status: text("status").notNull().default("PENDING"),
  amountCents: integer("amount_cents").notNull(),
  cobrandingAccepted: boolean("cobranding_accepted").notNull().default(false),
  cobrandingCreditText: text("cobranding_credit_text"),
  cleanMasterImageDataUrl: text("clean_master_image_data_url"),
  cleanMasterAssetKey: text("clean_master_asset_key"),
  frozenSnapshot: jsonb("frozen_snapshot").notNull(),
  customerEmail: text("customer_email"),
  customerWhatsapp: text("customer_whatsapp"),
  aiRegenerationCount: integer("ai_regeneration_count").notNull().default(0),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export interface OrderFrozenSnapshot {
  draftId: string;
  businessSegment: string;
  targetAspectRatio: string;
  businessName?: string;
  offerTitle: string;
  promoPrice?: string;
  originalPrice?: string;
  callToAction?: string;
  whatsapp?: string | null;
  productImageDataUrl?: string | null;
  referenceImageDataUrl?: string | null;
  previewCardImageUrl?: string | null;
  cleanMasterImageDataUrl?: string | null;
  cleanMasterAssetKey?: string | null;
  previewAssetKey?: string | null;

  // Metadados comerciais e co-branding
  planId: string;
  planName: string;
  amountCents: number;
  originalAmountCents: number;
  cobrandingAccepted: boolean;
  cobrandingDiscountPercent: number | null;
  cobrandingCreditText: string | null;
  maxPostPaymentRegenerations: number;
  frozenAt: string;
}

export const paymentCharges = pgTable("payment_charges", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  txId: text("tx_id").notNull().unique(),
  status: text("status").notNull().default("PENDING"),
  qrCodeImageUrl: text("qr_code_image_url"),
  copiaECola: text("copia_e_cola").notNull(),
  amountCents: integer("amount_cents").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type PaymentCharge = typeof paymentCharges.$inferSelect;
export type NewPaymentCharge = typeof paymentCharges.$inferInsert;
