import { redirect } from "next/navigation";

import { CitasProClient } from "./citas-pro-client";
import { auth } from "@/auth/auth";

export default async function ProfesionalCitasPage() {
  const session = await auth();
  if (session?.user?.role !== "professional") redirect("/ingreso");

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Solicitudes de cita</h1>
      <p className="text-sm text-calm-800">Revisá el desglose de cobro antes de aceptar.</p>
      <CitasProClient />
    </main>
  );
}
