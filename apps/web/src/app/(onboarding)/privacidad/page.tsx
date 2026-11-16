import Link from "next/link";

import { Alert, Card } from "@telehealth/ui";

export default function PrivacidadPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Privacidad y datos de salud</h1>
      <Card className="space-y-3 text-sm leading-relaxed text-calm-800">
        <p>
          No usamos tu información de salud para publicidad de terceros. Puedes configurar recordatorios
          de sesión sin mensajes persuasivos.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Recordatorios de sesiones agendadas</li>
          <li>Revocación de consentimiento para compartir ficha</li>
        </ul>
        <Alert variant="info">
          Los datos de salud se cifran en reposo. El acceso a tu ficha queda en el registro de auditoría.
        </Alert>
      </Card>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-calm-800 px-4 text-sm font-medium text-white"
      >
        Ir al inicio
      </Link>
    </main>
  );
}