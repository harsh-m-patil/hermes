import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tool } from "@openai/agents";
import { z } from "zod";

const execFileAsync = promisify(execFile);

const VercelLogsSchema = z.object({});
const GhIssueSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export const vercelInspectLogsTool = tool({
  name: "vercel_inspect_logs",
  description:
    "Fetch Vercel deployment logs. Input: {}. Output: {stdout, stderr, exitCode}.",
  parameters: VercelLogsSchema,
  execute: async () => {
    try {
      const { stdout, stderr } = await execFileAsync("vercel", [
        "inspect",
        "--logs",
        "portfolio-oqcyjyz5f-harsh-m-patils-projects.vercel.app",
      ]);
      return { stdout, stderr, exitCode: 0 };
    } catch (error) {
      const err = error as {
        stdout?: string;
        stderr?: string;
        code?: number;
      };
      return {
        stdout: err.stdout ?? "",
        stderr: err.stderr ?? String(error),
        exitCode: err.code ?? 1,
      };
    }
  },
});

export const ghCreateIssueTool = tool({
  name: "gh_create_issue",
  description:
    "Create GitHub issue in harsh-m-patil/hermes. Input: {title, body}. Output: {stdout, stderr, exitCode}.",
  parameters: GhIssueSchema,
  execute: async (input) => {
    try {
      const { stdout, stderr } = await execFileAsync("gh", [
        "issue",
        "create",
        "--repo",
        "harsh-m-patil/hermes",
        "--title",
        input.title,
        "--body",
        input.body,
        "--label",
        "triage",
        "--assignee",
        "@me",
      ]);
      return { stdout, stderr, exitCode: 0 };
    } catch (error) {
      const err = error as {
        stdout?: string;
        stderr?: string;
        code?: number;
      };
      return {
        stdout: err.stdout ?? "",
        stderr: err.stderr ?? String(error),
        exitCode: err.code ?? 1,
      };
    }
  },
});
