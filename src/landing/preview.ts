import type { MarqueeOptions } from "../utils/svg";

export function createLivePreview(host: HTMLElement) {
  let frame = 0;
  let previousTime = 0;
  let offset = 0;
  let paused = false;
  let animated = false;
  let track: SVGGElement | null = null;
  let queue: number[] = [];
  let stride = 0;
  let unitsPerSecond = 0;
  let right = false;
  let next: () => number = () => 0;
  let themeStyles: { element: SVGStyleElement; source: string }[] = [];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function draw() {
    track?.setAttribute(
      "transform",
      `translate(${right ? offset - stride : -offset}, 0)`,
    );
  }

  function drawQueue() {
    if (!track) return;
    track.replaceChildren(
      ...queue.map((asset, index) => {
        const use = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "use",
        );
        use.setAttribute("href", `#asset-${asset}`);
        use.setAttribute("transform", `translate(${index * stride}, 0)`);
        return use;
      }),
    );
  }

  function tick(time: number) {
    frame = 0;
    if (!animated || paused || reduced.matches || document.hidden) return;
    if (previousTime)
      offset += (Math.min(time - previousTime, 64) * unitsPerSecond) / 1000;
    previousTime = time;
    while (offset >= stride) {
      offset -= stride;
      if (right) {
        queue.pop();
        queue.unshift(next());
      } else {
        queue.shift();
        queue.push(next());
      }
      drawQueue();
    }
    draw();
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (animated && !paused && !reduced.matches && !document.hidden)
      frame = requestAnimationFrame(tick);
  }

  function setPaused(value: boolean) {
    paused = value;
    sync();
  }

  function setTheme(theme: string) {
    for (const { element, source } of themeStyles) {
      element.textContent = source.replace(
        /@media\s*\(prefers-color-scheme:\s*(light|dark)\)/g,
        (_, value: string) =>
          value === theme ? "@media all" : "@media not all",
      );
    }
  }

  function clear() {
    animated = false;
    sync();
    track = null;
    themeStyles = [];
    host.replaceChildren();
  }

  function show(
    svg: string,
    count: number,
    options: MarqueeOptions,
    isAnimated: boolean,
    theme: string,
  ) {
    clear();
    const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (parsed.querySelector("parsererror"))
      throw new Error("Could not read the generated SVG.");
    const root = document.importNode(
      parsed.documentElement,
      true,
    ) as unknown as SVGSVGElement;
    host.replaceChildren(root);
    themeStyles = Array.from(
      root.querySelectorAll<SVGStyleElement>("style"),
      (element) => ({
        element,
        source: element.textContent ?? "",
      }),
    );
    setTheme(theme);
    if (!isAnimated) return;
    track = root.querySelector<SVGGElement>("g.track");
    if (!track) return;
    track.style.animation = "none";
    const height = options.heightPx ?? 48;
    stride = 256 + ((options.gapPx ?? 0) * 256) / height;
    unitsPerSecond = ((options.speedPxPerS ?? 30) * 256) / height;
    right = options.direction === "right";
    const length = Math.ceil(root.viewBox.baseVal.width / stride) + 2;
    let cursor = right ? -1 : length;
    let bag: number[] = [];
    let last = -1;
    next = () => {
      if (options.order !== "shuffle") {
        const value = ((cursor % count) + count) % count;
        cursor += right ? -1 : 1;
        return value;
      }
      if (!bag.length) {
        bag = Array.from({ length: count }, (_, i) => i);
        for (let i = count - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j] ?? 0, bag[i] ?? 0];
        }
        if (count > 1 && bag.at(-1) === last)
          [bag[0], bag[count - 1]] = [bag[count - 1] ?? 0, bag[0] ?? 0];
      }
      last = bag.pop() ?? 0;
      return last;
    };
    queue = Array.from({ length }, (_, i) =>
      options.order === "shuffle" ? next() : i % count,
    );
    offset = 0;
    drawQueue();
    draw();
    animated = true;
    sync();
  }

  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  return { show, clear, setPaused, setTheme };
}
