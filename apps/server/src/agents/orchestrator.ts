import { Agent, getLogger, run } from "@openai/agents";
import { learningAgentTool } from "./learning";
import { memoryAgentTool } from "./memory";
import { withAgentTrace } from "./observability";
import { vercelInspectLogsTool } from "./tools";
import { triageTool } from "./triage";

const logger = getLogger("hermes:agents");

const agent = new Agent({
	name: "Hermes",
	instructions:
		"You are an on-call engineer assistant for production incidents. Be extremely concise. Sacrifice grammar for the sake of concision.",
	model: "gpt-5.2-codex",
	tools: [
		triageTool,
		vercelInspectLogsTool,
		learningAgentTool,
		memoryAgentTool,
	],
});

export const runAgent = async (prompt: string): Promise<string> => {
	logger.debug("runAgent: Hermes");
	const result = await withAgentTrace("Hermes", () => run(agent, prompt), {
		metadata: { route: "orchestrator" },
	});
	if (!result?.finalOutput) {
		throw new Error("No agent output");
	}
	return result.finalOutput;
};
