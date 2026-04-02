/**
 * Canonical test project specifications for FirmForge Phase 1 + 2 testing.
 * These are the 5 reference cases defined in CLAUDE.md.
 * Used by scripts/test-pipeline.ts and all agent unit tests.
 */

import type { ProjectSpec } from "../../types";

// ── Test Case 1 — Simple sensor node ─────────────────────────────────────────
// STM32F411 + BME280 I2C, bare-metal, CMake
// Expected: bsp.c, bme280.c/.h, main.c with 5s super-loop, CMakeLists.txt

export const TC1: ProjectSpec = {
  description:
    "Read temperature, humidity and pressure every 5 seconds and print the values over UART",
  projectType: "prototype",
  hasExistingHardware: true,
  mcu: "STM32",
  mcuModel: "STM32F411RE",
  devBoard: "Nucleo-F411RE",
  components: [
    {
      name: "BME280",
      description: "Temperature, humidity, and pressure sensor",
      interface: "i2c",
      quantity: 1,
    },
  ],
  interfaces: ["i2c", "uart"],
  rtos: "none",
  hasRealTimeConstraints: false,
  hasPowerConstraints: false,
  buildSystem: "cmake",
  outputScope: "full_app",
  pushToGitHub: false,
};

// ── Test Case 2 — WiFi IoT with display ──────────────────────────────────────
// ESP32-S3 + MPU-6050 (I2C) + SSD1306 (SPI), FreeRTOS, PlatformIO
// Expected: sensor_task.c, display_task.c, WiFi+MQTT in main.c, platformio.ini

export const TC2: ProjectSpec = {
  description:
    "Read accelerometer data and show it on an OLED display. Also send the data to an MQTT broker over WiFi every 10 seconds",
  projectType: "prototype",
  hasExistingHardware: false,
  mcu: "ESP32",
  mcuModel: "ESP32-S3",
  devBoard: "ESP32-S3-DevKitC-1",
  components: [
    {
      name: "MPU-6050",
      description: "6-axis accelerometer and gyroscope IMU",
      interface: "i2c",
      quantity: 1,
    },
    {
      name: "SSD1306",
      description: "128x64 OLED display",
      interface: "spi",
      quantity: 1,
    },
  ],
  interfaces: ["i2c", "spi", "wifi"],
  rtos: "freertos",
  hasRealTimeConstraints: false,
  hasPowerConstraints: false,
  buildSystem: "platformio",
  outputScope: "full_app",
  pushToGitHub: false,
};

// ── Test Case 3 — Motor controller with CAN bus ───────────────────────────────
// STM32F407 + DRV8833 (PWM+GPIO), FreeRTOS, CMake
// Expected: drv8833.c, can_task.c, motor_task.c with PID stub, main.c

export const TC3: ProjectSpec = {
  description:
    "Control two DC motors based on CAN bus commands received from a master controller. Implement basic PID speed control",
  projectType: "product",
  hasExistingHardware: true,
  mcu: "STM32",
  mcuModel: "STM32F407VGT6",
  devBoard: "STM32F407VG Discovery",
  components: [
    {
      name: "DRV8833",
      description: "Dual H-bridge motor driver IC",
      interface: "pwm",
      quantity: 1,
    },
  ],
  interfaces: ["can", "pwm", "gpio"],
  rtos: "freertos",
  hasRealTimeConstraints: true,
  realTimeConstraintDetail: "PID loop must run at 1 kHz",
  hasPowerConstraints: false,
  buildSystem: "cmake",
  outputScope: "full_app",
  pushToGitHub: false,
};

// ── Test Case 4 — Freehand mode (AI picks hardware) ──────────────────────────
// No hardware specified — agent must recommend low-power MCU for GPS tracker
// Expected: low-power MCU (STM32L4/nRF9160), GPS + cellular in BOM, sleep stubs

export const TC4_DESCRIPTION =
  "I want to build a battery-powered GPS tracker that sends location data over cellular every 60 seconds. It should last at least 1 week on a single charge";

// TC4 has no pre-filled spec — it starts from just the description (freehand mode).
// The intake agent + recommendHardware() must fill this in.
export const TC4_PARTIAL: Partial<ProjectSpec> = {
  description: TC4_DESCRIPTION,
  projectType: "product",
  hasExistingHardware: false,
  hasPowerConstraints: true,
  powerConstraintDetail: "1 week battery life on single charge",
  // mcu, components, rtos, buildSystem — all left to agent
};

// ── Test Case 5 — Obscure component, no open-source driver ───────────────────
// STM32F4 + MAX31865 (SPI RTD), bare-metal, CMake
// Expected: AI-generated MAX31865 driver, correct SPI mode, README warning

export const TC5: ProjectSpec = {
  description:
    "Read resistance from a PT100 RTD temperature sensor and log the temperature over UART",
  projectType: "prototype",
  hasExistingHardware: true,
  mcu: "STM32",
  mcuModel: "STM32F411RE",
  devBoard: "Nucleo-F411RE",
  components: [
    {
      name: "MAX31865",
      description: "PT100/PT1000 RTD-to-digital converter with SPI interface",
      interface: "spi",
      quantity: 1,
    },
  ],
  interfaces: ["spi", "uart"],
  rtos: "none",
  hasRealTimeConstraints: false,
  hasPowerConstraints: false,
  buildSystem: "cmake",
  outputScope: "full_app",
  pushToGitHub: false,
};

// ── Lookup table ──────────────────────────────────────────────────────────────

export const TEST_CASES: Record<number, ProjectSpec | Partial<ProjectSpec>> = {
  1: TC1,
  2: TC2,
  3: TC3,
  4: TC4_PARTIAL,
  5: TC5,
};

export const TEST_CASE_NAMES: Record<number, string> = {
  1: "Simple sensor node (STM32F411 + BME280, bare-metal, CMake)",
  2: "WiFi IoT with display (ESP32-S3 + MPU-6050 + SSD1306, FreeRTOS, PlatformIO)",
  3: "Motor controller with CAN bus (STM32F407 + DRV8833, FreeRTOS, CMake)",
  4: "Freehand GPS tracker (AI picks hardware, power-constrained)",
  5: "Obscure component — MAX31865 RTD (no open-source driver, AI generates)",
};
