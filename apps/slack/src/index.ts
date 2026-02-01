import { db } from "@hermes/db";
import { threadMessages, threads } from "@hermes/db/schema";
import { env } from "@hermes/env/slack";
import { App } from "@slack/bolt";
import { and, desc, eq } from "drizzle-orm";
import { callOrchestratorAgent, callSequentialAgent } from "./agent-utils";

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

const ensureThread = async (input: {
  threadId: string;
  channel: string;
  user?: string;
}) => {
  const [existing] = await db
    .select({ id: threads.id })
    .from(threads)
    .where(
      and(eq(threads.source, "slack"), eq(threads.externalId, input.threadId))
    )
    .limit(1);

  if (existing?.id) {
    return existing.id;
  }

  const [created] = await db
    .insert(threads)
    .values({
      source: "slack",
      externalId: input.threadId,
      channel: input.channel,
      metadata: { user: input.user },
    })
    .returning({ id: threads.id });

  return created?.id ?? null;
};

const addThreadMessage = async (input: {
  threadRowId: string;
  role: string;
  content: string;
  externalTs?: string;
  user?: string;
}) => {
  await db.insert(threadMessages).values({
    threadId: input.threadRowId,
    role: input.role,
    content: input.content,
    externalTs: input.externalTs,
    metadata: input.user ? { user: input.user } : undefined,
  });
};

app.message(async ({ message, say, client, logger, context }) => {
  if (message.type !== "message") {
    return;
  }
  const text = message.text?.trim();
  if (!text) {
    return;
  }
  if (context.botUserId && text.includes(`<@${context.botUserId}>`)) {
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
    threadRowId = await ensureThread({
      threadId,
      channel,
      user: message.user,
    });

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
      await addThreadMessage({
        threadRowId,
        role: "user",
        content: text,
        externalTs: timestamp,
        user: message.user,
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
      await addThreadMessage({
        threadRowId,
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

app.event("app_mention", async ({ event, say, client, logger, context }) => {
  if (event.type !== "app_mention") {
    return;
  }
  const text = event.text?.trim();
  if (!text) {
    return;
  }

  const botTag = context.botUserId ? `<@${context.botUserId}>` : null;
  const issue = botTag ? text.replaceAll(botTag, "").trim() : text;
  if (!issue) {
    return;
  }

  const channel = event.channel;
  const timestamp = event.ts;
  const threadId = event.thread_ts ?? event.ts;

  try {
    await client.reactions.add({ name: "eyes", channel, timestamp });
  } catch (error) {
    logger.warn("Failed to add eyes reaction", error);
  }

  let result = "Sorry—something went wrong. Try again.";
  let threadRowId: string | null = null;

  try {
    threadRowId = await ensureThread({
      threadId,
      channel,
      user: event.user,
    });

    if (threadRowId) {
      await addThreadMessage({
        threadRowId,
        role: "user",
        content: issue,
        externalTs: timestamp,
        user: event.user,
      });
    }
  } catch (error) {
    logger.error("Thread DB write failed", error);
  }

  try {
    const response = await callSequentialAgent(issue);
    result = response.solution;
    if (response.notes) {
      result = `${result}\nNotes: ${response.notes}`;
    }
    if (response.valid === false) {
      result = `${result}\n(valid: false)`;
    }
  } catch (error) {
    logger.error("Sequential agent call failed", error);
  }

  if (threadRowId) {
    try {
      await addThreadMessage({
        threadRowId,
        role: "assistant",
        content: result,
      });
    } catch (error) {
      logger.error("Thread assistant write failed", error);
    }
  }

  try {
    await client.reactions.remove({ name: "eyes", channel, timestamp });
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
