import { env } from "@hermes/env/slack";

export const callOrchestratorAgent = async (prompt: string) => {
  try {
    const response = await fetch(
      `${env.AGENT_SERVER_URL}/agents/orchestrator`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
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

export const callSequentialAgent = async (issue: string) => {
  try {
    const response = await fetch(`${env.AGENT_SERVER_URL}/agents/sequential`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ issue }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Agent server ${response.status}: ${text || response.statusText}`
      );
    }

    const json = (await response.json()) as {
      solution?: string;
      valid?: boolean;
      notes?: string | null;
    };
    if (!json.solution) {
      throw new Error("Missing solution in agent response");
    }

    return json;
  } catch (error) {
    console.error("callSequentialAgent failed", error);
    return {
      solution: "Sorry—something went wrong. Try again.",
      valid: false,
      notes: "agent_error",
    };
  }
};
