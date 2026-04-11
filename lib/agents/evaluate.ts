import type { LibraryCandidate, EvaluationScore, LicenseType } from "@/types";

// License scores — higher = more permissive
const LICENSE_SCORES: Record<LicenseType, number> = {
  "MIT": 20,
  "Apache-2.0": 18,
  "BSD-3-Clause": 18,
  "BSD-2-Clause": 17,
  "ISC": 16,
  "Unlicense": 15,
  "LGPL-2.1": 8,
  "LGPL-3.0": 8,
  "GPL-2.0": 2,
  "GPL-3.0": 2,
  "unknown": 5,
};

/**
 * Score a single library candidate (0–100).
 */
export function scoreLibrary(candidate: LibraryCandidate): EvaluationScore {
  // Stars score (0–25) — logarithmic scale
  const starsScore = candidate.stars
    ? Math.min(25, Math.round(Math.log10(candidate.stars + 1) * 10))
    : 0;

  // Recency score (0–25)
  let recencyScore = 0;
  if (candidate.lastCommit) {
    const daysSinceCommit =
      (Date.now() - new Date(candidate.lastCommit).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCommit < 90) recencyScore = 25;
    else if (daysSinceCommit < 180) recencyScore = 20;
    else if (daysSinceCommit < 365) recencyScore = 15;
    else if (daysSinceCommit < 730) recencyScore = 8;
    else recencyScore = 2;
  }

  // License score (0–20)
  const licenseScore = LICENSE_SCORES[candidate.license] ?? 5;

  // MCU match score (0–20)
  const mcuMatchScore = candidate.source === "curated" ? 20 : 15;

  // README quality (0–10) — curated libs get full score; others get partial
  const readmeQuality = candidate.source === "curated" ? 10 : 6;

  return {
    stars: starsScore,
    recency: recencyScore,
    license: licenseScore,
    mcuMatch: mcuMatchScore,
    readmeQuality,
  };
}

function totalScore(breakdown: EvaluationScore): number {
  return (
    breakdown.stars +
    breakdown.recency +
    breakdown.license +
    breakdown.mcuMatch +
    breakdown.readmeQuality
  );
}

/**
 * Evaluate and rank a list of candidates.
 * Selects the best one per component.
 * Returns the scored list with the winner flagged.
 */
export function evaluateCandidates(
  candidates: LibraryCandidate[]
): LibraryCandidate[] {
  // Score every candidate
  const scored = candidates.map((c) => {
    const breakdown = scoreLibrary(c);
    return { ...c, scoreBreakdown: breakdown, score: totalScore(breakdown) };
  });

  // Group by component
  const grouped: Record<string, LibraryCandidate[]> = {};
  for (const c of scored) {
    const key = c.forComponent;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  }

  // Select the top scorer per component
  const winners: LibraryCandidate[] = [];
  for (const [, group] of Object.entries(grouped)) {
    const sorted = group.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    winners.push(sorted[0]); // Best pick
  }

  return winners;
}

/**
 * Warn the user about any GPL-licensed libraries in the selection.
 * Returns a list of warning messages.
 */
export function getLicenseWarnings(selected: LibraryCandidate[]): string[] {
  const warnings: string[] = [];
  for (const lib of selected) {
    if (lib.license === "GPL-2.0" || lib.license === "GPL-3.0") {
      warnings.push(
        `⚠ ${lib.forComponent}: "${lib.name}" is ${lib.license} licensed. ` +
        `Your entire project must be open-source if you use this. ` +
        `Consider an alternative or FirmForge will generate a non-GPL driver.`
      );
    }
    if (lib.license === "LGPL-2.1" || lib.license === "LGPL-3.0") {
      warnings.push(
        `ℹ ${lib.forComponent}: "${lib.name}" is ${lib.license} licensed. ` +
        `This is generally safe for commercial use if linked as a library, ` +
        `but consult a lawyer for production products.`
      );
    }
  }
  return warnings;
}
