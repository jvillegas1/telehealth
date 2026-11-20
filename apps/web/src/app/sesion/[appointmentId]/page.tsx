import { redirect } from "next/navigation";

import { auth } from "@/auth/auth";
import { VideoCallClient } from "@/components/session/video-call-client";

export default async function SessionCallPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/ingreso");

  const { appointmentId } = await params;
  const controlHref =
    session.user.role === "professional" ? `/sesion/${appointmentId}/control` : undefined;

  return (
    <VideoCallClient appointmentId={appointmentId} {...(controlHref ? { controlHref } : {})} />
  );
}
