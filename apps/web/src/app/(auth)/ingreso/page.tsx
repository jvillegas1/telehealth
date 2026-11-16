"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button, Card, Input, Label } from "@telehealth/ui";

export default function IngresoPage() {
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
      setError("No pudimos iniciar sesión. Revisa tu correo, contraseña o código MFA.");
      return;
    }
    router.push("/consentimiento");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Ingresar</h1>
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
          <div>
            <Label htmlFor="totp">Código MFA (profesional o administración)</Label>
            <Input id="totp" name="totp" inputMode="numeric" autoComplete="one-time-code" />
          </div>
          {error ? <Alert variant="error">{error}</Alert> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Verificando…" : "Continuar"}
          </Button>
        </form>
      </Card>
    </main>
  );
}