import { site } from "../site";

const repo = new URL(site.github).pathname.slice(1);

/**
 * Star count for the nav, read at build time while the page is prerendered. A private repo,
 * a rate limit or no network all return null, and the nav then shows "Star" without a number.
 */
export async function fetchGitHubStars(): Promise<number | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "preface-landing" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as { stargazers_count?: unknown };
    return typeof body.stargazers_count === "number" ? body.stargazers_count : null;
  } catch {
    return null;
  }
}
