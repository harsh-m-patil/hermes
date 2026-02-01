# Requirements

## Goal
Slack mention bot resolves incidents via multi-agent workflow + memory + handoff.

## In Scope
- Slack Socket Mode, channel mentions only
- Agents: Coordinator, Triage, Investigator, Handoff, Verifier
- Guardrails: hard-block injection + unsafe tool intent
- Tools: gh + vercel (read+write), allowlisted
- Storage: Neon Postgres + Drizzle + pgvector
- Similar-incident retrieval + handoff doc
- Tool audit log

## Out of Scope (MVP)
- Docker sandbox runtime
- Other integrations
- DMs
- Fully autonomous deploys without verifier gate

## Non-Functional
- Fail-closed policy
- Traceability for tool use
- Slack response target <15s
- Secrets via env

## Success
- Mention triggers pipeline
- Handoff posted to thread
- Similar incident retrieved
- Policy violations blocked
