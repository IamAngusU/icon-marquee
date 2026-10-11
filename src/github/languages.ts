import { config } from "../config";
import { resolveIconName } from "../utils/registry";

const LANGUAGE_ICONS: Readonly<Record<string, string>> = {
  "c#": "csharp",
  "c++": "cpp",
  dockerfile: "docker",
  "f#": "fsharp",
  go: "golang",
  hcl: "terraform",
  "jupyter notebook": "jupyter",
  less: "less",
  mdx: "markdown",
  "objective-c": "objectivec",
  "objective-c++": "objectivec",
  powershell: "powershell",
  r: "r",
  scss: "sass",
  shell: "bash",
  solidity: "solidity",
  svelte: "svelte",
  tex: "latex",
  tsx: "typescript",
  typescript: "typescript",
  vue: "vuejs",
};

type CacheEntry = {
  etag?: string;
  fetchedAt: number;
  lastAccess: number;
  values: Readonly<Record<string, number>>;
};

export type GithubLanguage = {
  name: string;
  bytes: number;
  percentage: number;
  icon?: string;
};

export type GithubLanguages = {
  cache: "fresh" | "refreshed" | "revalidated" | "stale";
  icons: string[];
  languages: GithubLanguage[];
  unsupported: string[];
};

export class GithubLanguagesError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<GithubLanguages>>();

export function languageIcon(language: string): string | undefined {
  const normalized = language.trim().toLowerCase();
  const candidate =
    LANGUAGE_ICONS[normalized] ?? normalized.replace(/[^a-z0-9+#]/g, "");
  return resolveIconName(candidate);
}

function describe(
  values: Readonly<Record<string, number>>,
  cacheState: GithubLanguages["cache"],
): GithubLanguages {
  const total = Object.values(values).reduce((sum, bytes) => sum + bytes, 0);
  const languages = Object.entries(values)
    .filter(
      ([name, bytes]) =>
        name.length > 0 && name.length <= 100 && Number.isSafeInteger(bytes),
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: total ? Math.round((bytes / total) * 1000) / 10 : 0,
      icon: languageIcon(name),
    }));
  return {
    cache: cacheState,
    icons: [...new Set(languages.flatMap((language) => language.icon ?? []))],
    languages,
    unsupported: languages
      .filter((language) => !language.icon)
      .map((language) => language.name),
  };
}

function remember(key: string, entry: CacheEntry) {
  cache.delete(key);
  cache.set(key, entry);
  while (cache.size > config.github.maxCacheEntries) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function validPayload(value: unknown): value is Record<string, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (bytes) =>
        typeof bytes === "number" && Number.isSafeInteger(bytes) && bytes >= 0,
    )
  );
}

export async function getGithubLanguages(
  owner: string,
  repo: string,
  fetcher: typeof fetch = fetch,
  clock: () => number = Date.now,
): Promise<GithubLanguages> {
  const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const now = clock();
  const cached = cache.get(key);
  if (cached && now - cached.fetchedAt < config.github.cacheFreshMs) {
    cached.lastAccess = now;
    return describe(cached.values, "fresh");
  }
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      config.github.requestTimeoutMs,
    );
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": config.appName,
        "X-GitHub-Api-Version": "2022-11-28",
      };
      if (cached?.etag) headers["If-None-Match"] = cached.etag;
      if (config.github.apiToken)
        headers.Authorization = `Bearer ${config.github.apiToken}`;
      const response = await fetcher(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
        { headers, signal: controller.signal },
      );
      if (response.status === 304 && cached) {
        const entry = { ...cached, fetchedAt: now, lastAccess: now };
        remember(key, entry);
        return describe(entry.values, "revalidated");
      }
      if (response.status === 404)
        throw new GithubLanguagesError(
          "Public repository not found. Check the URL and visibility.",
          404,
        );
      if (!response.ok)
        throw new GithubLanguagesError(
          response.status === 403 || response.status === 429
            ? "GitHub is busy. Try this repository again shortly."
            : "Could not read this repository from GitHub.",
          response.status === 403 || response.status === 429
            ? 503
            : response.status,
        );
      const values: unknown = await response.json();
      if (!validPayload(values))
        throw new GithubLanguagesError(
          "GitHub returned an invalid language summary.",
          502,
        );
      const entry: CacheEntry = {
        etag: response.headers.get("ETag") ?? undefined,
        fetchedAt: now,
        lastAccess: now,
        values,
      };
      remember(key, entry);
      return describe(entry.values, "refreshed");
    } catch (error) {
      if (
        cached &&
        now - cached.fetchedAt < config.github.cacheStaleMs &&
        (!(error instanceof GithubLanguagesError) || error.status !== 404)
      ) {
        cached.lastAccess = now;
        return describe(cached.values, "stale");
      }
      if (error instanceof GithubLanguagesError) throw error;
      throw new GithubLanguagesError(
        "GitHub did not respond in time. Try again shortly.",
        503,
      );
    } finally {
      clearTimeout(timeout);
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, request);
  return request;
}

export function clearGithubLanguageCache() {
  cache.clear();
  inFlight.clear();
}
