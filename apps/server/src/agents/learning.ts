import { db } from "@hermes/db";
import { learnings } from "@hermes/db/schema";
import { Agent, getLogger, run, tool } from "@openai/agents";
import { z } from "zod";
import { withAgentTrace } from "./observability";

const logger = getLogger("hermes:agents");

export const LearningInputSchema = z.object({
	issue: z.string().trim().min(1),
	solution: z.string().trim().min(1),
});

export type LearningInput = z.infer<typeof LearningInputSchema>;

export const LearningOutputSchema = z.object({});

export type LearningResult = z.infer<typeof LearningOutputSchema>;

const AddLearningSchema = LearningInputSchema;
export type AddLearningInput = z.infer<typeof AddLearningSchema>;

export const addLearningTool = tool({
	name: "add_learning",
	description:
		"Write incident learning to DB. Input: {issue, solution}. Output: {id}.",
	parameters: AddLearningSchema,
	execute: async (input) => {
		logger.debug("tool:add_learning");
		const [row] = await db
			.insert(learnings)
			.values({
				issueText: input.issue,
				solutionText: input.solution,
			})
			.returning({ id: learnings.id });

		return { id: row?.id ?? null };
	},
});

export const learningAgent = new Agent({
	name: "Learning",
	model: "gpt-4.1-nano",
	instructions: [
		"You are a production incident learning assistant.",
		"Derive a clear issue and solution.",
		"Then call the add_learning tool with issue and solution.",
		"Be extremely concise. Sacrifice grammar for the sake of concision.",
	].join("\n"),
	tools: [addLearningTool],
});

export const runLearningAgent = async (input: LearningInput) => {
	logger.debug("runLearningAgent");
	const prompt = `Issue: ${input.issue}\nSolution: ${input.solution}`;
	const result = await withAgentTrace(
		"Learning",
		() => run(learningAgent, prompt),
		{ metadata: { route: "learning" } }
	);
	return result?.finalOutput ?? null;
};

export const learningAgentTool = learningAgent.asTool({
	toolName: "add_learning_agent",
	toolDescription: "Use this agent to add a learning to knowledge base",
});
