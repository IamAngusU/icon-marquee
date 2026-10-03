import { describe, expect, test } from "bun:test";
import { llmsRoutes } from ".";

describe("GET /llms.txt", () => {
  test("serves usage docs as plain text with the request origin as base URL", async () => {
    const res = await llmsRoutes.request("https://example.test/llms.txt");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(body.startsWith("# icon-marquee")).toBe(true);
    expect(body).toContain("https://example.test/v1/marquee?i=");
  });

  test("lists short names and every icon name", async () => {
    const body = await (await llmsRoutes.request("/llms.txt")).text();

    expect(body).toContain("- `js` → `javascript`");
    expect(body).toMatch(/## All icon names \(\d+\)/);
    expect(body).toContain("webassembly");
  });
});
