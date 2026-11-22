---
name: engineeringandsecurity
description: Standardize repository structure, AI engineering instructions, secure coding defaults, dependencies, and deployment conventions. Use when setting up, auditing, or governing a repository.
---

# Engineering and Security

Standardize repositories so humans and AI coding tools follow the same engineering, security, and validation practices.

## Responsibilities

- Create and maintain the shared `AGENTS.md` rulebook.
- Apply secure coding and dependency policies.
- Standardize repository, folder, CI, container, and deployment conventions.
- Keep Claude, Copilot, Cursor, and other AI-tool instructions synchronized.
- Inspect existing repository patterns before introducing new conventions.
- Configure and verify security gates for pull requests and protected branches.
- Review AI-generated code for secrets, unsafe dependencies, injection risks, and architectural drift.

## Workflow

1. Inspect the repository structure, package manager, CI configuration, deployment files, and existing agent instructions.
2. Identify gaps in engineering consistency or secure defaults.
3. Reuse existing repository patterns where possible.
4. Make scoped, minimal changes.
5. Add or update documentation and focused tests when behavior changes.
6. Configure all applicable checks below.
7. Run the repository's formatter, linter, type checker, tests, and build.

## Required Security Rules

- Never commit credentials, tokens, private keys, or production secrets.
- Validate untrusted input at trust boundaries.
- Use maintained dependencies from verified package registries.
- Reject dependencies that are unnecessary, hallucinated, abandoned, or vulnerable.
- Preserve least-privilege permissions in workflows, containers, and deployment configuration.
- Surface failures explicitly; do not hide errors or return success-shaped fallbacks.

## Required Security Gates

Configure these controls in CI for every pull request:

| Gate | Tools | Required coverage |
| --- | --- | --- |
| Secret scanning | Gitleaks or TruffleHog | API keys, tokens, credentials, database URLs, and private keys |
| Static analysis | Semgrep or CodeQL | SQL injection, XSS, authentication gaps, and unsafe logic |
| Dependency audit | Renovate plus Trivy or Snyk | Vulnerable, hallucinated, abandoned, or mismatched packages |
| Container scanning | Trivy | Vulnerable OS packages, unsafe base images, and root-user risks |
| Quality checks | Existing formatter, linter, type checker, and tests | Invalid formatting, typing errors, regressions, and inconsistent agent output |

Security jobs must fail closed. A pull request must not merge when a required job fails, reports a critical finding, or cannot run.

## AI-Generated Code Review

Before approving AI-generated code:

1. Verify every added dependency exists in the declared registry and package lockfile.
2. Search for secrets, credentials, internal URLs, and debug artifacts.
3. Review authentication, authorization, database queries, HTML output, file access, shell commands, and network requests.
4. Confirm input validation and output encoding exist at trust boundaries.
5. Check generated changes against the indexed codebase for unintended cross-module effects.
6. Reject new architecture, public APIs, or infrastructure changes that are unrelated to the task.

## Container and Deployment Security

- Use multi-stage Docker builds and minimal maintained base images.
- Run production processes as a non-root user.
- Exclude secrets and build artifacts with `.dockerignore` and `.gitignore`.
- Pin dependencies and base images where the repository policy permits.
- Deploy only after CI security gates pass.
- Use Coolify, Dokploy, Railway, Render, Fly.io, or the repository's existing orchestrator without bypassing deployment checks.

## Core Branch Protection

Require all of the following for `main` and `production`:

- Pull request before merge; block direct pushes.
- One or two human approvals according to repository policy.
- Dismiss stale approvals when new commits are pushed.
- All required tests, lint, type checks, Semgrep, Gitleaks, and dependency checks pass.
- Code-owner approval for critical paths through `.github/CODEOWNERS`.
- No administrator bypass, except an explicitly documented emergency procedure.

## Critical Ownership Paths

Require specialist review for:

- Authentication and authorization code.
- Billing and payment code.
- Database schemas and migrations.
- CI/CD workflows and deployment configuration.
- Root engineering and AI rule files such as `AGENTS.md`.

## Parallel Agent Isolation

When multiple AI agents work on one repository:

- Never let agents edit the protected main worktree directly.
- Create a separate Git worktree and feature branch for each task.
- Assign a distinct local port to each worktree.
- Copy required untracked environment files without committing secrets.
- Validate each agent's changes independently before opening a pull request.

## Review Notifications

Configure pull-request notifications to core reviewers when a non-draft pull request opens or becomes ready for review. Keep notification webhooks in encrypted repository secrets and never in tracked files.

## Outputs

Report:

- Files created or changed.
- Standards and security controls applied.
- Validation commands and results.
- Security tools configured, their scope, and any findings.
- Branch protection and CODEOWNERS requirements verified or needing manual setup.
- Required manual configuration, if any.

Do not claim completion when required checks fail or secrets and reviewer identities still need external configuration.
