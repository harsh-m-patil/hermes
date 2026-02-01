import { Agent, run } from "@openai/agents";

const agent = new Agent({
  name: "Assistant",
  instructions: "You are a helpful assistant",
  model: "gpt-5-nano",
});

export const runAgent = async (prompt: string): Promise<string> => {
  const result = await run(agent, prompt);
  if (!result?.finalOutput) {
    throw new Error("No agent output");
  }
  return result.finalOutput;
};
