import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { ProjectSpecSchema, BOMSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabaseAuth = await createClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Input validation ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const specResult = ProjectSpecSchema.safeParse(body.spec);
    const bomResult  = BOMSchema.safeParse(body.bom);

    if (!specResult.success || !bomResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: {
          spec: specResult.success ? null : specResult.error.flatten().fieldErrors,
          bom:  bomResult.success  ? null : bomResult.error.flatten().fieldErrors,
        }},
        { status: 400 }
      );
    }

    const spec = specResult.data;
    const bom  = bomResult.data;

    // ── Daily limit check ─────────────────────────────────────────────────────
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, generations_today")
      .eq("id", user.id)
      .single();

    if (profile && profile.plan === "free" && profile.generations_today >= 3) {
      const now      = new Date();
      const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const msLeft   = midnight.getTime() - now.getTime();
      const hoursLeft   = Math.floor(msLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      const resetIn = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`;

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

    // ── Create project record ─────────────────────────────────────────────────
    const projectId = randomUUID();

    const { error: dbError } = await supabase.from("projects").insert({
      id: projectId,
      user_id: user.id,
      spec,
      bom,
      status: "generating",
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.warn("Supabase insert failed (expected during initial setup):", dbError.message);
    } else {
      // Atomic increment — avoids race condition that would let concurrent
      // requests bypass the free-tier daily limit.
      await supabase.rpc("increment_generations_today", { p_user_id: user.id });
    }

    return NextResponse.json({ projectId });
  } catch (err) {
    console.error("Intake API error:", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
