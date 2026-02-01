import { env } from "@hermes/env/slack";

export const callOrchestratorAgent = async (prompt: string) => {
	try {
		const response = await fetch(
			`${env.AGENT_SERVER_URL}/agents/orchestrator`,
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

		const json = (await response.json()) as { result?: string };
		if (!json.result) {
			throw new Error("Missing result in agent response");
		}

		return json.result;
	} catch (error) {
		console.error("callAgent failed", error);
		return "Sorry—something went wrong. Try again.";
	}
};

export const callSequentialAgent = async (issue: string) => {
	try {
		const response = await fetch(`${env.AGENT_SERVER_URL}/agents/sequential`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ issue }),
		});

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(
				`Agent server ${response.status}: ${text || response.statusText}`
			);
		}

		const json = (await response.json()) as {
			solution?: string;
			valid?: boolean;
			notes?: string | null;
		};
		if (!json.solution) {
			throw new Error("Missing solution in agent response");
		}

		return json;
	} catch (error) {
		console.error("callSequentialAgent failed", error);
		return {
			solution: "Sorry—something went wrong. Try again.",
			valid: false,
			notes: "agent_error",
		};
	}
};

export const callTriageAgent = async (issue: string) => {
	try {
		const response = await fetch(`${env.AGENT_SERVER_URL}/agents/triage`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ incident: issue }),
		});

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(
				`Agent server ${response.status}: ${text || response.statusText}`
			);
		}

		const json = (await response.json()) as { result?: string };
		if (!json.result) {
			throw new Error("Missing result in triage response");
		}

		return json.result;
	} catch (error) {
		console.error("callTriageAgent failed", error);
		return null;
	}
};

export const callMemoryAgent = async (issue: string) => {
	try {
		const response = await fetch(`${env.AGENT_SERVER_URL}/agents/memory`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ question: issue }),
		});

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(
				`Agent server ${response.status}: ${text || response.statusText}`
			);
		}

		const json = (await response.json()) as { result?: string };
		if (!json.result) {
			throw new Error("Missing result in memory response");
		}

		return json.result;
	} catch (error) {
		console.error("callMemoryAgent failed", error);
		return null;
	}
};

export const callSolutionAgent = async (input: {
	issue: string;
	triage: string | null;
	memory: string | null;
}) => {
	try {
		const response = await fetch(`${env.AGENT_SERVER_URL}/agents/solution`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(input),
		});

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(
				`Agent server ${response.status}: ${text || response.statusText}`
			);
		}

		const json = (await response.json()) as { result?: string };
		if (!json.result) {
			throw new Error("Missing result in solution response");
		}

		return json.result;
	} catch (error) {
		console.error("callSolutionAgent failed", error);
		return null;
	}
};

export const callValidatorAgent = async (input: {
	issue: string;
	triage: string | null;
	memory: string | null;
	solution: string;
}) => {
	try {
		const response = await fetch(`${env.AGENT_SERVER_URL}/agents/validator`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(input),
		});

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(
				`Agent server ${response.status}: ${text || response.statusText}`
			);
		}

		const json = (await response.json()) as {
			valid?: boolean;
			solution: string;
			notes?: string | null;
		};
		if (!json.solution) {
			throw new Error("Missing solution in validator response");
		}

		return json;
	} catch (error) {
		console.error("callValidatorAgent failed", error);
		return {
			valid: false,
			solution: input.solution,
			notes: "agent_error",
		};
	}
};

export const callLearningAgent = async (input: {
	issue: string;
	solution: string;
}) => {
	try {
		const response = await fetch(`${env.AGENT_SERVER_URL}/agents/learning`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(input),
		});

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(
				`Agent server ${response.status}: ${text || response.statusText}`
			);
		}

		return true;
	} catch (error) {
		console.error("callLearningAgent failed", error);
		return false;
	}
};
