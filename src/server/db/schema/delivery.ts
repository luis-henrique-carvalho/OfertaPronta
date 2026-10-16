import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const deliveryExports = pgTable("exports", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  feedUrl: text("feed_url").notNull(),
  storyUrl: text("story_url").notNull(),
  feedAssetKey: text("feed_asset_key"),
  storyAssetKey: text("story_asset_key"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  downloadCount: integer("download_count").notNull().default(0),
  lastDownloadedAt: timestamp("last_downloaded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export { deliveryExports as exports };

export type Export = typeof deliveryExports.$inferSelect;
export type NewExport = typeof deliveryExports.$inferInsert;
