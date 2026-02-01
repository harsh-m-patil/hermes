import { Hono } from "hono";
import { runSolutionAgent } from "@/agents/solution";
import { SolutionBodySchema } from "@/types";

export const solutionRouter = new Hono().post("/", async (c) => {
	let rawBody: unknown;
	try {
		rawBody = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const parsed = SolutionBodySchema.safeParse(rawBody);
	if (!parsed.success) {
		return c.json(
			{ error: "Invalid body", issues: parsed.error.flatten().fieldErrors },
			400
		);
	}

	try {
		const result = await runSolutionAgent({
			issue: parsed.data.issue,
			triage: parsed.data.triage ?? null,
			memory: parsed.data.memory ?? null,
		});
		return c.json({ result });
	} catch (error) {
		console.error("runSolutionAgent failed", error);
		return c.json({ error: "Agent error" }, 500);
	}
});
