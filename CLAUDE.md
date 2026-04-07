# FirmForge — Claude Code Project Context

This file is read automatically by Claude Code at the start of every session.
Do not delete it. Update it when major decisions change.

---

## What this project is

FirmForge is an AI-powered firmware project architect built with Next.js 14.
Users describe their embedded device, approve a Bill of Materials, and receive
a complete layered firmware codebase assembled from open-source libraries.

Live site (when deployed): https://firmforge.dev
GitHub: https://github.com/Faiez-ali/firmforge (private)
Owner: Faiez Ali — embedded firmware engineer, sole founder

---

## Stack

- **Framework:** Next.js 14 App Router + Tailwind CSS
- **AI:** Claude API — `claude-haiku-4-5-20251001` for intake, `claude-sonnet-4-6` for assembly
- **Database:** Supabase (Postgres + Auth + RLS)
- **Storage:** Cloudflare R2 (generated project zips)
- **Payments:** Paddle (merchant of record — not Stripe, Pakistan-compatible)
- **Deployment:** Vercel — `main` → production, `dev` → staging
- **CI/CD:** GitHub Actions (see .github/workflows/)
- **Monitoring:** Sentry + PostHog

---

## Branch strategy

```
main        production — auto-deploys to Vercel on push
dev         staging — auto-deploys to Vercel preview
feat/*      feature branches — PR into main
fix/*       bugfix branches — PR into main
chore/*     config/tooling — PR into main
```

**Always work on a feature branch. Never commit directly to main.**

To create a branch, commit, push, and open a PR:
```bash
bash forge.sh feat/branch-name "feat: what this does" main
```

---

## Project structure

```
firmforge/
├── app/
│   ├── page.tsx                        # Landing page
│   ├── layout.tsx                      # Root layout (Inter + JetBrains Mono)
│   ├── globals.css
│   ├── auth/
│   │   ├── login/page.tsx              # Email + GitHub OAuth login
│   │   ├── signup/page.tsx             # Email signup
│   │   ├── callback/route.ts           # OAuth redirect handler
│   │   └── signout/route.ts            # Signout API route
│   ├── dashboard/
│   │   ├── layout.tsx                  # Sidebar nav, user profile, plan badge
│   │   ├── page.tsx                    # Usage stats, recent projects
│   │   └── generate/page.tsx           # Main generation wizard
│   └── api/
│       ├── agents/
│       │   ├── intake/route.ts         # Creates project record, returns projectId
│       │   └── hint/route.ts           # Claude Haiku hints for intake wizard
│       ├── bom/route.ts                # BOM generation from project spec
│       └── stream/route.ts             # SSE pipeline — runs all agents, streams progress
├── components/
│   ├── wizard/IntakeWizard.tsx         # 4-step hybrid wizard (describe/hardware/firmware/scope)
│   ├── bom/BOMApproval.tsx             # BOM review table with live/estimated prices
│   ├── progress/GenerationProgress.tsx # SSE live agent progress feed
│   └── file-preview/FilePreview.tsx    # In-browser file tree + syntax view + download
├── lib/
│   ├── agents/
│   │   ├── intake.ts                   # Claude Haiku Q&A + BOM generation
│   │   ├── discover.ts                 # Curated library + GitHub API fallback
│   │   ├── evaluate.ts                 # Score by stars, recency, license, MCU match
│   │   ├── assemble.ts                 # Claude Sonnet layered code generation
│   │   └── deliver.ts                  # JSZip packaging + R2 upload
│   ├── github/client.ts                # GitHub API (Octokit) — library search
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   └── server.ts                   # Server + admin clients
│   └── r2/client.ts                    # Cloudflare R2 (S3-compatible)
├── supabase/migrations/
│   └── 001_initial_schema.sql          # Run in Supabase SQL Editor
├── types/index.ts                      # All shared TypeScript types
├── middleware.ts                       # Session protection for /dashboard routes
├── forge.sh                            # Branch + PR helper script
├── .env.local.example                  # All env vars listed with descriptions
└── .github/workflows/
    ├── deploy.yml                      # main → Vercel production
    └── preview.yml                     # dev + PRs → Vercel preview
```

---

## Agent pipeline

The 6-agent pipeline runs when user approves the BOM. All agents run in
`app/api/stream/route.ts` as a single SSE endpoint.

1. **Intake** (`lib/agents/intake.ts`) — Claude Haiku Q&A, outputs project spec JSON
2. **Discovery** (`lib/agents/discover.ts`) — searches curated library then GitHub API
3. **Evaluation** (`lib/agents/evaluate.ts`) — scores candidates 0-100
4. **Assembly** (`lib/agents/assemble.ts`) — Claude Sonnet generates all code layers
5. **Compile validation** — NOT BUILT YET, v1.1 (Docker + ARM GCC on Railway)
6. **Delivery** (`lib/agents/deliver.ts`) — JSZip + R2 upload + README

---

## Code layer architecture (bottom to top)

```
Application layer     main.c, tasks, state machines       Claude-generated
Middleware layer      RTOS, protocol stacks, services     Open-source + Claude
Platform / HAL        BSP, clock, GPIO, peripheral init   Vendor HAL
Driver layer          IC-specific drivers                 Open-source repos, Claude fills gaps
CMSIS / Vendor SDK    Startup, linker scripts             Always vendor-sourced, never generated
```

---

## Key decisions (do not change without discussing)

- One-shot generation for MVP. No iteration within a session. v2 adds this.
- BOM approval is mandatory before generation starts. Decision before execution.
- GPL licenses: warn user and let them decide. Do not auto-exclude.
- Missing drivers: generate with Claude using part name. Do not skip.
- Claude models: Haiku for intake + hints (cheap), Sonnet for assembly (quality).
- Payments: Paddle only. Not Stripe. Pakistan-compatible.
- Infrastructure budget: under $50/month until first revenue.
- Desktop-first UI. Mobile works but is not the priority.
- Free tier: 3 generations per calendar month per user.
- Pro tier: $19/month, unlimited generations, all MCUs, RTOS, GitHub push.

