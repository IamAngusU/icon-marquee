import { describe, expect, test } from "bun:test";
import { marqueeRoutes } from ".";

describe("GET /marquee", () => {
  test("returns an animated svg with the row rendered twice", async () => {
    const res = await marqueeRoutes.request("/?i=js,html,css,wasm");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(body).toContain("@keyframes scroll");
    expect(body).toContain("translateX(-1200px)");
    expect(body).toContain("prefers-reduced-motion");
    expect(body.match(/<g transform=/g)).toHaveLength(8);
  });

  test("caps the visible window at 400px", async () => {
    const res = await marqueeRoutes.request(
      `/?i=${Array(20).fill("js").join(",")}`,
    );

    expect((await res.text()).startsWith('<svg width="400" height="48"')).toBe(
      true,
    );
  });

  test("shrinks the window to one row when icons are fewer than the window", async () => {
    const res = await marqueeRoutes.request("/?i=js,html");

    expect((await res.text()).startsWith('<svg width="104" height="48"')).toBe(
      true,
    );
  });

  test("rejects a missing i param", async () => {
    const res = await marqueeRoutes.request("/");

    expect(res.status).toBe(400);
  });

  test("rejects unknown icons and names them", async () => {
    const res = await marqueeRoutes.request("/?i=js,nope");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Unknown icons: nope" });
  });

  test("rejects more than 100 icons", async () => {
    const res = await marqueeRoutes.request(
      `/?i=${Array(101).fill("js").join(",")}`,
    );

    expect(res.status).toBe(400);
  });
});
