import { redirect } from "next/navigation";

import { ProfessionalOnboardingForm } from "./onboarding-form";
import { auth } from "@/auth/auth";

export default async function ProfessionalOnboardingPage() {
  const session = await auth();
  if (session?.user?.role !== "professional") {
    redirect("/ingreso");
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Tu perfil profesional</h1>
      <p className="text-sm text-calm-800">
        Completá tus datos y credenciales. Hasta que un administrador apruebe tu matrícula, no aparecerás en el
        directorio para pacientes.
      </p>
      <ProfessionalOnboardingForm />
    </main>
  );
}