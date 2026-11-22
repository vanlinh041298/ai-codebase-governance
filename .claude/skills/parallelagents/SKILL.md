---
name: parallelagents
description: Plan and run isolated AI coding agents using Git worktrees, unique branches and ports, and independent validation. Use when parallel implementation tasks share one repository.
---

# Parallel Agents

Own safe parallel-agent execution without allowing agents to collide in the same worktree.

## Responsibilities

- Split requested work into independent, testable tasks.
- Create one feature branch and Git worktree per agent.
- Assign a unique local development port to each worktree.
- Install dependencies with the repository's existing package manager.
- Keep protected `main` and `production` worktrees untouched.
- Coordinate integration and detect overlapping changes early.
- Validate each task independently before pull requests or integration.

## Workflow

1. Confirm the repository has a clean base branch and record the current branch and lockfile strategy.
2. Divide work by file or subsystem to minimize overlap.
3. Create each worktree with a safe task branch, using `scripts/wt-agent.sh` when available.
4. Reuse untracked environment templates without copying real secrets into tracked files.
5. Install dependencies using the matching frozen-lockfile command.
6. Run lint, type checks, tests, and builds in each worktree.
7. Open separate reviewable pull requests or integrate completed branches only after validation.

## Safety Rules

- Never run multiple agents in one worktree.
- Never let an agent edit `main` or `production` directly.
- Never copy `.env` files containing secrets into commits.
- Never force-push or remove a worktree that may contain unreviewed changes.
- Do not merge one task branch into another without checking for scope overlap.
- Stop and report blocked agents rather than inventing success.

## Outputs

Report each worktree path, branch, port, task scope, validation result, and remaining integration risk.
