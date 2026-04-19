"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { GeneratedFile } from "@/types";
import Link from "next/link";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Props {
  files: GeneratedFile[];
  readme: string;
  downloadUrl: string;
}

const LAYER_COLORS: Record<string, string> = {
  application: "text-pink-400",
  middleware:   "text-purple-400",
  platform_hal: "text-teal-400",
  driver:       "text-amber-400",
  cmsis_sdk:    "text-gray-400",
};

const EXT_TO_LANG: Record<string, string> = {
  c: "c", h: "c", cpp: "cpp", hpp: "cpp",
  cmake: "cmake", txt: "cmake",
  toml: "toml", yaml: "yaml", yml: "yaml",
  json: "json", md: "markdown",
  makefile: "makefile", sh: "shell",
};

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (path.toLowerCase().includes("makefile")) return "makefile";
  return EXT_TO_LANG[ext] ?? "plaintext";
}

export default function FilePreview({ files, readme, downloadUrl }: Props) {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(files[0] ?? null);
  const [view, setView] = useState<"files" | "readme">("files");
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [downloadClicked, setDownloadClicked] = useState(false);

  const grouped: Record<string, GeneratedFile[]> = {};
  for (const file of files) {
    const parts = file.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "root";
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(file);
  }

  function handleDownload() {
    setDownloadClicked(true);
    setTimeout(() => setDownloadClicked(false), 3000);
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1 text-emerald-400">✓ Project generated</h2>
          <p className="text-gray-400 text-sm">
            {files.length} files across {Object.keys(grouped).length} directories.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowFlashModal(true)}
            className="px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 text-sm font-medium transition-all flex items-center gap-2"
          >
            ⚡ Flash to device
          </button>
          <a
            href={downloadUrl}
            download="firmware.zip"
            onClick={handleDownload}
            className={`px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-105 flex items-center gap-2 ${
              downloadClicked
                ? "bg-emerald-600 shadow-lg shadow-emerald-500/25"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
            }`}
          >
            {downloadClicked ? "✓ Downloading…" : "↓ Download .zip"}
          </a>
        </div>
      </div>

      {/* Start new project link */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1">
          {(["files", "readme"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors capitalize ${
                view === v ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {v === "readme" ? "README" : "Files"}
            </button>
          ))}
        </div>
        <Link
          href="/dashboard/generate"
          className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
        >
          + New project
        </Link>
      </div>

      {/* README view */}
      {view === "readme" && (
        <div className="bg-gray-900/50 border border-white/5 rounded-xl p-6 prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className ?? "");
                const isBlock = match !== null;
                return isBlock ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus as Record<string, React.CSSProperties>}
                    language={match![1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>{children}</code>
                );
              },
            }}
          >
            {readme}
          </ReactMarkdown>
        </div>
      )}

      {/* Files view */}
      {view === "files" && (
        <div className="grid grid-cols-3 gap-0 border border-white/5 rounded-xl overflow-hidden">
          {/* File tree */}
          <div className="col-span-1 bg-gray-900/50 border-r border-white/5 overflow-y-auto max-h-[560px]">
            {Object.entries(grouped).map(([dir, dirFiles]) => (
              <div key={dir}>
                <div className="px-3 py-1.5 text-xs text-gray-500 font-mono bg-white/[0.02] border-b border-white/5">
                  {dir === "root" ? "/" : `/${dir}/`}
                </div>
                {dirFiles.map((file) => {
                  const filename = file.path.split("/").pop() ?? file.path;
                  const isSelected = selectedFile?.path === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-4 py-2 text-xs font-mono flex items-center gap-2 border-b border-white/[0.03] transition-colors ${
                        isSelected
                          ? "bg-brand-500/10 text-brand-300"
                          : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200"
                      }`}
                    >
                      <span className={`text-[10px] ${LAYER_COLORS[file.layer] ?? "text-gray-500"}`}>●</span>
                      {filename}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Monaco code viewer */}
          <div className="col-span-2 bg-gray-950 overflow-hidden" style={{ height: 560 }}>
            {selectedFile ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-gray-900/30 flex-shrink-0">
                  <span className="font-mono text-xs text-gray-400">{selectedFile.path}</span>
                  <div className="flex items-center gap-3">
                    {selectedFile.attribution && (
                      <a href={selectedFile.attribution} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:text-brand-300">
                        source →
                      </a>
                    )}
                    <span className={`text-xs font-mono ${LAYER_COLORS[selectedFile.layer] ?? "text-gray-500"}`}>
                      {selectedFile.layer}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <MonacoEditor
                    height="100%"
                    language={getLanguage(selectedFile.path)}
                    value={selectedFile.content}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                Select a file to preview
              </div>
            )}
          </div>
        </div>
      )}

      {/* Layer legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        <span className="text-xs text-gray-600">Layers:</span>
        {Object.entries(LAYER_COLORS).map(([layer, color]) => (
          <div key={layer} className="flex items-center gap-1.5">
            <span className={`text-[10px] ${color}`}>●</span>
            <span className="text-xs text-gray-500 font-mono">{layer}</span>
          </div>
        ))}
      </div>

      {/* Flash modal */}
      {showFlashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowFlashModal(false)}>
          <div className="bg-[#0d1018] border border-white/10 rounded-2xl p-7 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-lg font-bold mb-2">Direct flash — coming soon</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Cloud compilation for STM32 and ESP32 is in development.
              For now, download the zip and use your local toolchain to flash.
            </p>
            <div className="flex gap-2">
              <a
                href={downloadUrl}
                download="firmware.zip"
                onClick={() => { handleDownload(); setShowFlashModal(false); }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium text-center transition-all"
              >
                Download zip ↓
              </a>
              <button
                onClick={() => setShowFlashModal(false)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Close
              </button>
            </div>
            <p className="text-gray-700 text-xs mt-4 text-center">
              ESP32 WebSerial flash (no compile needed) — Q3 2026
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
