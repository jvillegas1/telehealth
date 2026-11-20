ALTER TYPE "consent_scope" ADD VALUE IF NOT EXISTS 'session_recording';--> statement-breakpoint
ALTER TABLE "consents" ALTER COLUMN "intake_form_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "consents" ADD COLUMN IF NOT EXISTS "appointment_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consents" ADD CONSTRAINT "consents_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "therapy_sessions" ADD COLUMN IF NOT EXISTS "livekit_room_name" text;--> statement-breakpoint
ALTER TABLE "therapy_sessions" ADD COLUMN IF NOT EXISTS "e2ee_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "therapy_sessions" ADD COLUMN IF NOT EXISTS "recording_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "therapy_sessions" ADD COLUMN IF NOT EXISTS "recording_patient_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "therapy_sessions" ADD COLUMN IF NOT EXISTS "recording_professional_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "therapy_sessions" ADD COLUMN IF NOT EXISTS "subtitles_enabled" boolean DEFAULT false NOT NULL;