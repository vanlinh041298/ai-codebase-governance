---
name: implement
description: Implement one agreed ticket or a small spec-driven change test-first, validate it with repository checks, review the result, and commit on the intended feature branch.
disable-model-invocation: true
---

# Implement

Build work whose scope and behavior have already been decided. Do not redesign the plan while coding. If the request is ambiguous, stop and ask rather than filling gaps with assumptions.

## Workflow

1. Read the referenced ticket or spec in full, including acceptance criteria and relevant comments. If given a tracker reference, confirm its title with the user when ambiguous.
2. Check the current branch and working tree. Do not implement on a protected branch or disturb unrelated changes; ask the user to move to the intended feature branch when needed.
3. Inspect the relevant code, tests, project instructions, and existing patterns. Identify observable test seams from the accepted plan.
4. Work in small test-first slices: add or adjust a focused test that demonstrates the behavior, make the smallest implementation that passes it, then refactor safely. Do not test private implementation details.
5. Run focused tests and type checks regularly. At completion, run the relevant full test suite and the repository's formatter, linter, type checker, and build where available. Report unavailable or failing checks accurately.
6. Review the completed diff against both repository standards and the source requirements. Call `code-review` when available; otherwise perform and report separate standards and spec checks.
7. Commit the completed change to the current feature branch only after validation and review. Keep the commit scoped and atomic. Never include secrets or unrelated work.

One run should cover one ticket. If a spec spans several sessions, use `to-tickets` first. Do not close the originating ticket or claim its acceptance criteria are complete unless you actually update and verify them.

Source: https://www.aihero.dev/skills-implement
