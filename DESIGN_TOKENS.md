# FirmForge — Fonts, Logos, Assets & Color Themes
*Generated 2026-04-19 from a full code audit — every value below is sourced directly from the codebase*

---

## 1. Fonts

### 1.1 Loaded fonts

Both fonts are loaded via `next/font/google` in `app/layout.tsx`. They are subset to Latin.

| Variable | Font family | Weight | Use |
|----------|-------------|--------|-----|
| `--font-sans` | **Inter** | Default (variable) | UI text, body copy, headings |
| `--font-mono` | **JetBrains Mono** | Default (variable) | Code, identifiers, labels, badges, MCU names |

```tsx
// app/layout.tsx
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });
```

### 1.2 Font application in Tailwind

`tailwind.config.ts` only defines the mono override:

```ts
fontFamily: {
  mono: ["var(--font-mono)", "ui-monospace", "monospace"],
}
```

`font-sans` is **not** overridden in Tailwind — this is a current bug. The body applies `antialiased` but not `font-[var(--font-sans)]`, so Inter is loaded but not applied. Fix: add `sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans]` to `tailwind.config.ts` and apply `font-sans` to `<body>`.

### 1.3 Font usage rules

**JetBrains Mono** (`font-mono`) is used for:
- All section eyebrow labels: `text-[10px] font-mono uppercase tracking-widest`
- MCU names, chip identifiers, part numbers
- Status badges and plan badges
- Terminal log output in `GenerationProgress`
- File paths in `FilePreview`
- Interface names (SPI, I2C, UART etc.) in `IntakeWizard`
- Code inside the `StepPlayer` AssembleScene simulation
- SVG text inside `HwSwAnim` and `ChipSVG` (uses `fontFamily="monospace"` directly in SVG attributes)
- The `"beta"` badge on the logo
- All agent step labels ("DISCOVER", "AI HINT", "PROJECT SUMMARY" etc.)

**Inter** is intended for:
- Page headings (`text-4xl font-bold` etc.)
- Body paragraphs and descriptions
- Navigation links
- Pricing plan copy
- All prose/natural-language content

### 1.4 Font sizes in use

| Class | Size | Context |
|-------|------|---------|
| `text-8xl` | 96px | Hero `h1` on landing |
| `text-6xl` | 60px | Hero `h1` mobile / about hero |
| `text-5xl` | 48px | Section headings |
| `text-4xl` | 36px | Sub-section headings, MCU name in showcase |
| `text-3xl` | 30px | About section headings |
| `text-2xl` | 24px | Dashboard `h1`, wizard step titles |
| `text-xl` | 20px | Hero paragraph, plan card prices |
| `text-lg` | 18px | CTA buttons, navigation |
| `text-base` | 16px | Body default |
| `text-sm` | 14px | Most UI labels, table rows, card text |
| `text-xs` | 12px | Secondary labels, meta info |
| `text-[11px]` | 11px | Ticker card subtitles, sub-labels |
| `text-[10px]` | 10px | Eyebrow labels, badge text, stat sub-labels |
| `text-[9px]` | 9px | Chip vendor text in MCU showcase SVG |

---

## 2. Logo

### 2.1 Wordmark construction

FirmForge has no image file logo. The wordmark is built entirely in JSX using the CSS gradient technique. It is consistent across every page.

**Pattern:**
```tsx
<span className="font-bold tracking-tight">
  Firm
  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
    Forge
  </span>
</span>
```

- "Firm" — white (`text-white`), font-bold
- "Forge" — gradient text from `#60a5fa` (blue-400) to `#22d3ee` (cyan-400), rendered via `bg-clip-text text-transparent`
- No icon, no symbol, no separate logo mark — the wordmark is the entire logo identity

### 2.2 Logo sizes by context

| Location | Font size | Extra elements |
|----------|-----------|----------------|
| Landing nav (`app/page.tsx:88`) | `text-lg` | `"beta"` pill badge |
| Dashboard sidebar (`app/dashboard/layout.tsx:31`) | `text-base` | `"beta"` pill badge |
| Auth login branding panel (`app/auth/login/page.tsx:45`) | `text-2xl` | `"beta"` pill badge |
| About nav (`app/about/page.tsx:130`) | `text-lg` | `"beta"` pill badge |
| Footer (`app/page.tsx:443`) | `text-sm` | Copyright year |
| LoginForm mobile header (`LoginForm.tsx:89`) | `text-xl` | None |

