import {
  pgTable,
  uuid,
  text,
  integer,
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
