---
name: to-spec
description: Synthesize already-agreed decisions from the conversation and repository into a precise feature spec for work that spans multiple implementation sessions.
disable-model-invocation: true
---

# To Spec

Turn settled decisions into a durable spec. Do not reopen design questions or interview the user about decisions already made. If required information is absent or contradictory, identify the gap rather than inventing a decision.

## Workflow

1. Read the relevant conversation, codebase, glossary, and ADRs. If given an issue or document reference, retrieve its full content before drafting.
2. Identify the user-observable behavior, implementation and testing decisions, explicit non-goals, and the highest practical test seams. Prefer existing seams and keep their number small.
3. Show the proposed seams to the user and confirm them before drafting. This confirmation must not become a fresh design interview.
4. Write a spec with these sections: Problem Statement, Solution, User Stories, Implementation Decisions, Testing Decisions, Out of Scope, and Further Notes. Use the repository's vocabulary. Avoid stale-prone file paths and code snippets unless a prototype established a decision that prose cannot express.
5. Verify every statement reflects a decision or fact already established. Preserve explicit constraints and rejected alternatives where relevant.
6. Publish only after user approval, using the repository's configured issue tracker and label conventions. If no tracker configuration exists, ask how the user wants it handled; do not assume credentials, labels, or a publishing destination.

Use this for multi-session work. For a change that fits one session, skip the spec and proceed to `implement`. For work not yet decided, use `grill-with-docs` first.

Source: https://www.aihero.dev/skills-to-spec
