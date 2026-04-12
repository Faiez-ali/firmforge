import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import type { ProjectSpec, BOM } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { spec, bom }: { spec: ProjectSpec; bom: BOM } = await req.json();

    // Verify the user is authenticated
    const supabaseAuth = await createClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Enforce daily generation limit for free-tier users
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, generations_today")
      .eq("id", user.id)
      .single();

    if (profile && profile.plan === "free" && profile.generations_today >= 3) {
      // Calculate time until midnight UTC (when the counter resets)
      const now = new Date();
      const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const msLeft = midnight.getTime() - now.getTime();
      const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      const resetIn =
        hoursLeft > 0
          ? `${hoursLeft}h ${minutesLeft}m`
          : `${minutesLeft}m`;

      return NextResponse.json(
        {
          error: `Daily limit reached (3/3 used). Your quota resets at midnight UTC — in ${resetIn}. Upgrade to Pro for unlimited generations.`,
          limitReached: true,
          resetsAt: midnight.toISOString(),
          resetIn,
        },
        { status: 403 }
      );
    }

    const projectId = randomUUID();

    // Save project record to Supabase
    const { error } = await supabase.from("projects").insert({
      id: projectId,
      user_id: user.id,
      spec,
      bom,
      status: "generating",
      created_at: new Date().toISOString(),
    });

    if (error) {
      // If DB not set up yet, still return projectId for development
      console.warn("Supabase insert failed (expected during initial setup):", error.message);
    } else {
      // Increment daily generation counter
      await supabase
        .from("profiles")
        .update({ generations_today: (profile?.generations_today ?? 0) + 1 })
        .eq("id", user.id);
    }

    return NextResponse.json({ projectId });
  } catch (err) {
    console.error("Intake API error:", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
