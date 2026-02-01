import { Agent, run } from "@openai/agents";

const agent = new Agent({
  name: "Assistant",
  instructions: "You are a helpful assistant",
});

export const runAgent = async (prompt: string): Promise<string | undefined> => {
  try {
    const result = await run(agent, prompt);

    return result.finalOutput;
  } catch (error) {
    return String(error);
  }
};
