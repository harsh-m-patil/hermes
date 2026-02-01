import { z } from "zod";

export const DemoBodySchema = z.object({
  prompt: z.string().trim().min(1),
});

export const TriageBodySchema = z.object({
  incident: z.string().trim().min(1),
});

export type DemoBody = z.infer<typeof DemoBodySchema>;
export type TriageBody = z.infer<typeof TriageBodySchema>;
