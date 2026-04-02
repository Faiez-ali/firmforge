import { searchGitHubLibraries, fetchRepoReadme } from "@/lib/github/client";
import type { ProjectSpec, LibraryCandidate, MCUFamily } from "@/types";

// ── Curated internal library ──────────────────────────────────────────────────
// Known-good repos per component, vetted by FirmForge team.
// This is checked FIRST before hitting GitHub API — faster and more reliable.
// Keys are matched case-insensitively against component names from the project spec.
const CURATED_LIBRARY: Record<string, LibraryCandidate[]> = {
  // ── IMU / Motion sensors ──────────────────────────────────────────────────
  "MPU-6050": [
    {
      id: "curated-mpu6050-electroniccats",
      name: "electroniccats/mpu6050",
      description: "MPU-6050 6-axis IMU driver, well-maintained, STM32 and ESP32 compatible",
      url: "https://github.com/electroniccats/mpu6050",
      source: "curated",
      license: "MIT",
      stars: 890,
      lastCommit: "2024-09-01",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "MPU-6050",
      cloneUrl: "https://github.com/electroniccats/mpu6050.git",
    },
  ],
  "MPU-9250": [
    {
      id: "curated-mpu9250-bolderflight",
      name: "bolderflight/mpu9250",
      description: "MPU-9250 9-axis IMU driver for STM32 and Teensy, CMake-ready, BSD-3-Clause",
      url: "https://github.com/bolderflight/mpu9250",
      source: "curated",
      license: "BSD-3-Clause",
      stars: 420,
      lastCommit: "2024-06-15",
      mcuCompatibility: ["STM32", "ESP32", "RP2040"],
      forComponent: "MPU-9250",
      cloneUrl: "https://github.com/bolderflight/mpu9250.git",
    },
  ],

  // ── Environmental sensors ─────────────────────────────────────────────────
  "BME280": [
    {
      id: "curated-bme280-boschsensortec",
      name: "BoschSensortec/BME280_driver",
      description: "Official Bosch BME280 driver — vendor-provided, highly reliable, platform-agnostic",
      url: "https://github.com/BoschSensortec/BME280_driver",
      source: "curated",
      license: "BSD-3-Clause",
      stars: 990,
      lastCommit: "2024-08-12",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "nRF52", "AVR"],
      forComponent: "BME280",
      cloneUrl: "https://github.com/BoschSensortec/BME280_driver.git",
    },
  ],
  "BME680": [
    {
      id: "curated-bme680-boschsensortec",
      name: "BoschSensortec/BME68x-Sensor-API",
      description: "Official Bosch BME680/BME688 gas sensor API — vendor-provided, platform-agnostic C library",
      url: "https://github.com/BoschSensortec/BME68x-Sensor-API",
      source: "curated",
      license: "BSD-3-Clause",
      stars: 380,
      lastCommit: "2024-09-20",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "nRF52", "AVR"],
      forComponent: "BME680",
      cloneUrl: "https://github.com/BoschSensortec/BME68x-Sensor-API.git",
    },
  ],
  "BMP280": [
    {
      id: "curated-bmp280-boschsensortec",
      name: "BoschSensortec/BMP2-Sensor-API",
      description: "Official Bosch BMP280/BMP180 barometric pressure sensor API — platform-agnostic",
      url: "https://github.com/BoschSensortec/BMP2-Sensor-API",
      source: "curated",
      license: "BSD-3-Clause",
      stars: 220,
      lastCommit: "2024-07-10",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "nRF52", "AVR"],
      forComponent: "BMP280",
      cloneUrl: "https://github.com/BoschSensortec/BMP2-Sensor-API.git",
    },
  ],
  "DS18B20": [
    {
      id: "curated-ds18b20-onewire",
      name: "PaulStoffregen/OneWire",
      description: "1-Wire protocol library — use with DallasTemperature for DS18B20 temperature readings",
      url: "https://github.com/PaulStoffregen/OneWire",
      source: "curated",
      license: "MIT",
      stars: 1900,
      lastCommit: "2024-08-01",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "DS18B20",
      cloneUrl: "https://github.com/PaulStoffregen/OneWire.git",
    },
  ],
  "MAX31865": [
    {
      id: "curated-max31865-adafruit",
      name: "adafruit/Adafruit_MAX31865",
      description: "MAX31865 RTD-to-digital converter driver for PT100/PT1000 temperature sensors",
      url: "https://github.com/adafruit/Adafruit_MAX31865",
      source: "curated",
      license: "MIT",
      stars: 340,
      lastCommit: "2024-05-20",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "MAX31865",
      cloneUrl: "https://github.com/adafruit/Adafruit_MAX31865.git",
    },
  ],

  // ── Display drivers ───────────────────────────────────────────────────────
  "SSD1306": [
    {
      id: "curated-ssd1306-adafruit",
      name: "adafruit/Adafruit_SSD1306",
      description: "SSD1306 OLED display driver — 128x64 and 128x32 variants supported",
      url: "https://github.com/adafruit/Adafruit_SSD1306",
      source: "curated",
      license: "BSD-2-Clause",
      stars: 1800,
      lastCommit: "2024-10-15",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "SSD1306",
      cloneUrl: "https://github.com/adafruit/Adafruit_SSD1306.git",
    },
  ],
  "SSD1351": [
    {
      id: "curated-ssd1351-adafruit",
      name: "adafruit/Adafruit-SSD1351-library",
      description: "SSD1351 color OLED driver — 128x128 RGB OLED display support",
      url: "https://github.com/adafruit/Adafruit-SSD1351-library",
      source: "curated",
      license: "MIT",
      stars: 490,
      lastCommit: "2024-06-01",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "SSD1351",
      cloneUrl: "https://github.com/adafruit/Adafruit-SSD1351-library.git",
    },
  ],
  "ILI9341": [
    {
      id: "curated-ili9341-tft-espi",
      name: "Bodmer/TFT_eSPI",
      description: "High-performance TFT display driver supporting ILI9341, ST7789, and many others. SPI + DMA capable.",
      url: "https://github.com/Bodmer/TFT_eSPI",
      source: "curated",
      license: "MIT",
      stars: 3600,
      lastCommit: "2024-11-15",
      mcuCompatibility: ["STM32", "ESP32", "RP2040"],
      forComponent: "ILI9341",
      cloneUrl: "https://github.com/Bodmer/TFT_eSPI.git",
    },
  ],

  // ── Flash / EEPROM ────────────────────────────────────────────────────────
  "W25Q128": [
    {
      id: "curated-w25q-nimaltd",
      name: "nimaltd/W25Qxx",
      description: "W25Qxx SPI NOR flash driver for STM32 HAL — supports W25Q16 through W25Q256",
      url: "https://github.com/nimaltd/W25Qxx",
      source: "curated",
      license: "MIT",
      stars: 320,
      lastCommit: "2024-07-20",
      mcuCompatibility: ["STM32"],
      forComponent: "W25Q128",
      cloneUrl: "https://github.com/nimaltd/W25Qxx.git",
    },
  ],
  "AT24C256": [
    {
      id: "curated-at24c256-rjduran",
      name: "RobTillaart/I2C_EEPROM",
      description: "I2C EEPROM library supporting AT24Cxx series (AT24C32 through AT24C512), platform-agnostic",
      url: "https://github.com/RobTillaart/I2C_EEPROM",
      source: "curated",
      license: "MIT",
      stars: 180,
      lastCommit: "2024-09-05",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "AT24C256",
      cloneUrl: "https://github.com/RobTillaart/I2C_EEPROM.git",
    },
  ],

  // ── Motor drivers ─────────────────────────────────────────────────────────
  "DRV8833": [
    {
      id: "curated-drv8833-adafruit",
      name: "adafruit/Adafruit_DRV8833",
      description: "DRV8833 dual H-bridge motor driver — controls two DC motors via PWM",
      url: "https://github.com/adafruit/Adafruit_DRV8833",
      source: "curated",
      license: "MIT",
      stars: 140,
      lastCommit: "2024-04-10",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "DRV8833",
      cloneUrl: "https://github.com/adafruit/Adafruit_DRV8833.git",
    },
  ],
  "L298N": [
    {
      id: "curated-l298n-andrea",
      name: "AndreaLombardo/L298N",
      description: "L298N dual H-bridge motor driver — simple DC motor and stepper control via PWM + direction GPIO",
      url: "https://github.com/AndreaLombardo/L298N",
      source: "curated",
      license: "MIT",
      stars: 610,
      lastCommit: "2024-03-15",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "L298N",
      cloneUrl: "https://github.com/AndreaLombardo/L298N.git",
    },
  ],

  // ── Distance / range sensors ──────────────────────────────────────────────
  "HC-SR04": [
    {
      id: "curated-hcsr04-robtillaart",
      name: "RobTillaart/HCSR04",
      description: "HC-SR04 ultrasonic distance sensor driver — timing-based ranging, multiple units supported",
      url: "https://github.com/RobTillaart/HCSR04",
      source: "curated",
      license: "MIT",
      stars: 290,
      lastCommit: "2024-08-22",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "HC-SR04",
      cloneUrl: "https://github.com/RobTillaart/HCSR04.git",
    },
  ],

  // ── GPS ───────────────────────────────────────────────────────────────────
  "NEO-6M": [
    {
      id: "curated-neo6m-minmea",
      name: "kosma/minmea",
      description: "Lightweight NMEA sentence parser for GPS modules (NEO-6M, NEO-M8N, etc.) — UART-based, pure C",
      url: "https://github.com/kosma/minmea",
      source: "curated",
      license: "MIT",
      stars: 940,
      lastCommit: "2024-07-30",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "nRF52", "AVR"],
      forComponent: "NEO-6M",
      cloneUrl: "https://github.com/kosma/minmea.git",
    },
  ],

  // ── Cellular / GSM ────────────────────────────────────────────────────────
  "SIM800L": [
    {
      id: "curated-sim800l-tinygsm",
      name: "vshymanskyy/TinyGSM",
      description: "TinyGSM — GSM/GPRS AT-command library supporting SIM800L, SIM7600, and many other modems",
      url: "https://github.com/vshymanskyy/TinyGSM",
      source: "curated",
      license: "LGPL-2.1",
      stars: 4500,
      lastCommit: "2024-10-20",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "SIM800L",
      cloneUrl: "https://github.com/vshymanskyy/TinyGSM.git",
    },
  ],

  // ── RF / Wireless ─────────────────────────────────────────────────────────
  "nRF24L01": [
    {
      id: "curated-nrf24l01-rf24",
      name: "nRF24/RF24",
      description: "RF24 — nRF24L01 2.4GHz radio driver. Note: GPL-2.0 — project must be open-source.",
      url: "https://github.com/nRF24/RF24",
      source: "curated",
      license: "GPL-2.0",
      stars: 4200,
      lastCommit: "2024-11-10",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "AVR"],
      forComponent: "nRF24L01",
      cloneUrl: "https://github.com/nRF24/RF24.git",
    },
  ],

  // ── RTOS ──────────────────────────────────────────────────────────────────
  "FreeRTOS": [
    {
      id: "curated-freertos-official",
      name: "FreeRTOS/FreeRTOS-Kernel",
      description: "Official FreeRTOS kernel — the standard preemptive RTOS for embedded systems",
      url: "https://github.com/FreeRTOS/FreeRTOS-Kernel",
      source: "curated",
      license: "MIT",
      stars: 4100,
      lastCommit: "2024-11-01",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "nRF52", "AVR", "SAME5x"],
      forComponent: "FreeRTOS",
      cloneUrl: "https://github.com/FreeRTOS/FreeRTOS-Kernel.git",
    },
  ],

  // ── Networking ────────────────────────────────────────────────────────────
  "LwIP": [
    {
      id: "curated-lwip-official",
      name: "lwip-tcpip/lwip",
      description: "lwIP — lightweight TCP/IP stack for embedded systems. Ethernet, PPP, DHCP, DNS, HTTP support.",
      url: "https://github.com/lwip-tcpip/lwip",
      source: "curated",
      license: "BSD-3-Clause",
      stars: 3100,
      lastCommit: "2024-10-05",
      mcuCompatibility: ["STM32", "ESP32", "RP2040", "SAME5x"],
      forComponent: "LwIP",
      cloneUrl: "https://github.com/lwip-tcpip/lwip.git",
    },
  ],
};

