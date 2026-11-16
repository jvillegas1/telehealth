"use server";

import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createDb } from "@telehealth/db";
import { countries, patientProfiles, users } from "@telehealth/db/schema";

import { getServerEnv } from "@/env.server";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, "Usa al menos 12 caracteres."),
  displayName: z.string().min(2),
});

export type RegisterState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function registerPatient(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Revisa los datos del formulario." };
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return { status: "error", message: "El servicio no está disponible en este entorno." };
  }

  const db = createDb(url);
  const [country] = await db.select().from(countries).where(eq(countries.code, "AR"));
  if (!country) {
    return { status: "error", message: "Configuración incompleta del país demo." };
  }

  try {
    const passwordHash = await hash(parsed.data.password);
    const [user] = await db
      .insert(users)
      .values({
        email: parsed.data.email,
        name: parsed.data.displayName,
        role: "patient",
        passwordHash,
        countryId: country.id,
        privacySettings: { marketingEmails: false, sessionReminders: true },
      })
      .returning();
    if (!user) {
      return { status: "error", message: "No pudimos crear la cuenta." };
    }
    await db.insert(patientProfiles).values({
      userId: user.id,
      displayName: parsed.data.displayName,
    });
    return { status: "success" };
  } catch {
    return { status: "error", message: "Ese correo ya está registrado o hubo un problema." };
  }
}