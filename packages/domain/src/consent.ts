export type ConsentRecord = {
  grantedAt: Date;
  revokedAt: Date | null;
};

/** Consentimiento vigente solo si no está revocado (REQ-SEC-02). */
export function isConsentActive(consent: ConsentRecord, at: Date = new Date()): boolean {
  if (consent.revokedAt !== null && consent.revokedAt <= at) {
    return false;
  }
  return consent.grantedAt <= at;
}