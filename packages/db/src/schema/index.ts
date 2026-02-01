import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const learnings = pgTable("learnings", {
  id: uuid("id").defaultRandom().primaryKey(),
  incidentText: text("incident_text").notNull(),
  resolutionText: text("resolution_text").notNull(),
  summary: text("summary").notNull(),
  rootCause: text("root_cause"),
  fixSteps: text("fix_steps").array(),
  tags: text("tags").array().notNull().default(sql`'{}'`),
  severity: text("severity"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
