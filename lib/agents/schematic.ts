import Anthropic from "@anthropic-ai/sdk";
import type { ProjectSpec, BOM } from "@/types";

export interface Connection {
  from: string;
  to: string;
  net: string;
  type: "power" | "digital" | "analog" | "i2c" | "spi" | "uart" | "ground";
  label?: string;
}

export interface PowerRail {
  name: string;
  voltage: number;
  consumers: string[];
}

export interface Schematic {
  connections: Connection[];
  powerRails: PowerRail[];
  powerUpSteps: string[];
  voltageWarning?: string;
}

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const SYSTEM = `You are a hardware schematic generator for embedded systems. Given a project spec and BOM, output a wiring netlist JSON.

Rules:
- Use realistic MCU pin names (e.g. STM32 PA5, ESP32 GPIO23, RP2040 GP5)
- Only include connections that are actually needed
- Always include VCC and GND connections for every component
- Group connections by interface (SPI, I2C, UART, GPIO)
- powerUpSteps should be 4-7 ordered steps for safely powering the assembled device
- If any 5V component is used with a 3.3V MCU, set voltageWarning

Return ONLY valid JSON matching this exact schema:
{
  "connections": [
    { "from": "MCU.PIN", "to": "COMPONENT.PIN", "net": "NET_NAME", "type": "spi|i2c|uart|digital|analog|power|ground", "label": "optional" }
  ],
  "powerRails": [
    { "name": "3V3|5V|GND|VBAT", "voltage": number, "consumers": ["component names"] }
  ],
  "powerUpSteps": ["step 1", "step 2", ...],
  "voltageWarning": "optional warning string if level shifting needed"
}`;

export async function generateSchematic(spec: ProjectSpec, bom: BOM): Promise<Schematic> {
  const prompt = `Project spec:
MCU: ${spec.mcu} ${spec.mcuModel ?? ""}
RTOS: ${spec.rtos}
Interfaces: ${spec.interfaces?.join(", ") ?? "none specified"}
Description: ${spec.description}

BOM components:
${bom.items.map((item) => `- ${item.name}: ${item.description}`).join("\n")}

Generate the wiring schematic netlist JSON.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in schematic response");
  return JSON.parse(jsonMatch[0]) as Schematic;
}
