import { z } from "zod";

export const DemoBodySchema = z.object({
	prompt: z.string().trim().min(1),
});

export const TriageBodySchema = z.object({
	incident: z.string().trim().min(1),
});

export const MemoryBodySchema = z.object({
	question: z.string().trim().min(1),
});

export const SequentialBodySchema = z.object({
	issue: z.string().trim().min(1),
});

export const SolutionBodySchema = z.object({
	issue: z.string().trim().min(1),
	triage: z.string().trim().min(1).nullable().optional(),
	memory: z.string().trim().min(1).nullable().optional(),
});

export const ValidatorBodySchema = z.object({
	issue: z.string().trim().min(1),
	triage: z.string().trim().min(1).nullable().optional(),
	memory: z.string().trim().min(1).nullable().optional(),
	solution: z.string().trim().min(1),
});

export const LearningBodySchema = z.object({
	issue: z.string().trim().min(1),
	solution: z.string().trim().min(1),
});

export type DemoBody = z.infer<typeof DemoBodySchema>;
export type TriageBody = z.infer<typeof TriageBodySchema>;
export type MemoryBody = z.infer<typeof MemoryBodySchema>;
export type SequentialBody = z.infer<typeof SequentialBodySchema>;
export type SolutionBody = z.infer<typeof SolutionBodySchema>;
export type ValidatorBody = z.infer<typeof ValidatorBodySchema>;
export type LearningBody = z.infer<typeof LearningBodySchema>;
