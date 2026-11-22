# AI-Driven Codebase Management, Security & Team Governance Guide

> **Purpose:** A complete operational playbook for managing multiple AI-generated repositories, running parallel AI coding agents safely with Git worktrees, enforcing team consistency across different AI tools, and protecting core branches from unreviewed or vulnerable code.

---

## 1. The 4-Layer AI Code Management Architecture

Treat AI source code management as an end-to-end engineering pipeline rather than relying on a single chat window:

1. **Whole-Codebase Indexing & Semantic Search:**
   * **Tools:** Sourcegraph Cody, Continue.dev.
   * **Role:** Indexes symbols, dependencies, and cross-repository references into a local or cloud context graph so agents understand system-wide impacts before editing.
2. **Multi-File Agentic Editing:**
   * **Tools:** Claude Code, Cursor, OpenAI Codex CLI, Aider.
   * **Role:** Executes scoped multi-file changes, runs terminal test suites, and stages atomic Git commits.
3. **Automated Pull Request (PR) & Security Gates:**
   * **Tools:** CodeRabbit, Qodo Merge, Semgrep, Gitleaks, Trivy.
   * **Role:** Acts as an objective gatekeeper on every PR—catching leaked secrets, SQL injection, hallucinated dependencies, and architectural drift before human review.
4. **Auto-Generated Documentation:**
   * **Tools:** Google Code Wiki, DeepWiki.
   * **Role:** Automatically updates architecture diagrams and module READMEs on every merge to `main`.

---

## 2. Managing 10+ AI-Generated Repositories

### A. Standardization (`AGENTS.md` + Symlinks)
Keep a single master rulebook (`AGENTS.md`) at the root of every repository defining your tech stack, folder structure, and security rules. Create symlinks so every teammate's preferred AI tool automatically reads the exact same rules:

```bash
ln -s AGENTS.md CLAUDE.md
ln -s AGENTS.md .cursorrules
mkdir -p .github && ln -s ../AGENTS.md .github/copilot-instructions.md
```

### B. Automated CI/CD Security Gates
Configure GitHub Actions / GitLab CI to block any PR that fails these automated checks:

| Security Layer | Tool | What It Catches in AI Code |
| :--- | :--- | :--- |
| **Secret Scanning** | Gitleaks / TruffleHog | Hardcoded API keys, database URLs, and tokens left by agents. |
| **Static Analysis (SAST)** | Semgrep / CodeQL | SQL injection, XSS, missing auth middleware, and logic flaws. |
| **Dependency Audit** | Renovate + Trivy / Snyk | Vulnerable packages and "slopsquatting" (hallucinated package names). |
| **Container Scanning** | Trivy | Outdated OS packages or root-user risks inside generated `Dockerfiles`. |

### C. Centralized GitOps Deployment
* **Containerize Everything:** Standardize on multi-stage `Dockerfiles` across all repositories.
* **Single Deployment Orchestrator:** Connect all repositories to **Coolify / Dokploy** (self-hosted VPS) or **Railway / Render / Fly.io** (managed cloud) so merges to `main` deploy automatically only after CI security gates pass.

---

## 3. Running Parallel AI Agents with Git Worktrees

Use **Git worktrees** to run 2–4 AI coding agents simultaneously on the same repository without file collisions or branch conflicts:

```text
~/projects/
├── app-main/               # Clean main branch (never let agents edit directly here)
├── app-wt-auth/            # Worktree 1: Agent A building authentication (PORT=3001)
├── app-wt-billing/         # Worktree 2: Agent B building billing (PORT=3002)
└── app-wt-bugfix/          # Worktree 3: Agent C fixing a UI bug (PORT=3003)
```

### Parallel Worktree Automation Script (`wt-agent.sh`)
Save this script globally (e.g., `/usr/local/bin/wt-agent`) and make it executable (`chmod +x /usr/local/bin/wt-agent`):

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <task-name> [optional-agent-command]"
  exit 1
fi

TASK_NAME="$1"
AGENT_CMD="${2:-}"

REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_ROOT")"
PARENT_DIR="$(dirname "$REPO_ROOT")"

SAFE_NAME="$(echo "$TASK_NAME" | tr ' /' '--' | tr -cd '[:alnum:]-_')"
BRANCH_NAME="feat/${SAFE_NAME}"
WORKTREE_DIR="${PARENT_DIR}/${REPO_NAME}-wt-${SAFE_NAME}"

if [ -d "$WORKTREE_DIR" ]; then
  echo "Worktree already exists at: $WORKTREE_DIR"
  exit 1
