import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { generateBOM } from "@/lib/agents/intake";
import { createClient } from "@/lib/supabase/server";
import { ProjectSpecSchema } from "@/lib/validation/schemas";

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

    const parsed = ProjectSpecSchema.safeParse(body.spec);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid spec", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const bom = await generateBOM(parsed.data);
    const enrichedBOM = await enrichWithLivePrices(bom);

    return NextResponse.json({ bom: enrichedBOM });
  } catch (err) {
    console.error("BOM generation error:", err);
    return NextResponse.json({ error: "Failed to generate BOM" }, { status: 500 });
  }
}

async function enrichWithLivePrices(bom: Awaited<ReturnType<typeof generateBOM>>) {
  // Live price enrichment — LCSC and Mouser APIs (v1.1)
  if (!process.env.LCSC_API_KEY && !process.env.MOUSER_API_KEY) {
    return bom;
  }
  // TODO: Implement LCSC and Mouser API calls per item.
  return bom;
}
