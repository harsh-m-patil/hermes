import { db } from "@hermes/db";
import { learnings } from "@hermes/db/schema";
import { desc } from "drizzle-orm";
import { Hono } from "hono";

const MAX_LIMIT = 50;

export const learningsRouter = new Hono().get("/", async (c) => {
	const rawLimit = c.req.query("limit");
	const parsed = rawLimit ? Number(rawLimit) : 8;
	const limit = Number.isFinite(parsed)
		? Math.min(Math.max(parsed, 1), MAX_LIMIT)
		: 8;

	try {
		const items = await db
			.select({
				id: learnings.id,
				issueText: learnings.issueText,
				solutionText: learnings.solutionText,
				createdAt: learnings.createdAt,
			})
			.from(learnings)
			.orderBy(desc(learnings.createdAt))
			.limit(limit);

		return c.json({ items });
	} catch (error) {
		console.error("fetch learnings failed", error);
		return c.json({ error: "Database error" }, 500);
	}
});
