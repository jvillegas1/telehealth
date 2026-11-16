import type { UserRole } from "@telehealth/domain";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: UserRole;
    };
  }

  interface User {
    role?: UserRole;
    mfaEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
  }
}