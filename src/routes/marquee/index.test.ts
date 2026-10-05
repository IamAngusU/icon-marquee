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
    expect(body.match(/<use href="#asset-/g)).toHaveLength(8);
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

  test("skips unknown icons and lists them in a header", async () => {
    const res = await marqueeRoutes.request("/?i=js,nope,ts");

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Unknown-Icons")).toBe("nope");
    expect((await res.text()).match(/<use href="#asset-/g)).toHaveLength(4);
  });

  test("rejects a request where no icon is known", async () => {
    const res = await marqueeRoutes.request("/?i=nope,nah");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "No known icons: nope, nah" });
  });

  test("rejects more than 100 icons", async () => {
    const res = await marqueeRoutes.request(
      `/?i=${Array(101).fill("js").join(",")}`,
    );

    expect(res.status).toBe(400);
  });

  test("fills an explicit width by repeating the row", async () => {
    const res = await marqueeRoutes.request("/?i=js,html&width=600");
    const body = await res.text();

    expect(body.startsWith('<svg width="600" height="48"')).toBe(true);
    expect(body.match(/<use href="#asset-/g)).toHaveLength(14);
  });

  test("rejects a width that is not a whole number in range", async () => {
    for (const width of ["0", "abc", "1.5", "3841"]) {
      const res = await marqueeRoutes.request(`/?i=js&width=${width}`);

      expect(res.status).toBe(400);
    }
  });

  test("size, spacing, speed and reverse direction produce a seamless loop", async () => {
    const res = await marqueeRoutes.request(
      "/?i=js,ts&width=720&height=64&gap=16&speed=80&direction=right",
    );
    const body = await res.text();
    expect(res.status).toBe(200);
    expect(body).toStartWith('<svg width="720" height="64"');
    expect(body).toContain("from{transform:translateX(-640px)}");
    expect(body).toContain("scroll 2.00s linear infinite");
    expect(body.match(/<use href="#asset-/g)).toHaveLength(12);
  });

  test("every repeated icon has unique IDs with matching references", async () => {
    const body = await (
      await marqueeRoutes.request("/?i=github,github&width=900")
    ).text();
    const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(body).toContain('id="i0-github"');
    expect(body).toContain("#i0-github");
    expect(body.match(/<g id="asset-/g)).toHaveLength(2);
  });

  test("invalid controls are rejected before rendering", async () => {
    for (const query of [
      "height=19",
      "height=129",
      "gap=-1",
      "gap=97",
      "gap=",
      "gap=1.5",
      "speed=4",
      "speed=201",
      "speed=NaN",
      "direction=up",
      "order=chaos",
      "seed=-1",
      "seed=4294967296",
      "seed=abc",
      "width=1e3",
      "width=%20",
    ]) {
      const res = await marqueeRoutes.request(`/?i=js&${query}`);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBeString();
    }
  });
});
