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

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
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
        const db = createDb(url);
        const [user] = await db.select().from(users).where(eq(users.email, String(credentials.email)));
        if (!user?.passwordHash) {
          return null;
        }
        const valid = await verify(user.passwordHash, String(credentials.password));
        if (!valid) {
          return null;
        }
        if (requiresMfa(user.role) && user.mfaEnabled) {
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        (session.user as { role?: UserRole }).role = token["role"] as UserRole;
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