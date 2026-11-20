import { redirect } from "next/navigation";

import { CobrosClient } from "./cobros-client";
import { auth } from "@/auth/auth";

export default async function ProfesionalCobrosPage() {
  const session = await auth();
  if (session?.user?.role !== "professional") redirect("/ingreso");

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-calm-900">Cobros y liquidaciones</h1>
        <a href="/profesional/cobros/datos" className="text-sm font-medium text-calm-800 underline">
          Datos de cobro
        </a>
      </div>
      <CobrosClient />
    </main>
  );
}
