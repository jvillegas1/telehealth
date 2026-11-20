import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb } from "../client";
import { runMigrations } from "../migrate/run-migrations";
import { seedAnonymized } from "../seed/anonymized";
import { bookAppointment } from "../scheduling/book-appointment";
import { ScheduleConflictError } from "../scheduling/errors";
import { patientProfiles, professionalProfiles } from "../schema";

const ENCRYPTION_KEY = "01234567890123456789012345678901";

describe("concurrencia de reserva (REQ-MOD-05)", () => {
  let container: StartedPostgreSqlContainer;
  let databaseUrl: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
    databaseUrl = container.getConnectionUri();
    await runMigrations(databaseUrl);
    await seedAnonymized(createDb(databaseUrl), ENCRYPTION_KEY);
  }, 120_000);

  afterAll(async () => {
    await container?.stop();
  });

  it("solo una reserva concurrente confirma el mismo horario", async () => {
    const db = createDb(databaseUrl);
    const [pro] = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.displayName, "Profesional Demo"));
    const [patientA] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.displayName, "Paciente A"));
    const [patientB] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.displayName, "Paciente B"));

    if (!pro || !patientA || !patientB) {
      throw new Error("Seed incompleto");
    }

    const scheduledAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    scheduledAt.setMinutes(0, 0, 0);
    const scheduledEndAt = new Date(scheduledAt.getTime() + 50 * 60 * 1000);
    const now = new Date();

    const input = {
      professionalProfileId: pro.id,
      scheduledAt,
      scheduledEndAt,
      cancellationPolicyVersion: 1,
      policyAcceptedAt: now,
    };

    const results = await Promise.allSettled([
      bookAppointment(db, { ...input, patientProfileId: patientA.id }),
      bookAppointment(db, { ...input, patientProfileId: patientB.id }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const fail = rejected[0];
    expect(fail?.status).toBe("rejected");
    if (fail?.status === "rejected") {
      expect(fail.reason).toBeInstanceOf(ScheduleConflictError);
    }
  });
});
