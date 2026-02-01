import { Hono } from "hono";
import { runAgent } from "@/agents/orchestrator";
import type { DemoBody } from "@/types";

export const demoRouter = new Hono().post("/", async (c) => {
  let body: DemoBody | null = null;
  try {
    body = await c.req.json<DemoBody>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const prompt = body?.prompt?.trim();
  if (!prompt) {
    return c.json({ error: "prompt is required" }, 400);
  }

  try {
    const result = await runAgent(prompt);
    return c.json({ result });
  } catch (error) {
    console.error("runAgent failed", error);
    return c.json({ error: "Agent error" }, 500);
  }
});
