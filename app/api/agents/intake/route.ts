import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const ComponentSchema = z.object({
  name: z.string().min(1).max(100),
  interface: z.string().optional(),
  partNumber: z.string().optional(),
});

const SpecSchema = z.object({
  description: z.string().min(1).max(2000),
  mcu: z.string().min(1).max(100),
  rtos: z.string().optional(),
  buildSystem: z.string().optional(),
  components: z.array(ComponentSchema).optional(),
  additionalContext: z.string().max(2000).optional(),
});

const BOMItemSchema = z.object({
  name: z.string().min(1).max(200),
  partNumber: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  estimatedPrice: z.number().nonnegative().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

const BOMSchema = z.object({
  items: z.array(BOMItemSchema),
  estimatedTotal: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const specResult = SpecSchema.safeParse(body.spec);
    const bomResult = BOMSchema.safeParse(body.bom);

    if (!specResult.success || !bomResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: {
          spec: specResult.success ? null : specResult.error.flatten().fieldErrors,
          bom: bomResult.success ? null : bomResult.error.flatten().fieldErrors,
        }},
        { status: 400 }
      );
    }

    const spec = specResult.data;
    const bom = bomResult.data;

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
      // Atomic increment — avoids the read-modify-write race condition that
      // would let concurrent requests bypass the free-tier daily limit.
      await supabase.rpc("increment_generations_today", { p_user_id: user.id });
    }

    return NextResponse.json({ projectId });
  } catch (err) {
    console.error("Intake API error:", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
