export type IconRowOptions = { heightPx?: number; gapPx?: number };
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
    const result: number[] = [];
    for (let pass = 0; pass < settings.shufflePasses; pass++) {
      const bag = Array.from({ length: count }, (_, index) => index);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [bag[i], bag[j]] = [bag[j] ?? 0, bag[i] ?? 0];
      }
      if (count > 1 && bag[0] === result.at(-1)) {
        [bag[0], bag[1]] = [bag[1] ?? 0, bag[0] ?? 0];
      }
      result.push(...bag);
    }
    return result;
  }

  function definitions(svgs: readonly string[]) {
    return (
      "<defs>" +
      svgs
        .map((svg, i) => `<g id="asset-${i}">${scopeIds(svg, `i${i}`)}</g>`)
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

  function document(width: number, height: number, content: string) {
    return `<svg width="${Math.round((width * height) / settings.sizeUnits)}" height="${height}" viewBox="0 0 ${width} ${settings.sizeUnits}" fill="none" xmlns="http://www.w3.org/2000/svg"><title>My tech stack</title>${content}</svg>`;
  }

  function icons(svgs: readonly string[], options: IconRowOptions = {}) {
    if (!svgs.length) throw new Error("At least one icon is required");
    const { height, gap, stride } = layout(options);
    const sequence = svgs.map((_, i) => i);
    return document(
      svgs.length * stride - gap,
      height,
      definitions(svgs) + row(sequence, stride),
    );
  }

  function marquee(svgs: readonly string[], options: MarqueeOptions = {}) {
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
      `${definitions(svgs)}${style}<g class="track">${rows}</g>`,
    );
  }

  return { icons, marquee, shuffled, layout };
}
