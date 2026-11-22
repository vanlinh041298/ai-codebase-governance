# AI Codebase Governance

Reusable, language-agnostic workflows for teams and AI coding agents. Use this project to standardize engineering rules, secure pull requests, isolate parallel agents, and protect core branches.

## Quick start

1. Copy `AGENTS.md` into your repository.
2. Copy the applicable files from `.github/`.
3. Replace every placeholder owner and secret with your project's values.
4. Choose the checks that match your languages and deployment model.
5. Add `main` and `develop` as protected branches in your Git provider.

> The included workflows are starting templates. Review action versions, scan severity, permissions, and deployment behavior before enabling them.

## Contents

- `AGENTS.md` — shared rules for AI coding tools.
- `.github/CODEOWNERS` — required reviewers for sensitive paths.
- `.github/workflows/pr-security.yml` — secret, SAST, and dependency checks.
- `.github/workflows/pr-notify.yml` — Slack notification for review-ready PRs.
- `scripts/wt-agent.sh` — isolated Git worktree setup for parallel agents.
- `.claude/skills/` — task-specific skills for Claude-compatible agents.
- `src/` — shared source integration area; local shortcuts are not published.
- `runbook/` — standalone React governance runbook managed with pnpm.
- `ai_codebase_governance_workflow_guide.md` — full operating guide.

## Customize

| Item | Replace or configure |
| --- | --- |
| `.github/CODEOWNERS` | Replace `@core-lead-*`, `@security-lead`, `@backend-lead`, `@db-admin`, and `@devops-lead`; remove paths your project does not use |
| `pr-notify.yml` | Set `SLACK_WEBHOOK_URL` as a repository secret or remove the workflow |
| `pr-security.yml` | Adjust languages, scan severity, triggers, and action versions |
| `AGENTS.md` | Set your package manager, architecture, commands, and repository conventions |
| Branch rules | Require pull requests, approvals, resolved conversations, status checks, and no bypass for `main` and `develop` |

## Run the source code

```powershell
cd runbook
pnpm install
pnpm dev
```

`runbook` remains at the repository root alongside `src`; place reusable or additional source modules under `src`. Do not edit generated output such as `runbook\dist`.

## Agent workflow

Use the matching skill when delegating governance work:

- `/engineeringandsecurity` — repository standards and secure defaults
- `/securitygates` — secret, SAST, dependency, and container checks
- `/parallelagents` — isolated Git worktrees for parallel tasks
- `/governancereview` — CODEOWNERS, reviews, and branch protection

Agents must work on feature branches or worktrees, validate their changes, and report manual platform setup separately.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security reports should follow [SECURITY.md](SECURITY.md).

## Branching and review

- `main` is the stable, release-ready branch.
- `develop` is the integration branch for reviewed changes.
- Create feature, fix, and documentation branches from `develop`.
- Open pull requests into `develop` and complete all required reviews and status checks.
- Promote `develop` to `main` through a reviewed pull request only.
- Direct pushes, force pushes, and deletions of `main` or `develop` are disabled by repository rules.

For a documentation or governance update:

```powershell
git switch develop
git pull
git switch -c docs/<short-description>
# Make and validate the changes.
git push -u origin docs/<short-description>
```

Then open a pull request targeting `develop`. Do not bypass required checks or merge before CODEOWNERS review.

## License

MIT. Adapt the templates for personal, internal, or commercial use; retain the license notice.
