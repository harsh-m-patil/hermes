import { Hono } from "hono";
import z from "zod";
import { runAgent } from "@/agents/orchestrator";
import { DemoBodySchema } from "@/types";

export const demoRouter = new Hono().post("/", async (c) => {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = DemoBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid body", issues: z.treeifyError(parsed.error) },
      400
    );
  }

  try {
    const result = await runAgent(parsed.data.prompt);
    return c.json({ result });
  } catch (error) {
    console.error("runAgent failed", error);
    return c.json({ error: "Agent error" }, 500);
  }
});
