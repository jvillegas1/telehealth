import { z } from "zod";

export const urgencyLevelSchema = z.enum(["bajo", "moderado", "elevado"]);

export const assessmentOutputSchema = z.object({
  resumen: z.string().min(20).max(2000),
  areasDeAtencion: z.array(z.string().min(2).max(120)).min(1).max(8),
  perfilProfesionalSugerido: z.array(z.string().min(2).max(80)).min(1).max(8),
  nivelUrgencia: urgencyLevelSchema,
  promptVersion: z.string().min(1),
});

export type AssessmentOutput = z.infer<typeof assessmentOutputSchema>;