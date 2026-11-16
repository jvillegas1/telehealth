CREATE TYPE "public"."professional_profile_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."review_moderation_status" AS ENUM('pending', 'visible', 'hidden', 'reported');--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "country_id" uuid;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "specialties" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "therapeutic_approach" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "languages" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "fee_cents" integer;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "photo_alt" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "status" "professional_profile_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credential_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credential_documents" ADD CONSTRAINT "credential_documents_credential_id_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professional_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_profile_id" uuid NOT NULL,
	"patient_profile_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"moderation_status" "review_moderation_status" DEFAULT 'pending' NOT NULL,
	"reported_at" timestamp with time zone,
	"moderated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "professional_reviews" ADD CONSTRAINT "professional_reviews_professional_profile_id_professional_profiles_id_fk" FOREIGN KEY ("professional_profile_id") REFERENCES "public"."professional_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "professional_reviews" ADD CONSTRAINT "professional_reviews_patient_profile_id_patient_profiles_id_fk" FOREIGN KEY ("patient_profile_id") REFERENCES "public"."patient_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "professional_reviews" ADD CONSTRAINT "professional_reviews_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "professional_reviews" ADD CONSTRAINT "professional_reviews_moderated_by_user_id_users_id_fk" FOREIGN KEY ("moderated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;