fi

# Find an available local TCP port (3001-3999)
find_free_port() {
  for port in $(seq 3001 3999); do
    if ! lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$port"
      return 0
    fi
  done
  echo "3001"
}

FREE_PORT="$(find_free_port)"

BASE_BRANCH="main"
if ! git show-ref --verify --quiet refs/heads/main; then
  BASE_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" "$BASE_BRANCH"

# Copy .env files and inject unique PORT
for env_file in .env .env.local .env.development; do
  if [ -f "${REPO_ROOT}/${env_file}" ]; then
    cp "${REPO_ROOT}/${env_file}" "${WORKTREE_DIR}/${env_file}"
  fi
done

TARGET_ENV="${WORKTREE_DIR}/.env"
if [ -f "$TARGET_ENV" ]; then
  if grep -q "^PORT=" "$TARGET_ENV"; then
    sed -i.bak "s/^PORT=.*/PORT=${FREE_PORT}/" "$TARGET_ENV" && rm -f "${TARGET_ENV}.bak"
  else
    echo -e "\nPORT=${FREE_PORT}" >> "$TARGET_ENV"
  fi
else
  echo "PORT=${FREE_PORT}" > "$TARGET_ENV"
fi

# Copy untracked agent rulebooks
for rule_file in AGENTS.md .cursorrules CLAUDE.md; do
  if [ -f "${REPO_ROOT}/${rule_file}" ] && [ ! -f "${WORKTREE_DIR}/${rule_file}" ]; then
    cp "${REPO_ROOT}/${rule_file}" "${WORKTREE_DIR}/${rule_file}"
  fi
done

cd "$WORKTREE_DIR"

# Install dependencies automatically
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install --frozen-lockfile
elif [ -f "yarn.lock" ]; then
  yarn install --frozen-lockfile
elif [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
  bun install --frozen-lockfile
elif [ -f "package-lock.json" ]; then
  npm ci
elif [ -f "requirements.txt" ]; then
  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
elif [ -f "pyproject.toml" ] && command -v uv >/dev/null 2>&1; then
  uv sync
fi

echo "Worktree ready at $WORKTREE_DIR (Branch: $BRANCH_NAME, PORT: $FREE_PORT)"

if [ -n "$AGENT_CMD" ]; then
  exec $AGENT_CMD
fi
```

---

## 4. Team Governance: "Vibe Coding" Consistency & Core Branch Protection

When multiple team members use different AI tools on the same codebase, enforce consistency and safety at the Git server level:

### A. Deterministic Formatting & Linting
Run strict formatters (**Biome**, **Prettier + ESLint**, or **Ruff**) and type checkers (`tsc --noEmit`) in CI so stylistic differences between AI models are automatically rejected unless formatted cleanly.

### B. Server-Side Branch Rulesets (`main` / `production`)
Enable the following protections in GitHub/GitLab:
1. **Require a Pull Request before merging:** Blocks all direct `git push` commands to `main`.
2. **Require Approvals (1–2 reviewers) + Dismiss Stale Approvals:** If an agent pushes new commits after an approval, the approval resets automatically.
3. **Require Status Checks to Pass:** Locks the merge button until unit tests, linters, Semgrep, and Gitleaks succeed.
4. **Disable Admin Bypass:** Prevents anyone—including repository owners—from bypassing PR review gates.

### C. Mandatory Core Reviewer Assignment (`.github/CODEOWNERS`)
Place this file in `.github/CODEOWNERS` and enable **"Require review from Code Owners"** in your branch ruleset:

```text
# Default: Require core maintainer approval on all PRs
* @core-lead-1 @core-lead-2

# Critical paths: Require specialist sign-off
/src/auth/          @security-lead
/src/billing/       @backend-lead
/prisma/migrations/ @db-admin
/.github/workflows/ @devops-lead
AGENTS.md           @core-lead-1
```

### D. Automated Slack/Discord PR Review Alerts (`.github/workflows/pr-notify.yml`)
Notify core reviewers immediately whenever a teammate marks an AI-assisted PR ready for review:

```yaml
name: Notify Core Reviewers
on:
  pull_request:
    types: [opened, ready_for_review]

jobs:
  notify-slack:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - name: Send Slack Notification
        uses: slackapi/slack-github-action@v2.0.0
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "🚨 *New PR Ready for Core Review* in `${{ github.repository }}`\n*Title:* ${{ github.event.pull_request.title }}\n*Author:* @${{ github.actor }}\n*Link:* ${{ github.event.pull_request.html_url }}"
            }
```