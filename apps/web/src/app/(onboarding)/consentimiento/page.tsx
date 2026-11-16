import Link from "next/link";

import { Alert, Card } from "@telehealth/ui";

export default function ConsentimientoPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Consentimiento para compartir tu ficha</h1>
      <Card className="space-y-3 text-sm leading-relaxed text-calm-800">
        <p>
          Tu ficha de autoevaluación es <strong className="font-medium">orientativa</strong>. Solo la
          compartiremos con un profesional cuando tú lo autorices de forma explícita.
        </p>
        <p>Puedes revocar el permiso en cualquier momento desde privacidad.</p>
        <Alert variant="info">
          Cada acceso de un profesional a tu ficha queda registrado por seguridad.
        </Alert>
      </Card>
      <Link
        href="/privacidad"
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-calm-800 px-4 text-sm font-medium text-white"
      >
        Continuar
      </Link>
    </main>
  );
}