import { z } from "zod";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const MCUFamilySchema = z.enum(["STM32", "ESP32", "RP2040", "nRF52", "AVR", "SAME5x", "custom"]);
export const BuildSystemSchema = z.enum(["cmake", "platformio", "arduino", "espidf"]);
export const RTOSTypeSchema = z.enum(["none", "freertos", "zephyr"]);
export const ProjectTypeSchema = z.enum(["product", "prototype", "learning", "client"]);
export const OutputScopeSchema = z.enum(["full_app", "drivers_hal_stub", "drivers_only"]);
export const InterfaceSchema = z.enum(["uart", "spi", "i2c", "can", "usb", "ble", "wifi", "adc", "pwm", "gpio"]);

// ── Component ─────────────────────────────────────────────────────────────────

export const ComponentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  interface: InterfaceSchema,
  quantity: z.number().int().positive().default(1),
});

// ── ProjectSpec ───────────────────────────────────────────────────────────────

export const ProjectSpecSchema = z.object({
  // Phase 1
  description: z.string().min(1).max(2000),
  projectType: ProjectTypeSchema,
  hasExistingHardware: z.boolean(),

  // Phase 2
  mcu: MCUFamilySchema,
  mcuModel: z.string().max(100).optional(),
  devBoard: z.string().max(100).optional(),
  components: z.array(ComponentSchema).default([]),
  interfaces: z.array(InterfaceSchema).default([]),

  // Phase 3
  rtos: RTOSTypeSchema,
  hasRealTimeConstraints: z.boolean(),
  realTimeConstraintDetail: z.string().max(500).optional(),
  hasPowerConstraints: z.boolean(),
  powerConstraintDetail: z.string().max(500).optional(),
  buildSystem: BuildSystemSchema,

  // Phase 4
  outputScope: OutputScopeSchema,
  pushToGitHub: z.boolean().default(false),
});

// ── BOM ───────────────────────────────────────────────────────────────────────

export const BOMItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).default(""),
  quantity: z.number().int().positive().default(1),
  estimatedUnitPrice: z.number().nonnegative().default(0),
  lcscPartNumber: z.string().optional(),
  mouserPartNumber: z.string().optional(),
  lcscPrice: z.number().nonnegative().optional(),
  mouserPrice: z.number().nonnegative().optional(),
  datasheet: z.string().url().optional(),
  alternatives: z.array(z.string()).optional(),
  category: z.enum(["mcu", "sensor", "driver_ic", "passive", "connector", "power", "other"]),
});

export const BOMSchema = z.object({
  items: z.array(BOMItemSchema),
  totalEstimatedCost: z.number().nonnegative().default(0),
  currency: z.literal("USD").default("USD"),
  pricesFetchedAt: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

// ── Inferred types (safe to use in routes) ────────────────────────────────────

export type ValidatedSpec = z.infer<typeof ProjectSpecSchema>;
export type ValidatedBOM  = z.infer<typeof BOMSchema>;
