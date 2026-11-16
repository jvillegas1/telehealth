import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { Db } from "@telehealth/db";
import { decryptField } from "@telehealth/db";
import { assessmentSessions, intakeForms } from "@telehealth/db/schema";
import { assessmentOutputSchema } from "@telehealth/domain";

const intakeContentSchema = z.union([assessmentOutputSchema, z.object({ perfilProfesionalSugerido: z.array(z.string()) })]);

export async function loadSuggestedTagsForPatient(
  db: Db,
  patientProfileId: string,
  encryptionKey: string,
  intakeId?: string,
): Promise<string[]> {
  if (intakeId) {
    const [intake] = await db.select().from(intakeForms).where(eq(intakeForms.id, intakeId));
    if (intake && intake.patientProfileId === patientProfileId) {
      return decryptIntakeTags(intake, encryptionKey);
    }
  }

  const [session] = await db
    .select()
    .from(assessmentSessions)
    .where(
      and(
        eq(assessmentSessions.patientProfileId, patientProfileId),
        eq(assessmentSessions.status, "completed"),
      ),
    )
    .orderBy(desc(assessmentSessions.updatedAt))
    .limit(1);

  if (!session?.intakeFormId) {
    return [];
  }

  const [intake] = await db.select().from(intakeForms).where(eq(intakeForms.id, session.intakeFormId));
  if (!intake) {
    return [];
  }

  return decryptIntakeTags(intake, encryptionKey);
}

function decryptIntakeTags(
  intake: typeof intakeForms.$inferSelect,
  encryptionKey: string,
): string[] {
  try {
    const plain = decryptField(
      {
        ciphertext: intake.contentCiphertext,
        iv: intake.contentIv,
        tag: intake.contentTag,
      },
      encryptionKey,
    );
    const parsed = intakeContentSchema.safeParse(JSON.parse(plain));
    if (parsed.success && "perfilProfesionalSugerido" in parsed.data) {
      return parsed.data.perfilProfesionalSugerido;
    }
  } catch {
    return [];
  }
  return [];
}