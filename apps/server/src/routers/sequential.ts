import { Hono } from "hono";
import { runLearningAgent } from "@/agents/learning";
import { runMemoryAgent } from "@/agents/memory";
import { runSolutionAgent } from "@/agents/solution";
import { runTriageAgent } from "@/agents/triage";
import { runValidatorAgent } from "@/agents/validator";
import { SequentialBodySchema } from "@/types";

export const sequentialRouter = new Hono().post("/", async (c) => {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = SequentialBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid body", issues: parsed.error.flatten().fieldErrors },
      400
    );
  }

  try {
    const issue = parsed.data.issue;
    const triage = await runTriageAgent(issue);
    const memory = await runMemoryAgent(issue);
    const solution = await runSolutionAgent({ issue, triage, memory });
    const validation = await runValidatorAgent({
      issue,
      triage,
      memory,
      solution: solution ?? "",
    });
    await runLearningAgent({ issue, solution: validation.solution });

    return c.json({
      issue,
      triage,
      memory,
      solution: validation.solution,
      valid: validation.valid,
      notes: validation.notes ?? null,
    });
  } catch (error) {
    console.error("runSequential failed", error);
    return c.json({ error: "Agent error" }, 500);
  }
});
