import Link from "next/link";

import { Alert, Card } from "@telehealth/ui";

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ intake?: string }>;
}) {
  const { intake } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Tu resumen orientativo</h1>

      <Alert variant="info">
        Este resumen es orientativo. No es un diagnóstico clínico ni sustituye una evaluación con un
        profesional.
      </Alert>

      <Card className="text-sm leading-relaxed text-calm-800">
        <p>
          Guardamos tu ficha de forma cifrada. Cuando elijas un profesional, podrás decidir si compartirla.
        </p>
        {intake ? (
          <p className="mt-2 text-xs text-calm-800">Referencia interna: {intake}</p>
        ) : null}
      </Card>

      <Link
        href="/profesionales"
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-calm-800 px-4 text-sm font-medium text-white"
      >
        Ver profesionales sugeridos
      </Link>
    </main>
  );
}