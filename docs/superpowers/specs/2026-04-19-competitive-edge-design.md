# FirmForge — competitive-edge branch design spec
*2026-04-19 | Branch: feat/competitive-edge*

---

## Scope summary

This branch delivers four work streams in parallel:

| Stream | What it fixes |
|--------|--------------|
| **UI polish** | 9 critical/high issues from DESIGN_BRIEF.md that affect trust on first impression |
| **Schematic viewer** | New feature: interactive wiring diagram + power-up guide after BOM approval |
| **Serial monitor** | New feature: WebSerial terminal for device log viewing from within FirmForge |
| **Landing page** | Competitive repositioning — professional engineers, not makers |

---

## Stream 1 — UI Polish

### 1.1 Inter font wired to body
**File:** `app/layout.tsx`, `tailwind.config.ts`

`app/layout.tsx` loads Inter via `next/font` into `--font-sans` but never applies it. Body renders in browser default sans-serif.

Fix:
- Add `fontFamily: { sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans] }` to `tailwind.config.ts`
- Add `font-sans` class to `<body>` in `app/layout.tsx`

### 1.2 Lucide icons replace emoji in sidebar
**File:** `components/dashboard/SidebarNav.tsx`

Current: emoji strings (`⚡`, `🏠`, `📁`, `⚙`) as icon props — inconsistent across OS/browser.

Fix: Install `lucide-react`. Replace with `<Zap>`, `<LayoutDashboard>`, `<FolderOpen>`, `<Settings>` at size 16. Keep existing active-state gradient left-border.

### 1.3 BOM generation loading state
**File:** `app/dashboard/generate/page.tsx`

After user clicks "Generate BOM →", `stage` stays `"intake"` with no feedback for several seconds.

Fix: Add `stage: "bom-loading"` between intake and bom. Render an interim screen with:
- Animated pulsing LogoMark (scale oscillation via Framer Motion)
- Copy: "Analyzing your project spec…" with a mono sub-label cycling through: "Reading MCU family → Matching interfaces → Selecting components"
- No spinner — the animated LogoMark IS the loading indicator

### 1.4 BOM approval loading state
**File:** `components/bom/BOMApproval.tsx`, `app/dashboard/generate/page.tsx`

"Approve BOM & start generation" button has no disabled/loading state. User can double-click, creating two project records.

Fix:
- Add `loading` prop to `BOMApproval`
- Disable button + show inline spinner while `handleBOMApproved` is in-flight
- Parent passes `bomApproving` state down

### 1.5 Consistent CTA button style
**Files:** `components/wizard/IntakeWizard.tsx`, `components/bom/BOMApproval.tsx`

Primary action buttons in the wizard and BOM screen use flat `bg-brand-500`. All landing page and dashboard CTAs use `from-blue-600 to-cyan-600` gradient. Gradient is the richer choice.

Fix: Replace `bg-brand-500 hover:bg-brand-400` with `bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500` on all primary action buttons. BOM approve button additionally gets green gradient (`from-emerald-600 to-teal-600`) to signal commitment.

### 1.6 Monaco Editor in FilePreview
**File:** `components/file-preview/FilePreview.tsx`

Plain `<pre>` tag for code. Monaco is installed but unused.

Fix: Replace `<pre>` with Monaco Editor in read-only mode. Language detection by file extension (`.c` → `c`, `.h` → `c`, `.cpp` → `cpp`, `.cmake` → `cmake`, `.toml` → `toml`, `.md` → `markdown`). Theme: `vs-dark`. Disable minimap. Load Monaco dynamically (next/dynamic, no SSR) to avoid hydration issues.

### 1.7 react-markdown in README tab
**File:** `components/file-preview/FilePreview.tsx`

README content wrapped in `<pre>` — raw Markdown text shows to user.

Fix: Install `react-markdown` + `remark-gfm`. Render README through `<ReactMarkdown>` inside the existing `prose prose-invert` wrapper. Code blocks inside the README get syntax highlighting via `react-syntax-highlighter`.

### 1.8 GenerationProgress polish
**File:** `components/progress/GenerationProgress.tsx`

Issues: empty terminal on connect with no state, `⟳` emoji spinner, 25% progress jumps, no success screen.

Fix:
- Show "Connecting to pipeline…" message with animated dots when `messages` is empty
- Replace `⟳` with a proper `<svg>` spinner (animate-spin)
- Smooth progress bar: interpolate between step thresholds using a `useEffect` + `requestAnimationFrame` accumulator rather than jumping at exactly 25/50/75/100
- After all agents complete, show a 2-second success screen: "✓ Project generated in {elapsed}s — {fileCount} files assembled" before transitioning to FilePreview

### 1.9 Error recovery UI in GenerationProgress
**File:** `components/progress/GenerationProgress.tsx`

On stream failure, only a terminal log message appears.

