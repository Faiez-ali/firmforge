import { Octokit } from "octokit";
import type { LibraryCandidate, MCUFamily, LicenseType } from "@/types";

const octokit = new Octokit({ auth: process.env.GITHUB_API_TOKEN });

// License string → normalized type
const LICENSE_MAP: Record<string, LicenseType> = {
  mit: "MIT",
  "apache-2.0": "Apache-2.0",
  "bsd-2-clause": "BSD-2-Clause",
  "bsd-3-clause": "BSD-3-Clause",
  "gpl-2.0": "GPL-2.0",
  "gpl-3.0": "GPL-3.0",
  "lgpl-2.1": "LGPL-2.1",
  "lgpl-3.0": "LGPL-3.0",
  isc: "ISC",
  unlicense: "Unlicense",
};

function normalizeLicense(spdx: string | undefined): LicenseType {
  if (!spdx) return "unknown";
  return LICENSE_MAP[spdx.toLowerCase()] ?? "unknown";
}

/**
 * Search GitHub for firmware driver/library repos matching a component and MCU.
 * Returns up to `maxResults` candidates sorted by stars.
 */
export async function searchGitHubLibraries(
  componentName: string,
  mcu: MCUFamily,
  maxResults = 6
): Promise<LibraryCandidate[]> {
  const query = `${componentName} ${mcu} driver library language:C language:C++ NOT "arduino-library-list"`;

  const { data } = await octokit.rest.search.repos({
    q: query,
    sort: "stars",
    order: "desc",
    per_page: maxResults,
  });

  return data.items.map((repo) => ({
    id: `github-${repo.id}`,
    name: repo.full_name,
    description: repo.description ?? "",
    url: repo.html_url,
    source: "github" as const,
    license: normalizeLicense(repo.license?.spdx_id ?? undefined),
    stars: repo.stargazers_count,
    lastCommit: repo.pushed_at ?? undefined,
    mcuCompatibility: [mcu],
    forComponent: componentName,
    cloneUrl: repo.clone_url,
  }));
}

/**
 * Fetch the README content of a repo for evaluation.
 * Returns the decoded text or empty string on failure.
 */
export async function fetchRepoReadme(
  owner: string,
  repo: string
): Promise<string> {
  try {
    const { data } = await octokit.rest.repos.getReadme({ owner, repo });
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

/**
 * Check rate limit status — useful to avoid hitting GitHub API limits.
 */
export async function getRateLimitStatus() {
  const { data } = await octokit.rest.rateLimit.get();
  return data.rate;
}
