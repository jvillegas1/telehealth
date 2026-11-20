CREATE TYPE "public"."settlement_status" AS ENUM('calculated', 'in_process', 'paid', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commission_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid,
	"version" integer NOT NULL,
	"rate_bps" integer NOT NULL,
	"min_commission_cents" integer,
	"max_commission_cents" integer,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commission_rules_country_version" ON "commission_rules" ("country_id","version");--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "commission_rule_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "commission_rule_version" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "commission_cents" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "net_cents" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "country_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "approved_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_commission_rule_id_commission_rules_id_fk" FOREIGN KEY ("commission_rule_id") REFERENCES "public"."commission_rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settlement_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_profile_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"status" "settlement_status" DEFAULT 'calculated' NOT NULL,
	"gross_cents" integer NOT NULL,
	"commission_cents" integer NOT NULL,
	"net_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"failure_code" text,
	"failure_message" text,
	"paid_at" timestamp with time zone,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "settlement_batches" ADD CONSTRAINT "settlement_batches_professional_profile_id_professional_profiles_id_fk" FOREIGN KEY ("professional_profile_id") REFERENCES "public"."professional_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "settlement_batches_idempotency_key_unique" ON "settlement_batches" ("idempotency_key");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settlement_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settlement_batch_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_settlement_batch_id_settlement_batches_id_fk" FOREIGN KEY ("settlement_batch_id") REFERENCES "public"."settlement_batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "settlement_items_payment_unique" ON "settlement_items" ("payment_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professional_payout_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_profile_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"payload_ciphertext" text NOT NULL,
	"payload_iv" text NOT NULL,
	"payload_tag" text NOT NULL,
	"last_validated_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "professional_payout_credentials" ADD CONSTRAINT "professional_payout_credentials_professional_profile_id_professional_profiles_id_fk" FOREIGN KEY ("professional_profile_id") REFERENCES "public"."professional_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "professional_payout_credentials" ADD CONSTRAINT "professional_payout_credentials_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "professional_payout_credentials_pro_country" ON "professional_payout_credentials" ("professional_profile_id","country_id");