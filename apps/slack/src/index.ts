import { db } from "@hermes/db";
import { threadMessages, threads } from "@hermes/db/schema";
import { env } from "@hermes/env/slack";
import { App } from "@slack/bolt";
import { and, desc, eq } from "drizzle-orm";
import { callOrchestratorAgent } from "./agent-utils";

const formatContext = (
  messages: Array<{ role: string; content: string }>
): string => {
  if (!messages.length) {
    return "";
  }
  const lines = messages.map((message) => {
    const role = message.role === "assistant" ? "assistant" : "user";
    return `- ${role}: ${message.content}`;
  });
  return `Thread context:\n${lines.join("\n")}\n\n`;
};

const app = new App({
  token: env.SLACK_BOT_TOKEN,
  appToken: env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.message(async ({ message, say, client, logger }) => {
  if (message.type !== "message") {
    return;
  }
  const text = message.text?.trim();
  if (!text) {
    return;
  }

  const channel = message.channel;
  const timestamp = message.ts;
  const threadId = message.thread_ts ?? message.ts;

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
  let prompt = text;
  let threadRowId: string | null = null;

  try {
    const [existing] = await db
      .select({ id: threads.id })
      .from(threads)
      .where(and(eq(threads.source, "slack"), eq(threads.externalId, threadId)))
      .limit(1);

    if (existing?.id) {
      threadRowId = existing.id;
    } else {
      const [created] = await db
        .insert(threads)
        .values({
          source: "slack",
          externalId: threadId,
          channel,
          metadata: { user: message.user },
        })
        .returning({ id: threads.id });
      threadRowId = created?.id ?? null;
    }

    if (threadRowId) {
      const priorMessages = await db
        .select({ role: threadMessages.role, content: threadMessages.content })
        .from(threadMessages)
        .where(eq(threadMessages.threadId, threadRowId))
        .orderBy(desc(threadMessages.createdAt))
        .limit(10);

      const context = formatContext(priorMessages.reverse());
      if (context) {
        prompt = `${context}User: ${prompt}`;
      }
    }

    if (threadRowId) {
      await db.insert(threadMessages).values({
        threadId: threadRowId,
        role: "user",
        content: text,
        externalTs: timestamp,
        metadata: { user: message.user },
      });
    }
  } catch (error) {
    logger.error("Thread DB write failed", error);
  }

  try {
    result = await callOrchestratorAgent(prompt);
  } catch (error) {
    logger.error("Agent call failed", error);
  }

  if (threadRowId) {
    try {
      await db.insert(threadMessages).values({
        threadId: threadRowId,
        role: "assistant",
        content: result,
      });
    } catch (error) {
      logger.error("Thread assistant write failed", error);
    }
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
