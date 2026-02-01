import { Agent, getLogger, run } from "@openai/agents";
import { z } from "zod";
import { withAgentTrace } from "./observability";
import { ghCreateIssueTool, vercelInspectLogsTool } from "./tools";

const logger = getLogger("hermes:agents");

export const TriageOutputSchema = z.object({
  summary: z.string(),
  severity: z.enum(["sev1", "sev2", "sev3", "sev4"]),
  tags: z.array(z.string()),
  rationale: z.string(),
  next_steps: z.array(z.string()),
});

export type TriageResult = z.infer<typeof TriageOutputSchema>;

export const triageAgent = new Agent({
  name: "Triage",
  model: "gpt-5-mini",
  instructions: [
    "You are a production incident triage assistant.",
    "Return ONLY a JSON object with keys: summary, severity, tags, rationale, next_steps.",
    "summary: 1-3 sentences. severity: one of sev1, sev2, sev3, sev4.",
    "tags: 1-5 short strings. rationale: 1-2 sentences.",
    "next_steps: 1-5 short action items.",
    "If logs needed, call vercel_inspect_logs.",
    "If severity is sev1 or sev2, call gh_create_issue with title/body.",
  ].join("\n"),
  outputType: TriageOutputSchema,
  tools: [vercelInspectLogsTool, ghCreateIssueTool],
});

export const runTriageAgent = async (incident: string) => {
  logger.debug("runTriageAgent");
  const result = await withAgentTrace(
    "Triage",
    () => run(triageAgent, incident),
    { metadata: { route: "triage" } }
  );
  if (!result?.finalOutput) {
    throw new Error("No triage output");
  }
  return result.finalOutput;
};

export const triageTool = triageAgent.asTool({
  toolName: "triage_agent",
  toolDescription:
    "Triage production incidents. Input: incident text. Output: JSON {summary, severity(sev1-4), tags, rationale, next_steps}.",
});
