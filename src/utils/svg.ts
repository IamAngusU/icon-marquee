import type { createMotionTools } from "./motion";

export type IconRowOptions = {
  heightPx?: number;
  gapPx?: number;
  effect?: "none" | "glint" | "chrome";
  intensity?: number;
  effectDuration?: number;
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
    const opacity = Math.min(1, Math.max(0, (options.intensity ?? 35) / 100));
    const duration = Math.min(20, Math.max(1, options.effectDuration ?? 5));
    const shine = options.effect === "glint";
    return `<linearGradient id="surface-sheen" x1="0" y1="0" x2="${shine ? "1" : "0"}" y2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".4" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity="${opacity}"/><stop offset=".57" stop-color="#12213a" stop-opacity="${opacity / 2}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="surface-clip"><rect width="256" height="256" rx="40"/></clipPath>${shine ? `<style>@keyframes glint{0%,25%{transform:translateX(-300px)}65%,100%{transform:translateX(300px)}}.glint{animation:glint ${duration}s ease-in-out infinite;animation-play-state:var(--effect-play,running)}@media(prefers-reduced-motion:reduce){.glint{animation:none;display:none}}</style>` : ""}`;
  }

  function definitions(svgs: readonly string[], options: IconRowOptions) {
    const finish =
      options.effect && options.effect !== "none"
        ? `<g clip-path="url(#surface-clip)" pointer-events="none"><rect class="${options.effect === "glint" ? "glint" : "chrome"}" width="256" height="256" fill="url(#surface-sheen)"/></g>`
        : "";
    return (
      "<defs>" +
      effects(options) +
      svgs
        .map(
          (svg, i) =>
            `<g id="asset-${i}">${scopeIds(svg, `i${i}`)}${finish}</g>`,
        )
        .join("") +
      "</defs>"
    );
  }

  function row(sequence: readonly number[], stride: number, offset = 0) {
    return sequence
      .map(
        (asset, i) =>
          `<use href="#asset-${asset}" transform="translate(${offset + i * stride}, 0)"/>`,
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
      definitions(svgs, options) + row(sequence, stride),
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
      row(sequence, stride, i * period),
    ).join("");
    return document(
      width,
      height,
      `${definitions(svgs, options)}${style}<g class="track">${rows}</g>`,
      options.theme,
    );
  }

  return { icons, marquee, shuffled, layout };
}