Fix: Replace with a proper error card:
- Red border card with title "Generation failed"
- Error message from the stream
- "Try again" button → links back to `/dashboard/generate`
- "Contact support" link

### 1.10 Fix Projects stat card count
**File:** `app/dashboard/page.tsx`

`recentProjects.length` is capped at 5 by the query limit. Shows wrong count.

Fix: Add a separate `count` query: `.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user.id)` and display `count` in the stat card.

### 1.11 Forgot password route
**Files:** `app/auth/forgot-password/page.tsx` (new)

`/auth/forgot-password` is linked from LoginForm but returns 404.

Fix: Create the page with a simple form — email input → `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + "/auth/callback" })` → success state showing "Check your inbox".

---

## Stream 2 — Hardware Schematic Viewer

### 2.1 Overview

After the user approves the BOM and before GenerationProgress begins, show a new stage: the hardware schematic. This gives the user something valuable to read while waiting and directly competes with Schematik's wiring diagram feature.

### 2.2 Generation

**When:** Bundled into the existing BOM generation call (`/api/bom`). Same Claude Haiku call, second structured output section.

**Prompt addition:** After generating the BOM, Claude also outputs a `schematic` field: an array of connection objects.

**Schema:**
```typescript
interface Connection {
  from: string;        // e.g. "MCU.PA5"
  to: string;          // e.g. "BME280.SCK"
  net: string;         // e.g. "SPI1_CLK"
  type: "power" | "digital" | "analog" | "i2c" | "spi" | "uart" | "ground";
  label?: string;      // optional human-readable label
}

interface PowerRail {
  name: string;        // "3V3" | "5V" | "GND" | "VBAT"
  voltage: number;     // 3.3 | 5.0 | 0
  consumers: string[]; // component names connected to this rail
}

interface Schematic {
  connections: Connection[];
  powerRails: PowerRail[];
  powerUpSteps: string[];  // ordered list: "1. Connect USB-C to MCU", "2. ..."
}
```

**Token cost:** ~400–800 output tokens added to the existing BOM call (Haiku rates, negligible cost).

### 2.3 Schematic Viewer component

**File:** `components/schematic/SchematicViewer.tsx` (new)

**Layout:** Two-column (desktop): left = interactive SVG diagram, right = power-up guide steps.

