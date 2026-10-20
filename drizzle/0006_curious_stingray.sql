ALTER TABLE "drafts" ADD COLUMN "card_intent" text DEFAULT 'promo' NOT NULL;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "custom_intent_text" text;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "logo_image_data_url" text;