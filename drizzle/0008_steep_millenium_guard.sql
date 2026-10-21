CREATE TABLE "showcase_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_segment" text NOT NULL,
	"style_preset_id" text NOT NULL,
	"card_intent" text DEFAULT 'promo' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"aspect_ratio" text DEFAULT 'feed' NOT NULL,
	"is_featured" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "preview_asset_key" text;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "clean_master_asset_key" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "clean_master_asset_key" text;--> statement-breakpoint
CREATE INDEX "showcase_cards_segment_style_idx" ON "showcase_cards" USING btree ("business_segment","style_preset_id");--> statement-breakpoint
CREATE INDEX "showcase_cards_featured_order_idx" ON "showcase_cards" USING btree ("business_segment","is_featured","display_order");