export const AdminInternalRole = {
  Verifier: "verifier",
  Finance: "finance",
  Support: "support",
} as const;

export type AdminInternalRole = (typeof AdminInternalRole)[keyof typeof AdminInternalRole];

export const AdminPermission = {
  CredentialsReview: "credentials.review",
  CredentialsRead: "credentials.read",
  UsersSuspend: "users.suspend",
  UsersRead: "users.read",
  PaymentsRead: "payments.read",
  PaymentsExport: "payments.export",
  SettlementsRead: "settlements.read",
  ReviewsModerate: "reviews.moderate",
  CountriesConfigure: "countries.configure",
  CountriesRead: "countries.read",
  AuditRead: "audit.read",
  SensitiveRequest: "sensitive.request",
  SensitiveApprove: "sensitive.approve",
  CrisisManage: "crisis.manage",
} as const;

export type AdminPermission = (typeof AdminPermission)[keyof typeof AdminPermission];

const rolePermissions: Record<AdminInternalRole, ReadonlySet<AdminPermission>> = {
  verifier: new Set([
    AdminPermission.CredentialsReview,
    AdminPermission.CredentialsRead,
    AdminPermission.AuditRead,
  ]),
  finance: new Set([
    AdminPermission.PaymentsRead,
    AdminPermission.PaymentsExport,
    AdminPermission.SettlementsRead,
    AdminPermission.CountriesConfigure,
    AdminPermission.CountriesRead,
    AdminPermission.AuditRead,
    AdminPermission.CrisisManage,
  ]),
  support: new Set([
    AdminPermission.UsersSuspend,
    AdminPermission.UsersRead,
    AdminPermission.ReviewsModerate,
    AdminPermission.CredentialsRead,
    AdminPermission.PaymentsRead,
    AdminPermission.SettlementsRead,
    AdminPermission.CountriesRead,
    AdminPermission.AuditRead,
    AdminPermission.SensitiveRequest,
    AdminPermission.SensitiveApprove,
    AdminPermission.CrisisManage,
  ]),
};

export function permissionsForRoles(roles: AdminInternalRole[]): Set<AdminPermission> {
  const out = new Set<AdminPermission>();
  for (const role of roles) {
    for (const p of rolePermissions[role]) {
      out.add(p);
    }
  }
  return out;
}

export function hasAdminPermission(
  roles: AdminInternalRole[],
  permission: AdminPermission,
): boolean {
  return permissionsForRoles(roles).has(permission);
}
