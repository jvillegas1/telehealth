import { createDb } from "@telehealth/db";

import { BookingClient } from "./booking-client";
import { getServerEnv } from "@/env.server";
import { getPublicProfessionalById } from "@/server/professionals/list";

export default async function ReservarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return <p className="p-4 text-sm">Servicio no disponible.</p>;
  }

  const pro = await getPublicProfessionalById(createDb(url), id);
  if (!pro) {
    return <p className="p-4 text-sm">Profesional no disponible.</p>;
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <BookingClient professionalId={id} professionalName={pro.displayName} />
    </main>
  );
}
