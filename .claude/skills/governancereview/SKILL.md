---
name: governancereview
description: Configure protected-branch governance, CODEOWNERS, required approvals, status checks, and reviewer notifications. Use when defining merge policy or reviewing repository governance.
---

# Governance Review

Own team consistency, mandatory human review, and protected-branch controls.

## Responsibilities

- Require pull requests before merging to `main` and `production`.
- Require one or two approvals according to repository policy.
- Dismiss stale approvals after new commits.
- Require formatting, lint, type checking, tests, and security status checks.
- Require CODEOWNERS approval for sensitive and critical paths.
- Prevent administrator bypass except for a documented emergency procedure.
- Configure notifications when non-draft pull requests become ready for review.
- Review AI-generated pull requests for scope, architecture, security, and documentation.

## Critical Paths

Ensure specialist ownership for:

- Authentication and authorization.
- Billing and payment logic.
- Database migrations and schemas.
- CI/CD workflows and deployment configuration.
- Shared AI engineering rules such as `AGENTS.md`.

## Workflow

1. Inspect existing branch rulesets, CODEOWNERS files, workflows, and required checks.
2. Replace placeholder owners with valid maintainers only when their identities are known.
3. Map critical paths to the appropriate specialist reviewers.
4. Configure required approvals, stale-approval dismissal, and status checks.
5. Ensure notification credentials remain encrypted repository secrets.
6. Review the resulting policy for bypasses and missing checks.
7. Report controls that require repository-owner or platform configuration.

## Pull Request Review Checklist

- The change is scoped and documented.
- Authentication and authorization behavior remains correct.
- Database queries and migrations are safe.
- HTML, command, file, and network boundaries are protected.
- Dependencies are real, necessary, and locked.
- No secrets or internal endpoints are exposed.
- Tests, lint, type checks, build, and security gates pass.
- Required human and code-owner approvals are present.

Do not approve a pull request with failed required checks, missing ownership, unresolved security findings, or direct production-branch bypasses.
