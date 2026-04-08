"use client";

import { useState } from "react";
import type { GeneratedFile } from "@/types";

interface Props {
  files: GeneratedFile[];
  readme: string;
  downloadUrl: string;
}

const LAYER_COLORS: Record<string, string> = {
  application: "text-pink-400",
  middleware: "text-purple-400",
  platform_hal: "text-teal-400",
  driver: "text-amber-400",
  cmsis_sdk: "text-gray-400",
};

const LANG_SYNTAX_CLASS: Record<string, string> = {
  c: "language-c",
  cpp: "language-cpp",
  h: "language-c",
  cmake: "language-cmake",
  md: "language-markdown",
  toml: "language-toml",
  yaml: "language-yaml",
  json: "language-json",
  makefile: "language-makefile",
};

export default function FilePreview({ files, readme, downloadUrl }: Props) {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(
    files[0] ?? null
  );
  const [view, setView] = useState<"files" | "readme">("files");

  // Group files by directory
  const grouped: Record<string, GeneratedFile[]> = {};
  for (const file of files) {
    const parts = file.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "root";
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(file);
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 text-green-400">
            ✓ Project generated
          </h2>
          <p className="text-gray-400 text-sm">
            {files.length} files across {Object.keys(grouped).length} directories.
            Browse below or download the zip.
          </p>
        </div>
        <a
          href={downloadUrl}
          download="firmware.zip"
          className="self-start sm:flex-shrink-0 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-all hover:scale-105"
        >
          ↓ Download .zip
        </a>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setView("files")}
          className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
            view === "files" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Files
        </button>
        <button
          onClick={() => setView("readme")}
          className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
            view === "readme" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          README
        </button>
      </div>

      {view === "readme" && (
        <div className="bg-gray-900/50 border border-white/5 rounded-xl p-6 prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-xs text-gray-300 font-mono leading-relaxed">
            {readme}
          </pre>
        </div>
      )}

      {view === "files" && (
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-0 border border-white/5 rounded-xl overflow-hidden">
          {/* File tree */}
          <div className="sm:col-span-1 bg-gray-900/50 border-b sm:border-b-0 sm:border-r border-white/5 overflow-y-auto max-h-[220px] sm:max-h-[500px]">
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
                      <span className={`text-[10px] ${LAYER_COLORS[file.layer] ?? "text-gray-500"}`}>
                        ●
                      </span>
                      {filename}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Code viewer */}
          <div className="sm:col-span-2 bg-gray-950 overflow-auto max-h-[360px] sm:max-h-[500px]">
            {selectedFile ? (
              <div>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-gray-900/30">
                  <span className="font-mono text-xs text-gray-400">{selectedFile.path}</span>
                  <div className="flex items-center gap-3">
                    {selectedFile.attribution && (
                      <a
                        href={selectedFile.attribution}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-400 hover:text-brand-300"
                      >
                        source →
                      </a>
                    )}
                    <span className={`text-xs font-mono ${LAYER_COLORS[selectedFile.layer] ?? "text-gray-500"}`}>
                      {selectedFile.layer}
                    </span>
                  </div>
                </div>
                <pre className="p-4 text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
                  {selectedFile.content}
                </pre>
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
    </div>
  );
}
