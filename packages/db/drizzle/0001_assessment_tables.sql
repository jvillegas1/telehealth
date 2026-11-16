CREATE TYPE "public"."assessment_session_status" AS ENUM('in_progress', 'completed', 'risk_halted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."crisis_resource_type" AS ENUM('phone', 'url', 'text');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assessment_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_profile_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"prompt_version" text NOT NULL,
	"status" "assessment_session_status" DEFAULT 'in_progress' NOT NULL,
	"current_step" text DEFAULT 'welcome' NOT NULL,
	"progress_ciphertext" text,
	"progress_iv" text,
	"progress_tag" text,
	"intake_form_id" uuid,
	"risk_triggered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crisis_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"resource_type" "crisis_resource_type" NOT NULL,
	"contact_uri" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by_user_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_patient_profile_id_patient_profiles_id_fk" FOREIGN KEY ("patient_profile_id") REFERENCES "public"."patient_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_intake_form_id_intake_forms_id_fk" FOREIGN KEY ("intake_form_id") REFERENCES "public"."intake_forms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crisis_resources" ADD CONSTRAINT "crisis_resources_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crisis_resources" ADD CONSTRAINT "crisis_resources_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
