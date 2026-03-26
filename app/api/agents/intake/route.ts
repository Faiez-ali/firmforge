import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import type { ProjectSpec, BOM } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { spec, bom }: { spec: ProjectSpec; bom: BOM } = await req.json();

    const projectId = randomUUID();
    const supabase = createAdminClient();

    // Save project record to Supabase
    const { error } = await supabase.from("projects").insert({
      id: projectId,
      spec,
      bom,
      status: "generating",
      created_at: new Date().toISOString(),
    });

    if (error) {
      // If DB not set up yet, still return projectId for development
      console.warn("Supabase insert failed (expected during initial setup):", error.message);
    }

    return NextResponse.json({ projectId });
  } catch (err) {
    console.error("Intake API error:", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
