import { env } from "@hermes/env/slack";

export const callAgent = async (prompt: string) => {
  try {
    const response = await fetch(`${env.AGENT_SERVER_URL}/agents/demo`, {
      method: "POST",
      body: JSON.stringify({ prompt })
    });

    const json: { result: string } = await response.json();

    console.log(json)
    return json.result;
  } catch (error) {
    return String(error);
  }
};
