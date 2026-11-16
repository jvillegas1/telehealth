import { redirect } from "next/navigation";

import { AdminProfessionalQueue } from "./admin-queue";
import { auth } from "@/auth/auth";

export default async function AdminProfesionalesPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/ingreso");
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Verificación de profesionales</h1>
      <p className="text-sm text-calm-800">Aprueba o rechaza credenciales en revisión.</p>
      <AdminProfessionalQueue />
    </main>
  );
}