### 2.3 "beta" badge

Appears alongside the logo in nav and sidebar. Styled consistently everywhere:

```tsx
<span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
  beta
</span>
```

- Background: `bg-blue-500/10` — 10% opacity blue
- Text: `text-blue-400` — `#60a5fa`
- Border: `border-blue-500/20` — 20% opacity blue
- Font: `font-mono`, `text-xs`

### 2.4 No static image assets

There is no `public/` directory. FirmForge has **zero raster images** (no `.png`, `.jpg`, `.webp`, `.svg` files on disk). Every visual element is:
- JSX/HTML (wordmark, badges, cards)
- Inline SVG rendered in React (chip illustrations in `McuShowcase`, signal flow in `HwSwAnim`)
- Canvas 2D API (animated circuit board in `CircuitBg`)
- CSS gradients and Tailwind utilities (aurora blobs, progress bars, backgrounds)

---

## 3. Color System

### 3.1 Brand colors (from `tailwind.config.ts`)

The full brand palette is defined but only `brand-500` and `brand-400` are in active use:

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-50` | `#eef5ff` | Not currently used |
| `brand-100` | `#d9e8ff` | Not currently used |
| `brand-200` | `#bbd4ff` | Not currently used |
| `brand-300` | `#8ab8ff` | Active state text in wizard and file-preview |
| `brand-400` | `#5291ff` | Hover state on primary buttons |
| `brand-500` | `#2b6aff` | **Primary.** Wizard nav buttons, intake/bom primary actions, active focus rings |
| `brand-600` | `#1247f5` | Not directly used |
| `brand-700` | `#0e35e1` | Not directly used |
| `brand-800` | `#112eb6` | Not directly used |
| `brand-900` | `#142b8f` | Not directly used |
| `brand-950` | `#111c57` | Not directly used |

### 3.2 CSS custom properties (from `globals.css`)

```css
:root {
  --background:         0 0% 100%;       /* white — declared but ignored, all pages use #060610 */
  --foreground:         222 47% 11%;     /* near-black */
  --muted:              210 40% 96%;     /* light gray */
  --muted-foreground:   215 16% 47%;     /* mid gray */
  --border:             214 32% 91%;     /* light border */
  --ring:               222 84% 60%;     /* focus ring blue */
  --radius:             0.5rem;

  --brand:              222 84% 56%;     /* matches brand-500 */
  --brand-foreground:   0 0% 100%;       /* white on brand */

  /* Agent step accent colors */
  --step-intake:        222 84% 56%;     /* blue */
  --step-discover:      262 52% 55%;     /* purple */
  --step-evaluate:      197 71% 52%;     /* cyan */
  --step-assemble:      142 72% 45%;     /* green */
  --step-deliver:        32 95% 55%;     /* amber */
}
```

The dark mode block is defined but not used:
```css
.dark {
  --background:   222 47% 6%;    /* near-black */
  --foreground:   210 40% 98%;   /* near-white */
  --muted:        217 33% 18%;
  --muted-foreground: 215 20% 65%;
  --border:       217 33% 18%;
}
```

### 3.3 Background colors

| Value | Where used |
|-------|-----------|
| `#060610` | **Primary background.** Landing (`app/page.tsx:71`), Auth pages, Dashboard layout (`app/dashboard/layout.tsx:26`), About page. This is the canonical app background. |
| `#07080f` | Dashboard sidebar (`app/dashboard/layout.tsx:28`). Slightly lighter than the main background — creates the sidebar depth. |
| `#0b0b18` | `StepPlayer` container background. |
| `#07070f` | AssembleScene code panel in `StepPlayer`. |
| `bg-gray-900` / `bg-gray-950` | Terminal log in `GenerationProgress` and code viewer in `FilePreview`. |
| `bg-white/[0.02]` | Default card/surface background. Used throughout dashboard and wizard. |
| `bg-white/[0.025]` | Stat cards in dashboard. |
| `bg-white/[0.03]` | Auth form card. |
| `bg-white/5` | Input field backgrounds, secondary surfaces. |

### 3.4 Gradient palette

**Primary CTA gradient** — used on all main call-to-action buttons:
```
from-blue-600 to-cyan-600   (#2563eb → #0891b2)
hover: from-blue-500 to-cyan-500
```

