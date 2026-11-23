#!/usr/bin/env bash
# Usage: scripts/ship.sh "<commit message>"
# Commits everything, pushes, opens a PR and enables squash auto-merge.
set -euo pipefail
MSG="${1:?usage: scripts/ship.sh \"<commit message>\"}"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" = "main" ]; then
  echo "Refusing to ship from main. Use scripts/new-branch.sh <name> first." >&2
  exit 1
fi

git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit; pushing anyway."
else
  git commit -m "$MSG"
fi
git push -u origin "$BRANCH"

if ! gh pr view --json number >/dev/null 2>&1; then
  gh pr create --fill
fi
gh pr merge --auto --squash
echo "PR opened; will squash-merge automatically when 'ci' passes."
