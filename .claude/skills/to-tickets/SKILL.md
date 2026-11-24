---
name: to-tickets
description: Break an agreed spec, plan, or conversation into reviewable tickets with explicit dependencies and independently verifiable user-facing behavior.
disable-model-invocation: true
---

# To Tickets

Create a dependency-aware work breakdown from settled requirements. Do not change the design while splitting it. If the source is unclear, surface the ambiguity before drafting tickets.

## Workflow

1. Read the full source spec or conversation and relevant repository docs. Use established domain terms and respect recorded decisions.
2. Identify useful preparatory refactoring and place it before dependent feature work when needed.
3. Draft the smallest sensible set of tickets. Each should deliver a narrow, end-to-end behavior, be independently verifiable, fit one focused implementation session, and state what blocks it. Avoid slicing by technical layer.
4. For a broad mechanical refactor that cannot land incrementally, plan an expand-migrate-contract sequence and make the dependency edges explicit.
5. Present a numbered draft with each ticket's title, behavior delivered, acceptance criteria, and blockers. Check whether the sizing and dependencies are right; revise until the user approves.
6. Publish only after approval. Use the configured tracker and its native dependency relationships when available. If none is configured, ask before choosing a storage location or creating local ticket files. Do not modify or close the parent issue.

For a change small enough for one implementation session, skip ticketing and use `implement`. If the plan is not settled, use `grill-with-docs` before creating a spec or tickets.

Source: https://www.aihero.dev/skills-to-tickets
