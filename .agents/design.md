# Design

## System Overview

- Slack bot receives mention, builds context, calls orchestrator
- Orchestrator runs multi-agent pipeline, gates tools, stores memory
- Response posted to Slack thread + handoff

## Components

- apps/slack-bot: Bolt JS Socket Mode
- apps/orchestrator: HTTP API + Agents SDK
- packages/agents: prompts + agent defs
- packages/security: sanitizer, policy, verifier
- packages/tools: gh/vercel wrappers
- packages/db: Drizzle schema + pgvector
- packages/shared: types/utils

## Orchestrator Design

### API

- POST /incident/ingest
- POST /incident/run
- GET /incident/:id
- POST /incident/:id/search
- POST /incident/:id/handoff

### Pipeline

1. Build context: thread msgs + mention payload
2. Sanitize: strip instructions + normalize quotes/links
3. Guardrails: classify unsafe/injection -> hard block
4. Coordinator routes:
   - Triage: summarize, severity, tags
   - Investigator: retrieve similar, root cause, fix, verification steps
   - Handoff: shift summary + checklist
5. Verifier validates:
   - outputs vs policy
   - tool intents vs allowlist
6. Tool calls (if needed):
   - gh/vercel via wrappers
   - audit each call; fail-closed on violations
7. Aggregate response + store outputs + embeddings

### Agent Graph

- Coordinator (router + consensus)
- Triage <-> Investigator (shared context)
- Handoff uses Triage + Investigator output
- Verifier gates tool intents + final output

### Tool Gating

- Allowlist: repos, vercel projects, commands
- Deny network egress outside allowlist
- Write ops require Verifier approval

### Error Handling

- Policy fail -> short block reason + safe guidance
- Tool failure -> retry once, then degrade to read-only guidance
- Timeout per agent; overall budget ~12s

## Data Model

- incidents(id, title, status, severity, created_at)
- events(id, incident_id, source, body, ts)
- agent_outputs(id, incident_id, agent, content, ts)
- handoffs(id, incident_id, content, ts)
- tool_audit(id, incident_id, tool, input, output, verdict, ts)
- embeddings(id, incident_id, chunk_type, content, vector)

## Retrieval

- Embed incident chunks (summary, fix, tags)
- pgvector cosine similarity; top-k + threshold
- Provide citations in output

## Security

- Slack signature verify
- Prompt-injection classifier + instruction strip
- Policy engine (hard-block)
- Audit logs for all tool calls

## Observability

- Structured logs per pipeline step
- Incident id correlation id
