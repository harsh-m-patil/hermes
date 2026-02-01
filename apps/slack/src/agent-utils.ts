import { env } from "@hermes/env/slack";

export const callOrchestratorAgent = async (prompt: string, ts: string) => {
  try {
    const response = await fetch(
      `${env.AGENT_SERVER_URL}/agents/orchestrator`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, ts }),
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Agent server ${response.status}: ${text || response.statusText}`
      );
    }

    const json = (await response.json()) as { result?: string };
    if (!json.result) {
      throw new Error("Missing result in agent response");
    }

    return json.result;
  } catch (error) {
    console.error("callAgent failed", error);
    return "Sorry—something went wrong. Try again.";
  }
};
