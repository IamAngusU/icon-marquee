import { afterEach, describe, expect, test } from "bun:test";
import { config } from "../config";
import {
  clearGithubLanguageCache,
  getGithubLanguages,
  languageIcon,
} from "./languages";

afterEach(clearGithubLanguageCache);

describe("GitHub language discovery", () => {
  test("maps GitHub language names to bundled icons by byte share", async () => {
    let requests = 0;
    const fetcher = (async () => {
      requests++;
      return new Response(
        JSON.stringify({ TypeScript: 900, HTML: 80, "C++": 20, Brainfuck: 1 }),
        { status: 200, headers: { ETag: '"stack-1"' } },
      );
    }) as unknown as typeof fetch;

    const first = await getGithubLanguages("octo", "demo", fetcher);
    const second = await getGithubLanguages("octo", "demo", fetcher);

    expect(first.icons).toEqual(["typescript", "html", "cpp"]);
    expect(first.unsupported).toEqual(["Brainfuck"]);
    expect(first.languages[0]).toMatchObject({
      name: "TypeScript",
      icon: "typescript",
      percentage: 89.9,
    });
    expect(second.cache).toBe("fresh");
    expect(requests).toBe(1);
  });

  test("covers common Linguist names that are not icon filenames", () => {
    expect(languageIcon("Shell")).toBe("bash");
    expect(languageIcon("Jupyter Notebook")).toBe("jupyter");
    expect(languageIcon("Objective-C++")).toBe("objectivec");
    expect(languageIcon("Vue")).toBe("vuejs");
  });

  test("revalidates with GitHub's ETag after the fresh window", async () => {
    let requests = 0;
    let validator = "";
    let now = 1_000;
    const fetcher = (async (_input: unknown, init?: RequestInit) => {
      requests++;
      validator = new Headers(init?.headers).get("If-None-Match") ?? "";
      if (requests === 1)
        return new Response(JSON.stringify({ Go: 42 }), {
          headers: { ETag: '"go-1"' },
        });
      return new Response(null, { status: 304 });
    }) as unknown as typeof fetch;

    const first = await getGithubLanguages("octo", "go", fetcher, () => now);
    now += config.github.cacheFreshMs + 1;
    const second = await getGithubLanguages("octo", "go", fetcher, () => now);

    expect(first.icons).toEqual(["golang"]);
    expect(second.cache).toBe("revalidated");
    expect(validator).toBe('"go-1"');
  });

  test("serves last-known-good data during a temporary GitHub failure", async () => {
    let requests = 0;
    let now = 1_000;
    const fetcher = (async () => {
      requests++;
      if (requests === 1)
        return new Response(JSON.stringify({ Rust: 42 }), {
          headers: { ETag: '"rust-1"' },
        });
      return new Response("upstream error", { status: 500 });
    }) as unknown as typeof fetch;

    await getGithubLanguages("octo", "rust", fetcher, () => now);
    now += config.github.cacheFreshMs + 1;
    const fallback = await getGithubLanguages(
      "octo",
      "rust",
      fetcher,
      () => now,
    );

    expect(fallback.icons).toEqual(["rust"]);
    expect(fallback.cache).toBe("stale");
  });
});
