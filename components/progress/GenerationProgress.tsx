"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ProjectSpec, BOM, GeneratedFile } from "@/types";

interface ProgressMessage {
  step: string;
  text: string;
  status: "info" | "success" | "warning" | "error";
  ts: number;
}

interface Props {
  projectId: string;
  spec: ProjectSpec;
  bom: BOM;
  onComplete: (output: { files: GeneratedFile[]; downloadUrl: string; readme: string }) => void;
}

const STEP_LABELS: Record<string, string> = {
  discover: "Searching open-source repos",
  evaluate: "Evaluating library candidates",
  assemble: "Assembling codebase",
  deliver:  "Packaging & uploading",
};

const STEPS = ["discover", "evaluate", "assemble", "deliver"] as const;

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v3.5A4.5 4.5 0 007.5 12H4z" />
    </svg>
  );
}

export default function GenerationProgress({ projectId, spec, bom, onComplete }: Props) {
  const [messages, setMessages] = useState<ProgressMessage[]>([]);
  const [stepStatus, setStepStatus] = useState<Record<string, "pending" | "running" | "done" | "error">>({
    discover: "pending", evaluate: "pending", assemble: "pending", deliver: "pending",
  });
  const [elapsed, setElapsed] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ elapsed: number; fileCount: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(Date.now());
  const rafRef = useRef<number>(0);
  const targetProgress = useRef(0);
  const currentProgress = useRef(0);

  // Smooth progress bar animation
  useEffect(() => {
    const animate = () => {
      const diff = targetProgress.current - currentProgress.current;
      if (Math.abs(diff) > 0.1) {
        currentProgress.current += diff * 0.06;
        setSmoothProgress(currentProgress.current);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime.current) / 1000));
    }, 1000);

    let controller: AbortController | null = new AbortController();

    const run = async () => {
      try {
        const res = await fetch("/api/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, spec, bom }),
          signal: controller?.signal,
        });

        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "progress") {
                setMessages((prev) => [...prev, {
                  step: event.step, text: event.text,
                  status: event.status, ts: event.ts,
                }]);
              }

              if (event.type === "step") {
                setStepStatus((prev) => {
                  const next = { ...prev, [event.step]: event.status };
                  const done = Object.values(next).filter((s) => s === "done").length;
                  const running = Object.values(next).filter((s) => s === "running").length;
                  targetProgress.current = (done / 4) * 100 + (running ? 12 : 0);
                  return next;
                });
              }

              if (event.type === "complete") {
                targetProgress.current = 100;
                const fileCount = (event.files as unknown[]).length;
                const elapsedSecs = Math.round((Date.now() - startTime.current) / 1000);
                setSuccessInfo({ elapsed: elapsedSecs, fileCount });
                setShowSuccess(true);
                setTimeout(() => {
                  setShowSuccess(false);
                  onComplete({ files: event.files, downloadUrl: event.downloadUrl, readme: event.readme });
                }, 2500);
              }

              if (event.type === "error") {
                setStreamError(event.message ?? "Unknown error from pipeline.");
              }
            } catch {}
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setStreamError("Connection to pipeline lost.");
        }
      }
    };

    run();
    return () => { clearInterval(timer); controller?.abort(); controller = null; };
  }, [projectId, spec, bom, onComplete]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Success overlay
  if (showSuccess && successInfo) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <div className="text-5xl mb-5">✓</div>
        <h2 className="text-2xl font-bold text-emerald-400 mb-2">Project generated</h2>
        <p className="text-gray-400">
          {successInfo.fileCount} files assembled in {successInfo.elapsed}s
        </p>
      </div>
    );
  }

  // Error state
  if (streamError) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/30">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Generation failed</h3>
          <p className="text-gray-400 text-sm mb-5">{streamError}</p>
          <div className="flex gap-3">
            <Link
              href="/dashboard/generate"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium transition-all"
            >
              Try again
            </Link>
            <a
              href="mailto:support@firmforge.dev"
              className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    );
  }

  const activeStep = STEPS.find((s) => stepStatus[s] === "running");

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Generating your firmware project</h2>
        <p className="text-gray-400 text-sm">
          {activeStep ? STEP_LABELS[activeStep] + "…" : "AI agents are assembling your codebase."}
        </p>
      </div>

      {/* Step grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {STEPS.map((key) => {
          const status = stepStatus[key];
          return (
            <div key={key} className={`p-3 rounded-xl border text-center transition-all duration-300 ${
              status === "running" ? "border-brand-500/50 bg-brand-500/10"
              : status === "done"  ? "border-emerald-500/30 bg-emerald-500/5"
              : status === "error" ? "border-red-500/30 bg-red-500/5"
              : "border-white/5 bg-white/[0.02]"
            }`}>
              <div className="flex justify-center mb-1.5 h-5 items-center">
                {status === "done"    && <span className="text-emerald-400 text-base">✓</span>}
                {status === "running" && <Spinner size={16} />}
                {status === "error"   && <span className="text-red-400 text-base">✕</span>}
                {status === "pending" && <span className="w-2 h-2 rounded-full bg-gray-700 inline-block" />}
              </div>
              <div className="text-[10px] text-gray-400 leading-tight">{STEP_LABELS[key]}</div>
            </div>
          );
        })}
      </div>

      {/* Smooth progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
            style={{ width: `${smoothProgress}%`, transition: "none" }}
          />
        </div>
        <span className="text-xs text-gray-500 font-mono w-8 text-right">{elapsed}s</span>
      </div>

      {/* Terminal */}
      <div className="bg-gray-950 border border-white/5 rounded-xl p-4 h-80 overflow-y-auto font-mono text-xs">
        {messages.length === 0 ? (
          <div className="text-gray-700 flex items-center gap-2">
            <Spinner size={12} />
            <span>Connecting to pipeline<AnimatedDots /></span>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 mb-1 ${
              msg.status === "error"   ? "text-red-400"
              : msg.status === "warning" ? "text-yellow-400"
              : msg.status === "success" ? "text-emerald-400"
              : "text-gray-400"
            }`}>
              <span className="text-gray-700 flex-shrink-0">
                [{new Date(msg.ts).toLocaleTimeString()}]
              </span>
              <span>{msg.text}</span>
            </div>
          ))
        )}
        {activeStep && (
          <div className="flex gap-2 text-brand-400 mt-1">
            <span className="animate-pulse">▋</span>
            <span>{STEP_LABELS[activeStep]}<AnimatedDots /></span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function AnimatedDots() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const id = setInterval(() => setDots((d) => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(id);
  }, []);
  return <span>{dots}</span>;
}
