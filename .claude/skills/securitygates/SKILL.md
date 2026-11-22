---
name: securitygates
description: Configure and verify pull-request security gates for secrets, SAST, dependencies, containers, and required CI checks. Use when adding or auditing repository security automation.
---

# Security Gates

Own automated security checks that must pass before code can merge or deploy.

## Responsibilities

- Configure Gitleaks or TruffleHog secret scanning.
- Configure Semgrep or CodeQL static analysis.
- Configure Renovate plus Trivy or Snyk dependency auditing.
- Configure Trivy container and filesystem scanning.
- Make security workflows fail closed on errors and high-confidence critical findings.
- Use least-privilege workflow permissions and encrypted repository secrets.
- Verify every applicable security gate passes on the current change.

## Workflow

1. Inspect the repository languages, package manifests, lockfiles, containers, CI workflows, and trust boundaries.
2. Reuse existing security tooling before introducing another scanner.
3. Add or update focused workflow jobs with explicit permissions.
4. Pin and review actions according to repository policy.
5. Check pull-request paths, triggers, report output, and failure behavior.
6. Run relevant local scans and validation commands.
7. Report findings, false positives, unresolved failures, and manual branch-protection setup.

## Required Checks

| Gate | Coverage |
| --- | --- |
| Secret scanning | Tokens, credentials, private keys, API keys, and database URLs |
| SAST | SQL injection, XSS, unsafe authorization, file access, command execution, and unsafe network use |
| Dependency audit | Vulnerable, hallucinated, abandoned, unregistered, or mismatched dependencies |
| Container scan | Vulnerable OS packages, unsafe base images, and root-user execution |
| Existing quality checks | Formatter, linter, type checker, tests, and production build |

Never commit secrets, scanner tokens, webhook URLs, or generated credentials. Mark a gate as incomplete if required branch rules cannot be configured from the current environment.
