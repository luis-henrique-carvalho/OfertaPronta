ALTER TABLE "exports" ALTER COLUMN "expires_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "drafts" ADD COLUMN "clean_master_image_data_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "clean_master_image_data_url" text;