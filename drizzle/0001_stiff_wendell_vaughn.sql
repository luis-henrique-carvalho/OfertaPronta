ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_campaign_id_campaigns_id_fk";--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "campaigns_draft_id_drafts_id_fk";--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "draft_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "drafts" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "drafts" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "drafts" ALTER COLUMN "call_to_action" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "drafts" ALTER COLUMN "call_to_action" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "campaign_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "business_segment" text DEFAULT 'supermarket' NOT NULL;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "offer_title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "product_image_data_url" text;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "reference_image_data_url" text;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "style_preset_id" text;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "custom_style_instructions" text;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "preview_card_image_url" text;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "ai_generation_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "drafts" DROP COLUMN "product_name";--> statement-breakpoint
ALTER TABLE "drafts" DROP COLUMN "product_image_url";--> statement-breakpoint
ALTER TABLE "drafts" DROP COLUMN "logo_url";--> statement-breakpoint
ALTER TABLE "drafts" DROP COLUMN "selected_template_id";--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;