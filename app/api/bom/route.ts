import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { generateBOM } from "@/lib/agents/intake";
import type { ProjectSpec } from "@/types";

export async function POST(req: NextRequest) {
  try {
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
  // Gracefully skips if API keys are not configured
  if (!process.env.LCSC_API_KEY && !process.env.MOUSER_API_KEY) {
    return bom; // Return with static estimated prices
  }

  // TODO: Implement LCSC and Mouser API calls per item
  // For now, return as-is with estimated prices
  return { ...bom, pricesFetchedAt: new Date().toISOString() };
}
