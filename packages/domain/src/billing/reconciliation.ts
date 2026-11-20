import type { PaymentSnapshot } from "./types";

export function reconcilePaymentSnapshots(payments: PaymentSnapshot[]): void {
  let gross = 0;
  let commission = 0;
  let net = 0;
  for (const p of payments) {
    gross += p.grossCents;
    commission += p.commissionCents;
    net += p.netCents;
    if (p.grossCents !== p.commissionCents + p.netCents) {
      throw new Error(
        `Pago inconsistente: gross=${p.grossCents} commission=${p.commissionCents} net=${p.netCents}`,
      );
    }
  }
  if (gross !== commission + net) {
    throw new Error(`Conciliación fallida: gross=${gross} commission=${commission} net=${net}`);
  }
}