---

## MCU and RTOS scope

**Launch (full support):** STM32, ESP32
**Launch (experimental):** RP2040, nRF52, AVR, SAME5x
**RTOS launch:** bare-metal + FreeRTOS
**RTOS v1.1:** Zephyr
**Build systems launch:** CMake + PlatformIO
**Build systems v1.1:** Arduino IDE

---

## Environment variables

See `.env.local.example` for the full list with descriptions.

Minimum required to run locally:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CLAUDE_API_KEY
GITHUB_API_TOKEN
```

---

## Known issues to fix (as of session 4)

1. `next.config.ts` → must be renamed `next.config.mjs` (Next.js 14 limitation)

## Maintenance backlog (non-blocking, do in a future sprint)

- Upgrade ESLint 8 → 9 + migrate to flat config format (`eslint.config.js`).
  This will eliminate the `eslint@8.57.1` deprecation warning and clean up
  the `@humanwhocodes/config-array`, `@humanwhocodes/object-schema`, `rimraf`,
  `glob`, and `inflight` transitive dep warnings seen in Vercel build logs.
  Not urgent — ESLint 8 still works, this is purely a maintenance item.
2. `app/layout.tsx` → uses `Geist` font (Next.js 15 only) → replace with `Inter` + `JetBrains_Mono`
3. Run `npm audit fix` to address 17 vulnerabilities from npm install

---

## Current deployment status (as of 3 April 2026)

- **Vercel production + preview:** ✅ Clean build, 14 routes, no errors
- **GitHub Actions CI:** ✅ npm ci → type-check → Vercel deploy on every push
- **Auth pages:** ✅ `/auth/login` and `/auth/signup` render correctly
- **Middleware:** ✅ Gracefully bypasses auth when Supabase env vars absent
- **Discover agent (all 5 cases):** ✅ Pass
- **Evaluate agent (all 5 cases):** ✅ Pass
- **Intake / Assemble / Deliver agents:** ❌ Blocked — no Anthropic API credits

## Open PRs (merge when ready)

- `fix/middleware-500` — middleware Supabase env guard (safe to merge)
- `chore/maintenance-backlog` — ESLint backlog note in CLAUDE.md (safe to merge)

## ⚠️ Blocked — waiting on credentials (DO NOT SKIP)

### 1. Anthropic API credits — CRITICAL
- All Claude agents fail with "credit balance too low"
- Top up at: https://console.anthropic.com/settings/billing
- Unblocks all Phase 1 agent testing

### 2. Look for any missing portions in the project
- Claude along withh Codex should review the compplete code.
- Create different simulation scenarios and check for any anomolies.
- Make a complete plan to fix those anomolies so that the instant fixes won't createw bugs in future.

## Next session priorities

When Anthropic credits are topped up, run in this order:
```bash
npx tsx scripts/test-pipeline.ts --agent intake --all
npx tsx scripts/test-pipeline.ts --agent assemble --all
npx tsx scripts/test-pipeline.ts --agent deliver --all
npx tsx scripts/test-pipeline.ts --all
```
Then do Phase 3 acceptance review — Faiez reviews generated firmware output
as an embedded engineer before starting Phase 4 (billing, UI, limits).

---

## How to start a session in Claude Code

1. Open VS Code in the firmforge directory
2. Open terminal (Ctrl + backtick)
3. Run `claude`
4. Say: "Read CLAUDE.md and tell me the current state of the project"
5. Claude Code will read all files, understand the context, and start building

---

## ⚠️ BLOCKED — Waiting on credentials (DO NOT SKIP)

These tasks are blocked on missing credentials and MUST be completed before
Phase 1 testing can proceed. Do not skip or defer them.

### 1. Anthropic API credits — CRITICAL
- **Blocker:** Credit balance = $0. All Claude API calls fail (intake, assemble, deliver agents).
- **Action:** Top up at https://console.anthropic.com/settings/billing
- **Unblocks:** `npx tsx scripts/test-pipeline.ts --agent intake --case 1` (and all 5 cases for all 3 agents)

### 2. Vercel environment variables — CRITICAL
These are NOT set in the Vercel project dashboard. Without them:
- Middleware silently bypasses all auth (500 MIDDLEWARE_INVOCATION_FAILED without the guard)
- Dashboard routes are unprotected
- Auth (login/signup) cannot connect to Supabase

Go to: https://vercel.com/faiez-alis-projects/firmforge/settings/environment-variables

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (service_role key) |
| `CLAUDE_API_KEY` | console.anthropic.com (after topping up) |
| `GITHUB_API_TOKEN` | github.com → Settings → Developer settings → Personal access tokens |

### 3. Phase 1 agent tests — blocked on #1 above
Once Anthropic credits are added, run in order:
```bash
npx tsx scripts/test-pipeline.ts --agent intake --case 1
npx tsx scripts/test-pipeline.ts --agent intake --all
npx tsx scripts/test-pipeline.ts --agent assemble --case 1
npx tsx scripts/test-pipeline.ts --agent assemble --all
npx tsx scripts/test-pipeline.ts --agent deliver --case 1
npx tsx scripts/test-pipeline.ts --all
```

### 4. Open PRs to merge
- `fix/middleware-500` — middleware Supabase env var guard (ready to merge)

---

## Notion project notebook

Full session logs, decisions, roadmap, and brainstorm docs live at:
https://www.notion.so/32d60b81890081afa2e5d58b849d2ea2

Save session notes at the end of each session.
