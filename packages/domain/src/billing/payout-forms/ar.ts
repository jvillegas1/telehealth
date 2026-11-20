import { z } from "zod";

export const arPayoutFormSchema = z.object({
  taxId: z.string().min(8).max(20),
  accountHolder: z.string().min(2).max(120),
  cbu: z.string().regex(/^\d{22}$/, "CBU debe tener 22 dígitos"),
  bankName: z.string().min(2).max(80),
});

export type ArPayoutForm = z.infer<typeof arPayoutFormSchema>;

export const AR_PAYOUT_SCHEMA_VERSION = 1;
