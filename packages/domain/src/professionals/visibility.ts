import type { ProfessionalProfileStatus } from "./types";

/** REQ 7.2: solo perfiles aprobados con credencial verificada en el directorio. */
export function isProfessionallyListed(params: {
  status: ProfessionalProfileStatus;
  hasVerifiedCredential: boolean;
}): boolean {
  return params.status === "approved" && params.hasVerifiedCredential;
}