"use client";

import { useState, useCallback } from "react";
import type { ProjectSpec, BOM } from "@/types";
import IntakeWizard from "@/components/wizard/IntakeWizard";
import BOMApproval from "@/components/bom/BOMApproval";
import GenerationProgress from "@/components/progress/GenerationProgress";
import FilePreview from "@/components/file-preview/FilePreview";
import type { GeneratedFile } from "@/types";

type Stage = "intake" | "bom_review" | "generating" | "complete";

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

  // Called when intake wizard completes the spec
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

  // Called when user approves the BOM
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

  // Stable reference — useCallback prevents SSE reconnect loop in GenerationProgress
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
    <div className="px-6 py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <StageIndicator current={stage} />
      </div>

      {error && !limitInfo && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {limitInfo && (
        <div className="mb-6 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5">⏳</span>
            <div className="flex-1">
              <p className="text-amber-300 font-semibold mb-1">Daily limit reached — 3 of 3 generations used</p>
              <p className="text-amber-200/70">
                Your free quota resets at{" "}
                <span className="text-amber-300 font-medium">midnight UTC</span>
                {" "}—{" "}
                <span className="text-amber-300 font-medium">in {limitInfo.resetIn}</span>.
              </p>
              <p className="text-amber-200/50 text-xs mt-2">
                Reset time: {new Date(limitInfo.resetsAt).toLocaleString(undefined, {
                  weekday: "short", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit", timeZoneName: "short",
                })}
              </p>
              <a
                href="/dashboard/settings#billing"
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
              >
                Upgrade to Pro — unlimited generations →
              </a>
            </div>
          </div>
        </div>
      )}

      {stage === "intake" && (
        <IntakeWizard
          initialSpec={spec}
          onComplete={handleIntakeComplete}
        />
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

const STAGES: { key: Stage; label: string }[] = [
  { key: "intake", label: "Describe" },
  { key: "bom_review", label: "Review BOM" },
  { key: "generating", label: "Generate" },
  { key: "complete", label: "Download" },
];

function StageIndicator({ current }: { current: Stage }) {
  const currentIndex = STAGES.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-2">
      {STAGES.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              i < currentIndex
                ? "bg-green-500/10 text-green-400"
                : i === currentIndex
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                : "text-gray-600"
            }`}
          >
            {i < currentIndex && <span>✓</span>}
            {s.label}
          </div>
          {i < STAGES.length - 1 && (
            <span className="text-gray-700 text-xs">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
