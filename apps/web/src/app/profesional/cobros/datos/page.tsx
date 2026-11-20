import { redirect } from "next/navigation";

import { PayoutForm } from "./payout-form";
import { auth } from "@/auth/auth";

export default async function PayoutDatosPage() {
  const session = await auth();
  if (session?.user?.role !== "professional") redirect("/ingreso");

  return (
    <main className="px-4 py-10">
      <h1 className="mb-4 text-center text-2xl font-semibold text-calm-900">Datos de cobro</h1>
      <PayoutForm />
    </main>
  );
}
