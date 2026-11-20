import Link from "next/link";

import { Alert, Card } from "@telehealth/ui";

export default function PrivacidadPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Privacidad y datos de salud</h1>
      <Card className="space-y-3 text-sm leading-relaxed text-calm-800">
        <p>
          Tratamos datos de salud solo con tu consentimiento explícito y para prestar el servicio
          (agenda, sesiones, pagos y soporte). No vendemos tu información ni la usamos para
          publicidad de terceros. No integramos píxeles de remarketing ni SDK de analítica
          publicitaria.
        </p>
        <h2 className="text-base font-medium text-calm-900">Qué guardamos</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Cuenta, país y preferencias de privacidad (p. ej. recordatorios de sesión).</li>
          <li>Ficha de autoevaluación orientativa, cifrada en reposo.</li>
          <li>Citas, pagos, notas de sesión y registro de accesos a datos sensibles.</li>
        </ul>
        <h2 className="text-base font-medium text-calm-900">Consentimiento y acceso</h2>
        <p>
          Compartir la ficha con un profesional requiere tu autorización explícita; puedes revocarla
          cuando quieras. Cada lectura de ficha queda en el registro de auditoría.
        </p>
        <h2 className="text-base font-medium text-calm-900">Retención y borrado</h2>
        <p>
          Conservamos los datos el tiempo necesario para el servicio, obligaciones legales y
          liquidaciones. Puedes solicitar exportación o borrado de cuenta contactando soporte; el
          equipo validará identidad y plazos legales antes de eliminar datos.
        </p>
        <h2 className="text-base font-medium text-calm-900">Comunicaciones</h2>
        <p>
          Los recordatorios de sesión son informativos, sin mensajes persuasivos ni marketing de
          salud.
        </p>
        <Alert variant="info">
          Los datos de salud se cifran en reposo. El acceso a tu ficha queda en el registro de
          auditoría.
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
