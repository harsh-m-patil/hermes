import { Agent, getLogger, run } from "@openai/agents";
import { learningAgentTool } from "./learning";
import { withAgentTrace } from "./observability";
import { triageTool } from "./triage";

const logger = getLogger("hermes:agents");

const agent = new Agent({
  name: "Assistant",
  instructions: "You are a helpful assistant",
  model: "gpt-5-nano",
  tools: [triageTool, learningAgentTool],
});

export const runAgent = async (prompt: string): Promise<string> => {
  logger.debug("runAgent: Assistant");
  const result = await withAgentTrace(
    "Assistant",
    () => run(agent, prompt),
    { metadata: { route: "orchestrator" } }
  );
  if (!result?.finalOutput) {
    throw new Error("No agent output");
  }
  return result.finalOutput;
};
