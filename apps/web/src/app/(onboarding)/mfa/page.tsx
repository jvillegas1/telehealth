import { Alert, Card } from "@telehealth/ui";

export default function MfaPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Verificación en dos pasos</h1>
      <Card className="space-y-3 text-sm leading-relaxed text-calm-800">
        <p>
          Las cuentas de profesional y administración deben activar un código de autenticación (TOTP)
          antes de acceder a fichas de pacientes.
        </p>
        <Alert variant="info">
          En el siguiente paso del proyecto verás aquí el código QR de enrolamiento. Hasta entonces, usa el
          campo MFA al ingresar si tu cuenta ya tiene un secreto configurado.
        </Alert>
      </Card>
    </main>
  );
}