**Brand text gradient** — the logo "Forge" wordmark and hero headline:
```
from-blue-400 to-cyan-400   (#60a5fa → #22d3ee)
```

**Hero headline gradient** — broader sweep:
```
from-blue-400 via-cyan-400 to-teal-400
```

**Stat card top accent lines** (from `dashboard/page.tsx`):
```
blue:   from-blue-500 to-cyan-400
violet: from-violet-500 to-purple-400
green:  from-emerald-500 to-teal-400
```

**Aurora background blobs** (landing + auth pages):
```
bg-blue-600/10    blur-[100px–130px]   — primary hero glow
bg-violet-600/8   blur-[110px–120px]   — secondary accent
bg-cyan-600/5     blur-[90px]          — tertiary
```

**Pro plan card gradient:**
```
from-blue-500/10 to-transparent    (pricing card background)
from-blue-600 to-cyan-600          (top "Most popular" badge)
```

### 3.5 Text colors

| Class | Hex approx. | Context |
|-------|-------------|---------|
| `text-white` | `#ffffff` | Primary headings, active labels |
| `text-gray-200` | `#e5e7eb` | Sidebar username, card titles |
| `text-gray-300` | `#d1d5db` | Body text, description copy |
| `text-gray-400` | `#9ca3af` | Secondary body, wizard descriptions |
| `text-gray-500` | `#6b7280` | Tertiary text, field labels, sub-labels |
| `text-gray-600` | `#4b5563` | Disabled/inactive states, eyebrow muted |
| `text-gray-700` | `#374151` | Inactive step connectors |
| `text-blue-400` | `#60a5fa` | Eyebrow labels, active sidebar items, links |
| `text-blue-300` | `#93c5fd` | Sidebar active item text, brand-300 text |
| `text-cyan-400` | `#22d3ee` | Paired with blue-400 in gradients |
| `text-green-400` | `#4ade80` | Success states, terminal success messages |
| `text-emerald-400` | `#34d399` | Completed step indicators |
| `text-amber-300` | `#fcd34d` | Daily limit countdown numbers |
| `text-red-400` | `#f87171` | Error messages, failed status |
| `text-yellow-400` | `#facc15` | Star count in discovery scene |
| `text-violet-400` | `#a78bfa` | Middleware layer color |
| `text-teal-400` | `#2dd4bf` | Driver layer color |
| `text-pink-400` | `#f472b6` | Application layer color in FilePreview |

### 3.6 Border colors

| Class | Context |
|-------|---------|
| `border-white/5` | Default card border — barely visible, just enough for structure |
| `border-white/8` | IdeaTicker cards, StepPlayer container |
| `border-white/10` | Input fields, auth card, form elements |
| `border-blue-500/20` | Beta badge, focus ring hint, subtle brand borders |
| `border-blue-500/50` | Active MCU selector, BOM table header |
| `border-green-500/30` | Success/complete states |
| `border-red-500/20` | Error state borders |
| `border-amber-500/25` | Daily limit banner |
| `border-dashed border-blue-500/20` | Empty state dashed border |

### 3.7 MCU accent colors (from `McuShowcase.tsx`)

Each supported MCU has its own accent color used for chip illustrations, glow effects, and active tab states:

| MCU | Accent hex | Glow rgba | Tailwind border |
|-----|-----------|-----------|-----------------|
| STM32 | `#2b6aff` | `rgba(43,106,255,0.35)` | `border-blue-500/40` |
| ESP32 | `#e8423c` | `rgba(232,66,60,0.35)` | `border-red-500/40` |
| RP2040 | `#c026d3` | `rgba(192,38,211,0.35)` | `border-purple-500/40` |
| nRF52 | `#0ea5e9` | `rgba(14,165,233,0.35)` | `border-sky-500/40` |
| AVR | `#10b981` | `rgba(16,185,129,0.35)` | `border-emerald-500/40` |
| SAME5x | `#f59e0b` | `rgba(245,158,11,0.35)` | `border-amber-500/40` |

### 3.8 Agent/layer color system

Used to color-code agents in `GenerationProgress`, layers in `FilePreview`, and agent cards on the About page:

