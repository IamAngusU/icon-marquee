import type { createMotionTools } from "./motion";

export type IconRowOptions = {
  heightPx?: number;
  gapPx?: number;
  effect?: "none" | "glint" | "chrome" | "holo";
  intensity?: number;
  effectDuration?: number;
  effectArea?: "surface" | "border";
  effectTiming?: "stagger" | "random" | "sync";
  effectCoverage?: "all" | "some" | "selected";
  effectIndices?: number[];
  effectInterval?: number;
  effectVariation?: number;
  edgeFade?: number;
  labels?: string[];
  theme?: "auto" | "light" | "dark";
};
export type MarqueeOptions = IconRowOptions & {
  widthPx?: number;
  speedPxPerS?: number;
  direction?: "left" | "right";
  order?: "repeat" | "shuffle";
  seed?: number;
};
export type RendererSettings = {
  sizeUnits: number;
  heightPx: number;
  gapUnits: number;
  defaultWidthPx: number;
  speedPxPerS: number;
  shufflePasses: number;
  defaultSeed: number;
};

// Self-contained factory shared by the server, browser and asset generator.
export function createSvgRenderer(
  settings: RendererSettings,
  scopeIds: (svg: string, prefix: string) => string,
  motion: ReturnType<typeof createMotionTools>,
) {
  function layout(options: IconRowOptions) {
    const height = options.heightPx ?? settings.heightPx;
    const gap =
      options.gapPx === undefined
        ? settings.gapUnits
        : (options.gapPx * settings.sizeUnits) / height;
    return { height, gap, stride: settings.sizeUnits + gap };
  }

  function shuffled(count: number, seed = settings.defaultSeed): number[] {
    let state = seed >>> 0;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const length = count * settings.shufflePasses;
    const cooldown = Math.min(count - 1, Math.max(1, Math.floor(count / 2)));
    for (let attempt = 0; attempt < 64; attempt++) {
      const next = motion.shuffle(count, random);
      const result = Array.from({ length }, next);
      let seamless = true;
      for (let i = 0; i < cooldown; i++) {
        for (let distance = 1; distance <= cooldown; distance++) {
          if (result[i] === result[(i - distance + length) % length])
            seamless = false;
        }
      }
      if (seamless) return result;
    }
    // A cyclic permutation is a bounded fallback for pathological random streams.
    const first = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [first[i], first[j]] = [first[j] ?? 0, first[i] ?? 0];
    }
    return Array.from({ length }, (_, i) => first[i % count] ?? 0);
  }

  function effects(options: IconRowOptions) {
    if (!options.effect || options.effect === "none") return "";
    const stops =
      options.effect === "glint"
        ? '<stop stop-color="#fff" stop-opacity="0"/><stop offset=".38" stop-color="#fff" stop-opacity="0"/><stop offset=".48" stop-color="#c8edff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".95"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>'
        : options.effect === "holo"
          ? '<stop stop-color="#7ffff2" stop-opacity="0"/><stop offset=".2" stop-color="#71e7ff"/><stop offset=".38" stop-color="#ada0ff"/><stop offset=".5" stop-color="#fff"/><stop offset=".6" stop-color="#ff94d9"/><stop offset=".76" stop-color="#ffe5a3"/><stop offset=".9" stop-color="#8fffd9"/><stop offset="1" stop-color="#8fffd9" stop-opacity="0"/>'
          : '<stop stop-color="#a8bccb" stop-opacity="0"/><stop offset=".24" stop-color="#d5e3ee"/><stop offset=".4" stop-color="#fff"/><stop offset=".48" stop-color="#71849a"/><stop offset=".5" stop-color="#e8f5ff"/><stop offset=".54" stop-color="#fff"/><stop offset=".7" stop-color="#94acbf"/><stop offset="1" stop-color="#c2d8e8" stop-opacity="0"/>';
    return `<linearGradient id="surface-sheen" x1="0" y1=".2" x2="1" y2=".8">${stops}</linearGradient><clipPath id="surface-clip"><rect width="256" height="256" rx="40"/></clipPath><mask id="surface-border" maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256"><rect x="4" y="4" width="248" height="248" rx="36" fill="none" stroke="white" stroke-width="8"/></mask><style>.finish{animation-play-state:var(--effect-play,running)!important;pointer-events:none}@media(prefers-reduced-motion:reduce){.finish{animation:none!important;display:none}}</style>`;
  }

  function finish(options: IconRowOptions, index: number) {
    if (
      !options.effect ||
      options.effect === "none" ||
      (options.effectCoverage === "selected" &&
        !options.effectIndices?.includes(index))
    )
      return "";
    let state =
      (Math.imul(index + 1, 2654435761) ^
        ((options as MarqueeOptions).seed ?? 1)) >>>
      0;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const duration = options.effectDuration ?? 5;
    const interval = options.effectInterval ?? 3;
    const varying = options.effectTiming === "random";
    const sparse = options.effectCoverage === "some";
    const variation = (options.effectVariation ?? 55) / 100;
    const cycles = Array.from({ length: varying || sparse ? 8 : 1 }, () => ({
      sweep: Math.max(
        0.3,
        duration * (varying ? 1 + (random() * 2 - 1) * variation : 1),
      ),
      wait:
        Math.max(0.1, interval * (varying ? 0.5 + random() : 1)) +
        (sparse ? duration * (2 + random() * 5) : 0),
    }));
    const total = cycles.reduce((sum, c) => sum + c.sweep + c.wait, 0);
    let cursor = 0;
    const frames = cycles
      .map(({ sweep, wait }) => {
        const start = (cursor / total) * 100;
        const end = ((cursor + sweep) / total) * 100;
        const cycleEnd = ((cursor + sweep + wait) / total) * 100;
        cursor += sweep + wait;
        // Both ends of the band sit fully outside the icon. The reset therefore
        // happens while invisible instead of exposing a rectangular loop seam.
        return `${start.toFixed(4)}%{transform:translateX(0)}${end.toFixed(4)}%{transform:translateX(896px)}${Math.max(end, cycleEnd - 0.0001).toFixed(4)}%{transform:translateX(896px)}${cycleEnd.toFixed(4)}%{transform:translateX(0)}`;
      })
      .join("");
    const delay =
      options.effectTiming === "sync" && !sparse
        ? 0
        : options.effectTiming !== "random" && !sparse
          ? -((index * 0.61803398875) % 1) * total
          : -random() * total;
    const opacity = Math.min(1, Math.max(0, (options.intensity ?? 35) / 100));
    const strength =
      options.effect === "glint" ? Math.min(1, opacity * 1.65) : opacity;
    return `<style>@keyframes finish-${index}{${frames}}</style><g clip-path="url(#surface-clip)"${options.effectArea === "border" ? ' mask="url(#surface-border)"' : ""} pointer-events="none" opacity="${strength}"><path class="finish ${options.effect}" d="M-512 0h448l-128 256h-448z" fill="url(#surface-sheen)" style="animation:finish-${index} ${total.toFixed(4)}s linear var(--finish-delay,${delay.toFixed(4)}s) infinite"/></g>`;
  }

  function finishUseStyle(
    options: IconRowOptions,
    asset: number,
    instance: number,
  ) {
    if (
      !options.effect ||
      options.effect === "none" ||
      (options.effectCoverage === "selected" &&
        !options.effectIndices?.includes(asset)) ||
      (options.effectTiming === "sync" && options.effectCoverage !== "some")
    )
      return "";
    const seed = (options as MarqueeOptions).seed ?? settings.defaultSeed;
    const hash =
      (Math.imul(asset + 1, 3266489917) ^
        Math.imul(instance + 1, 2246822519) ^
        seed) >>>
      0;
    return ` style="--finish-delay:-${((hash / 4294967296) * 97).toFixed(4)}s"`;
  }

  function escapeLabel(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll('"', "&quot;")
      .replaceAll(">", "&gt;");
  }

  function definitions(svgs: readonly string[], options: IconRowOptions) {
    return (
      "<defs>" +
      effects(options) +
      svgs
        .map(
          (svg, i) =>
            `<g id="asset-${i}">${scopeIds(svg, `i${i}`)}${finish(options, i)}</g>`,
        )
        .join("") +
      "</defs>"
    );
  }

  function faded(content: string, width: number, height: number, fadePx = 0) {
    if (!fadePx) return content;
    const fraction = Math.min(
      0.45,
      (fadePx * settings.sizeUnits) / height / width,
    );
    return `<defs><linearGradient id="edge-gradient"><stop stop-color="white" stop-opacity="0"/><stop offset="${fraction}" stop-color="white"/><stop offset="${1 - fraction}" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="edge-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="256"><rect width="${width}" height="256" fill="url(#edge-gradient)"/></mask></defs><g mask="url(#edge-mask)">${content}</g>`;
  }

  function row(
    sequence: readonly number[],
    stride: number,
    offset = 0,
    labels: readonly string[] = [],
    options: IconRowOptions = {},
    instanceOffset = 0,
  ) {
    return sequence
      .map(
        (asset, i) =>
          `<use href="#asset-${asset}" transform="translate(${offset + i * stride}, 0)"${finishUseStyle(options, asset, instanceOffset + i)}${labels[asset] ? `><title>${escapeLabel(labels[asset] ?? "")}</title></use>` : "/>"}`,
      )
      .join("");
  }

  function document(
    width: number,
    height: number,
    content: string,
    theme = "auto",
  ) {
    if (theme !== "auto")
      content = content.replace(
        /@media\s*\(prefers-color-scheme:\s*(light|dark)\)/g,
        (_, value: string) =>
          value === theme ? "@media all" : "@media not all",
      );
    return `<svg width="${Math.round((width * height) / settings.sizeUnits)}" height="${height}" viewBox="0 0 ${width} ${settings.sizeUnits}" fill="none" xmlns="http://www.w3.org/2000/svg"><title>My tech stack</title>${content}</svg>`;
  }

  function icons(svgs: readonly string[], options: IconRowOptions = {}) {
    if (!svgs.length) throw new Error("At least one icon is required");
    const { height, gap, stride } = layout(options);
    const sequence = svgs.map((_, i) => i);
    return document(
      svgs.length * stride - gap,
      height,
      definitions(svgs, options) +
        row(sequence, stride, 0, options.labels, options),
      options.theme,
    );
  }

  function marquee(svgs: readonly string[], options: MarqueeOptions = {}) {
    if (options.order === "shuffle") svgs = [...new Set(svgs)];
    if (!svgs.length) throw new Error("At least one icon is required");
    const { height, gap, stride } = layout(options);
    const sequence =
      options.order === "shuffle"
        ? shuffled(svgs.length, options.seed)
        : svgs.map((_, i) => i);
    const period = sequence.length * stride;
    const width =
      options.widthPx === undefined
        ? Math.min(
            (settings.defaultWidthPx * settings.sizeUnits) / height,
            svgs.length * stride - gap,
          )
        : (options.widthPx * settings.sizeUnits) / height;
    const speed = options.speedPxPerS ?? settings.speedPxPerS;
    const duration = ((period * height) / settings.sizeUnits / speed).toFixed(
      2,
    );
    const keyframes =
      options.direction === "right"
        ? `from{transform:translateX(-${period}px)}`
        : `to{transform:translateX(-${period}px)}`;
    const style = `<style>@keyframes scroll{${keyframes}}.track{animation:scroll ${duration}s linear infinite}@media (prefers-reduced-motion:reduce){.track{animation:none}}</style>`;
    const copies = Math.ceil(width / period) + 1;
    const rows = Array.from({ length: copies }, (_, i) =>
      row(
        sequence,
        stride,
        i * period,
        options.labels,
        options,
        i * sequence.length,
      ),
    ).join("");
    return document(
      width,
      height,
      `${definitions(svgs, options)}${style}${faded(`<g class="track">${rows}</g>`, width, height, options.edgeFade)}`,
      options.theme,
    );
  }

  return { icons, marquee, shuffled, layout };
}
