import { expect, test } from "bun:test";
import { assetsRoutes } from ".";

test("assets map names to source SVGs, preserving aliases and duplicates", async () => {
  const response = await assetsRoutes.request("/?i=js,nope,typescript,js");
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.names).toEqual(["js", "typescript", "js"]);
  expect(body.unknown).toEqual(["nope"]);
  expect(body.svgs).toHaveLength(3);
  expect(body.svgs[0]).toBe(body.svgs[2]);
  expect(body.svgs.every((svg: string) => svg.includes("<svg"))).toBe(true);
  expect(response.headers.get("Cache-Control")).toContain("max-age=86400");
});

test("asset requests reject missing names, traversal and excessive input", async () => {
  for (const query of [
    "",
    "?i=../../.env",
    "?i=custom-1",
    `?i=${Array(101).fill("js").join(",")}`,
  ])
    expect((await assetsRoutes.request(`/${query}`)).status).toBe(400);
});
