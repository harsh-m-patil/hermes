import { Agent, getLogger, run } from "@openai/agents";
import { withAgentTrace } from "./observability";

const logger = getLogger("hermes:agents");

const solutionAgent = new Agent({
	name: "Solution",
	model: "gpt-5",
	instructions: [
		"You are a production incident solution assistant.",
		"Input includes issue, triage summary, and memory learnings.",
		"Return a concise, actionable solution only.",
		"Be extremely concise. Sacrifice grammar for the sake of concision.",
	].join("\n"),
});

export const runSolutionAgent = async (input: {
	issue: string;
	triage: string | null;
	memory: string | null;
}) => {
	logger.debug("runSolutionAgent");
	const prompt = [
		`Issue: ${input.issue}`,
		`Triage: ${input.triage ?? "(none)"}`,
		`Memory: ${input.memory ?? "(none)"}`,
	].join("\n");
	const result = await withAgentTrace(
		"Solution",
		() => run(solutionAgent, prompt),
		{ metadata: { route: "solution" } }
	);
	return result?.finalOutput ?? null;
};
