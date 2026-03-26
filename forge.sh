#!/bin/bash
# ─────────────────────────────────────────────────────────────────
#  forge.sh — FirmForge branch & PR helper
#  Usage: bash forge.sh <branch> <commit-message> [base-branch]
#  Example: bash forge.sh feat/supabase-auth "feat: add Supabase auth" main
#
#  Requires: git, gh (GitHub CLI — brew install gh / apt install gh)
#  One-time auth: gh auth login
# ─────────────────────────────────────────────────────────────────

set -e

BRANCH=${1:-""}
MESSAGE=${2:-"chore: update files"}
BASE=${3:-"main"}

if [ -z "$BRANCH" ]; then
  echo "Usage: bash forge.sh <branch-name> <commit-message> [base-branch]"
  exit 1
fi

echo ""
echo "⚡ FirmForge — pushing feature branch"
echo "   Branch : $BRANCH"
echo "   Base   : $BASE"
echo "   Commit : $MESSAGE"
echo ""

# Fetch latest
git fetch origin

# Create branch from base (or switch to it if it exists)
if git show-ref --verify --quiet refs/heads/$BRANCH; then
  echo "→ Switching to existing branch: $BRANCH"
  git checkout $BRANCH
else
  echo "→ Creating branch from $BASE: $BRANCH"
  git checkout -b $BRANCH origin/$BASE
fi

# Stage all changes
git add -A

# Show what's being committed
echo ""
echo "📁 Files staged:"
git diff --cached --name-status
echo ""

# Commit
git commit -m "$MESSAGE" || echo "Nothing new to commit."

# Push
git push -u origin $BRANCH

# Open PR if branch is new (gh CLI)
if command -v gh &> /dev/null; then
  echo ""
  echo "→ Opening pull request..."
  gh pr create \
    --base $BASE \
    --head $BRANCH \
    --title "$MESSAGE" \
    --body "Automated PR from FirmForge dev pipeline. Review changes and merge to deploy." \
    --draft || echo "PR may already exist — check github.com/Faiez-ali/firmforge/pulls"
else
  echo ""
  echo "ℹ  gh CLI not installed — push complete but PR not created."
  echo "   Open PR manually: https://github.com/Faiez-ali/firmforge/compare/$BRANCH"
fi

echo ""
echo "✅ Done — branch pushed: $BRANCH"
