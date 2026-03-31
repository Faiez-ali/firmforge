#!/bin/bash
# ─────────────────────────────────────────────────────────────────
#  forge.sh — FirmForge branch & PR helper
#  Run from the ROOT of your firmforge repo.
#
#  Usage:
#    bash forge.sh <branch> "<commit message>" [base-branch]
#
#  Examples:
#    bash forge.sh feat/supabase-auth "feat: add auth pages" main
#    bash forge.sh fix/bom-prices "fix: handle LCSC timeout" main
#    bash forge.sh chore/update-deps "chore: bump dependencies" main
#
#  Prerequisites:
#    - git installed and repo cloned
#    - gh CLI installed (brew/winget/apt install gh) for auto PR
#    - gh auth login done once
# ─────────────────────────────────────────────────────────────────

set -e

BRANCH="${1:-}"
MESSAGE="${2:-chore: update files}"
BASE="${3:-main}"

# ── Validation ────────────────────────────────────────────────────
if [ -z "$BRANCH" ]; then
  echo "Usage: bash forge.sh <branch-name> \"<commit message>\" [base-branch]"
  echo "Example: bash forge.sh feat/supabase-auth \"feat: add auth\" main"
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "❌ Run this from the root of the firmforge repo (where package.json is)"
  exit 1
fi

# ── Branch setup ──────────────────────────────────────────────────
echo ""
echo "⚡ FirmForge — pushing branch"
echo "   Branch  : $BRANCH"
echo "   Base    : $BASE"
echo "   Message : $MESSAGE"
echo ""

git fetch origin

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "→ Switching to existing branch: $BRANCH"
  git checkout "$BRANCH"
else
  echo "→ Creating new branch from origin/$BASE"
  git checkout -b "$BRANCH" "origin/$BASE"
fi

# ── Commit ────────────────────────────────────────────────────────
git add -A

if git diff --cached --quiet; then
  echo "ℹ  Nothing to commit — working tree is clean"
else
  echo ""
  echo "📁 Files changed:"
  git diff --cached --name-status
  echo ""
  git commit -m "$MESSAGE"
fi

# ── Push ──────────────────────────────────────────────────────────
git push -u origin "$BRANCH"
echo ""
echo "✅ Pushed: $BRANCH"

# ── PR ────────────────────────────────────────────────────────────
if command -v gh &> /dev/null; then
  # Check if PR already exists
  EXISTING_PR=$(gh pr list --head "$BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
  if [ -n "$EXISTING_PR" ]; then
    echo "ℹ  PR #$EXISTING_PR already exists for this branch"
    echo "   https://github.com/Faiez-ali/firmforge/pull/$EXISTING_PR"
  else
    echo "→ Opening draft PR..."
    gh pr create \
      --base "$BASE" \
      --head "$BRANCH" \
      --title "$MESSAGE" \
      --body "Automated PR from FirmForge dev pipeline.

Branch: \`$BRANCH\`
Base: \`$BASE\`

Review the changes and merge to deploy to production." \
      --draft
  fi
else
  echo ""
  echo "ℹ  gh CLI not installed — push complete, open PR manually:"
  echo "   https://github.com/Faiez-ali/firmforge/compare/$BRANCH"
  echo ""
  echo "   Install gh CLI: https://cli.github.com"
fi

echo ""
echo "─────────────────────────────────"
echo "✅ Done — $BRANCH"
echo "─────────────────────────────────"