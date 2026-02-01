import { Agent, getLogger, run } from "@openai/agents";
import { z } from "zod";
import { withAgentTrace } from "./observability";

const logger = getLogger("hermes:agents");

const ValidationSchema = z.object({
  valid: z.boolean(),
  solution: z.string().trim().min(1),
  notes: z.string().trim().min(1).optional(),
});

export type ValidationResult = z.infer<typeof ValidationSchema>;

const validatorAgent = new Agent({
  name: "Validator",
  model: "gpt-5",
  instructions: [
    "You validate incident solutions.",
    "Input includes issue, triage summary, memory learnings, and solution.",
    "If solution weak or unsafe, revise it.",
    "Return JSON only: {" +
      "valid:boolean, solution:string, notes?:string" +
      "}.",
  ].join("\n"),
});

export const runValidatorAgent = async (input: {
  issue: string;
  triage: string | null;
  memory: string | null;
  solution: string;
}): Promise<ValidationResult> => {
  logger.debug("runValidatorAgent");
  const prompt = [
    `Issue: ${input.issue}`,
    `Triage: ${input.triage ?? "(none)"}`,
    `Memory: ${input.memory ?? "(none)"}`,
    `Solution: ${input.solution}`,
  ].join("\n");

  const result = await withAgentTrace(
    "Validator",
    () => run(validatorAgent, prompt),
    { metadata: { route: "validator" } }
  );

  const text = result?.finalOutput ?? "";
  try {
    const parsed = ValidationSchema.parse(JSON.parse(text));
    return parsed;
  } catch (error) {
    logger.warn("validator output parse failed", { error, text });
    return { valid: false, solution: input.solution, notes: "invalid output" };
  }
};
