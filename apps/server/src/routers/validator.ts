import { Hono } from "hono";
import { runValidatorAgent } from "@/agents/validator";
import { ValidatorBodySchema } from "@/types";

export const validatorRouter = new Hono().post("/", async (c) => {
	let rawBody: unknown;
	try {
		rawBody = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const parsed = ValidatorBodySchema.safeParse(rawBody);
	if (!parsed.success) {
		return c.json(
			{ error: "Invalid body", issues: parsed.error.flatten().fieldErrors },
			400
		);
	}

	try {
		const result = await runValidatorAgent({
			issue: parsed.data.issue,
			triage: parsed.data.triage ?? null,
			memory: parsed.data.memory ?? null,
			solution: parsed.data.solution,
		});
		return c.json(result);
	} catch (error) {
		console.error("runValidatorAgent failed", error);
		return c.json({ error: "Agent error" }, 500);
	}
});
