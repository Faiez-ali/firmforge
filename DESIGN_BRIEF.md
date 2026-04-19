# FirmForge — Design Brief
*Generated 2026-04-19 from a full codebase audit*

---

## 1. Project Overview

**FirmForge** is an AI-powered firmware project architect aimed squarely at embedded systems engineers — solo founders, hardware startups, and freelance firmware developers who waste 2–4 hours scaffolding every new project before writing a single line of application logic.

**Core user flow:**

1. **Describe** — User fills a 4-step intake wizard: project description → MCU + interfaces + components → RTOS + build system → output scope (full app / drivers + stub / drivers only).
2. **Review BOM** — Claude Haiku generates a Bill of Materials from the spec. User sees a table of components with estimated prices and approves (or goes back to edit).
3. **Generate** — 4 AI agents run via SSE stream: Discovery (GitHub library search), Evaluation (scoring), Assembly (Claude Sonnet code generation), Delivery (JSZip → Cloudflare R2 upload). The user watches a terminal-style log with a progress bar.
4. **Download** — User browses a file tree with inline code preview and downloads a structured `.zip` (HAL + drivers + application layer + README + CMakeLists or PlatformIO config).

**Who it's for:** Firmware engineers who know their MCU and peripherals but want to skip the scaffolding grunt work. The product is a **developer tool** — not a consumer app. Precision, readability, and trust in the output matter more than visual flair.

**Current status:** All CRITICAL and HIGH issues are resolved. Agents are blocked pending Anthropic API credits. Phase 3 is output quality review — Faiez reviewing the generated firmware as an embedded engineer. Near-term milestone: first paying Pro subscriber.

---

## 2. Current UI Inventory

### Public pages

| Path | File | What it does |
|------|------|--------------|
| `/` | `app/page.tsx` | Landing page. Fixed nav, animated hero (CircuitBg + IdeaTicker), StepPlayer demo, MCuShowcase, stats banner, pricing section, CTA banner (HwSwAnim), consultation CTA, footer. Entire page is `"use client"`. |
| `/about` | `app/about/page.tsx` | Informational page. Agent pipeline cards, code layer diagram, MCU support grid, FAQ accordion, founder section. Complete and polished. |

### Auth pages

| Path | File | What it does |
|------|------|--------------|
| `/auth/login` | `app/auth/login/page.tsx` + `LoginForm.tsx` | Split-panel layout (branding left, form right). Email + password, Google OAuth, GitHub OAuth. Uses `AuthFormSkeleton` during Suspense hydration. |
| `/auth/signup` | `app/auth/signup/page.tsx` + `SignupForm.tsx` | Same structure as login. |
| `/auth/callback` | `app/auth/callback/route.ts` | OAuth redirect handler. |
| `/auth/signout` | `app/auth/signout/route.ts` | POST handler, signs out and redirects. |

### Dashboard pages

