import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { z } from "zod";
import { generateBOM } from "@/lib/agents/intake";
import { createClient } from "@/lib/supabase/server";

const SpecSchema = z.object({
  description: z.string().min(1).max(2000),
  mcu: z.string().min(1).max(100),
  rtos: z.string().optional(),
  buildSystem: z.string().optional(),
  components: z.array(z.object({
    name: z.string().min(1).max(100),
    interface: z.string().optional(),
    partNumber: z.string().optional(),
  })).optional(),
  additionalContext: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = SpecSchema.safeParse(body.spec);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid spec", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const spec = parsed.data;

    const bom = await generateBOM(spec);

    // Try to enrich with live prices — gracefully falls back if APIs unavailable
    const enrichedBOM = await enrichWithLivePrices(bom);

    return NextResponse.json({ bom: enrichedBOM });
  } catch (err) {
    console.error("BOM generation error:", err);
    return NextResponse.json({ error: "Failed to generate BOM" }, { status: 500 });
  }
}

async function enrichWithLivePrices(bom: Awaited<ReturnType<typeof generateBOM>>) {
  // Live price enrichment — LCSC and Mouser APIs
  // Returns estimated prices until API integration is implemented (v1.1)
  if (!process.env.LCSC_API_KEY && !process.env.MOUSER_API_KEY) {
    return bom;
  }

  // TODO: Implement LCSC and Mouser API calls per item.
  // Only set pricesFetchedAt once real prices are actually returned.
  return bom;
}
