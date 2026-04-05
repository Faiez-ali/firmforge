"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectSpec, BOM, GeneratedFile, AgentStep } from "@/types";

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
  deliver: "Packaging & uploading",
};

export default function GenerationProgress({ projectId, spec, bom, onComplete }: Props) {
  const [messages, setMessages] = useState<ProgressMessage[]>([]);
  const [stepStatus, setStepStatus] = useState<Record<string, "pending" | "running" | "done" | "error">>({
    discover: "pending",
    evaluate: "pending",
    assemble: "pending",
    deliver: "pending",
  });
  const [elapsed, setElapsed] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime.current) / 1000));
    }, 1000);

    // Start the SSE stream
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
                setMessages((prev) => [
                  ...prev,
                  { step: event.step, text: event.text, status: event.status, ts: event.ts },
                ]);
              }

              if (event.type === "step") {
                setStepStatus((prev) => ({ ...prev, [event.step]: event.status }));
              }

              if (event.type === "complete") {
                onComplete({
                  files: event.files,
                  downloadUrl: event.downloadUrl,
                  readme: event.readme,
                });
              }

              if (event.type === "error") {
                setMessages((prev) => [
                  ...prev,
                  { step: "system", text: `Error: ${event.message}`, status: "error", ts: Date.now() },
                ]);
              }
            } catch {}
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setMessages((prev) => [
            ...prev,
            { step: "system", text: "Connection lost. Please refresh.", status: "error", ts: Date.now() },
          ]);
        }
      }
    };

    run();

    return () => {
      clearInterval(timer);
      controller?.abort();
      controller = null;
    };
  }, [projectId, spec, bom, onComplete]);

  // Auto-scroll terminal
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeStep = Object.entries(stepStatus).find(([, s]) => s === "running")?.[0];
  const doneSteps = Object.values(stepStatus).filter((s) => s === "done").length;
  const progress = (doneSteps / 4) * 100;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Generating your firmware project</h2>
        <p className="text-gray-400 text-sm">
          AI agents are searching open-source repos and assembling your codebase.
        </p>
      </div>

      {/* Stage indicators */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {Object.entries(STEP_LABELS).map(([key, label]) => {
          const status = stepStatus[key];
          return (
            <div
              key={key}
              className={`p-3 rounded-xl border text-center transition-all ${
                status === "running"
                  ? "border-brand-500/50 bg-brand-500/10"
                  : status === "done"
                  ? "border-green-500/30 bg-green-500/5"
                  : status === "error"
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="text-lg mb-1">
                {status === "done" ? "✓" : status === "running" ? "⟳" : status === "error" ? "✕" : "○"}
              </div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 font-mono">{elapsed}s</span>
      </div>

      {/* Terminal-style log */}
      <div className="bg-gray-900/80 border border-white/5 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 mb-1 ${
            msg.status === "error" ? "text-red-400"
            : msg.status === "warning" ? "text-yellow-400"
            : msg.status === "success" ? "text-green-400"
            : "text-gray-400"
          }`}>
            <span className="text-gray-600">[{new Date(msg.ts).toLocaleTimeString()}]</span>
            <span>{msg.text}</span>
          </div>
        ))}
        {activeStep && (
          <div className="flex gap-2 text-brand-400 mt-1">
            <span className="animate-pulse">▋</span>
            <span>{STEP_LABELS[activeStep]}...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