| Agent / Layer | Color | Hex |
|---------------|-------|-----|
| Application layer | `text-pink-400` | `#f472b6` |
| Middleware layer | `text-purple-400` | `#c084fc` |
| Platform / HAL | `text-teal-400` | `#2dd4bf` |
| Driver layer | `text-amber-400` | `#fbbf24` |
| CMSIS / SDK | `text-gray-400` | `#9ca3af` |
| Intake agent | `--step-intake` / blue | `hsl(222 84% 56%)` |
| Discover agent | `--step-discover` / violet | `hsl(262 52% 55%)` |
| Evaluate agent | `--step-evaluate` / cyan | `hsl(197 71% 52%)` |
| Assemble agent | `--step-assemble` / green | `hsl(142 72% 45%)` |
| Deliver agent | `--step-deliver` / amber | `hsl(32 95% 55%)` |

### 3.9 CircuitBg canvas palette

The animated circuit board background (`components/hero/CircuitBg.tsx`) uses four signal colors:

```ts
const PALETTE = [
  "#3b82f6",  // blue-500
  "#06b6d4",  // cyan-500
  "#10b981",  // emerald-500
  "#8b5cf6",  // violet-500
];
```

Static trace lines: `rgba(59,130,246,0.10)` — 10% blue-500.
Node pads (circles): `rgba(6,182,212, alpha)` — cyan-500 with animated alpha.
IC pads (rectangles): `rgba(59,130,246, alpha)` — blue-500 with animated alpha.

### 3.10 HwSwAnim SVG palette

The hardware/firmware signal flow animation (`components/cta/HwSwAnim.tsx`) uses three colors for the three peripherals:

| Node | Color hex |
|------|-----------|
| BME280 (Temp/Humidity) | `#3b82f6` — blue-500 |
| MPU-6050 (IMU) | `#a78bfa` — violet-400 |
| SSD1306 (OLED Display) | `#22d3ee` — cyan-400 |

MCU pulse ring: `#3b82f6` (blue-500) with `drop-shadow(0 0 8px #3b82f6)`.

---

## 4. Animations

All animations are defined in two places: `tailwind.config.ts` (Tailwind keyframes) and `globals.css` (`@keyframes` utilities).

### 4.1 Tailwind-defined animations

| Name | Duration | Usage |
|------|----------|-------|
| `animate-fade-in` | 0.3s ease-out | Component mount transitions (wizard steps, BOM, progress) |
| `animate-slide-up` | 0.3s ease-out | Not currently in active use |
| `animate-pulse-slow` | 3s ease-in-out infinite | Aurora blobs on landing page |
| `animate-ticker` | 32s linear infinite | IdeaTicker horizontal marquee |

### 4.2 CSS `@keyframes` utilities

| Name | Usage |
|------|-------|
| `shimmer` (1.6s infinite) | Skeleton loading sweep in `Skeleton.tsx` |
| `pulse-slow` (6s ease-in-out) | `.animate-pulse-slow` override for aurora blobs |
| `gradient` (2s linear infinite) | `.animate-gradient` on progress bars |
| `ticker` (32s linear infinite) | Mirrors Tailwind `animate-ticker` |

### 4.3 Framer Motion patterns

All entrance animations use the same easing curve: `[0.22, 1, 0.36, 1]` — a custom cubic bezier used consistently across landing, about, auth, and StepPlayer scenes.

**Standard `fadeUp` variant (used on landing + about):**
```ts
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};
```

**Auth form stagger:**
```ts
// container staggers children by 0.07s
// individual items: opacity 0→1, y 18→0, duration 0.45s
```

**`AnimatePresence mode="wait"`** — used in McuShowcase and StepPlayer for clean exit/enter transitions between panels.

**Scroll-triggered `whileInView`** — used on all landing page sections with `viewport={{ once: true, margin: "-80px" }}` so animations fire once as the user scrolls down.

---

## 5. Spacing & Layout

### 5.1 Page max-widths

| Context | Max width |
|---------|-----------|
| Landing page sections | `max-w-5xl` (80rem / 1280px) |
| About page content | `max-w-4xl` (56rem / 896px) |
| Dashboard main area | `max-w-5xl` (dashboard page), `max-w-4xl` (generate page), `max-w-3xl` (BOM) |
| IntakeWizard | `max-w-2xl` (42rem / 672px) |
| GenerationProgress | `max-w-2xl` |
| Auth form | `max-w-sm` (384px) |

