import { searchGitHubLibraries, fetchRepoReadme } from "@/lib/github/client";
import type { ProjectSpec, LibraryCandidate, MCUFamily } from "@/types";

// ── Curated internal library ──────────────────────────────────────────────────
// Known-good repos per component, vetted by FirmForge team.
// This is checked FIRST before hitting GitHub API — faster and more reliable.
const CURATED_LIBRARY: Record<string, LibraryCandidate[]> = {
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
  "SSD1306": [
    {
      id: "curated-ssd1306-adafruit",
      name: "adafruit/Adafruit_SSD1306",
      description: "SSD1306 OLED display driver",
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
  "W25Q128": [
    {
      id: "curated-w25q-nimaltd",
      name: "nimaltd/W25Qxx",
      description: "W25Qxx SPI NOR flash driver for STM32 HAL",
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
  "BME280": [
    {
      id: "curated-bme280-boschsensortec",
      name: "BoschSensortec/BME280_driver",
      description: "Official Bosch BME280 driver — vendor-provided, highly reliable",
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
  "FreeRTOS": [
    {
      id: "curated-freertos-official",
      name: "FreeRTOS/FreeRTOS-Kernel",
      description: "Official FreeRTOS kernel — the standard for embedded RTOS",
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
  for (const component of spec.components) {
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