**SVG rendering:**
- Components rendered as labeled rectangles using a deterministic grid layout: MCU pinned center-left, peripherals arranged in columns to the right grouped by interface type (SPI group, I2C group, UART group, power-only). No physics simulation — positions are computed once from the connection list.
- Connections rendered as colored SVG `<path>` elements, color-coded by `type`:
  - `power` → amber (#f59e0b)
  - `ground` → gray (#6b7280)
  - `digital` → blue (#5291ff)
  - `spi` → cyan (#06b6d4)
  - `i2c` → violet (#8b5cf6)
  - `uart` → green (#10b981)
  - `analog` → orange (#f97316)
- Hover on a connection: tooltip shows `net` name + `type`
- Hover on a component: highlight all its connections
- Power rails shown as horizontal bus bars at top (VCC) and bottom (GND) of diagram

**Power-up guide (right panel):**
- Numbered step list from `powerUpSteps`
- Each step has a status indicator (unchecked circle → user clicks to check off)
- Intro copy: "Follow these steps to safely power your device for the first time"
- Warning banner if 5V components are mixed with 3.3V MCU: "⚠ Level shifting required — do not connect directly"

**Stage flow change in generate/page.tsx:**
```
intake → [bom-loading] → bom → [schematic] → generating → complete
```

The schematic stage has a "Start generation →" CTA that the user clicks to proceed.

---

## Stream 3 — Serial Monitor + Flash placeholder

### 3.1 Overview

A WebSerial-based terminal available in the dashboard. Lets users view device logs from any MCU connected via USB-UART. The flash upload button exists in FilePreview but shows a "compile coming soon" state.

**Browser compatibility:** WebSerial is Chromium-only (Chrome, Edge, Arc). Non-Chromium browsers see a clear message: "Serial Monitor requires Chrome or Edge — Firefox does not support WebSerial yet."

### 3.2 SerialMonitor component

**File:** `components/serial/SerialMonitor.tsx` (new)
**Dashboard route:** `/dashboard/serial` (new sidebar nav item)

**UI layout:**
- Top bar: "Connect device" button (port picker), baud rate selector (9600 / 115200 / 921600), "Clear" button, connection status badge
- Main area: scrolling terminal log (monospace, dark, auto-scroll pinned to bottom unless user scrolls up)
- Bottom: send field + "Send" button (for sending commands to device)

**Connection flow:**
1. User clicks "Connect device" → `navigator.serial.requestPort()` → browser native port picker appears
2. On selection: open port at chosen baud rate, read `ReadableStream` in a loop
3. Incoming bytes decoded as UTF-8, appended to log with timestamp prefix: `[00:01:23.456] Hello from device\n`
4. Connection status badge: gray (disconnected) → amber (connecting) → green (connected) → red (error)
5. "Disconnect" replaces "Connect" while connected

**Send field:** Input + button sends string + `\n` via `WritableStream`. Useful for AT commands, REPL interactions.

**Persistent log:** Log is kept in React state (max 2000 lines, oldest pruned). User can copy all or clear.

### 3.3 Flash placeholder in FilePreview

**File:** `components/file-preview/FilePreview.tsx`

Add a "Flash to device" button next to the existing download button.

On click: show a modal/popover:
```
⚡ Direct flash — coming soon

Cloud compilation for STM32 and ESP32 is in development.
For now, download the zip and use your local toolchain.

[Download zip ↓]   [Learn more →]
```

ESP32 note at bottom: "ESP32 WebSerial flash (no compile needed) — Q2 2026"

### 3.4 Sidebar nav addition

Add "Serial" as a new nav item in `SidebarNav.tsx` with a `<Terminal>` Lucide icon, linking to `/dashboard/serial`.

---

## Stream 4 — Landing page competitive repositioning

### 4.1 Hero subheading update

Current: generic "Describe what your embedded device does…"

New: Explicitly calls out what professional engineers care about — RTOS, CMake, HAL architecture, real libraries.

```
Describe your embedded device. FirmForge runs 6 AI agents to discover
real open-source drivers, assemble a layered HAL + driver + application
codebase, and deliver a zip you can open in your IDE and compile.
No stubs. No placeholders. Production-quality output.
```

### 4.2 Feature bullets refresh

Current bullets are generic. New bullets target the professional engineer comparing FirmForge to Schematik:

| Old | New |
|-----|-----|
| "6 AI agents run in sequence" | "6 agents: discover → evaluate → assemble → deliver" |
| "Real drivers, not stubs" | "Real open-source drivers matched to your exact MCU" |
| "Zip download in under 60 seconds" | "CMake + PlatformIO build system, ready to compile" |
| "3 free generations per day" | "FreeRTOS / bare-metal — your choice" |

### 4.3 "Not a hobby tool" section

New section between the StepPlayer and MCU Showcase. Two-column comparison card:

**Left — FirmForge:**
- STM32, ESP32, nRF52, RP2040, SAME5x, AVR
- FreeRTOS + bare-metal
- CMake + PlatformIO
- HAL → Drivers → Application layered architecture
- Compile-validated output (coming soon)

**Right — "Maker tools"** (no brand names, generic):
- Arduino, Raspberry Pi
- No RTOS
- No real build system
- Monolithic sketch files
- No compile check

Headline: "Built for engineers shipping products. Not weekend projects."
Sub-copy: "If you need `arm-none-eabi-gcc`, CMake, and a proper HAL — you're in the right place."

### 4.4 Pricing table update

Add "COM port flash (coming soon)" and "Serial monitor" as feature line items to all three plan tiers.

---

## What this branch does NOT include

- Full Projects page build-out (future branch)
- Settings page (future branch)
- Component interface selector in IntakeWizard (future branch)
- BOM item editing (future branch)
- Cloud compilation / actual device flashing (future branch — required for flash to work)
- Mobile dashboard layout (future branch)

---

## File change summary

| File | Change type |
|------|-------------|
| `app/layout.tsx` | Edit — apply font-sans to body |
| `tailwind.config.ts` | Edit — add fontFamily.sans override |
| `components/dashboard/SidebarNav.tsx` | Edit — Lucide icons, add Serial nav item |
| `app/dashboard/generate/page.tsx` | Edit — bom-loading stage, schematic stage, bomApproving state |
| `app/dashboard/page.tsx` | Edit — fix project count query |
| `app/api/bom/route.ts` | Edit — add schematic netlist to Haiku prompt + response |
| `components/bom/BOMApproval.tsx` | Edit — loading prop, green approve button |
| `components/schematic/SchematicViewer.tsx` | **New** — interactive SVG schematic |
| `components/progress/GenerationProgress.tsx` | Edit — spinner, smooth bar, success screen, error card |
| `components/file-preview/FilePreview.tsx` | Edit — Monaco, react-markdown, flash placeholder button |
| `components/serial/SerialMonitor.tsx` | **New** — WebSerial terminal |
| `app/dashboard/serial/page.tsx` | **New** — Serial monitor page |
| `app/auth/forgot-password/page.tsx` | **New** — password reset form |
| `app/page.tsx` | Edit — hero copy, new comparison section, pricing table |
| `wizard/IntakeWizard.tsx` | Edit — gradient CTA buttons |

---

## Dependencies to install

Already installed (no action needed):
- `lucide-react` ^0.511.0
- `@monaco-editor/react` ^4.7.0

Need to install:
```bash
npm install react-markdown remark-gfm react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter
```

---

*Spec status: draft — awaiting user review before implementation begins.*
