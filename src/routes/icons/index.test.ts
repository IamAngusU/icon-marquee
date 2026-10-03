import { describe, expect, test } from "bun:test";
import { iconsRoutes } from ".";

describe("GET /icons", () => {
  test("returns one svg with the requested icons in order", async () => {
    const res = await iconsRoutes.request("/?i=js,html,css,wasm");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(body.startsWith('<svg width="217" height="48"')).toBe(true);
    expect(body.match(/<g transform=/g)).toHaveLength(4);
    expect(body.indexOf("#F0DB4F")).toBeLessThan(body.indexOf("#654FF0"));
  });

  test("rejects a missing i param", async () => {
    const res = await iconsRoutes.request("/");

    expect(res.status).toBe(400);
  });

  test("rejects unknown icons and names them", async () => {
    const res = await iconsRoutes.request("/?i=js,nope");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Unknown icons: nope" });
  });

  test("rejects path traversal names", async () => {
    const res = await iconsRoutes.request("/?i=../../package.json");

    expect(res.status).toBe(400);
  });

  test("rejects more than 100 icons", async () => {
    const res = await iconsRoutes.request(
      `/?i=${Array(101).fill("js").join(",")}`,
    );

    expect(res.status).toBe(400);
  });
});
