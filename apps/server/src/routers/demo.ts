import { Hono } from "hono";
import { runAgent } from "@/agents/demo";
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

  const result = await runAgent(prompt);
  console.log(result);
  return c.json({ result });
});
