import Anthropic from "@anthropic-ai/sdk";
import type {
  ProjectSpec,
  LibraryCandidate,
  GeneratedFile,
  CodeLayer,
} from "@/types";

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// ── Per-layer system prompts ──────────────────────────────────────────────────

const ASSEMBLY_SYSTEM = `You are FirmForge's assembly agent — an expert embedded firmware architect.
You generate production-quality C/C++ firmware code following these rules:

1. Always use the exact MCU HAL/SDK specified (STM32 HAL, ESP-IDF, Arduino, pico-sdk)
2. Code must compile without modification — no placeholder TODOs in critical paths
3. Follow strict layer separation: drivers never call application code
4. All hardware-dependent code goes through the HAL layer
5. Include proper error handling with return codes (not exceptions)
6. Add brief inline comments explaining non-obvious logic
7. Use C99 for bare-metal STM32, C++17 for ESP-IDF/Arduino

Return ONLY a JSON array of file objects:
[
  {
    "path": "relative/path/to/file.c",
    "content": "complete file content",
    "layer": "driver|platform_hal|middleware|application|cmsis_sdk",
    "source": "claude_generated",
    "language": "c|cpp|h|cmake|makefile|toml|json|md|yaml"
  }
]`;

/**
 * Generate the platform/HAL layer — board support package, clock init, peripheral inits.
 */
export async function assembleHALLayer(
  spec: ProjectSpec,
  onProgress?: (msg: string) => void
): Promise<GeneratedFile[]> {
  onProgress?.("Generating platform/HAL layer...");

  const prompt = `Generate the platform/HAL layer for this project:

MCU: ${spec.mcu} (${spec.mcuModel ?? "generic"})
Dev Board: ${spec.devBoard ?? "custom"}
Interfaces needed: ${spec.interfaces.join(", ")}
Build system: ${spec.buildSystem}
RTOS: ${spec.rtos}

Generate these files:
- platform/board.h (pin definitions, board config macros)
- platform/bsp.c + platform/bsp.h (board support package — clock init, GPIO setup)
- platform/peripheral_init.c (UART, SPI, I2C, ADC init for all listed interfaces)

Use the appropriate HAL (STM32 HAL for STM32, ESP-IDF for ESP32, pico-sdk for RP2040, etc.)`;

  return callAssemblyAgent(prompt, spec);
}

/**
 * Generate driver files for each component.
 * If a library was found, generates a thin wrapper. If not, generates the full driver.
 */
export async function assembleDriverLayer(
  spec: ProjectSpec,
  selectedLibraries: LibraryCandidate[],
  onProgress?: (msg: string) => void
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  for (const component of spec.components) {
    const library = selectedLibraries.find(
      (l) => l.forComponent === component.name
    );

    const isGenerated = !library || library.name.includes("Claude-generated");
    onProgress?.(
      isGenerated
        ? `Generating ${component.name} driver with Claude...`
        : `Wrapping ${component.name} driver from ${library?.name}...`
    );

    const prompt = `Generate a driver for the ${component.name} (${component.description}) for the ${spec.mcu} (${spec.mcuModel ?? ""}).

${
  isGenerated
    ? `No open-source driver was found. Generate a complete, production-quality driver from scratch.`
    : `An open-source library exists: ${library?.name} (${library?.url}).
Generate a thin wrapper that:
- Includes the library headers properly
- Provides a clean, unified API matching our project's coding style
- Adds error handling on top of the library's functions`
}

Interface: ${component.interface.toUpperCase()}
MCU HAL: ${spec.mcu} (use appropriate HAL functions)

Generate:
- drivers/${component.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}/${component.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.h
- drivers/${component.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}/${component.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.c

Attribution if using open source: /* Based on ${library?.name ?? ""} — ${library?.url ?? ""} */`;

    const generated = await callAssemblyAgent(prompt, spec);

    // Attach attribution if using open-source library
    if (library && !isGenerated) {
      files.push(
        ...generated.map((f) => ({ ...f, attribution: library.url }))
      );
    } else {
      files.push(...generated);
    }
  }

  return files;
}

/**
 * Generate the application layer — main.c, task files, state machine.
 */
export async function assembleApplicationLayer(
  spec: ProjectSpec,
  driverFiles: GeneratedFile[],
  onProgress?: (msg: string) => void
): Promise<GeneratedFile[]> {
  onProgress?.("Generating application layer...");

  const driverHeaders = driverFiles
    .filter((f) => f.language === "h")
    .map((f) => f.path)
    .join(", ");

  const prompt = `Generate the application layer for this firmware project.

Project description: "${spec.description}"
MCU: ${spec.mcu} (${spec.mcuModel ?? ""})
RTOS: ${spec.rtos}
Driver headers available: ${driverHeaders}
Components: ${spec.components.map((c) => c.name).join(", ")}

Generate:
${spec.rtos !== "none"
  ? `- app/main.c (RTOS init, task creation)
- app/tasks/sensor_task.c + .h (reads sensors, publishes to queue)
- app/tasks/comm_task.c + .h (handles communication — WiFi/UART/BLE as appropriate)`
  : `- app/main.c (super-loop with state machine)
- app/app.c + app/app.h (application logic, called from main loop)`}
- ${spec.buildSystem === "cmake" ? "CMakeLists.txt" : "platformio.ini"} (complete build config)

The application must:
1. Initialize all drivers from the platform BSP
2. Implement the described behaviour: "${spec.description}"
3. Include proper error handling and logging
4. Be compilable with zero modifications`;

  return callAssemblyAgent(prompt, spec);
}

/**
 * Generate the README for the project.
 */
export async function generateReadme(
  spec: ProjectSpec,
  selectedLibraries: LibraryCandidate[],
  files: GeneratedFile[]
): Promise<string> {
  const prompt = `Generate a comprehensive README.md for this firmware project.

Project: ${spec.description}
MCU: ${spec.mcu} ${spec.mcuModel ?? ""}
Dev Board: ${spec.devBoard ?? "custom board"}
Components: ${spec.components.map((c) => `${c.name} (${c.description})`).join(", ")}
Build System: ${spec.buildSystem}
RTOS: ${spec.rtos}

Libraries used:
${selectedLibraries.map((l) => `- ${l.forComponent}: ${l.name} (${l.license}) — ${l.url}`).join("\n")}

Project structure:
${files.map((f) => `- ${f.path}`).join("\n")}

Include:
1. Project overview
2. Hardware requirements + wiring guide (describe connections for each component)
3. Software prerequisites (toolchain, SDK versions)
4. Build instructions (step-by-step for ${spec.buildSystem})
5. File structure explanation
6. Library attribution table
7. License section (aggregate license based on included libraries)`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

// ── Internal helper ───────────────────────────────────────────────────────────

async function callAssemblyAgent(
  prompt: string,
  spec: ProjectSpec
): Promise<GeneratedFile[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: ASSEMBLY_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Project context: ${spec.mcu}, ${spec.buildSystem}, RTOS: ${spec.rtos}\n\n${prompt}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";

  try {
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}
