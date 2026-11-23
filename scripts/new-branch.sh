#!/usr/bin/env bash
# Usage: scripts/new-branch.sh <name>
set -euo pipefail
NAME="${1:?usage: scripts/new-branch.sh <name>}"
git fetch origin main --quiet || true
git checkout -b "$NAME" origin/main 2>/dev/null || git checkout -b "$NAME" main
echo "On branch $NAME"
