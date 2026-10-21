import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const showcaseCards = pgTable(
  "showcase_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessSegment: text("business_segment").notNull(),
    stylePresetId: text("style_preset_id").notNull(),
    cardIntent: text("card_intent").notNull().default("promo"),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url").notNull(),
    aspectRatio: text("aspect_ratio").notNull().default("feed"),
    isFeatured: boolean("is_featured").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    metadata: jsonb("metadata").$type<{
      businessName?: string;
      promoPrice?: string;
      originalPrice?: string;
      highlights?: string[];
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("showcase_cards_segment_style_idx").on(
      table.businessSegment,
      table.stylePresetId,
    ),
    index("showcase_cards_featured_order_idx").on(
      table.businessSegment,
      table.isFeatured,
      table.displayOrder,
    ),
  ],
);

export type ShowcaseCard = typeof showcaseCards.$inferSelect;
export type NewShowcaseCard = typeof showcaseCards.$inferInsert;
