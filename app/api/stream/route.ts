import { NextRequest } from "next/server";
import { z } from "zod";
import { discoverLibraries } from "@/lib/agents/discover";
import { evaluateCandidates, getLicenseWarnings } from "@/lib/agents/evaluate";
import {
  assembleHALLayer,
  assembleDriverLayer,
  assembleApplicationLayer,
  generateReadme,
} from "@/lib/agents/assemble";
import { packageAndDeliver } from "@/lib/agents/deliver";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ProjectSpec, BOM } from "@/types";

export const maxDuration = 300; // 5 min timeout on Vercel Pro
export const dynamic = "force-dynamic";

const StreamBodySchema = z.object({
  projectId: z.string().uuid(),
  spec: z.object({
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
  }),
  bom: z.object({
    items: z.array(z.object({
      name: z.string().min(1).max(200),
      partNumber: z.string().optional(),
      quantity: z.number().int().positive().optional(),
      estimatedPrice: z.number().nonnegative().optional(),
      supplier: z.string().optional(),
      notes: z.string().optional(),
    })),
    estimatedTotal: z.number().nonnegative().optional(),
    notes: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  // Verify the user is authenticated before starting the pipeline
  const supabaseAuth = await createClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = StreamBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request body", details: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { projectId, spec, bom } = parsed.data as { projectId: string; spec: ProjectSpec; bom: BOM };

  // Verify the projectId belongs to the authenticated user — prevents one user
  // from hijacking another user's generation slot.
  const supabaseAdmin = createAdminClient();
  const { data: project, error: projectErr } = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectErr || !project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Set up SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(type: string, data: object) {
        const payload = JSON.stringify({ type, ...data });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      }

      function progress(step: string, text: string, status: "info" | "success" | "warning" | "error" = "info") {
        send("progress", { step, text, status, ts: Date.now() });
      }

      try {
        // ── Step 1: Discovery ────────────────────────────────────────────────
        send("step", { step: "discover", status: "running" });
        progress("discover", "Starting open-source library search...");

        const candidates = await discoverLibraries(spec, (msg) =>
          progress("discover", msg)
        );

        send("step", { step: "discover", status: "done" });

        // ── Step 2: Evaluation ───────────────────────────────────────────────
        send("step", { step: "evaluate", status: "running" });
        progress("evaluate", "Evaluating and scoring library candidates...");

        const selected = evaluateCandidates(candidates);
        const licenseWarnings = getLicenseWarnings(selected);

        if (licenseWarnings.length > 0) {
          licenseWarnings.forEach((w) => progress("evaluate", w, "warning"));
        }

        progress("evaluate", `✓ Selected ${selected.length} libraries`, "success");
        send("step", { step: "evaluate", status: "done" });
        send("libraries", { libraries: selected });

        // ── Step 3: Assembly ─────────────────────────────────────────────────
        send("step", { step: "assemble", status: "running" });

        const halFiles = await assembleHALLayer(spec, (msg) =>
          progress("assemble", msg)
        );

        const driverFiles = await assembleDriverLayer(spec, selected, (msg) =>
          progress("assemble", msg)
        );

        const appFiles = await assembleApplicationLayer(
          spec,
          [...halFiles, ...driverFiles],
          (msg) => progress("assemble", msg)
        );

        const allFiles = [...halFiles, ...driverFiles, ...appFiles];
        progress("assemble", `✓ Generated ${allFiles.length} files`, "success");
        send("step", { step: "assemble", status: "done" });

        // ── Step 4: README generation ────────────────────────────────────────
        progress("deliver", "Generating README and attribution...");
        const readme = await generateReadme(spec, selected, allFiles);

        // ── Step 5: Package & deliver ────────────────────────────────────────
        send("step", { step: "deliver", status: "running" });

        const output = await packageAndDeliver(
          projectId,
          spec,
          allFiles,
          readme,
          selected,
          (msg) => progress("deliver", msg)
        );

        // Update Supabase record
        try {
          const supabase = createAdminClient();
          await supabase
            .from("projects")
            .update({
              status: "complete",
              output_url: output.downloadUrl,
              completed_at: new Date().toISOString(),
            })
            .eq("id", projectId);
        } catch (dbErr) {
          console.warn("DB update failed:", dbErr);
        }

        send("step", { step: "deliver", status: "done" });
        send("complete", {
          files: allFiles,
          downloadUrl: output.downloadUrl,
          readme,
        });

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Pipeline error:", err);
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
