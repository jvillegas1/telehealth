import { z } from "zod";

const clinicalPatterns = [
  /diagn[oó]stic/i,
  /trastorno/i,
  /depresi[oó]n mayor/i,
  /toc\b/i,
  /bipolar/i,
  /esquizofrenia/i,
  /tdah/i,
  /\bcie-?\s*10\b/i,
  /\bdsm-?\s*5\b/i,
];

export const professionalReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
});

export function validateReviewComment(comment: string | undefined): string | null {
  if (!comment) {
    return null;
  }
  for (const pattern of clinicalPatterns) {
    if (pattern.test(comment)) {
      return "El comentario no puede incluir diagnósticos ni datos clínicos.";
    }
  }
  return null;
}