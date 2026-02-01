import { Hono } from "hono";
import { runMemoryAgent } from "@/agents/memory";
import { MemoryBodySchema } from "@/types";

export const memoryRouter = new Hono().post("/", async (c) => {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = MemoryBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid body", issues: parsed.error.flatten().fieldErrors },
      400
    );
  }

  try {
    const result = await runMemoryAgent(parsed.data.question);
    return c.json({ result });
  } catch (error) {
    console.error("runMemoryAgent failed", error);
    return c.json({ error: "Agent error" }, 500);
  }
});
