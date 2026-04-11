import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ hint: null }, { status: 401 });
    }

    const { description, step } = await req.json();

    if (!description) {
      return NextResponse.json({ hint: null });
    }

    const prompts: Record<string, string> = {
      describe: `A user is building this embedded device: "${description}"\n\nGive a single helpful 1-2 sentence suggestion about what MCU family would suit this project and why. Be specific and practical. No markdown.`,
      hardware: `For this project: "${description}"\n\nSuggest 1-2 common external ICs or components the user might have forgotten to add to their component list. Be brief and specific. No markdown.`,
      firmware: `For this project: "${description}"\n\nIn one sentence, recommend whether FreeRTOS or bare-metal is more appropriate and why. Be direct. No markdown.`,
    };

    const prompt = prompts[step] ?? prompts.describe;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const hint = response.content[0].type === "text" ? response.content[0].text.trim() : null;
    return NextResponse.json({ hint });
  } catch {
    return NextResponse.json({ hint: null });
  }
}
