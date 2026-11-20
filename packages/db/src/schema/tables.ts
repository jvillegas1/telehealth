import { relations, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import {
  adminInternalRoleEnum,
  appointmentStatusEnum,
  assessmentSessionStatusEnum,
  availabilityExceptionKindEnum,
  consentScopeEnum,
  credentialStatusEnum,
  crisisResourceTypeEnum,
  notificationJobKindEnum,
  notificationJobStatusEnum,
  professionalProfileStatusEnum,
  reviewModerationStatusEnum,
  paymentStatusEnum,
  payoutStatusEnum,
  sensitiveAccessStatusEnum,
  settlementStatusEnum,
  userRoleEnum,
} from "./enums";

export const countries = pgTable("countries", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  locale: text("locale").notNull().default("es"),
  paymentGateway: text("payment_gateway"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  name: text("name"),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("patient"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaSecretCiphertext: text("mfa_secret_ciphertext"),
  mfaSecretIv: text("mfa_secret_iv"),
  mfaSecretTag: text("mfa_secret_tag"),
  countryId: uuid("country_id").references(() => countries.id),
  privacySettings: jsonb("privacy_settings")
    .$type<Record<string, boolean>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspensionReason: text("suspension_reason"),
  suspendedByUserId: uuid("suspended_by_user_id").references((): AnyPgColumn => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [uniqueIndex("accounts_provider_unique").on(table.provider, table.providerAccountId)],
);

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("verification_tokens_identifier_token").on(table.identifier, table.token),
  ],
);

export const patientProfiles = pgTable(
  "patient_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    timezone: text("timezone").notNull().default("America/Argentina/Buenos_Aires"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("patient_profiles_user_unique").on(table.userId)],
);

export const professionalProfiles = pgTable(
  "professional_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    countryId: uuid("country_id").references(() => countries.id),
    specialties: text("specialties")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    therapeuticApproach: text("therapeutic_approach"),
    languages: text("languages")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    feeCents: integer("fee_cents"),
    currency: text("currency"),
    photoUrl: text("photo_url"),
    photoAlt: text("photo_alt"),
    status: professionalProfileStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    timezone: text("timezone").notNull().default("America/Argentina/Buenos_Aires"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("professional_profiles_user_unique").on(table.userId)],
);

export const credentials = pgTable("credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  professionalProfileId: uuid("professional_profile_id")
    .notNull()
    .references(() => professionalProfiles.id, { onDelete: "cascade" }),
  licenseNumber: text("license_number").notNull(),
  issuingBody: text("issuing_body").notNull(),
  status: credentialStatusEnum("status").notNull().default("pending"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedByUserId: uuid("verified_by_user_id").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const credentialDocuments = pgTable("credential_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  credentialId: uuid("credential_id")
    .notNull()
    .references(() => credentials.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const intakeForms = pgTable("intake_forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientProfileId: uuid("patient_profile_id")
    .notNull()
    .references(() => patientProfiles.id, { onDelete: "cascade" }),
  contentCiphertext: text("content_ciphertext").notNull(),
  contentIv: text("content_iv").notNull(),
  contentTag: text("content_tag").notNull(),
  summaryCiphertext: text("summary_ciphertext"),
  summaryIv: text("summary_iv"),
  summaryTag: text("summary_tag"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientProfileId: uuid("patient_profile_id")
    .notNull()
    .references(() => patientProfiles.id, { onDelete: "cascade" }),
  intakeFormId: uuid("intake_form_id").references(() => intakeForms.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "cascade" }),
  professionalProfileId: uuid("professional_profile_id")
    .notNull()
    .references(() => professionalProfiles.id, { onDelete: "cascade" }),
  scope: consentScopeEnum("scope").notNull().default("intake_form_share"),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const availability = pgTable("availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  professionalProfileId: uuid("professional_profile_id")
    .notNull()
    .references(() => professionalProfiles.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const professionalAvailabilityRules = pgTable("professional_availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  professionalProfileId: uuid("professional_profile_id")
    .notNull()
    .references(() => professionalProfiles.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  slotMinutes: integer("slot_minutes").notNull().default(50),
  bufferMinutes: integer("buffer_minutes").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const professionalAvailabilityExceptions = pgTable("professional_availability_exceptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  professionalProfileId: uuid("professional_profile_id")
    .notNull()
    .references(() => professionalProfiles.id, { onDelete: "cascade" }),
  kind: availabilityExceptionKindEnum("kind").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cancellationPolicies = pgTable("cancellation_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryId: uuid("country_id").references(() => countries.id),
  version: integer("version").notNull().default(1),
  minCancelHours: integer("min_cancel_hours").notNull().default(24),
  minRescheduleHours: integer("min_reschedule_hours").notNull().default(24),
  summary: text("summary").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientProfileId: uuid("patient_profile_id")
      .notNull()
      .references(() => patientProfiles.id, { onDelete: "cascade" }),
    professionalProfileId: uuid("professional_profile_id")
      .notNull()
      .references(() => professionalProfiles.id, { onDelete: "cascade" }),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }).notNull(),
    rescheduledFromId: uuid("rescheduled_from_id"),
    lockVersion: integer("lock_version").notNull().default(0),
    cancellationPolicyVersion: integer("cancellation_policy_version"),
    policyAcceptedAt: timestamp("policy_accepted_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("appointments_professional_slot_active")
      .on(table.professionalProfileId, table.scheduledAt)
      .where(sql`${table.status} in ('pending', 'confirmed')`),
  ],
);

export const notificationJobs = pgTable("notification_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: notificationJobKindEnum("kind").notNull(),
  runAt: timestamp("run_at", { withTimezone: true }).notNull(),
  status: notificationJobStatusEnum("status").notNull().default("pending"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const professionalReviews = pgTable("professional_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  professionalProfileId: uuid("professional_profile_id")
    .notNull()
    .references(() => professionalProfiles.id, { onDelete: "cascade" }),
  patientProfileId: uuid("patient_profile_id")
    .notNull()
    .references(() => patientProfiles.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  moderationStatus: reviewModerationStatusEnum("moderation_status").notNull().default("pending"),
  reportedAt: timestamp("reported_at", { withTimezone: true }),
  moderatedByUserId: uuid("moderated_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const therapySessions = pgTable(
  "therapy_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    professionalNotesCiphertext: text("professional_notes_ciphertext"),
    professionalNotesIv: text("professional_notes_iv"),
    professionalNotesTag: text("professional_notes_tag"),
    livekitRoomName: text("livekit_room_name"),
    e2eeEnabled: boolean("e2ee_enabled").notNull().default(true),
    recordingEnabled: boolean("recording_enabled").notNull().default(false),
    recordingPatientConsentAt: timestamp("recording_patient_consent_at", { withTimezone: true }),
    recordingProfessionalConsentAt: timestamp("recording_professional_consent_at", {
      withTimezone: true,
    }),
    subtitlesEnabled: boolean("subtitles_enabled").notNull().default(false),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("therapy_sessions_appointment_unique").on(table.appointmentId)],
);

export const commissionRules = pgTable(
  "commission_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id").references(() => countries.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    rateBps: integer("rate_bps").notNull(),
    minCommissionCents: integer("min_commission_cents"),
    maxCommissionCents: integer("max_commission_cents"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
    active: boolean("active").notNull().default(true),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("commission_rules_country_version").on(table.countryId, table.version)],
);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  commissionRuleId: uuid("commission_rule_id").references(() => commissionRules.id),
  commissionRuleVersion: integer("commission_rule_version"),
  commissionCents: integer("commission_cents"),
  netCents: integer("net_cents"),
  countryId: uuid("country_id").references(() => countries.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settlementBatches = pgTable("settlement_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  professionalProfileId: uuid("professional_profile_id")
    .notNull()
    .references(() => professionalProfiles.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  status: settlementStatusEnum("status").notNull().default("calculated"),
  grossCents: integer("gross_cents").notNull(),
  commissionCents: integer("commission_cents").notNull(),
  netCents: integer("net_cents").notNull(),
  currency: text("currency").notNull(),
  failureCode: text("failure_code"),
  failureMessage: text("failure_message"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settlementItems = pgTable(
  "settlement_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    settlementBatchId: uuid("settlement_batch_id")
      .notNull()
      .references(() => settlementBatches.id, { onDelete: "cascade" }),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("settlement_items_payment_unique").on(table.paymentId)],
);

export const professionalPayoutCredentials = pgTable(
  "professional_payout_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    professionalProfileId: uuid("professional_profile_id")
      .notNull()
      .references(() => professionalProfiles.id, { onDelete: "cascade" }),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    schemaVersion: integer("schema_version").notNull().default(1),
    payloadCiphertext: text("payload_ciphertext").notNull(),
    payloadIv: text("payload_iv").notNull(),
    payloadTag: text("payload_tag").notNull(),
    lastValidatedAt: timestamp("last_validated_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("professional_payout_credentials_pro_country").on(
      table.professionalProfileId,
      table.countryId,
    ),
  ],
);

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  professionalProfileId: uuid("professional_profile_id")
    .notNull()
    .references(() => professionalProfiles.id, { onDelete: "cascade" }),
  netAmountCents: integer("net_amount_cents").notNull(),
  status: payoutStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const crisisResources = pgTable("crisis_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryId: uuid("country_id")
    .notNull()
    .references(() => countries.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  resourceType: crisisResourceTypeEnum("resource_type").notNull(),
  contactUri: text("contact_uri").notNull(),
  active: boolean("active").notNull().default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedByUserId: uuid("verified_by_user_id").references(() => users.id),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessmentSessions = pgTable("assessment_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientProfileId: uuid("patient_profile_id")
    .notNull()
    .references(() => patientProfiles.id, { onDelete: "cascade" }),
  countryId: uuid("country_id")
    .notNull()
    .references(() => countries.id),
  promptVersion: text("prompt_version").notNull(),
  status: assessmentSessionStatusEnum("status").notNull().default("in_progress"),
  currentStep: text("current_step").notNull().default("welcome"),
  progressCiphertext: text("progress_ciphertext"),
  progressIv: text("progress_iv"),
  progressTag: text("progress_tag"),
  intakeFormId: uuid("intake_form_id").references(() => intakeForms.id),
  riskTriggeredAt: timestamp("risk_triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminStaffAssignments = pgTable(
  "admin_staff_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    internalRole: adminInternalRoleEnum("internal_role").notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    assignedByUserId: uuid("assigned_by_user_id").references(() => users.id),
  },
  (table) => [uniqueIndex("admin_staff_user_role_unique").on(table.userId, table.internalRole)],
);

export const sensitiveAccessGrants = pgTable("sensitive_access_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterUserId: uuid("requester_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id").notNull(),
  reason: text("reason").notNull(),
  status: sensitiveAccessStatusEnum("status").notNull().default("pending"),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id").notNull(),
  metadata: jsonb("metadata")
    .$type<Record<string, string>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const countriesRelations = relations(countries, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  country: one(countries, { fields: [users.countryId], references: [countries.id] }),
  patientProfile: one(patientProfiles),
  professionalProfile: one(professionalProfiles),
  accounts: many(accounts),
  authSessions: many(authSessions),
}));
