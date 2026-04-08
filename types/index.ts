// ─────────────────────────────────────────────────────────────────────────────
//  FirmForge — Core Types
//  Shared across all agents and UI components
// ─────────────────────────────────────────────────────────────────────────────

// ── MCU Families ─────────────────────────────────────────────────────────────

export type MCUFamily =
  | "STM32"
  | "ESP32"
  | "RP2040"     // Raspberry Pi Pico (original)
  | "RP2350"     // Raspberry Pi Pico 2
  | "nRF52"
  | "AVR"        // AVR / Arduino Uno, Mega, Nano
  | "SAME5x"
  | "RPiLinux"   // Raspberry Pi 4/5/Zero 2W — Linux GPIO projects
  | "custom";

export type BuildSystem = "cmake" | "platformio" | "arduino" | "espidf";

export type RTOSType = "none" | "freertos" | "zephyr";

export type ProjectType = "product" | "prototype" | "learning" | "client";

export type OutputScope = "full_app" | "drivers_hal_stub" | "drivers_only";

// ── Intake / Project Spec ─────────────────────────────────────────────────────

export interface ProjectSpec {
  // Phase 1 — Intent
  description: string;          // What the device does in plain language
  projectType: ProjectType;
  hasExistingHardware: boolean;

  // Phase 2 — Hardware
  mcu: MCUFamily;
  mcuModel?: string;             // e.g. "STM32F407VG", "ESP32-S3"
  devBoard?: string;             // e.g. "Nucleo-F411RE"
  components: Component[];       // External ICs and sensors
  interfaces: Interface[];       // Comms interfaces in use

  // Phase 3 — Firmware requirements
  rtos: RTOSType;
  hasRealTimeConstraints: boolean;
  realTimeConstraintDetail?: string;
  hasPowerConstraints: boolean;
  powerConstraintDetail?: string;
  buildSystem: BuildSystem;

  // Phase 4 — Output
  outputScope: OutputScope;
  pushToGitHub: boolean;         // Pro feature
}

export interface Component {
  name: string;                  // e.g. "MPU-6050"
  description: string;           // e.g. "6-axis IMU"
  interface: Interface;
  quantity: number;
}

export type Interface =
  | "uart"
  | "spi"
  | "i2c"
  | "can"
  | "usb"
  | "ble"
  | "wifi"
  | "adc"
  | "pwm"
  | "gpio";

// ── Bill of Materials ─────────────────────────────────────────────────────────

export interface BOMItem {
  name: string;
  description: string;
  quantity: number;
  estimatedUnitPrice: number;    // USD
  lcscPartNumber?: string;
  mouserPartNumber?: string;
  lcscPrice?: number;            // Live price from LCSC
  mouserPrice?: number;          // Live price from Mouser
  datasheet?: string;            // URL
  alternatives?: string[];
  category: "mcu" | "sensor" | "driver_ic" | "passive" | "connector" | "power" | "other";
}

export interface BOM {
  items: BOMItem[];
  totalEstimatedCost: number;
  currency: "USD";
  pricesFetchedAt?: string;      // ISO timestamp, undefined if using estimates
  notes?: string;
}

// ── Library Discovery ─────────────────────────────────────────────────────────

export type LibrarySource =
  | "github"
  | "platformio"
  | "arduino"
  | "espidf"
  | "zephyr"
  | "curated";                   // From FirmForge's internal vetted library

export type LicenseType =
  | "MIT"
  | "Apache-2.0"
  | "BSD-2-Clause"
  | "BSD-3-Clause"
  | "GPL-2.0"
  | "GPL-3.0"
  | "LGPL-2.1"
  | "LGPL-3.0"
  | "ISC"
  | "Unlicense"
  | "unknown";

export interface LibraryCandidate {
  id: string;
  name: string;
  description: string;
  url: string;
  source: LibrarySource;
  license: LicenseType;
  stars?: number;
  lastCommit?: string;           // ISO date
  mcuCompatibility: MCUFamily[];
  forComponent: string;          // Which component this driver is for
  cloneUrl?: string;
  score?: number;                // Computed by evaluation agent (0-100)
  scoreBreakdown?: EvaluationScore;
}

export interface EvaluationScore {
  stars: number;                 // 0-25
  recency: number;               // 0-25
  license: number;               // 0-20
  mcuMatch: number;              // 0-20
  readmeQuality: number;         // 0-10
}

// ── Code Assembly ─────────────────────────────────────────────────────────────

export type CodeLayer =
  | "cmsis_sdk"          // Vendor startup + CMSIS — always sourced from vendor
  | "driver"             // IC-specific drivers
  | "platform_hal"       // BSP, clock, GPIO, peripheral init
  | "middleware"         // RTOS, protocol stacks, services
  | "application";       // main.c, tasks, state machines

export interface GeneratedFile {
  path: string;          // e.g. "drivers/mpu6050/mpu6050.c"
  content: string;       // File content
  layer: CodeLayer;
  source: "open_source" | "claude_generated" | "vendor";
  attribution?: string;  // Open source repo URL if sourced
  language: "c" | "cpp" | "h" | "cmake" | "makefile" | "toml" | "json" | "md" | "yaml";
}

export interface ProjectOutput {
  projectId: string;
  spec: ProjectSpec;
  files: GeneratedFile[];
  readme: string;
  librariesUsed: LibraryCandidate[];
  buildInstructions: string;
  downloadUrl?: string;          // Cloudflare R2 zip URL
  githubRepoUrl?: string;        // Pro: pushed to user's GitHub
  generatedAt: string;           // ISO timestamp
}

// ── Agent Pipeline ─────────────────────────────────────────────────────────────

export type AgentStep =
  | "intake"
  | "bom_generation"
  | "bom_approval"
  | "discovery"
  | "evaluation"
  | "assembly"
  | "delivery";

export type StepStatus = "pending" | "running" | "done" | "error";

export interface PipelineProgress {
  projectId: string;
  currentStep: AgentStep;
  steps: Record<AgentStep, StepStatus>;
  messages: ProgressMessage[];   // Streamed to client via SSE
}

export interface ProgressMessage {
  id: string;
  step: AgentStep;
  type: "info" | "success" | "warning" | "error";
  text: string;
  timestamp: string;
}

// ── User & Billing ─────────────────────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "team";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  plan: PlanTier;
  generationsThisMonth: number;
  generationsLimit: number;      // 3 for free, -1 for unlimited
  credits: number;               // Pay-per-use credits
  githubAccessToken?: string;    // For Pro GitHub push
  createdAt: string;
  referralCode: string;
  referredBy?: string;
}

// ── Database Row Types (Supabase) ──────────────────────────────────────────────

export interface ProjectRow {
  id: string;
  user_id: string;
  spec: ProjectSpec;
  bom: BOM;
  status: "draft" | "generating" | "complete" | "failed";
  output_url?: string;           // R2 zip download URL
  github_url?: string;
  created_at: string;
  completed_at?: string;
}
