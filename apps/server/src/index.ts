import { env } from "@hermes/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { initAgentObservability } from "./agents/observability";
import { learningRouter } from "./routers/learning";
import { learningsRouter } from "./routers/learnings";
import { memoryRouter } from "./routers/memory";
import { demoRouter } from "./routers/orchestrator";
import { sequentialRouter } from "./routers/sequential";
import { solutionRouter } from "./routers/solution";
import { triageRouter } from "./routers/triage";
import { validatorRouter } from "./routers/validator";

initAgentObservability();

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN ?? "*",
		allowMethods: ["GET", "POST", "OPTIONS"],
	})
);

app.onError((err, c) => {
	console.error("Unhandled server error", err);
	return c.json({ error: "Internal Server Error" }, 500);
});

app.get("/", (c) => {
	return c.text("OK");
});

app.route("/agents/orchestrator", demoRouter);
app.route("/agents/triage", triageRouter);
app.route("/agents/memory", memoryRouter);
app.route("/agents/solution", solutionRouter);
app.route("/agents/validator", validatorRouter);
app.route("/agents/learning", learningRouter);
app.route("/agents/sequential", sequentialRouter);
app.route("/learnings", learningsRouter);

import { serve } from "@hono/node-server";

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);
