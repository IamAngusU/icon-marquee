import { describe, expect, test } from "bun:test";
import type { GithubLanguages } from "../../github/languages";
import { createGithubRoutes } from ".";

const detected: GithubLanguages = {
  cache: "fresh",
  icons: ["typescript", "javascript", "html", "css"],
  unsupported: ["Brainfuck"],
  languages: [
    { name: "TypeScript", bytes: 700, percentage: 70, icon: "typescript" },
    { name: "JavaScript", bytes: 150, percentage: 15, icon: "javascript" },
    { name: "HTML", bytes: 100, percentage: 10, icon: "html" },
    { name: "CSS", bytes: 40, percentage: 4, icon: "css" },
    { name: "Brainfuck", bytes: 10, percentage: 1 },
  ],
};

describe("GET /api/:owner/:repo", () => {
  test("previews detected languages as JSON", async () => {
    const routes = createGithubRoutes(async () => detected);
    const res = await routes.request("/IamAngusU/icon-marquee.json");

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, no-cache");
    expect(await res.json()).toMatchObject({
      repository: "IamAngusU/icon-marquee",
      selectedIcons: ["typescript", "javascript", "html", "css"],
      unsupported: ["Brainfuck"],
    });
  });

  test("renders a live SVG with include and exclude overrides", async () => {
    const routes = createGithubRoutes(async () => detected);
    const res = await routes.request(
      "/octo/demo.svg?exclude=html,css&include=docker&width=640&height=64",
    );
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(res.headers.get("Cache-Control")).toBe("public, no-cache");
    expect(res.headers.get("ETag")).toMatch(/^"[\w-]+"$/);
    expect(res.headers.get("X-Icon-Marquee-Repository")).toBe("octo/demo");
    expect(res.headers.get("X-Unsupported-Languages")).toBe("Brainfuck");
    expect(body).toStartWith('<svg width="640" height="64"');
    expect(body.match(/<g id="asset-/g)).toHaveLength(3);

    const revalidated = await routes.request(
      "/octo/demo.svg?exclude=html,css&include=docker&width=640&height=64",
      { headers: { "If-None-Match": res.headers.get("ETag") ?? "" } },
    );
    expect(revalidated.status).toBe(304);
    expect(revalidated.headers.get("Cache-Control")).toBe("public, no-cache");
  });

  test("supports a static row and reports invalid paths", async () => {
    const routes = createGithubRoutes(async () => detected);
    const row = await routes.request("/octo/demo.svg?mode=icons");
    const invalid = await routes.request("/not valid/demo.svg");

    expect(row.status).toBe(200);
    expect(await row.text()).not.toContain("@keyframes scroll");
    expect(invalid.status).toBe(400);
  });
});
