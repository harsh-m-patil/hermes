import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "@hermes/env/server";
import { tool } from "@openai/agents";
import { Portkey } from "portkey-ai";
import { z } from "zod";

const execFileAsync = promisify(execFile);

const VercelLogsSchema = z.object({});
const GhIssueSchema = z.object({
	title: z.string().trim().min(1),
	body: z.string().trim().min(1),
});

const DatabricksMockLogsSchema = z.object({});

const PortkeyCreateApiKeySchema = z.object({
	name: z.string().trim().min(1),
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

export const createPortkeyApiKeyTool = tool({
	name: "create_api_key",
	description:
		"Call when asked for AI api key. Create Portkey API key. Input: {name, type, subType, workspaceId?, scopes}. Output: {apiKey}. API key can be viewed in the portkey dashboard",
	parameters: PortkeyCreateApiKeySchema,
	execute: async (input) => {
		if (!env.PORTKEY_API_KEY) {
			throw new Error("Missing PORTKEY_API_KEY");
		}
		const workspaceId = env.PORTKEY_WORKSPACE_ID;
		if (!workspaceId) {
			throw new Error("Missing workspaceId");
		}

		const portkey = new Portkey({ apiKey: env.PORTKEY_API_KEY });

		const apiKey = await portkey.virtualKeys.create({
			name: input.name,
			provider: "openai",
			key: env.OPENAI_API_KEY,
		});

		return { apiKey };
	},
});

// NOTE: Mocked for demo purpose due to time and permission restrictions in databricks
// Can be achived using databricks sdk for typescript
export const databricksMockLogsTool = tool({
	name: "databricks_mock_logs",
	description:
		"Return mock Databricks model deployment logs. Input: {}. Output: {logs}.",
	parameters: DatabricksMockLogsSchema,
	execute: () => {
		const pools = [
			[
				"[auth] WARN access denied: token missing or expired",
				"[auth] INFO refresh attempt failed: invalid refresh token",
				"[gateway] WARN request blocked: authz=deny",
				"[gateway] INFO request_id=dbc-7f1e trace=auth",
			],
			[
				"[serving] WARN memory usage 93% (container: model-serving)",
				"[serving] WARN oom_kills=2 in last 5m",
				"[runtime] WARN gc_pause=812ms (p99)",
				"[runtime] INFO scale up requested: +2 replicas",
				"[metrics] INFO mem_rss=7.8GiB limit=8GiB",
			],
			[
				"[serving] WARN p95 latency 4200ms (threshold 800ms)",
				"[serving] WARN queue depth 180 (threshold 50)",
				"[router] INFO retries=3 upstream=timeout",
				"[router] WARN upstream 502 from model server",
				"[metrics] INFO rps=42 error_rate=6.2%",
			],
			[
				"[provisioning] ERROR model not provisioned: no active replicas",
				"[provisioning] INFO last deployment failed: image pull backoff",
				"[provisioning] WARN capacity unavailable in selected region",
				"[provisioning] INFO desired_replicas=2 current=0",
			],
			[
				"[control] INFO rolling restart initiated",
				"[control] WARN healthcheck failures=12",
				"[control] INFO rollback initiated due to failed canary",
				"[metrics] INFO cpu=88% mem=91%",
			],
		];

		const pick = (): string[] =>
			pools[Math.floor(Math.random() * pools.length)] ?? pools[0] ?? [];
		const rollups = [
			"[summary] WARN incident suspected: model deployment instability",
			"[summary] INFO mitigation: scale replicas + invalidate cache",
			"[summary] INFO next: verify token + re-provision model",
		];
		const logs = [...pick(), ...pick(), ...pick(), ...rollups];

		return { logs };
	},
});
