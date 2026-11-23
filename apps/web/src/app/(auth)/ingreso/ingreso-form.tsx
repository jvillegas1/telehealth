"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button, Card, Input, Label } from "@telehealth/ui";

type IngresoFormProps = {
  mfaRequired: boolean;
  databaseReady: boolean;
};

export function IngresoForm({ mfaRequired, databaseReady }: IngresoFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      totp: String(form.get("totp") ?? ""),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError(
        !databaseReady
          ? "No hay conexión con la base de datos. Levantá PostgreSQL y ejecutá pnpm db:create-admin."
          : mfaRequired
            ? "No pudimos iniciar sesión. Revisa tu correo, contraseña o código MFA."
            : "No pudimos iniciar sesión. Revisa tu correo y contraseña.",
      );
      return;
    }
    const me = await fetch("/api/auth/session").then((r) => r.json());
    const role = me?.user?.role;
    if (role === "admin") {
      router.push("/admin");
    } else if (role === "professional") {
      router.push("/profesional/agenda");
    } else {
      router.push("/consentimiento");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Ingresar</h1>
      {!databaseReady ? (
        <Alert variant="info">
          PostgreSQL no responde en <code className="text-sm">DATABASE_URL</code>. Con Docker:{" "}
          <code className="text-sm">docker compose up -d</code>, luego{" "}
          <code className="text-sm">pnpm db:create-admin</code>.
        </Alert>
      ) : null}
      <Card>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">Correo</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {mfaRequired ? (
            <div>
              <Label htmlFor="totp">Código MFA (profesional o administración)</Label>
              <Input id="totp" name="totp" inputMode="numeric" autoComplete="one-time-code" />
            </div>
          ) : null}
          {error ? <Alert variant="error">{error}</Alert> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Verificando…" : "Continuar"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