/**
 * Find the best library candidates for every component in the project spec.
 * 1. Checks curated library first (fast, vetted)
 * 2. Falls back to live GitHub API search
 * 3. Returns up to 3 candidates per component
 */
export async function discoverLibraries(
  spec: ProjectSpec,
  onProgress?: (message: string) => void
): Promise<LibraryCandidate[]> {
  const results: LibraryCandidate[] = [];
  const componentsToSearch: string[] = [];

  // Build search list: components + RTOS if needed
  for (const component of spec.components ?? []) {
    componentsToSearch.push(component.name);
  }
  if (spec.rtos === "freertos") componentsToSearch.push("FreeRTOS");
  if (spec.rtos === "zephyr") componentsToSearch.push("Zephyr");

  for (const componentName of componentsToSearch) {
    onProgress?.(`Searching for ${componentName} drivers...`);

    // 1. Check curated library first
    const curatedKey = Object.keys(CURATED_LIBRARY).find(
      (k) => k.toLowerCase() === componentName.toLowerCase()
    );

    if (curatedKey) {
      const curated = CURATED_LIBRARY[curatedKey].filter(
        (lib) =>
          lib.mcuCompatibility.includes(spec.mcu) ||
          lib.mcuCompatibility.length === 0
      );
      if (curated.length > 0) {
        onProgress?.(`✓ Found vetted library for ${componentName} in curated library`);
        results.push(...curated);
        continue;
      }
    }

    // 2. Fall back to GitHub search
    onProgress?.(`Searching GitHub for ${componentName} + ${spec.mcu} drivers...`);
    try {
      const githubResults = await searchGitHubLibraries(componentName, spec.mcu, 5);
      if (githubResults.length > 0) {
        onProgress?.(`✓ Found ${githubResults.length} candidates on GitHub for ${componentName}`);
        results.push(...githubResults.slice(0, 3));
      } else {
        onProgress?.(`⚠ No open-source library found for ${componentName} — will generate with Claude`);
        // Flag for assembly agent: needs to generate this driver from scratch
        results.push({
          id: `generate-${componentName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          name: `${componentName} (Claude-generated)`,
          description: `No open-source driver found. FirmForge will generate a driver using Claude.`,
          url: "",
          source: "github",
          license: "MIT",
          mcuCompatibility: [spec.mcu],
          forComponent: componentName,
        });
      }
    } catch (err) {
      onProgress?.(`⚠ GitHub search failed for ${componentName} — will generate driver`);
    }
  }

  return results;
}
