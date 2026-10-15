CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid,
	"template_id" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text DEFAULT '' NOT NULL,
	"product_name" text DEFAULT '' NOT NULL,
	"promo_price" text DEFAULT '' NOT NULL,
	"original_price" text,
	"product_image_url" text,
	"logo_url" text,
	"call_to_action" text DEFAULT 'Peça já!' NOT NULL,
	"whatsapp" text,
	"selected_template_id" text DEFAULT 'classic-burger' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"amount_cents" integer DEFAULT 990 NOT NULL,
	"frozen_snapshot" jsonb NOT NULL,
	"customer_email" text,
	"customer_whatsapp" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"tx_id" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"qr_code_image_url" text,
	"copia_e_cola" text NOT NULL,
	"amount_cents" integer DEFAULT 990 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_charges_tx_id_unique" UNIQUE("tx_id")
);
--> statement-breakpoint
CREATE TABLE "exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"feed_url" text NOT NULL,
	"story_url" text NOT NULL,
	"feed_asset_key" text,
	"story_asset_key" text,
	"expires_at" timestamp with time zone NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"last_downloaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_charges" ADD CONSTRAINT "payment_charges_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;