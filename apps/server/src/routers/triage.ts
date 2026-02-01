import { Hono } from "hono";
import { runTriageAgent } from "@/agents/triage";
import { TriageBodySchema } from "@/types";

export const triageRouter = new Hono().post("/", async (c) => {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = TriageBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid body", issues: parsed.error.flatten().fieldErrors },
      400
    );
  }

  try {
    const result = await runTriageAgent(parsed.data.incident);
    return c.json({ result });
  } catch (error) {
    console.error("runTriageAgent failed", error);
    return c.json({ error: "Agent error" }, 500);
  }
});
