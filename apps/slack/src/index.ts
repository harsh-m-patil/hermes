import { env } from "@hermes/env/slack";
import { App } from "@slack/bolt";
import { callAgent } from "./agent-utils";

const app = new App({
  token: env.SLACK_BOT_TOKEN,
  appToken: env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.message(async ({ message, say, client, logger }) => {
  if (message.type !== "message" || "subtype" in message) {
    return;
  }
  const text = message.text?.trim();
  if (!text) {
    return;
  }

  const channel = message.channel;
  const timestamp = message.ts;

  try {
    await client.reactions.add({
      name: "eyes",
      channel,
      timestamp,
    });
  } catch (error) {
    logger.warn("Failed to add eyes reaction", error);
  }

  let result = "Sorry—something went wrong. Try again.";
  try {
    result = await callAgent(text, timestamp);
  } catch (error) {
    logger.error("Agent call failed", error);
  }

  try {
    await client.reactions.remove({
      name: "eyes",
      channel,
      timestamp,
    });
  } catch (error) {
    logger.warn("Failed to remove eyes reaction", error);
  }

  try {
    await client.reactions.add({
      name: "white_check_mark",
      channel,
      timestamp,
    });
  } catch (error) {
    logger.warn("Failed to add check reaction", error);
  }

  try {
    await say({
      text: result,
      thread_ts: timestamp,
    });
  } catch (error) {
    logger.error("Failed to send response", error);
  }
});

(async () => {
  await app.start();
  console.log("Slack bot running in Socket Mode");
})();
