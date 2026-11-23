import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticator } from "otplib";

import { createDb } from "@telehealth/db";
import { users } from "@telehealth/db/schema";
import { requiresMfa, type UserRole } from "@telehealth/domain";

import { getServerEnv } from "@/env.server";

function getDatabaseUrl(): string | undefined {
  const env = getServerEnv();
  return "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
}

/** `REQUIRE_MFA=0` desactiva TOTP en login y la exigencia MFA para admin (solo dev/local). */
function isMfaEnforced(): boolean {
  return process.env["REQUIRE_MFA"] !== "0";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "Código MFA", type: "text" },
      },
      async authorize(credentials) {
        const url = getDatabaseUrl();
        if (!url || !credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          const db = createDb(url);
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, String(credentials.email)));
          if (!user?.passwordHash) {
            return null;
          }
          const valid = await verify(user.passwordHash, String(credentials.password));
          if (!valid) {
            return null;
          }
          if (user.suspendedAt) {
            return null;
          }
          const adminMfaPolicy = process.env["ADMIN_REQUIRE_MFA"] !== "0";
          if (isMfaEnforced() && adminMfaPolicy && user.role === "admin" && !user.mfaEnabled) {
            return null;
          }
          if (isMfaEnforced() && requiresMfa(user.role) && user.mfaEnabled) {
            const code = String(credentials.totp ?? "");
            if (!user.mfaSecretCiphertext || !user.mfaSecretIv || !user.mfaSecretTag) {
              return null;
            }
            const env = getServerEnv();
            const key = env.ENCRYPTION_KEY;
            if (!key) return null;
            const { decryptField } = await import("@telehealth/db");
            const secret = decryptField(
              {
                ciphertext: user.mfaSecretCiphertext,
                iv: user.mfaSecretIv,
                tag: user.mfaSecretTag,
              },
              key,
            );
            if (!authenticator.check(code, secret)) {
              return null;
            }
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            mfaEnabled: user.mfaEnabled,
          };
        } catch (error) {
          console.error("[auth] authorize failed (¿PostgreSQL activo y migrado?)", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const role = (user as { role?: UserRole }).role;
        if (role) {
          token["role"] = role;
        }
        if (user.id) {
          token["sub"] = user.id;
        }
        const mfaEnabled = (user as { mfaEnabled?: boolean }).mfaEnabled;
        if (mfaEnabled !== undefined) {
          token["mfaEnabled"] = mfaEnabled;
        }
        if (role === "admin") {
          const maxSec = Number(process.env["ADMIN_SESSION_MAX_AGE_SEC"] ?? 1200);
          token.exp = Math.floor(Date.now() / 1000) + maxSec;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        (session.user as { role?: UserRole }).role = token["role"] as UserRole;
        (session.user as { mfaEnabled?: boolean }).mfaEnabled = Boolean(token["mfaEnabled"]);
      }
      return session;
    },
  },
  pages: {
    signIn: "/ingreso",
  },
  secret: getServerEnv().AUTH_SECRET ?? "development-only-auth-secret-32chars!",
  trustHost: true,
});
