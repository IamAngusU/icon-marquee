import { expect, test } from "bun:test";
import { catalogRoutes } from ".";

test("catalog exposes valid canonical names and aliases", async () => {
  const res = await catalogRoutes.request("/");
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(body.names).toContain("javascript");
  expect(body.aliases.js).toBe("javascript");
  expect(
    Object.values(body.aliases).every((name) => body.names.includes(name)),
  ).toBe(true);
});
