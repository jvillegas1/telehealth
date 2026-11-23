import { IngresoForm } from "./ingreso-form";
import { isDatabaseReachable } from "@/server/db-health";

export default async function IngresoPage() {
  const mfaRequired = process.env["NEXT_PUBLIC_REQUIRE_MFA"] !== "0";
  const databaseReady = await isDatabaseReachable();
  return <IngresoForm mfaRequired={mfaRequired} databaseReady={databaseReady} />;
}
