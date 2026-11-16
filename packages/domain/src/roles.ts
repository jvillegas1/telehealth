export const UserRole = {
  Patient: "patient",
  Professional: "professional",
  Admin: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export function requiresMfa(role: UserRole): boolean {
  return role === UserRole.Professional || role === UserRole.Admin;
}

export function isUserRole(value: string): value is UserRole {
  return (Object.values(UserRole) as string[]).includes(value);
}