#!/bin/bash
# ─────────────────────────────────────────────────────────────────
#  FirmForge — feat/supabase-auth push script
#  Run from the ROOT of your firmforge repo:
#    bash push.sh
# ─────────────────────────────────────────────────────────────────
set -e

BRANCH="feat/supabase-auth"
BASE="main"
MESSAGE="feat: add Supabase auth, dashboard layout, AI hint API

- Email + GitHub OAuth login and signup pages
- Supabase session middleware protecting /dashboard routes
- OAuth callback route and signout route
- Dashboard layout with sidebar nav and user profile
- Dashboard home with usage stats and recent projects list
- /api/agents/hint route for intake wizard AI suggestions
- forge.sh helper script for future branch management"

echo ""
echo "⚡ FirmForge branch push"
echo "   Branch : $BRANCH"
echo ""

# Make sure we're in the repo root
if [ ! -f "package.json" ]; then
  echo "❌ Run this from the root of the firmforge repo (where package.json is)"
  exit 1
fi

# Fetch latest main
git fetch origin

# Create or switch to branch
if git show-ref --verify --quiet refs/heads/$BRANCH; then
  echo "→ Switching to existing branch: $BRANCH"
  git checkout $BRANCH
else
  echo "→ Creating branch from $BASE: $BRANCH"
  git checkout -b $BRANCH origin/$BASE
fi

# Copy files from the extracted zip into correct locations
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

copy_file() {
  local src="$SCRIPT_DIR/$1"
  local dest="$2"
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  echo "  ✓ $dest"
}

echo ""
echo "📁 Copying files..."

copy_file "middleware.ts"                              "middleware.ts"
copy_file "forge.sh"                                   "forge.sh"
copy_file "app/auth/login/page.tsx"                    "app/auth/login/page.tsx"
copy_file "app/auth/signup/page.tsx"                   "app/auth/signup/page.tsx"
copy_file "app/auth/callback/route.ts"                 "app/auth/callback/route.ts"
copy_file "app/auth/signout/route.ts"                  "app/auth/signout/route.ts"
copy_file "app/dashboard/layout.tsx"                   "app/dashboard/layout.tsx"
copy_file "app/dashboard/page.tsx"                     "app/dashboard/page.tsx"
copy_file "app/api/agents/hint/route.ts"               "app/api/agents/hint/route.ts"

# Stage and commit
echo ""
echo "📦 Committing..."
git add -A
git diff --cached --name-status
git commit -m "$MESSAGE"

# Push
git push -u origin $BRANCH

# Open PR
echo ""
if command -v gh &> /dev/null; then
  gh pr create \
    --base $BASE \
    --head $BRANCH \
    --title "feat: Supabase auth + dashboard" \
    --body "## What's in this PR

- **Auth pages**: Email + GitHub OAuth login/signup
- **Middleware**: Session protection for all \`/dashboard\` routes
- **Dashboard layout**: Sidebar with nav, user profile, plan badge
- **Dashboard home**: Usage stats, recent projects, quick-start CTA
- **AI hint API**: \`/api/agents/hint\` — powers intake wizard suggestions
- **forge.sh**: Helper script for future automated branch pushes

## How to test
1. Set \`NEXT_PUBLIC_SUPABASE_URL\` and \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` in \`.env.local\`
2. Enable GitHub OAuth in Supabase dashboard → Authentication → Providers
3. \`npm run dev\` → visit \`/auth/login\`" \
    --draft
  echo ""
  echo "✅ PR opened — review at https://github.com/Faiez-ali/firmforge/pulls"
else
  echo "ℹ  Install gh CLI for auto PR creation: https://cli.github.com"
  echo "   Open PR at: https://github.com/Faiez-ali/firmforge/compare/$BRANCH"
fi

echo ""
echo "✅ Done — feat/supabase-auth pushed"
