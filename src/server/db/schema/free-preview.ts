import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

export const freePreviewLedger = pgTable(
  "free_preview_ledger",
  {
    id: text("id").primaryKey(),
    visitorId: text("visitor_id").notNull(),
    ipHash: text("ip_hash").notNull(),
    draftId: text("draft_id").notNull(),
    status: text("status").notNull(), // 'RESERVED' | 'CONSUMED' | 'FAILED'
    reservedAt: timestamp("reserved_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
  },
  (table) => [
    index("free_preview_ledger_visitor_idx").on(
      table.visitorId,
      table.reservedAt,
    ),
    index("free_preview_ledger_ip_idx").on(table.ipHash, table.reservedAt),
    index("free_preview_ledger_reserved_at_idx").on(table.reservedAt),
    index("free_preview_ledger_visitor_status_idx").on(
      table.visitorId,
      table.status,
      table.reservedAt.desc(),
    ),
  ],
);

export type FreePreviewLedger = typeof freePreviewLedger.$inferSelect;
export type NewFreePreviewLedger = typeof freePreviewLedger.$inferInsert;
