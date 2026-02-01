import { env } from "@hermes/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { initAgentObservability } from "./agents/observability";
import { learningsRouter } from "./routers/learnings";
import { memoryRouter } from "./routers/memory";
import { demoRouter } from "./routers/orchestrator";
import { sequentialRouter } from "./routers/sequential";
import { triageRouter } from "./routers/triage";

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
