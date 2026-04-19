"use client";

import { useState, useCallback } from "react";
import type { ProjectSpec, BOM } from "@/types";
import IntakeWizard from "@/components/wizard/IntakeWizard";
import BOMApproval from "@/components/bom/BOMApproval";
import SchematicViewer from "@/components/schematic/SchematicViewer";
import GenerationProgress from "@/components/progress/GenerationProgress";
import FilePreview from "@/components/file-preview/FilePreview";
import type { GeneratedFile } from "@/types";
import type { Schematic } from "@/lib/agents/schematic";

type Stage = "intake" | "bom_loading" | "bom_review" | "schematic" | "generating" | "complete";

export default function GeneratePage() {
  const [stage, setStage] = useState<Stage>("intake");
  const [spec, setSpec] = useState<Partial<ProjectSpec>>({});
  const [bom, setBOM] = useState<BOM | null>(null);
  const [schematic, setSchematic] = useState<Schematic | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [readme, setReadme] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [bomApproving, setBomApproving] = useState(false);

  async function handleIntakeComplete(completedSpec: ProjectSpec) {
    setError(null);
    setSpec(completedSpec);
    setStage("bom_loading");
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
      if (data.schematic) setSchematic(data.schematic);
      setStage("bom_review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate BOM. Please try again.");
      setStage("intake");
    }
  }

  async function handleBOMApproved() {
    setError(null);
    setBomApproving(true);
    try {
      const res = await fetch("/api/agents/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, bom }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to start generation (${res.status})`);
      }
      const data = await res.json();
      setProjectId(data.projectId);
      setStage(schematic ? "schematic" : "generating");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start generation. Please try again.");
    } finally {
      setBomApproving(false);
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

  const currentStageIndex = ["intake", "bom_loading", "bom_review", "schematic", "generating", "complete"]
    .indexOf(stage);

  return (
    <div className="px-6 py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <StageIndicator current={stage} />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {stage === "intake" && (
        <IntakeWizard initialSpec={spec} onComplete={handleIntakeComplete} />
      )}

      {stage === "bom_loading" && <BOMLoadingScreen />}

      {stage === "bom_review" && bom && (
        <BOMApproval
          bom={bom}
          spec={spec as ProjectSpec}
          onApprove={handleBOMApproved}
          onBack={() => setStage("intake")}
          loading={bomApproving}
        />
      )}

      {stage === "schematic" && schematic && (
        <SchematicViewer
          schematic={schematic}
          onProceed={() => setStage("generating")}
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
        <FilePreview files={files} readme={readme} downloadUrl={downloadUrl ?? ""} />
      )}
    </div>
  );
}

function BOMLoadingScreen() {
  return (
    <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center animate-pulse">
          <svg width="28" height="28" viewBox="0 0 80 80" fill="none">
            <rect x="8"  y="11" width="54" height="5" rx="2" fill="#5291ff" />
            <rect x="8"  y="26" width="42" height="5" rx="2" fill="#5291ff" />
            <rect x="8"  y="41" width="30" height="5" rx="2" fill="#5291ff" />
            <rect x="8"  y="56" width="18" height="5" rx="2" fill="#5291ff" />
          </svg>
        </div>
      </div>
      <h2 className="text-xl font-bold mb-2">Analyzing your project spec…</h2>
      <RotatingLabel labels={[
        "Reading MCU family",
        "Matching interfaces",
        "Selecting components",
        "Estimating BOM cost",
        "Generating schematic",
      ]} />
    </div>
  );
}

function RotatingLabel({ labels }: { labels: string[] }) {
  const [index, setIndex] = useState(0);
  useState(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % labels.length), 1400);
    return () => clearInterval(id);
  });
  return (
    <p className="text-sm text-gray-500 font-mono mt-2 h-5 transition-all">
      {labels[index]}…
    </p>
  );
}

const INDICATOR_STAGES = [
  { key: "intake",      label: "Describe"  },
  { key: "bom_review",  label: "Review BOM" },
  { key: "schematic",   label: "Schematic"  },
  { key: "generating",  label: "Generate"   },
  { key: "complete",    label: "Download"   },
] as const;

function StageIndicator({ current }: { current: Stage }) {
  const resolvedCurrent = current === "bom_loading" ? "bom_review" : current;
  const currentIndex = INDICATOR_STAGES.findIndex((s) => s.key === resolvedCurrent);
  return (
    <div className="flex items-center gap-2">
      {INDICATOR_STAGES.map((s, i) => (
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
          {i < INDICATOR_STAGES.length - 1 && (
            <span className="text-gray-700 text-xs">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
