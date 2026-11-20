import { redirect } from "next/navigation";

import { CitasClient } from "./citas-client";
import { auth } from "@/auth/auth";

export default async function CitasPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/ingreso");
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Mis citas</h1>
      <CitasClient />
    </main>
  );
}
