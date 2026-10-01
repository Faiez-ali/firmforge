# ⚡ FirmForge

> AI-powered firmware project architect. Describe your embedded project — get a complete, layered, production-ready firmware codebase in minutes.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)

---
> [!NOTE]
> Actively looking for contributors !!!!


## What it does

FirmForge runs a 6-agent AI pipeline that:

1. **Intake** — Interviews you via a hybrid wizard + AI chat until it has a complete project spec
2. **Discovery** — Searches GitHub, PlatformIO, Arduino, ESP-IDF, and Zephyr for the best available drivers
3. **Evaluation** — Scores each library candidate by stars, recency, license, and MCU compatibility
4. **Assembly** — Structures the full codebase (drivers → HAL → middleware → app), Claude fills gaps
5. **Validation** — Compile-checks the project in Docker (v1.1)
6. **Delivery** — In-browser file preview, README with attribution, zip download, optional GitHub push

## Stack

- **Frontend/Backend:** Next.js 14 (App Router) + Tailwind CSS
- **AI:** Claude API (Haiku for intake, Sonnet for assembly)
- **Database:** Supabase (Postgres)
- **Storage:** Cloudflare R2
- **Payments:** Paddle
- **Deployment:** Vercel
- **Monitoring:** Sentry + PostHog

## Getting started (development)

```bash
# Clone the repo
git clone https://github.com/Faiez-ali/firmforge.git
cd firmforge

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your API keys (see .env.local.example for all required variables)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.local.example` for the full list. Minimum required for development:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
CLAUDE_API_KEY=
GITHUB_API_TOKEN=
```

## Database setup

Run the migration in Supabase SQL editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
# Paste and run in your Supabase project → SQL Editor
```

## Project structure

```
firmforge/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/generate/         # Main generation wizard
│   └── api/
│       ├── agents/                 # Agent API routes
│       ├── bom/                    # BOM generation
│       └── stream/                 # SSE pipeline stream
├── components/
│   ├── wizard/                     # Intake wizard
│   ├── bom/                        # BOM approval
│   ├── progress/                   # Live generation progress
│   └── file-preview/               # In-browser file tree
├── lib/
│   ├── agents/                     # All agent logic (intake, discover, evaluate, assemble, deliver)
│   ├── github/                     # GitHub API client
│   ├── supabase/                   # DB clients
│   └── r2/                         # Cloudflare R2 client
├── supabase/migrations/            # DB schema
└── types/                          # Shared TypeScript types
```

## Deployment

Pushes to `main` auto-deploy to production via GitHub Actions → Vercel.
Pushes to `dev` auto-deploy to a preview URL.

## Roadmap

- [x] v0.1 — Project scaffold, intake wizard, agent pipeline, file preview
- [ ] v0.2 — Supabase auth, user dashboard, generation history
- [ ] v0.3 — Paddle billing, free/pro/team tiers
- [ ] v1.0 — Production launch on firmforge.dev
- [ ] v1.1 — Compile validation (Docker + GCC toolchains)
- [ ] v1.1 — Zephyr RTOS support
- [ ] v2.0 — AI Datasheet Parser

---

Built by [Faiez Ali](https://github.com/Faiez-ali) · Powered by [Claude](https://anthropic.com)
