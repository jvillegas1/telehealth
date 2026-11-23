import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { Db } from "../client";
import { adminStaffAssignments, countries, users } from "../schema";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_NAME, DEMO_PASSWORD } from "./demo-credentials";

const INTERNAL_ROLES = ["verifier", "finance", "support"] as const;

export type EnsureAdminResult = {
  userId: string;
  email: string;
  password: string;
  created: boolean;
};

async function resolveCountryId(db: Db): Promise<string> {
  let [country] = await db.select().from(countries).where(eq(countries.code, "AR"));
  if (!country) {
    [country] = await db
      .insert(countries)
      .values({ code: "AR", name: "Argentina (demo)", currency: "ARS", locale: "es", active: true })
      .returning();
  }
  if (!country) {
    throw new Error("No se pudo resolver país AR.");
  }
  return country.id;
}

export async function ensureAdminUser(db: Db, encryptionKey: string): Promise<EnsureAdminResult> {
  const countryId = await resolveCountryId(db);
  const passwordHash = await hash(DEMO_PASSWORD);
  void encryptionKey;

  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_ADMIN_EMAIL));
  let userId: string;
  let created = false;

  if (existing) {
    userId = existing.id;
    await db
      .update(users)
      .set({
        name: DEMO_ADMIN_NAME,
        role: "admin",
        passwordHash,
        countryId,
        mfaEnabled: false,
        mfaSecretCiphertext: null,
        mfaSecretIv: null,
        mfaSecretTag: null,
        suspendedAt: null,
      })
      .where(eq(users.id, userId));
  } else {
    const [inserted] = await db
      .insert(users)
      .values({
        email: DEMO_ADMIN_EMAIL,
        name: DEMO_ADMIN_NAME,
        role: "admin",
        passwordHash,
        countryId,
        mfaEnabled: false,
      })
      .returning();
    if (!inserted) {
      throw new Error("No se pudo crear el usuario admin.");
    }
    userId = inserted.id;
    created = true;
  }

  const assigned = await db
    .select({ role: adminStaffAssignments.internalRole })
    .from(adminStaffAssignments)
    .where(eq(adminStaffAssignments.userId, userId));
  const present = new Set(assigned.map((r) => r.role));
  for (const internalRole of INTERNAL_ROLES) {
    if (!present.has(internalRole)) {
      await db.insert(adminStaffAssignments).values({
        userId,
        internalRole,
        assignedByUserId: userId,
      });
    }
  }

  return {
    userId,
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_PASSWORD,
    created,
  };
}
