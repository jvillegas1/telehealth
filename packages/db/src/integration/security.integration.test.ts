import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb, getPool } from "../client";
import { encryptField } from "../crypto/field-encryption";
import { readIntakeFormForActor } from "../access/intake-access";
import { runMigrations } from "../migrate/run-migrations";
import { withRlsClient } from "../rls/with-rls-context";
import { seedAnonymized } from "../seed/anonymized";
import {
  consents,
  intakeForms,
  patientProfiles,
  professionalProfiles,
  users,
} from "../schema";

const ENCRYPTION_KEY = "01234567890123456789012345678901";

describe("seguridad RLS y audit (REQ-SEC-03)", () => {
  let container: StartedPostgreSqlContainer;
  let databaseUrl: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
    databaseUrl = container.getConnectionUri();
    await runMigrations(databaseUrl);
    const db = createDb(databaseUrl);
    await seedAnonymized(db, ENCRYPTION_KEY);
  }, 120_000);

  afterAll(async () => {
    await container?.stop();
  });

  it("paciente A no lee ficha del paciente B (RLS)", async () => {
    const pool = getPool(databaseUrl);
    const db = createDb(databaseUrl);
    const [patientA] = await db
      .select()
      .from(users)
      .where(eq(users.email, "paciente.a@example.test"));
    const [patientB] = await db
      .select()
      .from(users)
      .where(eq(users.email, "paciente.b@example.test"));
    const [profileB] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientB!.id));
    const enc = encryptField('{"b":true}', ENCRYPTION_KEY);
    const [intakeB] = await db
      .insert(intakeForms)
      .values({
        patientProfileId: profileB!.id,
        contentCiphertext: enc.ciphertext,
        contentIv: enc.iv,
        contentTag: enc.tag,
      })
      .returning();

    const rows = await withRlsClient(
      pool,
      { userId: patientA!.id, role: "patient" },
      async (client) => {
        const res = await client.query<{ id: string }>(
          `SELECT id FROM intake_forms WHERE id = $1`,
          [intakeB!.id],
        );
        return res.rows;
      },
      { useAppRole: true },
    );

    expect(rows).toHaveLength(0);
  });

  it("profesional sin consentimiento recibe 403 en capa de acceso", async () => {
    const db = createDb(databaseUrl);
    const [pro] = await db
      .select()
      .from(users)
      .where(eq(users.email, "profesional@example.test"));
    const [patientB] = await db
      .select()
      .from(users)
      .where(eq(users.email, "paciente.b@example.test"));
    const [profileB] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientB!.id));
    const enc = encryptField('{"solo-b":true}', ENCRYPTION_KEY);
    const [intakeB] = await db
      .insert(intakeForms)
      .values({
        patientProfileId: profileB!.id,
        contentCiphertext: enc.ciphertext,
        contentIv: enc.iv,
        contentTag: enc.tag,
      })
      .returning();

    const result = await readIntakeFormForActor(db, {
      intakeFormId: intakeB!.id,
      actorUserId: pro!.id,
      actorRole: "professional",
      encryptionKey: ENCRYPTION_KEY,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });

  it("revocación corta el acceso al instante (RLS)", async () => {
    const pool = getPool(databaseUrl);
    const db = createDb(databaseUrl);
    const [pro] = await db
      .select()
      .from(users)
      .where(eq(users.email, "profesional@example.test"));
    const [proProfile] = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, pro!.id));
    const [intake] = await db.select().from(intakeForms).limit(1);

    await db
      .update(consents)
      .set({ revokedAt: new Date() })
      .where(eq(consents.intakeFormId, intake!.id));

    const rows = await withRlsClient(
      pool,
      { userId: pro!.id, role: "professional" },
      async (client) => {
        const res = await client.query(`SELECT id FROM intake_forms WHERE id = $1`, [intake!.id]);
        return res.rows;
      },
      { useAppRole: true },
    );

    expect(rows).toHaveLength(0);
    expect(proProfile).toBeTruthy();
  });

  it("audit_log rechaza UPDATE y DELETE", async () => {
    const pool = getPool(databaseUrl);
    const client = await pool.connect();
    try {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO audit_log (action, resource_type, resource_id)
         VALUES ('test', 'intake_form', gen_random_uuid())
         RETURNING id`,
      );
      const id = inserted.rows[0]!.id;
      await expect(client.query(`UPDATE audit_log SET action = 'x' WHERE id = $1`, [id])).rejects
        .toThrow(/append-only/);
      await expect(client.query(`DELETE FROM audit_log WHERE id = $1`, [id])).rejects.toThrow(
        /append-only/,
      );
    } finally {
      client.release();
    }
  });
});