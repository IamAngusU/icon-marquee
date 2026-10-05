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
  let labels: string[] = [];
  let finishSeed = 1;
  let finishSerial = 0;
  let finishIndependent = true;
  const tooltip = document.createElement("div");
  tooltip.className = "icon-tooltip";
  tooltip.id = "preview-icon-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  host.parentElement?.append(tooltip);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function draw() {
    track?.setAttribute(
      "transform",
      `translate(${right ? offset - stride : -offset}, 0)`,
    );
  }

  function drawQueue() {
    if (!track) return;
    tooltip.hidden = true;
    track.replaceChildren(
      ...queue.map((asset, index) => {
        const use = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "use",
        );
        use.setAttribute("href", `#asset-${asset}`);
        use.setAttribute("transform", `translate(${index * stride}, 0)`);
        phaseFinish(use, asset, finishSerial++);
        annotate(use, asset);
        return use;
      }),
    );
  }

  function phaseFinish(use: SVGUseElement, asset: number, instance: number) {
    if (!finishIndependent) {
      use.style.removeProperty("--finish-delay");
      return;
    }
    const hash =
      (Math.imul(asset + 1, 3266489917) ^
        Math.imul(instance + 1, 2246822519) ^
        finishSeed) >>>
      0;
    use.style.setProperty(
      "--finish-delay",
      `-${((hash / 4294967296) * 97).toFixed(4)}s`,
    );
  }

  function annotate(use: SVGUseElement, asset: number) {
    const label = labels[asset];
    if (!label) return;
    use.setAttribute("tabindex", "0");
    use.setAttribute("role", "img");
    use.setAttribute("aria-label", label);
    use.setAttribute("aria-describedby", tooltip.id);
  }

  function recycle() {
    if (!track) return;
    const use = (
      right ? track.lastElementChild : track.firstElementChild
    ) as SVGUseElement | null;
    if (!use) return;
    const asset = (right ? queue[0] : queue[queue.length - 1]) ?? 0;
    use.setAttribute("href", `#asset-${asset}`);
    phaseFinish(use, asset, finishSerial++);
    annotate(use, asset);
    if (right) track.prepend(use);
    else track.append(use);
    Array.from(track.children).forEach((node, index) => {
      node.setAttribute("transform", `translate(${index * stride}, 0)`);
    });
    tooltip.hidden = true;
  }

  function showTooltip(event: Event) {
    if (!(event.target instanceof SVGUseElement)) return;
    const label = event.target.getAttribute("aria-label");
    if (!label) return;
    const bounds = event.target.getBoundingClientRect();
    tooltip.textContent = label;
    tooltip.hidden = false;
    tooltip.style.left = `${Math.max(8, Math.min(innerWidth - tooltip.offsetWidth - 8, bounds.left + bounds.width / 2 - tooltip.offsetWidth / 2))}px`;
    tooltip.style.top = `${Math.max(8, bounds.top - tooltip.offsetHeight - 8)}px`;
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
      recycle();
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
    host.style.setProperty(
      "--effect-play",
      reduced.matches || document.hidden || velocity === 0
        ? "paused"
        : "running",
    );
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
    tooltip.hidden = true;
    host.replaceChildren();
  }

  function show(
    svg: string,
    count: number,
    options: MarqueeOptions,
    isAnimated: boolean,
    theme: string,
    iconLabels: string[] = [],
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
    labels = iconLabels;
    finishSeed = options.seed ?? 1;
    finishSerial = 0;
    finishIndependent =
      options.effectTiming !== "sync" || options.effectCoverage === "some";
    host.setAttribute("role", labels.length ? "group" : "img");
    themeStyles = Array.from(
      root.querySelectorAll<SVGStyleElement>("style"),
      (element) => ({
        element,
        source: element.textContent ?? "",
      }),
    );
    setTheme(theme);
    if (!isAnimated) {
      root
        .querySelectorAll<SVGUseElement>("use[href^='#asset-']")
        .forEach((use) => {
          annotate(use, Number(use.getAttribute("href")?.slice(7)));
        });
      return;
    }
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
  host.addEventListener("pointermove", showTooltip);
  host.addEventListener("focusin", showTooltip);
  host.addEventListener("focusout", () => {
    tooltip.hidden = true;
  });
  host.addEventListener("pointerout", () => {
    tooltip.hidden = true;
  });
  host.addEventListener("keydown", (event) => {
    if (event.key === "Escape") tooltip.hidden = true;
  });
  window.addEventListener(
    "scroll",
    () => {
      tooltip.hidden = true;
    },
    true,
  );
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
