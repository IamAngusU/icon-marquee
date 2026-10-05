import type { createMotionTools, MotionSettings } from "../utils/motion";
import type { MarqueeOptions } from "../utils/svg";

export function createLivePreview(
  host: HTMLElement,
  motion: ReturnType<typeof createMotionTools>,
) {
  let frame = 0;
  let previousTime = 0;
  let offset = 0;
  let paused = false;
  let hovering = false;
  let velocity = 1;
  let fromVelocity = 1;
  let targetVelocity = 1;
  let transitionElapsed = 0;
  let settings: MotionSettings = {
    pauseStyle: "instant",
    pauseDuration: 450,
    bezier: [0.42, 0, 0.58, 1],
    hoverPause: false,
  };
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
    if (!animated || reduced.matches || document.hidden) return;
    const dt = previousTime ? Math.min(time - previousTime, 64) : 0;
    const previousVelocity = velocity;
    if (velocity !== targetVelocity) {
      transitionElapsed += dt;
      const progress = Math.min(1, transitionElapsed / settings.pauseDuration);
      const curve =
        settings.pauseStyle === "bezier" ? settings.bezier : [0.42, 0, 0.58, 1];
      velocity =
        fromVelocity +
        (targetVelocity - fromVelocity) * motion.ease(progress, curve);
      if (progress === 1) velocity = targetVelocity;
    }
    offset += (dt * unitsPerSecond * (previousVelocity + velocity)) / 2000;
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
    host.style.setProperty(
      "--effect-play",
      velocity === 0 ? "paused" : "running",
    );
    if (velocity > 0 || targetVelocity > 0) frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (
      animated &&
      (velocity > 0 || targetVelocity > 0) &&
      !reduced.matches &&
      !document.hidden
    )
      frame = requestAnimationFrame(tick);
  }

  function setPaused(value: boolean) {
    paused = value;
    retarget();
  }

  function retarget() {
    fromVelocity = velocity;
    targetVelocity = paused || (hovering && settings.hoverPause) ? 0 : 1;
    transitionElapsed = 0;
    if (settings.pauseStyle === "instant" || !animated)
      velocity = targetVelocity;
    host.style.setProperty(
      "--effect-play",
      velocity === 0 ? "paused" : "running",
    );
    sync();
  }

  function setMotion(value: MotionSettings) {
    settings = value;
    retarget();
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
    const pick = motion.shuffle(count);
    next = () => {
      if (options.order !== "shuffle") {
        const value = ((cursor % count) + count) % count;
        cursor += right ? -1 : 1;
        return value;
      }
      return pick();
    };
    queue = Array.from({ length }, (_, i) =>
      options.order === "shuffle" ? next() : i % count,
    );
    if (right && options.order === "shuffle") queue.reverse();
    offset = 0;
    drawQueue();
    draw();
    animated = true;
    velocity = paused || (hovering && settings.hoverPause) ? 0 : 1;
    targetVelocity = velocity;
    sync();
  }

  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  host.addEventListener("pointerenter", () => {
    hovering = true;
    if (settings.hoverPause) retarget();
  });
  host.addEventListener("pointerleave", () => {
    hovering = false;
    if (settings.hoverPause) retarget();
  });
  return { show, clear, setPaused, setTheme, setMotion };
}
