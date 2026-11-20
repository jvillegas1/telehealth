import { redirect } from "next/navigation";

import { AgendaForm } from "./agenda-form";
import { auth } from "@/auth/auth";

export default async function ProfesionalAgendaPage() {
  const session = await auth();
  if (session?.user?.role !== "professional") {
    redirect("/ingreso");
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Tu agenda</h1>
      <p className="text-sm text-calm-800">
        Definí reglas semanales. Los turnos se guardan en UTC y se muestran a cada persona en su
        zona horaria.
      </p>
      <AgendaForm />
    </main>
  );
}
