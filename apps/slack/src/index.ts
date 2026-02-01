import { env } from "@hermes/env/slack";
import { App } from "@slack/bolt";

const app = new App({
  token: env.SLACK_BOT_TOKEN,
  appToken: env.SLACK_APP_TOKEN,
  socketMode: true
});

app.message(async ({ message, say, client }) => {
  if (message.type !== "message") {
    return
  }

  client.reactions.add({
    name: "eyes",
    channel: message.channel,
    timestamp: message.ts,
  })

  client.reactions.remove({
    name: "eyes",
    channel: message.channel,
    timestamp: message.ts,
  })

  const text = "Hi How can I help"

  client.reactions.add({
    name: "white_check_mark",
    channel: message.channel,
    timestamp: message.ts,
  })

  await say({
    text,
    thread_ts: message.ts
  });
});

(async () => {
  await app.start();
  console.log("Slack bot running in Socket Mode");
})();