| Path | File | What it does |
|------|------|--------------|
| `/dashboard` | `app/dashboard/page.tsx` | Stats (today's usage, projects count, credits), CTA button, recent projects list (last 5), empty state. Server component. |
| `/dashboard/generate` | `app/dashboard/generate/page.tsx` | Main 4-stage generation flow. Manages all state: spec → BOM → projectId → files. Shows stage indicator, error banners, and daily limit countdown. |
| `/dashboard/projects` | `app/dashboard/projects/page.tsx` | **Stub.** "Coming soon" placeholder only. |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | **Stub.** "Coming soon" placeholder only. |
| Dashboard shell | `app/dashboard/layout.tsx` | Server component. Auth redirect. Renders sidebar + main area. Fetches user profile for plan badge and user display name. |

### Components

| Component | File | What it does |
|-----------|------|--------------|
| `IntakeWizard` | `components/wizard/IntakeWizard.tsx` | 4-step form: describe → hardware → firmware → scope. MCU selector, interface toggles, component input (add/remove), RTOS picker, build system picker, output scope picker. AI hint button calls `/api/agents/hint`. |
| `BOMApproval` | `components/bom/BOMApproval.tsx` | Table of BOM items (name, description, qty, price). Project summary panel. Approve / Go back buttons. |
| `GenerationProgress` | `components/progress/GenerationProgress.tsx` | SSE stream consumer. 4-step status grid (discover/evaluate/assemble/deliver). Progress bar (% complete by steps). Auto-scrolling terminal log (h-64 fixed height, monospace). Elapsed timer. |
| `FilePreview` | `components/file-preview/FilePreview.tsx` | Files/README toggle. File tree (grouped by directory, layer-colored dots). Code viewer (`<pre>` tag — no syntax highlighting). Download button. Layer legend at bottom. |
| `SidebarNav` | `components/dashboard/SidebarNav.tsx` | Client component. 4 nav items with emoji icons and `usePathname` active state. Active item gets gradient left-border indicator. |
| `Skeleton` | `components/ui/Skeleton.tsx` | Base shimmer skeleton block. Used in `AuthFormSkeleton`. |
| `AuthFormSkeleton` | `components/auth/AuthFormSkeleton.tsx` | Matches the shape of LoginForm/SignupForm during Suspense. |
| `IdeaTicker` | `components/hero/IdeaTicker.tsx` | Horizontal infinite marquee of 10 random project idea cards (picked from 30 at hydration time). Cards link to `/dashboard/generate`. Pauses on hover. |
| `StepPlayer` | `components/how-it-works/StepPlayer.tsx` | Interactive 6-step pipeline demo. Tab navigation, play/pause, rAF-based progress bar, auto-advances every 5.2s, auto-starts on scroll into view. Each step has a bespoke animated scene. |
| `McuShowcase` | `components/mcu/McuShowcase.tsx` | MCU family card grid on landing page. |
| `CircuitBg` | `components/hero/CircuitBg.tsx` | SVG circuit board animation behind hero. |
| `HwSwAnim` | `components/cta/HwSwAnim.tsx` | Hardware ↔ MCU ↔ firmware signal flow animation in the CTA banner. |

### API routes

| Route | File | Notes |
|-------|------|-------|
| `POST /api/bom` | `app/api/bom/route.ts` | Auth-guarded. Calls Claude Haiku to generate BOM from spec. |
| `POST /api/agents/intake` | `app/api/agents/intake/route.ts` | Auth-guarded. Checks daily limit (403 if exceeded). Creates Supabase project row. Increments counter. |
| `POST /api/agents/hint` | `app/api/agents/hint/route.ts` | Auth-guarded. Returns Claude Haiku suggestion for current wizard step. |
| `POST /api/stream` | `app/api/stream/route.ts` | SSE. Runs full 4-agent pipeline (discover → evaluate → assemble → deliver). Streams progress events. |

---

## 3. Tech Stack & Design Constraints

### Framework
- **Next.js 14 App Router** — Server and client components mixed. Dashboard layout is a server component. Generate page and all wizards are client components.
- **Tailwind CSS** — Utility-first, no component library (no shadcn, no Radix). All UI is hand-built.
- **Framer Motion** — Used on landing page and auth forms for entrance animations.
- **Deployment:** Vercel. `main` → production, `dev` → preview.

### Fonts
- **Inter** (`--font-sans`) — Set in `app/layout.tsx` but **not wired into Tailwind**. Tailwind config only defines `fontFamily.mono`; there is no `fontFamily.sans` override. The body tag applies `inter.variable` and `jetbrainsMono.variable` CSS variables but the body itself falls through to the browser default sans-serif because `font-[var(--font-sans)]` is never applied. Inter is effectively unused at runtime.
- **JetBrains Mono** (`--font-mono`) — Correctly wired. Used via `.font-mono` class and the `terminal` utility class.

### Color tokens (from `tailwind.config.ts` + `globals.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `brand-500` | `#2b6aff` | Primary CTA buttons, active states, focus rings |
| `brand-400` | `#5291ff` | Hover states |
| `--background` | HSL 0 0% 100% (white) | CSS variable — **ignored**. All pages hardcode `bg-[#060610]`. |
| `--foreground` | HSL 222 47% 11% | CSS variable — also largely ignored |
| `--muted` | HSL 210 40% 96% | Used indirectly via `bg-muted` in some places |
| `--border` | HSL 214 32% 91% | `border-border` applied globally via `* { @apply border-border }` |
| `--step-intake/discover/evaluate/assemble/deliver` | Various | CSS custom props for agent step colors — defined but not referenced by components; GenerationProgress uses hardcoded Tailwind classes instead |

### CSS utilities (from `globals.css`)
- `.bg-grid` — subtle grid overlay for hero
- `.terminal` — green mono text, used in GenerationProgress implicitly
- `.animate-gradient`, `.animate-pulse-slow` — aurora/progress animations
- `@keyframes shimmer` — Skeleton shimmer; but the Skeleton component references `animate-[shimmer_1.6s_infinite]` which is correct Tailwind arbitrary syntax

### Design patterns already established
- Dark UI: near-black background `#060610`, secondary surface `#07080f`
- Glass surfaces: `bg-white/[0.02]` to `bg-white/[0.05]` with `border-white/5` to `border-white/10`
- Gradient CTAs: `from-blue-600 to-cyan-600` (the canonical primary action)
- Gradient brand text: `from-blue-400 to-cyan-400 bg-clip-text text-transparent`
- "FirmForge" logo: "Firm" in white, "Forge" in gradient — consistent across all pages
- Mono labels: `text-[10px] font-mono uppercase tracking-widest text-gray-500/600` for section eyebrows and field labels
- Active sidebar indicator: 3px gradient left-border strip (`from-blue-400 to-cyan-400`)
- Status badges: colored bg-*/10 + text-* pill with monospace text
- Framer Motion variant pattern: `fadeUp` with `custom` stagger index — replicated on landing and about pages

---

## 4. Current UI/UX Problems

These are observations from reading the actual code — not guesses.

### Critical flow gaps

**4.1 No loading state after "Generate BOM →"**
In `generate/page.tsx`, `handleIntakeComplete` fetches `/api/bom` asynchronously. While it's in flight, `stage` stays `"intake"` and `IntakeWizard` remains visible. There is no spinner, no button disabled state, no visual feedback. The user clicks "Generate BOM →" and sees nothing happen for potentially several seconds while Claude Haiku processes the request. This is the worst single UX gap in the product.

**4.2 No loading state on "Approve BOM & start generation"**
`handleBOMApproved` in `generate/page.tsx` calls `/api/agents/intake`. During this round-trip the `BOMApproval` approve button has no disabled or loading state. The user can double-click, triggering two project records. `BOMApproval` (`components/bom/BOMApproval.tsx:101-107`) shows no in-progress state whatsoever.

**4.3 GenerationProgress terminal is visually weak at the most dramatic moment**
`GenerationProgress` (`components/progress/GenerationProgress.tsx:177`) renders a fixed `h-64` terminal box. When the stream first connects, it is completely empty — no "Connecting..." placeholder, no initial message. The 4-step grid above the terminal uses a spinning `⟳` emoji for the running state, which looks unpolished. The progress bar fills linearly by step count (25% per step) rather than smoothly, creating awkward jumps.

**4.4 No syntax highlighting in FilePreview**
`components/file-preview/FilePreview.tsx:151` uses a plain `<pre>` tag. Monaco Editor is installed (`package.json`) but unused — this is tracked as issue M4 in CLAUDE.md. For a product that generates firmware code, the output viewer is the most important screen; showing raw unstyled text makes the output look less credible.

**4.5 README tab shows raw Markdown, not rendered Markdown**
`FilePreview` line 90 wraps the README in `<pre className="whitespace-pre-wrap">` inside a `<div className="prose prose-invert">`. The prose classes are wasted — Tailwind Typography only styles HTML tags, not text inside a `<pre>`. The README shows raw `##` headings, `**bold**`, and backtick-wrapped code to the user.

### Dashboard gaps

**4.6 Projects stat card shows wrong count**
`app/dashboard/page.tsx:56`: `value={String(recentProjects?.length ?? 0)}` — `recentProjects` is capped at `.limit(5)` by the Supabase query. A user with 20 projects sees "5" in the Projects stat card. The actual total requires a `count` query, not a `select + limit`.

**4.7 Projects and Settings pages are stubs**
`app/dashboard/projects/page.tsx` and `app/dashboard/settings/page.tsx` both show only "Coming soon" text. Users who click sidebar nav items reach a dead end. This is known and acceptable for now, but both pages need at minimum a placeholder UI that matches the dashboard shell's design rather than bare text.

**4.8 No mobile layout for the dashboard**
`app/dashboard/layout.tsx:28` sets `w-56` on the sidebar with no responsive variant (`lg:w-56 hidden lg:flex` pattern, or a hamburger). On screens narrower than ~800px, the sidebar and content crush together or the sidebar disappears entirely, making the dashboard unusable on anything but desktop. CLAUDE.md notes this is intentional ("desktop-first") but there is no graceful degradation.

### Inconsistencies and polish issues

**4.9 Font is effectively not applied**
`app/layout.tsx` loads Inter via `next/font/google` and assigns it to `--font-sans`, but `body` only has `antialiased` applied — not `font-[var(--font-sans)]` or `font-sans`. Tailwind's `fontFamily.sans` is not overridden in `tailwind.config.ts`. The body renders in the browser's default sans-serif (usually system-ui or Arial), not Inter. **The brand font is not showing.**

**4.10 CSS variable dark mode is defined but non-functional**
`globals.css` defines a `.dark { ... }` block with dark values for `--background`, `--foreground`, `--muted`, `--border`. However, no page applies the `dark` class or uses a theme switcher. All pages hardcode `bg-[#060610]`. The CSS variable system is partially set up but disconnected from the actual UI.

**4.11 Emoji icons in sidebar — fragile and unprofessional**
`SidebarNav.tsx` uses emoji strings ("⚡", "🏠", "📁", "⚙") as icon props. Emoji rendering varies by OS and browser. On Windows they render differently than macOS. For a developer tool, SVG icons from a consistent set (Lucide, Heroicons) look significantly more professional and are accessible.

**4.12 Component interface always defaults to "spi"**
`IntakeWizard.tsx:74`: `interface: "spi" as Interface` is hardcoded when adding external components. This is issue M1 in CLAUDE.md. Every component the user adds is tagged "spi" regardless of what they type.

**4.13 Inconsistent use of `brand-*` vs `blue-*`**
Some buttons use `bg-brand-500` (wizard navigation buttons, `IntakeWizard`, `BOMApproval`). Others use `bg-gradient-to-r from-blue-600 to-cyan-600` (landing page CTAs, dashboard CTAs, generate page buttons). The two aren't visually identical — `brand-500` is a flat blue, the gradient CTAs are richer. There is no clear rule for when to use which. The primary action button (`BOMApproval` approve, `IntakeWizard` proceed) uses flat `bg-brand-500` while secondary page CTAs use the gradient — which feels backwards.

**4.14 Stage indicator connectors animate in immediately**
`generate/page.tsx:184-186`: The connector line between completed stages fills instantly on render using a CSS transition. There is no progressive fill that tracks as the user moves through stages — the line is simply shown full or empty based on `isDone`. This misses a visual opportunity to feel more alive.

**4.15 BOM table has no edit or remove capability**
`BOMApproval.tsx` shows items read-only. Users cannot remove an irrelevant component, adjust quantity, or add a component they forgot to mention in the wizard. The only options are approve or go back to restart the entire intake form.

**4.16 GenerationProgress has no error recovery UI**
If the SSE stream fails (`err.name !== "AbortError"`), a single text message appears in the terminal log: "Connection lost. Please refresh." There is no retry button, no link back to the dashboard, no way for the user to understand what went wrong or what to do next without manually navigating.

**4.17 FilePreview download is silent**
`FilePreview.tsx:59-65` — the download link is a plain `<a download="firmware.zip">`. No toast, no success state, no visual confirmation that the download started. On some browsers the download happens silently in the background.

**4.18 Forgot password route doesn't exist**
`LoginForm.tsx:144` links to `/auth/forgot-password`. This route does not exist anywhere in the codebase. Clicking it returns a 404.

---

## 5. Improvement Priorities

Ranked by impact on Phase 3 goals (agent output quality review) and the near-term MRR milestone (first Pro subscriber).

### Tier 1 — Fix before showing to any external user

1. **Loading state during BOM generation** (issue 4.1) — Add a "Generating BOM..." loading state in `generate/page.tsx` between intake completion and BOM display. Minimum: disable the button and show a spinner. Better: show an interim screen with an animated progress indicator and copy like "Analyzing your project spec…"

2. **Loading state on BOM approval** (issue 4.2) — Disable the approve button and show a loading indicator in `BOMApproval` while the intake API call is in flight. Pass a `loading` prop from the parent.

3. **Fix Inter font application** (issue 4.9) — In `app/layout.tsx`, change `<body className="... antialiased">` to `<body className="font-[var(--font-sans)] ... antialiased">`. Add `fontFamily: { sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans] }` to `tailwind.config.ts`. The brand font isn't showing.

4. **Replace emoji icons in sidebar** (issue 4.11) — Install Lucide React and replace emoji strings with proper SVG icons. This one change makes the dashboard feel significantly more professional.

### Tier 2 — High UX impact, do before first paying user

5. **Syntax highlighting in FilePreview** (issue 4.4, M4) — Replace the `<pre>` tag with Monaco Editor in read-only mode. Monaco is already installed. This is the output screen — it must be impressive.

6. **Render Markdown in README tab** (issue 4.5) — Install `react-markdown` and replace the `<pre>` with a rendered Markdown view. The README is where FirmForge explains what it generated.

7. **GenerationProgress polish** (issue 4.3) — Add a "Connecting to pipeline..." state when messages is empty. Replace the `⟳` emoji with a proper animated spinner. Make the progress bar smooth (interpolate between steps) rather than jump by 25%.

8. **Error recovery in GenerationProgress** (issue 4.16) — Show a proper error card with a "Try again" button (links back to `/dashboard/generate`) rather than just a terminal log message.

9. **Fix Projects stat card count** (issue 4.6) — Change the Supabase query to fetch total count separately using `count: 'exact'` rather than counting `recentProjects.length`.

### Tier 3 — Quality and completeness, do before v1.0 announcement

10. **Component interface selector in IntakeWizard** (issue 4.12, M1) — Add a dropdown when adding external components so users can select the actual interface.

11. **Real Projects page** (issue 4.7) — Build out `/dashboard/projects` with the full project history: MCU, description, status, date, download link. Reuse the project row pattern from the dashboard.

12. **Settings page** (issue 4.7) — At minimum: profile name field, plan display with upgrade CTA, GitHub integration placeholder.

13. **Forgot password route** (issue 4.18) — Add `/auth/forgot-password` using `supabase.auth.resetPasswordForEmail`. Currently a 404.

14. **Consistent CTA button style** (issue 4.13) — Decide on one: gradient `from-blue-600 to-cyan-600` everywhere, or flat `bg-brand-500` everywhere. The gradient is richer and more distinctive. Make `IntakeWizard` and `BOMApproval` primary buttons match the rest of the product.

15. **BOM item editing** (issue 4.15) — Allow removing items from the BOM before approval. Even just a delete (×) button per row would address the most common need.

---

## 6. Design Direction Request

The following components need design work from Claude Design (or a frontend design pass). The existing visual direction is correct — dark, technical, developer-facing — so the goal is refinement and completion, not redesign.

### 6.1 Consistent component system

Define a minimal component library for internal use (not for export). Required primitives:
- **Button** — variants: `primary` (gradient CTA), `secondary` (glass border), `ghost` (text only), `danger`. All with `loading` and `disabled` states. Replace the three different button patterns currently scattered across the codebase.
- **Input** — consistent focus ring (`focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30`), error state (red border + error message below), label above.
- **Badge/Pill** — status badges (draft/generating/complete/failed), plan badges (free/pro/team), MCU/interface tags.
- **Card** — base surface card with optional top accent gradient line (as seen in `StatCard`).
- **Toast/notification** — replace the raw error divs scattered across pages with a consistent notification pattern.

### 6.2 Improved wizard flow

The intake wizard works but the UX is transactional rather than guiding. Redesign it with:
- A persistent side panel that shows the spec being built as the user fills in each step (similar to how `StepPlayer`'s `IntakeScene` shows the spec panel — bring that live into the actual wizard).
- Progress indicator that feels like momentum, not just step pills.
- The AI hint feature needs a better visual treatment — the `"✦ Ask AI for suggestions"` button is easy to miss and the hint display is generic.
- The component add field (`NAME - description` format) is unclear — most users won't know the expected format. Replace with two separate fields (Name, Description).

### 6.3 BOM approval screen

The BOM is the moment the user commits. Treat it accordingly:
- Make the approve button larger, more emphatic, and green (success color) — not the same flat blue as every other action.
- Add per-item delete/remove buttons so users can clean up the BOM before approving.
- Show what will happen next ("FirmForge will now search for drivers and generate your firmware in approximately 45–90 seconds").
- Add a loading overlay after approval that's more communicative than just switching to GenerationProgress.

### 6.4 Generation progress screen

This is the most important screen in the product — users are waiting for something they paid for (or used one of their 3 free daily generations on). It needs to feel like something impressive is happening:
- Replace the 4-step grid + terminal layout with a more immersive design: large agent cards that light up sequentially with real-time sub-status text (not just "running"/"done" states).
- The terminal log should be larger (400–500px) and more legible — current `h-64` feels cramped.
- Show the active agent's step name prominently, not just in the terminal.
- Smooth progress bar that fills continuously, not in 25% jumps.
- When all agents complete, don't silently flip to `FilePreview` — show a brief success state ("✓ Project generated in 47s — 52 files assembled") before revealing the output.

### 6.5 Firmware output / download screen

The FilePreview screen is where the product proves its value. Right now it looks like a prototype:
- Integrate Monaco Editor in read-only mode with language detection by file extension.
- Render the README as proper Markdown (react-markdown with prose styling).
- Make the download button more prominent and add a success toast when clicked.
- Add a "Start new project" shortcut link so users can immediately generate again.
- The layer legend at the bottom (`●application ●middleware…`) is useful — make it a proper clickable filter that highlights files of that layer in the tree.

### 6.6 Dashboard

The current dashboard is functional but sparse. For a first-time user with no projects it shows an empty state and a CTA — which is fine. For returning users with projects, it needs more:
- Fix the Projects stat card to show the real count.
- Replace emoji icons in the sidebar with Lucide SVG icons.
- The Recent Projects list is good — consider adding a status indicator that shows if an old project failed and can be retried.
- The Free plan upgrade nudge in the sidebar (`Upgrade to Pro →`) is correctly placed — just make the styling slightly warmer (amber rather than blue) to create urgency without being aggressive.

### Brand constraints to maintain

- Background: `#060610` — keep this exact value everywhere, do not introduce lighter grays as backgrounds.
- Brand text gradient: `from-blue-400 to-cyan-400` — the "Forge" wordmark gradient. Do not change.
- Primary CTA gradient: `from-blue-600 to-cyan-600` — all primary action buttons.
- JetBrains Mono for all code, identifiers, labels, status text, and MCU names. Inter for all prose/UI text.
- Section eyebrows: `text-[10px] font-mono uppercase tracking-widest text-blue-400` — the "How it works / Hardware support / Pricing" labels above each section heading. Keep this exact pattern.
- The product is **technical and precise** — no rounded cartoon UI, no playful illustrations beyond what already exists. Vercel/Linear/Linear-adjacent aesthetic is the target.