### 5.2 Dashboard layout geometry

- Sidebar: `w-56` (224px), fixed, not responsive
- Main content: `flex-1 overflow-auto`
- Sidebar padding: `py-5 px-3`
- Content padding: `p-8` on dashboard, `px-6 py-10` on generate page

### 5.3 Border radius tokens

| Class | Radius | Context |
|-------|--------|---------|
| `rounded-full` | 9999px | Pills, badges, progress dots, avatar |
| `rounded-2xl` | 1rem | Cards, IdeaTicker items, stat cards, plan cards |
| `rounded-3xl` | 1.5rem | Large feature cards, CTA banner, MCU showcase |
| `rounded-xl` | 0.75rem | Buttons, inputs, nav items, table containers |
| `rounded-lg` | 0.5rem | Component selectors, small cards |
| `rounded-md` | 0.375rem | Small labels in StepPlayer |

---

## 6. Icon System

FirmForge currently uses **emoji strings** as icons throughout the dashboard. This is documented here so it can be replaced in a future pass.

### 6.1 Current emoji usage

| Emoji | Context |
|-------|---------|
| `⚡` | "New project" sidebar nav, empty state, stat card (Today), CTA buttons |
| `🏠` | Dashboard nav item |
| `📁` | Projects nav item, stat card icon |
| `⚙` | Settings nav item (note: this is `U+2699` gear without variation selector — may render inconsistently) |
| `💳` | Credits stat card icon |
| `✓` | Completed step indicators, BOM approval button |
| `✕` | Remove component button in IntakeWizard |
| `⟳` | Running step indicator in GenerationProgress (Unicode rotate) |
| `○` | Pending step indicator |
| `✕` | Error/failed step |
| `▶` / `⏸` | StepPlayer play/pause controls |
| `‹` / `›` | StepPlayer prev/next buttons |
| `▋` | Blinking cursor in terminal log |
| `●` | Layer color dots in FilePreview legend, IdeaTicker status |
| `→` | Directional arrows in various CTAs |
| `↓` | Download link in FilePreview and dashboard project list |
| `✦` | AI hint trigger button in IntakeWizard |

### 6.2 Recommended replacement set

Replace all emoji icons with **Lucide React** (`lucide-react`) SVG icons for consistency and cross-platform reliability. Suggested mappings:

| Current emoji | Lucide icon |
|---------------|-------------|
| `⚡` (new project) | `Zap` |
| `🏠` (dashboard) | `LayoutDashboard` |
| `📁` (projects) | `FolderOpen` |
| `⚙` (settings) | `Settings` |
| `💳` (credits) | `CreditCard` |
| `⟳` (running) | `Loader2` (with `animate-spin`) |
| `▶` / `⏸` | `Play` / `Pause` |
| `‹` / `›` | `ChevronLeft` / `ChevronRight` |
| `↓` (download) | `Download` |
| `✕` (remove) | `X` |

---

## 7. Summary: Design Token Quick Reference

```
Background:        #060610
Sidebar bg:        #07080f
Surface:           rgba(255,255,255,0.02) — rgba(255,255,255,0.05)
Border default:    rgba(255,255,255,0.05)
Border subtle:     rgba(255,255,255,0.08–0.10)

Brand primary:     #2b6aff  (brand-500)
Brand hover:       #5291ff  (brand-400)
Brand text dim:    #8ab8ff  (brand-300)

CTA gradient:      #2563eb → #0891b2  (blue-600 → cyan-600)
Logo gradient:     #60a5fa → #22d3ee  (blue-400 → cyan-400)

Success:           #4ade80  (green-400)
Error:             #f87171  (red-400)
Warning:           #fcd34d  (amber-300)
Info:              #60a5fa  (blue-400)

Text primary:      #ffffff
Text secondary:    #9ca3af  (gray-400)
Text muted:        #6b7280  (gray-500)
Text disabled:     #4b5563  (gray-600)

Font UI:           Inter (--font-sans) — currently not applied to body
Font code/label:   JetBrains Mono (--font-mono)

Border radius:     xl (0.75rem) for buttons/inputs
                   2xl (1rem) for cards
                   3xl (1.5rem) for large panels
                   full for pills/badges

Easing curve:      cubic-bezier(0.22, 1, 0.36, 1) — all Framer Motion transitions
```
