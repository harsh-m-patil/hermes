import { db } from "@hermes/db";
import { learnings } from "@hermes/db/schema";
import { Agent, getLogger, tool } from "@openai/agents";
import { z } from "zod";

const logger = getLogger("hermes:agents");

export const LearningInputSchema = z.object({
  incident: z.string().trim().min(1),
  resolution: z.string().trim().min(1),
  severity: z.enum(["sev1", "sev2", "sev3", "sev4"]).optional(),
  metadata: z.object(),
});

export type LearningInput = z.infer<typeof LearningInputSchema>;

export const LearningOutputSchema = z.object({
  summary: z.string(),
  root_cause: z.string().optional(),
  fix_steps: z.array(z.string()),
  tags: z.array(z.string()),
  severity: z.enum(["sev1", "sev2", "sev3", "sev4"]).optional(),
});

export type LearningResult = z.infer<typeof LearningOutputSchema>;

const AddLearningSchema = LearningInputSchema.merge(LearningOutputSchema);
export type AddLearningInput = z.infer<typeof AddLearningSchema>;

export const addLearningTool = tool({
  name: "add_learning",
  description:
    "Write incident learning to DB. Input: {incident, resolution, summary, root_cause?, fix_steps, tags, severity?, metadata?}. Output: {id}.",
  parameters: AddLearningSchema,
  execute: async (input) => {
    logger.debug("tool:add_learning");
    const [row] = await db
      .insert(learnings)
      .values({
        incidentText: input.incident,
        resolutionText: input.resolution,
        summary: input.summary,
        rootCause: input.root_cause ?? null,
        fixSteps: input.fix_steps,
        tags: input.tags,
        severity: input.severity ?? null,
        metadata: input.metadata ?? null,
      })
      .returning({ id: learnings.id });

    return { id: row?.id ?? null };
  },
});

export const learningAgent = new Agent({
  name: "Learning",
  model: "gpt-4.1-nano",
  instructions: [
    "You are a production incident learning assistant.",
    "Derive learning fields from the incident and resolution.",
    "Then call the add_learning tool with incident, resolution, summary, root_cause, fix_steps, tags, severity, metadata.",
    "summary: 1-3 sentences. root_cause: 0-2 sentences.",
    "fix_steps: 1-6 short action items. tags: 2-6 short strings.",
    "severity: one of sev1, sev2, sev3, sev4 (omit if unknown).",
  ].join("\n"),
  tools: [addLearningTool],
});

export const learningAgentTool = learningAgent.asTool({
  toolName: "add_learning_agent",
  toolDescription: "Use this agent to add a learning to knowledge base",
});
