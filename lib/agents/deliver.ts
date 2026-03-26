import JSZip from "jszip";
import { uploadProjectZip, getDownloadUrl } from "@/lib/r2/client";
import type { GeneratedFile, ProjectSpec, LibraryCandidate, ProjectOutput } from "@/types";

/**
 * Package all generated files into a zip, upload to R2, and return the download URL.
 */
export async function packageAndDeliver(
  projectId: string,
  spec: ProjectSpec,
  files: GeneratedFile[],
  readme: string,
  selectedLibraries: LibraryCandidate[],
  onProgress?: (msg: string) => void
): Promise<ProjectOutput> {
  onProgress?.("Packaging project files into zip archive...");

  const zip = new JSZip();
  const projectFolder = zip.folder(spec.mcuModel?.toLowerCase().replace(/\s+/g, "-") ?? "firmware");

  if (!projectFolder) throw new Error("Failed to create zip folder");

  // Add all generated source files
  for (const file of files) {
    projectFolder.file(file.path, file.content);
  }

  // Add README
  projectFolder.file("README.md", readme);

  // Add attribution file
  const attribution = buildAttributionFile(selectedLibraries);
  projectFolder.file("LICENSES.md", attribution);

  // Add .env template if needed
  projectFolder.file(".gitignore", "build/\n.cache/\n*.o\n*.d\n");

  onProgress?.("Uploading to storage...");

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const r2Key = await uploadProjectZip(projectId, zipBuffer);
  const downloadUrl = await getDownloadUrl(r2Key);

  onProgress?.("✓ Project ready for download");

  return {
    projectId,
    spec,
    files,
    readme,
    librariesUsed: selectedLibraries,
    buildInstructions: extractBuildInstructions(readme),
    downloadUrl,
    generatedAt: new Date().toISOString(),
  };
}

function buildAttributionFile(libraries: LibraryCandidate[]): string {
  const lines = [
    "# Third-Party Library Attributions",
    "",
    "This project uses the following open-source libraries:",
    "",
  ];

  for (const lib of libraries) {
    if (!lib.url) continue;
    lines.push(`## ${lib.forComponent}`);
    lines.push(`- **Library:** ${lib.name}`);
    lines.push(`- **License:** ${lib.license}`);
    lines.push(`- **Source:** ${lib.url}`);
    lines.push("");
  }

  lines.push(
    "All FirmForge-generated code is provided under the MIT License.",
    "",
    "MIT License",
    "",
    "Copyright (c) 2026 FirmForge",
    "",
    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software...'
  );

  return lines.join("\n");
}

function extractBuildInstructions(readme: string): string {
  // Extract the build instructions section from the README
  const match = readme.match(/## Build Instructions?([\s\S]*?)(?=\n## |\n# |$)/i);
  return match ? match[1].trim() : "See README.md for build instructions.";
}
