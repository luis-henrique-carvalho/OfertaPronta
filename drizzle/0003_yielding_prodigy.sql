ALTER TABLE "orders" ADD COLUMN "draft_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ai_regeneration_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE no action ON UPDATE no action;