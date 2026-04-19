"use client";

import { useState, useCallback } from "react";
import type { ProjectSpec, BOM } from "@/types";
import IntakeWizard from "@/components/wizard/IntakeWizard";
import BOMApproval from "@/components/bom/BOMApproval";
import GenerationProgress from "@/components/progress/GenerationProgress";
import FilePreview from "@/components/file-preview/FilePreview";
import type { GeneratedFile } from "@/types";

type Stage = "intake" | "bom_review" | "generating" | "complete";

const STAGE_META: { key: Stage; label: string; icon: string }[] = [
  { key: "intake",      label: "Describe",    icon: "✏️" },
  { key: "bom_review",  label: "Review BOM",  icon: "📋" },
  { key: "generating",  label: "Generate",    icon: "⚙️" },
  { key: "complete",    label: "Download",    icon: "📦" },
];

export default function GeneratePage() {
  const [stage, setStage] = useState<Stage>("intake");
  const [spec, setSpec] = useState<Partial<ProjectSpec>>({});
  const [bom, setBOM] = useState<BOM | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [readme, setReadme] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState<{ resetIn: string; resetsAt: string } | null>(null);

  async function handleIntakeComplete(completedSpec: ProjectSpec) {
    setError(null);
    setSpec(completedSpec);
    try {
      const res = await fetch("/api/bom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: completedSpec }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `BOM generation failed (${res.status})`);
      }
      const data = await res.json();
      setBOM(data.bom);
      setStage("bom_review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate BOM. Please try again.");
    }
  }

  async function handleBOMApproved() {
    setError(null);
    setLimitInfo(null);
    try {
      const res = await fetch("/api/agents/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, bom }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data.limitReached) {
          setLimitInfo({ resetIn: data.resetIn, resetsAt: data.resetsAt });
        }
        throw new Error(data.error ?? `Failed to start generation (${res.status})`);
      }
      const data = await res.json();
      setProjectId(data.projectId);
      setStage("generating");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start generation. Please try again.");
    }
  }

  const handleGenerationComplete = useCallback((output: {
    files: GeneratedFile[];
    downloadUrl: string;
    readme: string;
  }) => {
    setFiles(output.files);
    setDownloadUrl(output.downloadUrl);
    setReadme(output.readme);
    setStage("complete");
  }, []);

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      {/* Stage indicator */}
      <div className="mb-10">
        <StageIndicator current={stage} />
      </div>

      {/* Error banner */}
      {error && !limitInfo && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
          <span className="text-base leading-none mt-0.5 flex-shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Daily limit banner — upgraded */}
      {limitInfo && (
        <LimitBanner resetIn={limitInfo.resetIn} resetsAt={limitInfo.resetsAt} />
      )}

      {stage === "intake" && (
        <IntakeWizard initialSpec={spec} onComplete={handleIntakeComplete} />
      )}
      {stage === "bom_review" && bom && (
        <BOMApproval
          bom={bom}
          spec={spec as ProjectSpec}
          onApprove={handleBOMApproved}
          onBack={() => setStage("intake")}
        />
      )}
      {stage === "generating" && projectId && bom && (
        <GenerationProgress
          projectId={projectId}
          spec={spec as ProjectSpec}
          bom={bom}
          onComplete={handleGenerationComplete}
        />
      )}
      {stage === "complete" && (
        <FilePreview
          files={files}
          readme={readme}
          downloadUrl={downloadUrl ?? ""}
        />
      )}
    </div>
  );
}

/* ── Stage Indicator ─────────────────────────────────────────────────────── */

function StageIndicator({ current }: { current: Stage }) {
  const currentIndex = STAGE_META.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center">
      {STAGE_META.map((s, i) => {
        const isDone    = i < currentIndex;
        const isActive  = i === currentIndex;
        const isPending = i > currentIndex;

        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400"
                    : isActive
                    ? "bg-blue-500/20 border-2 border-blue-400/60 text-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.35)]"
                    : "bg-white/[0.03] border-2 border-white/8 text-gray-700"
                }`}
              >
                {isDone ? "✓" : s.icon}
              </div>
              <span
                className={`text-[10px] font-semibold whitespace-nowrap ${
                  isDone   ? "text-emerald-500" :
                  isActive ? "text-blue-400" :
                             "text-gray-600"
                }`}
              >
                {s.label}
              </span>
            </div>

            {/* Connector */}
            {i < STAGE_META.length - 1 && (
              <div className="flex-1 mx-2 mb-5">
                <div className="h-[2px] rounded-full overflow-hidden bg-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone
                        ? "bg-gradient-to-r from-emerald-500 to-blue-500 w-full"
                        : "w-0"
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Daily Limit Banner ───────────────────────────────────────────────────── */

function LimitBanner({ resetIn, resetsAt }: { resetIn: string; resetsAt: string }) {
  // Parse hours and minutes from resetIn string like "4h 23m" or "23m"
  const hoursMatch   = resetIn.match(/(\d+)h/);
  const minutesMatch = resetIn.match(/(\d+)m/);
  const hours   = hoursMatch   ? hoursMatch[1].padStart(2, "0")   : null;
  const minutes = minutesMatch ? minutesMatch[1].padStart(2, "0") : "00";

  const localTime = new Date(resetsAt).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  return (
    <div className="mb-6 rounded-xl overflow-hidden border border-amber-500/25 bg-gradient-to-br from-amber-500/8 via-transparent to-transparent">
      <div className="p-5 flex items-start gap-4">
        <span className="text-3xl leading-none mt-0.5 flex-shrink-0">⏳</span>

        <div className="flex-1 min-w-0">
          <p className="text-amber-300 font-bold text-base mb-1">Daily limit reached</p>
          <p className="text-amber-200/60 text-sm mb-4">
            3 of 3 free generations used. Quota resets at{" "}
            <span className="text-amber-300 font-semibold">midnight UTC</span>.
          </p>

          {/* Countdown boxes */}
          <div className="flex items-center gap-2 mb-4">
            {hours !== null && (
              <>
                <div className="bg-black/30 border border-amber-500/20 rounded-lg px-3 py-2 text-center min-w-[52px]">
                  <div className="text-2xl font-black text-amber-300 font-mono leading-none">{hours}</div>
                  <div className="text-[9px] text-amber-500/50 uppercase tracking-widest mt-1">hours</div>
                </div>
                <span className="text-amber-500/40 text-lg font-bold">:</span>
              </>
            )}
            <div className="bg-black/30 border border-amber-500/20 rounded-lg px-3 py-2 text-center min-w-[52px]">
              <div className="text-2xl font-black text-amber-300 font-mono leading-none">{minutes}</div>
              <div className="text-[9px] text-amber-500/50 uppercase tracking-widest mt-1">mins</div>
            </div>
            <span className="text-amber-200/40 text-xs ml-1">until reset</span>
          </div>

          <p className="text-amber-200/30 text-xs mb-3">{localTime}</p>

          <a
            href="/dashboard/settings#billing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/15 hover:from-amber-500/35 hover:to-yellow-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-sm font-bold transition-all duration-200"
          >
            ⚡ Upgrade to Pro — unlimited generations
            <span className="opacity-60">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
