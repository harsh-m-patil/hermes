import { env } from "@hermes/env/web";

import OncallDashboard, {
	type LearningItem,
} from "@/components/oncall-dashboard";

const fetchLearnings = async () => {
	try {
		const response = await fetch(
			`${env.NEXT_PUBLIC_SERVER_URL}/learnings?limit=8`,
			{
				cache: "no-store",
			}
		);
		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(
				`Learnings ${response.status}: ${text || response.statusText}`
			);
		}
		const json = (await response.json().catch(() => null)) as {
			items?: LearningItem[];
		} | null;
		if (!json?.items) {
			throw new Error("Missing learnings");
		}
		return { items: json.items, error: null };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to load learnings";
		return { items: [], error: message };
	}
};

export default async function Home() {
	const { items, error } = await fetchLearnings();

	return (
		<div className="min-h-full bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(0,0,0,0.08)_0%,transparent_60%)] px-4 py-10 dark:bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(255,255,255,0.12)_0%,transparent_60%)]">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
				<section className="grid gap-4">
					<div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
						<span className="rounded-none border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
							Hermes On-Call
						</span>
						<span>Server: {env.NEXT_PUBLIC_SERVER_URL}</span>
						<span className="h-1 w-1 rounded-full bg-muted-foreground/70" />
						<span>Trigger the orchestrator agent</span>
					</div>
					<div className="grid gap-3">
						<h1 className="text-pretty font-medium text-3xl tracking-tight sm:text-4xl">
							Dispatch on-call support in seconds.
						</h1>
						<p className="max-w-2xl text-muted-foreground text-sm">
							Provide incident context and Hermes will triage, pull memory, and
							return an action plan. Keep it short, brutal, and focused.
						</p>
					</div>
				</section>

				<OncallDashboard learnings={items} learningsError={error} />
			</div>
		</div>
	);
}
