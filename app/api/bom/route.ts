import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { generateBOM } from "@/lib/agents/intake";
import { createClient } from "@/lib/supabase/server";
import type { ProjectSpec } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { spec }: { spec: ProjectSpec } = await req.json();

    if (!spec) {
      return NextResponse.json({ error: "spec is required" }, { status: 400 });
    }

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
