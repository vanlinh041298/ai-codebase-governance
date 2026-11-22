#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <task-name> [agent-command]"
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

find_free_port() {
  for port in $(seq 3001 3999); do
    if ! lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$port"
      return
    fi
  done
  echo "3001"
}

BASE_BRANCH="main"
if ! git show-ref --verify --quiet refs/heads/main; then
  BASE_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" "$BASE_BRANCH"
FREE_PORT="$(find_free_port)"
printf "PORT=%s\n" "$FREE_PORT" > "${WORKTREE_DIR}/.env"

cd "$WORKTREE_DIR"
if [ -f pnpm-lock.yaml ]; then
  pnpm install --frozen-lockfile
elif [ -f yarn.lock ]; then
  yarn install --frozen-lockfile
elif [ -f package-lock.json ]; then
  npm ci
elif [ -f requirements.txt ]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi

echo "Worktree ready at $WORKTREE_DIR (branch: $BRANCH_NAME, port: $FREE_PORT)"
if [ -n "$AGENT_CMD" ]; then
  exec "$AGENT_CMD"
fi
