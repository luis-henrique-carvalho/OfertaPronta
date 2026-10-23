CREATE TABLE "free_preview_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"visitor_id" text NOT NULL,
	"ip_hash" text NOT NULL,
	"draft_id" text NOT NULL,
	"status" text NOT NULL,
	"reserved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "free_preview_ledger_visitor_idx" ON "free_preview_ledger" USING btree ("visitor_id","reserved_at");--> statement-breakpoint
CREATE INDEX "free_preview_ledger_ip_idx" ON "free_preview_ledger" USING btree ("ip_hash","reserved_at");--> statement-breakpoint
CREATE INDEX "free_preview_ledger_reserved_at_idx" ON "free_preview_ledger" USING btree ("reserved_at");--> statement-breakpoint
CREATE INDEX "free_preview_ledger_visitor_status_idx" ON "free_preview_ledger" USING btree ("visitor_id","status","reserved_at" DESC NULLS LAST);