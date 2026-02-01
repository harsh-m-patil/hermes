"use client";

import { env } from "@hermes/env/web";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface LearningItem {
	id: string;
	issueText: string;
	solutionText: string;
	createdAt: string;
}

interface OncallDashboardProps {
	learnings: LearningItem[];
	learningsError?: string | null;
}

const getResponseContent = (
	loading: boolean,
	result: string | null
): ReactNode => {
	if (loading) {
		return (
			<div className="grid gap-2">
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-4 w-5/6" />
				<Skeleton className="h-4 w-2/3" />
				<Skeleton className="h-4 w-4/5" />
			</div>
		);
	}
	if (result) {
		return (
			<pre className="whitespace-pre-wrap text-foreground text-xs leading-relaxed">
				{result}
			</pre>
		);
	}
	return (
		<div className="text-muted-foreground text-xs">
			No response yet. Dispatch Hermes to see output.
		</div>
	);
};

const getLearningsContent = (input: {
	learningsError?: string | null;
	learnings: LearningItem[];
}): ReactNode => {
	if (input.learningsError) {
		return (
			<div className="rounded-none border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-xs">
				{input.learningsError}
			</div>
		);
	}
	if (input.learnings.length > 0) {
		return (
			<div className="grid gap-3">
				{input.learnings.map((item) => (
					<div className="grid gap-1" key={item.id}>
						<div className="font-medium text-foreground text-xs">
							{item.issueText}
						</div>
						<div className="text-muted-foreground text-xs">
							{item.solutionText}
						</div>
					</div>
				))}
			</div>
		);
	}
	return <div className="text-muted-foreground text-xs">No learnings yet.</div>;
};

export default function OncallDashboard({
	learnings,
	learningsError,
}: OncallDashboardProps) {
	const [title, setTitle] = useState("");
	const [context, setContext] = useState("");
	const [result, setResult] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [lastRun, setLastRun] = useState<Date | null>(null);
	const [useSequential, setUseSequential] = useState(false);

	const prompt = [title.trim(), context.trim()].filter(Boolean).join("\n\n");
	const canSubmit = prompt.length > 0 && !loading;
	const agentPath = useSequential ? "sequential" : "orchestrator";
	const agentLabel = useSequential ? "Sequential" : "Orchestrator";

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!prompt) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`${env.NEXT_PUBLIC_SERVER_URL}/agents/${agentPath}`,
				{
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ prompt }),
				}
			);

			if (!response.ok) {
				const text = await response.text().catch(() => "");
				throw new Error(
					`Agent server ${response.status}: ${text || response.statusText}`
				);
			}

			const json = (await response.json().catch(() => null)) as {
				result?: string;
			} | null;
			if (!json?.result) {
				throw new Error("Missing result in agent response");
			}

			setResult(json.result);
			setLastRun(new Date());
			toast.success("Hermes responded");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Request failed";
			setError(message);
			toast.error("Request failed");
		} finally {
			setLoading(false);
		}
	};

	const handleCopy = async () => {
		if (!result) {
			return;
		}
		try {
			await navigator.clipboard.writeText(result);
			toast.success("Copied response");
		} catch {
			toast.error("Copy failed");
		}
	};

	const responseContent = getResponseContent(loading, result);
	const learningsContent = getLearningsContent({ learnings, learningsError });

	return (
		<section className="grid gap-6">
			<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<Card className="border-foreground/10">
					<CardHeader className="border-b">
						<CardTitle>Trigger Hermes</CardTitle>
						<CardDescription>
							Send a concise incident summary to the agent pipeline.
						</CardDescription>
						<CardAction>
							<span className="rounded-none border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
								Live
							</span>
						</CardAction>
					</CardHeader>
					<CardContent>
						<form className="grid gap-4" onSubmit={handleSubmit}>
							<div className="flex flex-wrap items-center justify-between gap-3 border border-foreground/10 px-3 py-2">
								<div className="grid gap-1">
									<Label className="text-xs" htmlFor="agent-toggle">
										Sequential pipeline
									</Label>
									<span className="text-[11px] text-muted-foreground">
										{useSequential
											? "Routes to the sequential agent pipeline."
											: "Routes to the orchestrator agent."}
									</span>
								</div>
								<Switch
									checked={useSequential}
									id="agent-toggle"
									onCheckedChange={setUseSequential}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="incident-title">Incident title</Label>
								<Input
									id="incident-title"
									onChange={(event) => setTitle(event.target.value)}
									placeholder="Checkout latency spike"
									value={title}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="incident-context">Context</Label>
								<Textarea
									id="incident-context"
									onChange={(event) => setContext(event.target.value)}
									placeholder="Start time, impact, logs, metrics, recent deploys, owners..."
									value={context}
								/>
							</div>
							{error ? (
								<div className="rounded-none border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-xs">
									{error}
								</div>
							) : null}
							<div className="flex flex-wrap items-center gap-3">
								<Button disabled={!canSubmit} type="submit">
									{loading ? "Dispatching..." : "Dispatch Hermes"}
								</Button>
								<span className="text-muted-foreground text-xs">
									{lastRun
										? `Last run: ${lastRun.toLocaleTimeString()}`
										: "No runs yet"}
								</span>
							</div>
						</form>
					</CardContent>
					<CardFooter className="justify-between text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
						<span>Incident intake</span>
						<span>{agentLabel}</span>
					</CardFooter>
				</Card>

				<Card className="border-foreground/10">
					<CardHeader className="border-b">
						<CardTitle>Latest Response</CardTitle>
						<CardDescription>Hermes output with next steps.</CardDescription>
						<CardAction>
							<Button
								disabled={!result}
								onClick={handleCopy}
								size="xs"
								variant="outline"
							>
								Copy
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent className="min-h-[240px]">{responseContent}</CardContent>
					<CardFooter className="justify-between text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
						<span>Response</span>
						<span>On-call</span>
					</CardFooter>
				</Card>
			</div>

			<Card className="border-foreground/10">
				<CardHeader className="border-b">
					<CardTitle>Recent Learnings</CardTitle>
					<CardDescription>Latest incident recall from memory.</CardDescription>
				</CardHeader>
				<CardContent className="min-h-[200px]">{learningsContent}</CardContent>
				<CardFooter className="justify-between text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
					<span>Memory</span>
					<span>{learnings.length} items</span>
				</CardFooter>
			</Card>
		</section>
	);
}
