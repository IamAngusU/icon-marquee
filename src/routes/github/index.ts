import { createHash } from "node:crypto";
import { Hono } from "hono";
import {
  type GithubLanguages,
  GithubLanguagesError,
  getGithubLanguages,
  languageIcon,
} from "../../github/languages";
import { loadIcons } from "../../utils/load";
import { marqueeQuery } from "../../utils/marquee-query";
import { resolveIconName } from "../../utils/registry";
import { renderIconMarquee, renderIconRow } from "../../utils/render";
import { svgResponse } from "../../utils/respond";

const OWNER = /^[a-z\d](?:[a-z\d-]{0,38})$/i;
const REPO = /^[a-z\d._-]{1,100}$/i;

type LanguageFetcher = (
  owner: string,
  repo: string,
) => Promise<GithubLanguages>;

function list(value: string | undefined, maximum: number) {
  const items = (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (items.length > maximum)
    return { error: `Use at most ${maximum} comma-separated names` } as const;
  if (items.some((item) => item.length > 100 || !/^[a-z\d+#._-]+$/.test(item)))
    return { error: "Overrides contain an invalid name" } as const;
  return { value: items } as const;
}

function selection(
  github: GithubLanguages,
  include: readonly string[],
  exclude: readonly string[],
) {
  const excluded = new Set(
    exclude.map((name) => resolveIconName(name) ?? languageIcon(name) ?? name),
  );
  const detected = github.icons.filter((name) => !excluded.has(name));
  const resolvedIncludes = include.map((name) => resolveIconName(name));
  const unknownIncludes = include.filter(
    (_, index) => !resolvedIncludes[index],
  );
  const icons = [
    ...new Set([
      ...detected,
      ...resolvedIncludes.flatMap((name) => name ?? []),
    ]),
  ].filter((name) => !excluded.has(name));
  return { icons, unknownIncludes };
}

export function createGithubRoutes(
  fetchLanguages: LanguageFetcher = getGithubLanguages,
) {
  const routes = new Hono();

  routes.get("/:owner/:file", async (c) => {
    const owner = c.req.param("owner");
    const file = c.req.param("file");
    const format = file.endsWith(".svg")
      ? "svg"
      : file.endsWith(".json")
        ? "json"
        : undefined;
    const repo =
      format === "svg"
        ? file.slice(0, -4)
        : format === "json"
          ? file.slice(0, -5)
          : "";
    if (!format || !OWNER.test(owner) || !REPO.test(repo))
      return c.json({ error: "Use /api/owner/repository.svg" }, 400);

    const include = list(c.req.query("include"), 50);
    const exclude = list(c.req.query("exclude"), 100);
    if ("error" in include) return c.json({ error: include.error }, 400);
    if ("error" in exclude) return c.json({ error: exclude.error }, 400);

    try {
      const github = await fetchLanguages(owner, repo);
      const selected = selection(github, include.value, exclude.value);
      if (format === "json") {
        c.header("Cache-Control", "public, no-cache");
        return c.json({
          repository: `${owner}/${repo}`,
          ...github,
          selectedIcons: selected.icons,
          unknownIncludes: selected.unknownIncludes,
        });
      }
      if (!selected.icons.length)
        return c.json(
          {
            error:
              "No supported languages remain. Add icons with ?include=react,docker",
          },
          422,
        );
      const options = marqueeQuery(c.req.query());
      if ("error" in options) return c.json({ error: options.error }, 400);
      const loaded = await loadIcons(selected.icons.join(","));
      if ("error" in loaded) return c.json({ error: loaded.error }, 422);
      c.header("X-Icon-Marquee-Repository", `${owner}/${repo}`);
      c.header("X-Icon-Marquee-Cache", github.cache);
      if (github.unsupported.length)
        c.header(
          "X-Unsupported-Languages",
          github.unsupported.map(encodeURIComponent).join(","),
        );
      const svg =
        c.req.query("mode") === "icons"
          ? renderIconRow(loaded.svgs, options.value)
          : renderIconMarquee(loaded.svgs, options.value);
      const etag = `"${createHash("sha256").update(svg).digest("base64url")}"`;
      c.header("ETag", etag);
      c.header("Cache-Control", "public, no-cache");
      if (
        c.req
          .header("If-None-Match")
          ?.split(/\s*,\s*/)
          .includes(etag)
      )
        return c.body(null, 304);
      return svgResponse(c, svg, selected.unknownIncludes, "public, no-cache");
    } catch (error) {
      if (error instanceof GithubLanguagesError)
        return c.json(
          { error: error.message },
          error.status === 404 ? 404 : error.status === 503 ? 503 : 502,
        );
      return c.json({ error: "Could not build this repository marquee." }, 502);
    }
  });
  return routes;
}

export const githubRoutes = createGithubRoutes();
