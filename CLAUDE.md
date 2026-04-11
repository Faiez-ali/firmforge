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
- Free tier: 3 generations per day per user (resets at 00:00 UTC via Supabase cron calling `reset_daily_generations()`).
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

## Code review findings (session 5 — 11 April 2026)

Full static review of all source files. Issues ordered by severity.

### CRITICAL — ✅ All fixed (session 5)

**C1. ✅ Unprotected API routes** — auth guard added to `app/api/bom/route.ts` and `app/api/agents/hint/route.ts`.

**C2. ✅ No error handling in generate page** — try/catch added to both `handleIntakeComplete` and `handleBOMApproved`; error banner rendered in UI.

**C3. ✅ Assembly agent silent empty return** — `callAssemblyAgent` now throws on malformed JSON or empty file array instead of returning `[]`.

**C4. ✅ SSE reconnection loop** — `handleGenerationComplete` wrapped in `useCallback` in `generate/page.tsx`.

### HIGH — ✅ All fixed (session 5)

**H1. ✅ Missing dashboard pages** — stub pages created at `app/dashboard/projects/page.tsx` and `app/dashboard/settings/page.tsx`.

**H2. ✅ No generation limit enforcement** — `app/api/agents/intake/route.ts` now checks `generations_today >= 3` for free-tier users before creating project; returns 403 with upgrade message. Counter incremented on success.

**H3. ✅ R2 client confusing crash** — explicit env var check at module load in `lib/r2/client.ts`; throws a clear error naming the missing variables.

### MEDIUM — fix before v1.0 release

**M1. All user-added components hardcode `interface: "spi"`**
- `components/wizard/IntakeWizard.tsx:75` — `addComponent()` always sets `interface: "spi"`.
- Fix: add an interface selector dropdown in the component-add UI.

**M2. ✅ `enrichWithLivePrices` fake timestamp** — removed the false `pricesFetchedAt` set; function returns raw BOM until real API calls are implemented.

**M3. ✅ Generate page double-header layout** — removed custom `min-h-screen` wrapper and top bar from `generate/page.tsx`; relies on dashboard layout for chrome.

**M4. No syntax highlighting in FilePreview**
- `components/file-preview/FilePreview.tsx` — code viewer is a plain `<pre>` tag; Monaco editor installed but unused.
- Fix: replace `<pre>` with Monaco in read-only mode.

**M5. `runIntakeTurn` is dead code**
- `lib/agents/intake.ts:32-70` — conversational intake function, never called. Form wizard handles intake.
- No action needed for MVP; remove or wire up when adding conversational mode in v2.

### LOW — cleanup

**L1. ✅ Unused import in evaluate.ts** — `fetchRepoReadme` import removed.

**L2. Duplicate Octokit dependency**
- `package.json` has both `octokit` (v4) and `@octokit/rest` (v22). Only `@octokit/rest` is used.
- Fix: `npm uninstall octokit` when next touching package.json.

**L3. ✅ `next.config.ts` rename** — already resolved, item closed.

---

## Pipeline wiring — actual vs. documented

The 6-step pipeline in CLAUDE.md doesn't map exactly to what's built:

| Step | Documented | Actual |
|---|---|---|
| 1. Intake | Claude Haiku Q&A | Form wizard only — `runIntakeTurn` is dead code |
| 2. BOM | Claude Haiku | ✅ Correct — `generateBOM()` in `/api/bom` |
| 3. DB record | Implicit | ✅ `/api/agents/intake` creates Supabase row post-BOM-approval |
| 4. Discovery | ✅ | ✅ `discoverLibraries()` — curated then GitHub API |
| 5. Evaluation | ✅ | ✅ `evaluateCandidates()` — scoring by stars/recency/license |
| 6. Assembly | ✅ | ✅ HAL → Drivers → App layers via Claude Sonnet |
| 7. Compile validation | v1.1 | ✅ Correctly absent |
| 8. Delivery | ✅ | ✅ JSZip → R2 upload → presigned URL |

Missing between step 3 and 4: generation limit enforcement check.

---

## Maintenance backlog (non-blocking, do in a future sprint)

- Upgrade ESLint 8 → 9 + migrate to flat config format (`eslint.config.js`).
  This will eliminate the `eslint@8.57.1` deprecation warning and clean up
  the `@humanwhocodes/config-array`, `@humanwhocodes/object-schema`, `rimraf`,
  `glob`, and `inflight` transitive dep warnings seen in Vercel build logs.
  Not urgent — ESLint 8 still works, this is purely a maintenance item.
- `app/layout.tsx` → uses `Geist` font (Next.js 15 only) → replace with `Inter` + `JetBrains_Mono`
- Run `npm audit fix` to address 17 vulnerabilities from npm install

---

## Current deployment status (as of 3 April 2026)

- **Vercel production + preview:** ✅ Clean build, 14 routes, no errors
- **GitHub Actions CI:** ✅ npm ci → type-check → Vercel deploy on every push
- **Auth pages:** ✅ `/auth/login` and `/auth/signup` render correctly
- **Middleware:** ✅ Gracefully bypasses auth when Supabase env vars absent
- **Discover agent (all 5 cases):** ✅ Pass
- **Evaluate agent (all 5 cases):** ✅ Pass
- **Intake / Assemble / Deliver agents:** ❌ Blocked — no Anthropic API credits

## ⚠️ Blocked — waiting on credentials (DO NOT SKIP)

### 1. Anthropic API credits — CRITICAL
- All Claude agents fail with "credit balance too low"
- Top up at: https://console.anthropic.com/settings/billing
- Unblocks all Phase 1 agent testing

## Next session priorities

All CRITICAL and HIGH issues are fixed. Remaining before v1.0: M1 (component interface selector) and M4 (Monaco syntax highlighting).

Once Anthropic credits are topped up, run agents in this order:
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

## ⚠️ Vercel environment variables — CRITICAL

These are NOT set in the Vercel project dashboard. Without them:
- Middleware silently bypasses all auth
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

---

## Post-launch TODO (do after full functionality is verified)

### Google AdSense integration — free tier only
- Show Google AdSense ads to free-tier users only. Pro and Team accounts see no ads.
- Ads must be restricted to relevant categories only: **electronics, embedded systems, automation, AI/ML, and technology**.
- Explicitly block irrelevant or inappropriate categories in AdSense settings: no adult/pornographic, no grocery/food, no generic marketing/retail, no unrelated consumer products.
- Implementation approach: wrap ad slots in a check against the user's plan — only render if `plan === "free"`.
- Ad placement TBD (sidebar, below file preview, etc.) — decide after reviewing UX impact.
- Do NOT implement this until FirmForge core functionality is fully tested and verified end-to-end (all agents, billing, download flow).

---

## Notion project notebook

Full session logs, decisions, roadmap, and brainstorm docs live at:
https://www.notion.so/32d60b81890081afa2e5d58b849d2ea2

Save session notes at the end of each session.
