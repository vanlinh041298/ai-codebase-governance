---
name: grill-with-docs
description: Interview the user about an unsettled feature plan or design, resolve terminology and trade-offs, and record durable domain language and decisions in repository docs.
disable-model-invocation: true
---

# Grill With Docs

Use at the start of a repository change when the intended behavior, terminology, or design is not settled. Do not start implementation until the user confirms a shared understanding.

## Workflow

1. Read the relevant code, existing documentation, glossary, and architecture decision records before asking questions. Resolve facts from the repository yourself.
2. Ask a small, connected round of questions at a time. For each question, state a recommended answer and why; then wait for the user's response before continuing.
3. Follow the unresolved branches of the design. Distinguish facts, preferences, constraints, and decisions. Challenge contradictions and ambiguous domain terms rather than silently choosing an interpretation.
4. As terms are agreed, update the appropriate `GLOSSARY.md` with concise definitions only. If the repository uses `GLOSSARY-MAP.md`, place the entry in the mapped context. Do not put implementation details or feature specs in the glossary.
5. Record a decision as an ADR under `docs/adr/` only when it is hard to reverse, surprising without context, and involves a genuine trade-off. Do not create an ADR for routine choices.
6. Summarize the settled scope, behavior, terminology, and remaining unknowns. Ask the user to confirm the shared understanding before ending.

Do not invent answers to unresolved questions. Do not start implementation as part of this skill. For a multi-session effort, keep this conversation available for the `to-spec` step; for a small change, continue with `implement` after confirmation.

Source: https://www.aihero.dev/skills-grill-with-docs
