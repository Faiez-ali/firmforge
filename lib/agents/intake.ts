import Anthropic from "@anthropic-ai/sdk";
import type { ProjectSpec, BOM, BOMItem, MCUFamily } from "@/types";

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const INTAKE_SYSTEM_PROMPT = `You are FirmForge's project intake specialist. Your job is to gather all information needed to generate a complete firmware project for an embedded engineer.

You will be given the current state of a ProjectSpec (as JSON) and the user's latest message. Your job is to:

1. Ask ONE focused clarifying question if the spec is incomplete
2. Update the spec fields you can determine from the conversation so far
3. When the spec is complete, set "complete": true

Rules:
- Ask one question at a time, never multiple
- If the user is non-technical, suggest sensible defaults (e.g. recommend ESP32-S3 + FreeRTOS for IoT projects)
- Always be friendly and concise — this is a wizard, not an interrogation
- Infer as much as possible from context before asking

Return ONLY valid JSON in this exact format:
{
  "complete": boolean,
  "question": "string | null — the next question to ask, or null if complete",
  "updatedSpec": { ...partial ProjectSpec fields you can determine },
  "suggestions": "string | null — optional friendly note to the user"
}`;

/**
 * Run one turn of the intake conversation.
 * Returns the next question to ask, updated spec fields, and whether intake is complete.
 */
export async function runIntakeTurn(
  currentSpec: Partial<ProjectSpec>,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string
): Promise<{
  complete: boolean;
  question: string | null;
  updatedSpec: Partial<ProjectSpec>;
  suggestions: string | null;
}> {
  const messages = [
    ...conversationHistory,
    {
      role: "user" as const,
      content: `Current spec state:\n${JSON.stringify(currentSpec, null, 2)}\n\nUser message: ${userMessage}`,
    },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: INTAKE_SYSTEM_PROMPT,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    return JSON.parse(text);
  } catch {
    // Fallback if model returns non-JSON
    return {
      complete: false,
      question: "Could you tell me more about your project?",
      updatedSpec: {},
      suggestions: null,
    };
  }
}

/**
 * Generate a Bill of Materials from a completed ProjectSpec.
 * Uses Claude Haiku for speed and cost efficiency.
 */
export async function generateBOM(spec: ProjectSpec): Promise<BOM> {
  const prompt = `Given this firmware project spec, generate a complete Bill of Materials.

Project spec:
${JSON.stringify(spec, null, 2)}

Return ONLY valid JSON matching this structure:
{
  "items": [
    {
      "name": "string",
      "description": "string",
      "quantity": number,
      "estimatedUnitPrice": number,
      "category": "mcu|sensor|driver_ic|passive|connector|power|other",
      "datasheet": "URL or null",
      "alternatives": ["alternative part names"]
    }
  ],
  "notes": "any important notes about the BOM"
}

Include: the MCU/dev board, all listed components, essential passives (decoupling caps, pull-ups), and power regulation if needed.
Price in USD. Use realistic market prices from LCSC/Mouser.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    const items: BOMItem[] = parsed.items ?? [];
    const totalEstimatedCost = items.reduce(
      (sum, item) => sum + item.estimatedUnitPrice * item.quantity,
      0
    );
    return {
      items,
      totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
      currency: "USD",
      notes: parsed.notes,
    };
  } catch (err) {
    console.error("BOM parse failed — Claude returned non-JSON:", err);
    return { items: [], totalEstimatedCost: 0, currency: "USD" };
  }
}

/**
 * If user gave freehand mode, recommend an MCU and components from the project description.
 */
export async function recommendHardware(description: string): Promise<{
  mcu: MCUFamily;
  mcuModel: string;
  devBoard: string;
  reasoning: string;
}> {
  const prompt = `A user wants to build this embedded device: "${description}"

Recommend the best MCU family, specific model, and development board for this use case.
Consider: connectivity requirements, processing needs, power constraints, ecosystem maturity, and ease of prototyping.

Return ONLY valid JSON:
{
  "mcu": "STM32|ESP32|RP2040|nRF52|AVR|SAME5x",
  "mcuModel": "specific model e.g. ESP32-S3",
  "devBoard": "recommended dev board e.g. ESP32-S3-DevKitC-1",
  "reasoning": "2-3 sentence explanation for the user"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    return {
      mcu: "ESP32",
      mcuModel: "ESP32-S3",
      devBoard: "ESP32-S3-DevKitC-1",
      reasoning: "ESP32-S3 is a great general-purpose choice with WiFi/BLE built in.",
    };
  }
}
