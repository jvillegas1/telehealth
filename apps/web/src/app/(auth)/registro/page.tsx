"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, Button, Card, Input, Label } from "@telehealth/ui";

import { registerPatient, type RegisterState } from "@/app/actions/register";

const initial: RegisterState = { status: "idle" };

export default function RegistroPage() {
  const [state, action, pending] = useActionState(registerPatient, initial);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Crear cuenta de paciente</h1>
      <p className="text-sm leading-relaxed text-calm-800">
        Profesionales y administración reciben acceso por invitación. La autoevaluación es orientativa
        y no reemplaza una evaluación clínica.
      </p>
      <Card>
        <form className="flex flex-col gap-4" action={action}>
          <div>
            <Label htmlFor="displayName">Nombre para mostrar</Label>
            <Input id="displayName" name="displayName" autoComplete="name" required />
          </div>
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
              autoComplete="new-password"
              minLength={12}
              required
            />
          </div>
          {state.status === "error" ? <Alert variant="error">{state.message}</Alert> : null}
          {state.status === "success" ? (
            <Alert variant="success">
              Cuenta creada. Puedes{" "}
              <Link className="underline" href="/ingreso">
                ingresar
              </Link>
              .
            </Alert>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Creando cuenta…" : "Registrarme"}
          </Button>
        </form>
      </Card>
    </main>
  );
}