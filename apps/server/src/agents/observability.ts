import {
  BatchTraceProcessor,
  ConsoleSpanExporter,
  addTraceProcessor,
  getLogger,
  getOrCreateTrace,
  startTraceExportLoop,
} from "@openai/agents";

const logger = getLogger("hermes:agents");

type AgentTraceOptions = {
  workflowName?: string;
  groupId?: string;
  metadata?: Record<string, string>;
};

export const initAgentObservability = () => {
  if (process.env.HERMES_AGENT_TRACE_CONSOLE !== "1") {
    return;
  }

  addTraceProcessor(new BatchTraceProcessor(new ConsoleSpanExporter()));
  startTraceExportLoop();
  logger.debug("observability: console trace exporter enabled");
};

export const withAgentTrace = async <T>(
  agentName: string,
  fn: () => Promise<T>,
  options?: AgentTraceOptions
) =>
  getOrCreateTrace(fn, {
    name: options?.workflowName ?? `Agent workflow: ${agentName}`,
    groupId: options?.groupId,
    metadata: { agent: agentName, ...options?.metadata },
  });
