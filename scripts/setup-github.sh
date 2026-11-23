#!/usr/bin/env bash
# One-time GitHub setup: create repo, protect main, enable auto-merge.
# Requires: gh (authenticated), an existing local git repo with at least one commit.
set -euo pipefail

REPO_NAME="${1:-eulogy}"

echo "==> Creating public repo '$REPO_NAME' and pushing current branch"
gh repo create "$REPO_NAME" --public --source=. --remote=origin --push

OWNER_REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo "==> Repo: $OWNER_REPO"

echo "==> Protecting 'main': require PR + status check 'ci'"
gh api -X PUT "repos/$OWNER_REPO/branches/main/protection" \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["ci"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON

echo "==> Enabling auto-merge and delete-branch-on-merge"
gh repo edit "$OWNER_REPO" --enable-auto-merge --delete-branch-on-merge

cat <<EOT

Done. Next steps:
  1. scripts/new-branch.sh <name>      # start a feature branch
  2. ...hack...
  3. scripts/ship.sh "<commit message>" # commit, push, open PR, auto-merge when 'ci' is green
  4. Add secrets in GitHub → Settings → Secrets (see .env.example)
  5. Import the repo on Vercel; vercel.json already points at apps/web
EOT
