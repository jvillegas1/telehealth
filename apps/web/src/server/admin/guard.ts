import { NextResponse } from "next/server";

import { createDb, loadAdminInternalRoles } from "@telehealth/db";
import { users } from "@telehealth/db/schema";
import { eq } from "drizzle-orm";
import { AdminPermission, hasAdminPermission, type AdminInternalRole } from "@telehealth/domain";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";

export type AdminGuardResult =
  | { ok: false; response: Response }
  | { ok: true; userId: string; roles: AdminInternalRole[]; db: ReturnType<typeof createDb> };

export async function requireAdmin(permission?: AdminPermission): Promise<AdminGuardResult> {
  const session = await auth();
  if (session?.user?.role !== "admin" || !session.user.id) {
    return {
      ok: false,
      response: NextResponse.json({ message: "No autorizado." }, { status: 403 }),
    };
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Servicio no disponible." }, { status: 503 }),
    };
  }

  const db = createDb(url);
  const [userRow] = await db.select().from(users).where(eq(users.id, session.user.id));
  const requireMfa = process.env["REQUIRE_MFA"] !== "0" && process.env["ADMIN_REQUIRE_MFA"] !== "0";
  if (requireMfa && !userRow?.mfaEnabled) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "MFA obligatorio para administración." },
        { status: 403 },
      ),
    };
  }

  const roles = await loadAdminInternalRoles(db, session.user.id);
  if (roles.length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Sin rol interno asignado." }, { status: 403 }),
    };
  }

  if (permission && !hasAdminPermission(roles, permission)) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Permiso insuficiente." }, { status: 403 }),
    };
  }

  return { ok: true, userId: session.user.id, roles, db };
}
