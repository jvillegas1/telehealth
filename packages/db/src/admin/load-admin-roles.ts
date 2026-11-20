import { eq } from "drizzle-orm";

import type { AdminInternalRole } from "@telehealth/domain";

import type { Db } from "../client";
import { adminStaffAssignments } from "../schema";

export async function loadAdminInternalRoles(db: Db, userId: string): Promise<AdminInternalRole[]> {
  const rows = await db
    .select({ role: adminStaffAssignments.internalRole })
    .from(adminStaffAssignments)
    .where(eq(adminStaffAssignments.userId, userId));
  return rows.map((r) => r.role as AdminInternalRole);
}
