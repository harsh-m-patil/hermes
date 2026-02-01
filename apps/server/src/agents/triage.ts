import { Agent, getLogger, run } from "@openai/agents";
import { learningAgentTool } from "./learning";
import { withAgentTrace } from "./observability";
import { ghCreateIssueTool, vercelInspectLogsTool } from "./tools";

const logger = getLogger("hermes:agents");

export const triageAgent = new Agent({
  name: "Triage",
  model: "gpt-5",
  instructions: [
    "You are a production incident triage assistant.",
    "Return a brief triage summary.",
    "If logs needed, call vercel_inspect_logs.",
    "If severity is sev1 or sev2, call gh_create_issue with title/body.",
  ].join("\n"),
  tools: [vercelInspectLogsTool, ghCreateIssueTool, learningAgentTool],
});

export const runTriageAgent = async (incident: string) => {
  logger.debug("runTriageAgent");
  const result = await withAgentTrace(
    "Triage",
    () => run(triageAgent, incident),
    { metadata: { route: "triage" } }
  );
  return result?.finalOutput ?? null;
};

export const triageTool = triageAgent.asTool({
  toolName: "triage_agent",
  toolDescription:
    "Triage production incidents. Input: incident text. Output: brief summary.",
});
