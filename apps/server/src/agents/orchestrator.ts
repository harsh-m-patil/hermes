import { Agent, getLogger, run } from "@openai/agents";
import { learningAgentTool } from "./learning";
import { withAgentTrace } from "./observability";
import { triageTool } from "./triage";
import { vercelInspectLogsTool } from "./tools";

const logger = getLogger("hermes:agents");

const agent = new Agent({
  name: "Assistant",
  instructions:
    "You are a helpful assistant, Be extremely concise.Sacrifice grammar for the sake of concision.",
  model: "gpt-5-mini",
  tools: [triageTool, learningAgentTool, vercelInspectLogsTool],
});

export const runAgent = async (prompt: string): Promise<string> => {
  logger.debug("runAgent: Assistant");
  const result = await withAgentTrace("Assistant", () => run(agent, prompt), {
    metadata: { route: "orchestrator" },
  });
  if (!result?.finalOutput) {
    throw new Error("No agent output");
  }
  return result.finalOutput;
};
