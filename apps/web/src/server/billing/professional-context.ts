import { eq } from "drizzle-orm";

import type { Db } from "@telehealth/db";
import { professionalProfiles } from "@telehealth/db/schema";

export async function getProfessionalProfileForUser(db: Db, userId: string) {
  const [profile] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.userId, userId));
  return profile ?? null;
}
