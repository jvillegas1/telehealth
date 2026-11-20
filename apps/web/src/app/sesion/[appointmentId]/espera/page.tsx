import { redirect } from "next/navigation";

import { createDb } from "@telehealth/db";
import { appointments, professionalProfiles } from "@telehealth/db/schema";
import { eq } from "drizzle-orm";

import { auth } from "@/auth/auth";
import { WaitingRoomClient } from "@/components/session/waiting-room-client";
import { getServerEnv } from "@/env.server";

export default async function SessionWaitingPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/ingreso");

  const { appointmentId } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return <p className="p-4 text-sm">Servicio no disponible.</p>;
  }

  const db = createDb(url);
  const [row] = await db
    .select({
      professionalName: professionalProfiles.displayName,
    })
    .from(appointments)
    .innerJoin(
      professionalProfiles,
      eq(professionalProfiles.id, appointments.professionalProfileId),
    )
    .where(eq(appointments.id, appointmentId));

  if (!row) {
    return <p className="p-4 text-sm">Cita no encontrada.</p>;
  }

  return (
    <WaitingRoomClient
      appointmentId={appointmentId}
      professionalName={row.professionalName}
      joinHref={`/sesion/${appointmentId}`}
    />
  );
}
