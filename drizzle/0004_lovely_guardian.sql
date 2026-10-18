ALTER TABLE "orders" ALTER COLUMN "amount_cents" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payment_charges" ALTER COLUMN "amount_cents" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "plan_id" text DEFAULT 'single_campaign' NOT NULL;