"use client";

import { useState } from "react";
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

  // Called when intake wizard completes the spec
  async function handleIntakeComplete(completedSpec: ProjectSpec) {
    setSpec(completedSpec);

    // Generate BOM from the spec
    const res = await fetch("/api/bom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec: completedSpec }),
    });
    const data = await res.json();
    setBOM(data.bom);
    setStage("bom_review");
  }

  // Called when user approves the BOM
  async function handleBOMApproved() {
    // Create project record and get ID
    const res = await fetch("/api/agents/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec, bom }),
    });
    const data = await res.json();
    setProjectId(data.projectId);
    setStage("generating");
  }

  // Called when generation pipeline completes
  function handleGenerationComplete(output: {
    files: GeneratedFile[];
    downloadUrl: string;
    readme: string;
  }) {
    setFiles(output.files);
    setDownloadUrl(output.downloadUrl);
    setReadme(output.readme);
    setStage("complete");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-lg font-semibold tracking-tight">
          Firm<span className="text-brand-400">Forge</span>
        </a>
        <StageIndicator current={stage} />
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
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
