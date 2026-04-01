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

## Current priority: CORE FUNCTIONALITY FIRST

Before billing, before UI polish, before marketing — the firmware generation
pipeline must work reliably and produce real, useful output. A tool that looks
great but generates broken firmware is worthless. Ship the core, then everything else.

### Core functionality definition

FirmForge's core is working when ALL of the following are true:

1. A user can describe a real project in plain language
2. The intake agent correctly extracts MCU, components, and requirements
3. The BOM is generated with accurate components for the project
4. The discovery agent finds real, relevant open-source libraries on GitHub
5. The evaluation agent selects the best library per component
6. The assembly agent produces compilable, layered C code
7. The README correctly attributes every library used
8. The zip download contains all files and opens correctly
9. The generated code follows the correct layer architecture
10. The output is useful to a real embedded engineer — not toy code

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
test/*      test harness branches — PR into dev only
```

**Always work on a feature branch. Never commit directly to main.**

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
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── callback/route.ts
│   │   └── signout/route.ts
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── generate/page.tsx
│   └── api/
│       ├── agents/
│       │   ├── intake/route.ts
│       │   └── hint/route.ts
│       ├── bom/route.ts
│       └── stream/route.ts             # SSE pipeline — runs all agents
├── components/
│   ├── wizard/IntakeWizard.tsx
│   ├── bom/BOMApproval.tsx
│   ├── progress/GenerationProgress.tsx
│   └── file-preview/FilePreview.tsx
├── lib/
│   ├── agents/
│   │   ├── intake.ts
│   │   ├── discover.ts
│   │   ├── evaluate.ts
│   │   ├── assemble.ts
│   │   └── deliver.ts
│   ├── github/client.ts
│   ├── supabase/client.ts + server.ts
│   └── r2/client.ts
├── __tests__/                          # ALL test files — does not exist yet, must be built
│   ├── agents/
│   │   ├── intake.test.ts
│   │   ├── discover.test.ts
│   │   ├── evaluate.test.ts
│   │   ├── assemble.test.ts
│   │   └── deliver.test.ts
│   ├── integration/
│   │   └── pipeline.test.ts
│   └── fixtures/
│       └── test-specs.ts               # Canonical test project specs
├── scripts/
│   └── test-pipeline.ts               # CLI: run a full pipeline locally without UI
├── supabase/migrations/001_initial_schema.sql
├── types/index.ts
├── middleware.ts
├── forge.sh
└── .env.local.example
```

---

## Agent pipeline

All agents run in `app/api/stream/route.ts` as a single SSE endpoint.

1. **Intake** (`lib/agents/intake.ts`) — Claude Haiku Q&A, outputs ProjectSpec JSON
2. **Discovery** (`lib/agents/discover.ts`) — curated library first, GitHub API fallback
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

## Core functionality development plan

Work through these phases in strict order.
Do NOT start billing, UI overhaul, or marketing until Phase 3 passes.

---

### Phase 1 — Agent unit correctness

Each agent must work correctly in isolation before wiring them together.
Build the test harness first (`scripts/test-pipeline.ts`), then test each agent.

#### Step 1: Build the test harness

Create `scripts/test-pipeline.ts` — a CLI script that:
- Accepts a test case number (1-5) as argument
- Loads the corresponding spec from `__tests__/fixtures/test-specs.ts`
- Runs each agent in sequence and prints the output at each step
- Saves the final zip to `/tmp/firmforge-test-output/`
- Reports pass/fail for each step

Run with: `npx ts-node scripts/test-pipeline.ts --case 1`

#### Step 2: Test intake agent

File: `lib/agents/intake.ts`
Test with: `npx ts-node scripts/test-pipeline.ts --agent intake --case 1`

Checks:
- [ ] `runIntakeTurn()` produces valid ProjectSpec JSON for all 5 test cases
- [ ] All required fields populated (mcu, components, interfaces, rtos, buildSystem)
- [ ] MCU recommendations are sensible (ESP32 for WiFi, STM32 for industrial, etc.)
- [ ] `generateBOM()` produces correct component list for each spec
- [ ] BOM prices are realistic (no $0, no $9999 values)
- [ ] Empty/nonsensical input returns helpful error, not a crash
- [ ] Freehand mode: "you choose the MCU" triggers `recommendHardware()`

#### Step 3: Test discovery agent

File: `lib/agents/discover.ts`
Test with: `npx ts-node scripts/test-pipeline.ts --agent discover --case 1`

Checks:
- [ ] Curated library returns correct entries for MPU-6050, BME280, SSD1306, FreeRTOS
- [ ] GitHub API search returns relevant results for each component
- [ ] Results are actually relevant (not random C repos)
- [ ] `license` field is correctly extracted for every result
- [ ] GitHub 429 rate limit handled gracefully (retry with backoff)
- [ ] Network timeout handled gracefully (does not crash pipeline)
- [ ] "Claude-generated" placeholder returned when no library found
- [ ] Curated library expanded to 20+ entries (common ICs covered)

Curated library must include at minimum:
MPU-6050, MPU-9250, BME280, BME680, BMP280, SSD1306, SSD1351, ILI9341,
W25Q128, AT24C256 (EEPROM), DRV8833, L298N, HC-SR04 (ultrasonic),
MAX31865 (RTD), DS18B20, NEO-6M (GPS), SIM800L (GSM), nRF24L01,
FreeRTOS, LwIP

#### Step 4: Test evaluation agent

File: `lib/agents/evaluate.ts`
Test with: `npx ts-node scripts/test-pipeline.ts --agent evaluate --case 1`

Checks:
- [ ] Bosch official BME280 driver scores >80
- [ ] Abandoned repo (last commit 2019, 3 stars) scores <30
- [ ] GPL library gets warning flag, score not zeroed
- [ ] Curated entry scores higher than equivalent raw GitHub result
- [ ] Best candidate is selected per component (not just first result)
- [ ] `getLicenseWarnings()` returns accurate, readable messages

#### Step 5: Test assembly agent

File: `lib/agents/assemble.ts`
Test with: `npx ts-node scripts/test-pipeline.ts --agent assemble --case 1`

Checks:
- [ ] STM32 output uses `HAL_*` functions (not bare register access)
- [ ] ESP32 output uses `esp_*` / `i2c_master_*` ESP-IDF functions
- [ ] Driver files have correct include guards (`#ifndef DRIVER_H`)
- [ ] `main.c` includes the correct driver headers
- [ ] CMakeLists.txt has `target_link_libraries` with all driver targets
- [ ] platformio.ini has correct `board` and `framework` values
- [ ] No placeholder `// TODO: implement this` in init functions
- [ ] FreeRTOS: `xTaskCreate()` used correctly, stack sizes are sensible
- [ ] Bare-metal: super-loop structure is correct (while(1) with delays)
- [ ] All file paths in output match the declared layer structure

#### Step 6: Test delivery agent

File: `lib/agents/deliver.ts`
Test with: `npx ts-node scripts/test-pipeline.ts --agent deliver --case 1`

Checks:
- [ ] Zip file opens without errors
- [ ] All assembled files are present in the zip
- [ ] `README.md` is present with attribution table
- [ ] `LICENSES.md` lists all open-source libraries with URLs
- [ ] R2 upload succeeds (requires CLOUDFLARE_* env vars)
- [ ] Pre-signed URL is accessible and returns the zip file
- [ ] Pre-signed URL contains all files (not a corrupt zip)

---

### Phase 2 — Integration test cases

Run the full pipeline end-to-end for all 5 canonical test cases.
All must pass before moving to Phase 3.

#### Test Case 1 — Simple sensor node

```
Description: "Read temperature, humidity and pressure every 5 seconds
              and print the values over UART"
MCU: STM32F411 (Nucleo-F411RE)
Components: BME280 (I2C)
RTOS: bare-metal
Build: CMake
Output: full app
```

Expected output:
- `platform/bsp.c` with `MX_I2C1_Init()` and `MX_USART2_UART_Init()`
- `drivers/bme280/bme280.c` and `.h` sourced from Bosch official repo
- `app/main.c` with super-loop reading BME280 every 5s, printing via UART
- `CMakeLists.txt` with correct STM32 target and include paths
- README with BME280 attribution and STM32CubeIDE build instructions

Pass criteria:
- All 5 expected files present in zip
- `main.c` references `bme280_read_temperature()` or equivalent
- `CMakeLists.txt` references `bme280` as a target
- README has attribution link to Bosch GitHub repo

---

#### Test Case 2 — WiFi IoT device with display

```
Description: "Read accelerometer data and show it on an OLED display.
              Also send the data to an MQTT broker over WiFi every 10 seconds"
MCU: ESP32-S3
Components: MPU-6050 (I2C), SSD1306 OLED 128x64 (SPI)
RTOS: FreeRTOS
Build: PlatformIO
Output: full app
```

Expected output:
- `platform/bsp.c` with I2C and SPI init for ESP-IDF
- `drivers/mpu6050/mpu6050.c` with `mpu6050_read_accel()`
- `drivers/ssd1306/ssd1306.c` with `ssd1306_draw_string()`
- `app/tasks/sensor_task.c` — reads MPU-6050, publishes to queue
- `app/tasks/display_task.c` — reads queue, updates OLED
- `app/main.c` — creates both tasks, inits WiFi and MQTT
- `platformio.ini` with `esp32-s3` board and `espidf` framework

Pass criteria:
- All 7 expected files present
- `sensor_task.c` calls `xQueueSend()`
- `display_task.c` calls `xQueueReceive()`
- `platformio.ini` has correct board identifier

---

#### Test Case 3 — Motor controller with CAN bus

```
Description: "Control two DC motors based on CAN bus commands received from
              a master controller. Implement basic PID speed control"
MCU: STM32F407VGT6
Components: DRV8833 dual H-bridge (PWM + GPIO)
RTOS: FreeRTOS
Build: CMake
Output: full app
```

Expected output:
- `platform/bsp.c` with TIM PWM init and CAN init
- `drivers/drv8833/drv8833.c` with `drv8833_set_speed(motor, speed)`
- `app/tasks/can_task.c` — receives CAN frames, parses speed commands
- `app/tasks/motor_task.c` — runs PID loop, calls drv8833 driver
- `app/main.c` — creates tasks, starts scheduler

Pass criteria:
- All 5 expected files present
- `drv8833.c` uses `HAL_TIM_PWM_Start()`
- `can_task.c` uses `HAL_CAN_GetRxMessage()`
- PID controller stub exists in `motor_task.c`

---

#### Test Case 4 — Freehand mode (AI picks hardware)

```
Description: "I want to build a battery-powered GPS tracker that sends
              location data over cellular every 60 seconds. It should
              last at least 1 week on a single charge"
MCU: agent chooses
Components: agent chooses
RTOS: agent chooses
Build: agent chooses
Output: drivers + HAL + stub
```

Expected behavior:
- Agent recommends a low-power MCU (STM32L4, nRF9160, or similar)
- Agent includes GPS module (NEO-6M or similar) in BOM
- Agent includes cellular modem (SIM800L or SIM7600 or similar) in BOM
- Agent includes LiPo charger IC in BOM
- Agent recommends bare-metal or tickless FreeRTOS for power reasons
- Agent explains reasoning in the intake response

Pass criteria:
- MCU is a low-power variant (not STM32F4, not ESP32 full-power)
- BOM contains GPS, cellular, and power management components
- Agent's MCU reasoning mentions battery life or power consumption
- Generated project stub has power management stubs (sleep mode init)

---

#### Test Case 5 — Obscure component, no open-source driver

```
Description: "Read resistance from a PT100 RTD temperature sensor
              and log the temperature over UART"
MCU: STM32F4
Components: MAX31865 (SPI RTD-to-digital converter)
RTOS: bare-metal
Build: CMake
Output: full app
```

Expected behavior:
- Discovery agent finds no curated entry for MAX31865
- GitHub search returns limited or no results
- Assembly agent generates driver from scratch using SPI knowledge
- README clearly states the MAX31865 driver is AI-generated

Pass criteria:
- `drivers/max31865/max31865.c` is generated (not copied)
- Driver implements correct SPI configuration (CPOL=1, CPHA=1 for MAX31865)
- Driver reads the RTD ratio register (0x01) correctly
- README has "AI-generated driver" warning for MAX31865
- `LICENSES.md` notes the driver as MIT-licensed, AI-generated

---

### Phase 3 — Acceptance criteria (quality bar)

All must be true before Phase 4 starts:

- [ ] All 5 integration test cases produce a zip with no missing files
- [ ] All 5 generated CMakeLists.txt / platformio.ini are syntactically valid
- [ ] All 5 generated `main.c` files are manually verified to be plausible
      (correct includes, no nonexistent function calls, correct entry point)
- [ ] All 5 READMEs contain the attribution table with library names and URLs
- [ ] No generated file contains obvious hallucinations:
      - No nonexistent HAL functions (e.g., HAL_I2C_ReadSuperFast does not exist)
      - No wrong register addresses (verify against datasheets for Test Case 5)
      - No made-up library names in includes
- [ ] Pipeline completes in under 90 seconds for a 2-component project
- [ ] GitHub API 429 rate limit does not crash the pipeline
- [ ] Claude API timeout does not crash the pipeline (retry once, then fail cleanly)
- [ ] Pipeline output is reviewed by Faiez as a working embedded engineer
      and judged as "I could use this as a starting point for a real project"

---

### Phase 4 — After core is solid

Only start these after every Phase 3 checkbox is ticked:

1. `feat/paddle-billing` — Paddle checkout, webhook, plan enforcement
2. `feat/generation-limits` — free tier 3/month, credit deduction
3. `feat/projects-history` — project list with re-download
4. `feat/ui-overhaul` — modern dark SaaS UI with Framer Motion
5. `feat/landing-polish` — showcase gallery, SEO, testimonials
6. `feat/compile-validation` (v1.1) — Docker + ARM GCC on Railway

---

## How to run tests

### Step 1: Add API keys to .env.local

```
CLAUDE_API_KEY=sk-ant-...
GITHUB_API_TOKEN=github_pat_...
```

### Step 2: Run the test harness (once built)

```bash
# Test a single agent
npx ts-node scripts/test-pipeline.ts --agent intake --case 1

# Run full pipeline for a test case
npx ts-node scripts/test-pipeline.ts --case 1

# Run all 5 integration test cases
npx ts-node scripts/test-pipeline.ts --all
```

### Step 3: Manual end-to-end test via browser

```bash
npm run dev
# Go to http://localhost:3000/dashboard/generate
# Enter test case description, verify BOM, approve, download zip
# Open zip, inspect files, try to compile main.c
```

---

## Environment variables

Minimum to run and test core pipeline locally:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CLAUDE_API_KEY               ← CRITICAL — nothing works without this
GITHUB_API_TOKEN             ← CRITICAL — discovery agent needs this
```

Not needed until Phase 4:
```
CLOUDFLARE_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
PADDLE_VENDOR_ID / PADDLE_API_KEY / PADDLE_WEBHOOK_SECRET
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_POSTHOG_KEY
LCSC_API_KEY / MOUSER_API_KEY
```

---

## Current task queue

1. **Build `scripts/test-pipeline.ts`** and `__tests__/fixtures/test-specs.ts`
2. **Run Phase 1 tests** — work through each agent systematically
3. **Expand curated library** to 20+ entries in `lib/agents/discover.ts`
4. **Fix any agent bugs found** during Phase 1 testing
5. **Run Phase 2 integration tests** — all 5 test cases
6. **Phase 3 acceptance review** — Faiez reviews output as an embedded engineer
7. **Start Phase 4** — billing, UI, and everything else

---

## Known issues (as of session 5)

- [x] `next.config.ts` renamed to `next.config.mjs` — DONE
- [x] Geist font replaced with Inter + JetBrains_Mono — DONE
- [x] `npm audit fix` — Next.js upgraded to 14.2.35 — DONE
- [x] `autoprefixer` added to devDependencies — DONE
- [ ] CLAUDE_API_KEY not in `.env.local` — agents non-functional
- [ ] GITHUB_API_TOKEN not in `.env.local` — discovery cannot search
- [ ] `scripts/test-pipeline.ts` does not exist — must be built first
- [ ] `__tests__/` directory does not exist — must be built
- [ ] Curated library only has 5 entries — needs 20+ entries

---

## Key decisions (do not change without discussing)

- One-shot generation for MVP. No iteration. v2 adds this.
- BOM approval mandatory. Decision before execution.
- GPL: warn user, let them decide. Never auto-exclude.
- Missing drivers: generate with Claude. Never skip.
- Models: Haiku for intake/hints, Sonnet for assembly.
- Payments: Paddle only. Not Stripe. Pakistan-compatible.
- Budget: under $50/month until first revenue.
- Free tier: 3 generations per calendar month.
- Pro tier: $19/month. Team: $49/month.
- MRR target for Phase 2 (AI Datasheet Parser): $1,000/month.

---

## MCU and RTOS scope

Launch full: STM32, ESP32
Launch experimental: RP2040, nRF52, AVR, SAME5x
RTOS launch: bare-metal + FreeRTOS
RTOS v1.1: Zephyr
Build systems launch: CMake + PlatformIO
Build systems v1.1: Arduino IDE

---

## How to start a session in Claude Code

1. Open VS Code in the firmforge directory
2. Open terminal (`Ctrl + backtick`)
3. Run `claude`
4. Say: **"Read CLAUDE.md and continue Phase 1 core functionality testing"**

Claude Code reads the full context, checks which tasks are done, and continues.

---

## Notion project notebook

https://www.notion.so/32d60b81890081afa2e5d58b849d2ea2