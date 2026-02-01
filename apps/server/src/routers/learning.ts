import { Hono } from "hono";
import { runLearningAgent } from "@/agents/learning";
import { LearningBodySchema } from "@/types";

export const learningRouter = new Hono().post("/", async (c) => {
	let rawBody: unknown;
	try {
		rawBody = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const parsed = LearningBodySchema.safeParse(rawBody);
	if (!parsed.success) {
		return c.json(
			{ error: "Invalid body", issues: parsed.error.flatten().fieldErrors },
			400
		);
	}

	try {
		const result = await runLearningAgent({
			issue: parsed.data.issue,
			solution: parsed.data.solution,
		});
		return c.json({ result });
	} catch (error) {
		console.error("runLearningAgent failed", error);
		return c.json({ error: "Agent error" }, 500);
	}
});
