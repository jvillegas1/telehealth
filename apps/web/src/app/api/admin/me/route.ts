import { NextResponse } from "next/server";

import { AdminPermission, hasAdminPermission, permissionsForRoles } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";

export async function GET(): Promise<Response> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const permissions = [...permissionsForRoles(gate.roles)];
  return NextResponse.json({
    roles: gate.roles,
    permissions,
    canReview: hasAdminPermission(gate.roles, AdminPermission.CredentialsReview),
  });
}
