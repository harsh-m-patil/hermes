import { db } from "@hermes/db";
import { learnings } from "@hermes/db/schema";
import { Agent, getLogger, run, tool } from "@openai/agents";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { withAgentTrace } from "./observability";

const logger = getLogger("hermes:agents");

const SearchLearningsSchema = z.object({});

export type SearchLearningsInput = z.infer<typeof SearchLearningsSchema>;

export const searchLearningsTool = tool({
	name: "search_learnings",
	description: "Fetch recent incident learnings. Input: {}. Output: {items}.",
	parameters: SearchLearningsSchema,
	execute: async () => {
		logger.debug("tool:search_learnings");
		const items = await db
			.select({
				id: learnings.id,
				issueText: learnings.issueText,
				solutionText: learnings.solutionText,
				createdAt: learnings.createdAt,
			})
			.from(learnings)
			.orderBy(desc(learnings.createdAt))
			.limit(8);

		return { items };
	},
});

export const memoryAgent = new Agent({
	name: "Memory",
	model: "gpt-5",
	instructions: [
		"You are a memory agent for incident learnings.",
		"Use search_learnings to recall relevant learnings.",
		"Answer with concise bullets: issue -> solution.",
		"If nothing relevant, say no matching learnings.",
		"Be extremely concise. Sacrifice grammar for the sake of concision.",
	].join("\n"),
	tools: [searchLearningsTool],
});

export const runMemoryAgent = async (question: string) => {
	logger.debug("runMemoryAgent");
	const result = await withAgentTrace(
		"Memory",
		() => run(memoryAgent, question),
		{ metadata: { route: "memory" } }
	);
	return result?.finalOutput ?? null;
};

export const memoryAgentTool = memoryAgent.asTool({
	toolName: "memory_agent",
	toolDescription:
		"Recall prior incident learnings. Input: question text. Output: brief recall.",
});
