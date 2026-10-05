import { config } from "../config";
import { iconNames } from "../utils/registry";
import { rendererSettings } from "../utils/render";
import { scopeIds } from "../utils/scope-ids";
import { createSvgRenderer } from "../utils/svg";
import { type LocalLogo, readLocalLogo } from "./logos";
import { createLivePreview } from "./preview";

type ComposerData = {
  names: readonly string[];
  aliases: Readonly<Record<string, string>>;
  maxIcons: number;
  maxLogoBytes: number;
  maxLogoCount: number;
  logoRasterPx: number;
};

function composer(
  data: ComposerData,
  renderer: ReturnType<typeof createSvgRenderer>,
  makePreview: typeof createLivePreview,
  readLogo: typeof readLocalLogo,
) {
  function element<T extends HTMLElement>(id: string): T {
    const found = document.getElementById(id);
    if (!found) throw new Error(`Missing editor element: ${id}`);
    return found as T;
  }

  const input = element<HTMLInputElement>("icons");
  const preview = element<HTMLDivElement>("preview");
  const livePreview = makePreview(preview);
  const stage = element<HTMLDivElement>("stage");
  const status = element<HTMLParagraphElement>("status");
  const selected = element<HTMLUListElement>("selected");
  const catalog = element<HTMLDivElement>("catalog");
  const search = element<HTMLInputElement>("search");
  const snippet = element<HTMLTextAreaElement>("snippet");
  const copy = element<HTMLButtonElement>("copy");
  const download = element<HTMLButtonElement>("download");
  const share = element<HTMLButtonElement>("share");
  const pause = element<HTMLButtonElement>("pause");
  const empty = element<HTMLDivElement>("empty-preview");
  const controls = {
    width: element<HTMLInputElement>("width"),
    height: element<HTMLInputElement>("height"),
    gap: element<HTMLInputElement>("gap"),
    speed: element<HTMLInputElement>("speed"),
  };
  const modeButtons =
    document.querySelectorAll<HTMLButtonElement>("[data-mode]");
  const directionButtons =
    document.querySelectorAll<HTMLButtonElement>("[data-direction]");
  const formatButtons =
    document.querySelectorAll<HTMLButtonElement>("[data-format]");
  const orderButtons =
    document.querySelectorAll<HTMLButtonElement>("[data-order]");
  const logoInput = element<HTMLInputElement>("logo-files");
  const customLogos = new Map<string, LocalLogo>();
  const assetCache = new Map<string, string>();
  let logoCounter = 0;
  let hasLocal = false;
  let currentSvgs: string[] = [];
  let order: "repeat" | "shuffle" = "repeat";
  let seed = 1;
  const presets: Record<string, string> = {
    frontend: "ts,react,nextjs,tailwind,vite,figma",
    backend: "go,rust,nodejs,docker,postgres,redis",
    creative: "figma,blender,photoshop,illustrator,framer,threejs",
    ai: "python,pytorch,huggingface,ollama,claudeai,codex",
  };
  const popular = [
    "javascript",
    "typescript",
    "reactjs",
    "nextjs",
    "vuejs",
    "svelte",
    "tailwindcss",
    "nodejs",
    "python",
    "golang",
    "rust",
    "docker",
    "postgresql",
    "redis",
    "git",
    "github",
    "figma",
    "bun",
    "vite",
    "linux",
    "kubernetes",
    "supabase",
    "astro",
    "cloudflare",
  ];
  const allNames = [...new Set([...popular, ...data.names])].filter((name) =>
    data.names.includes(name),
  );
  const nameSet = new Set(data.names);
  let mode: "marquee" | "icons" = "marquee";
  let direction: "left" | "right" = "left";
  let format: "markdown" | "html" | "url" = "markdown";
  let paused = false;
  let surface = "dark";
  let visibleCount = 24;
  let requestId = 0;
  let request: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout>;
  let svg = "";
  let exportUrl = "";
  let dragIndex = -1;

  const names = () =>
    input.value
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);
  const canonical = (name: string) =>
    Object.hasOwn(data.aliases, name) ? (data.aliases[name] ?? name) : name;

  function notify(message: string, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
  }

  function setExportEnabled(enabled: boolean) {
    copy.disabled = !enabled;
    download.disabled = !enabled;
  }

  function params() {
    const params = new URLSearchParams();
    params.set("i", names().join(","));
    params.set("height", controls.height.value);
    params.set("gap", controls.gap.value);
    if (mode === "marquee") {
      params.set("width", controls.width.value);
      params.set("speed", controls.speed.value);
      params.set("direction", direction);
      if (order === "shuffle") {
        params.set("order", order);
        params.set("seed", String(seed));
      }
    }
    return params;
  }

  function saveState() {
    const state = params();
    state.set("mode", mode);
    state.set("width", controls.width.value);
    state.set("speed", controls.speed.value);
    state.set("direction", direction);
    state.set("surface", surface);
    state.set("order", order);
    state.set("seed", String(seed));
    history.replaceState(null, "", `#${state.toString()}`);
  }

  function restoreState() {
    const state = new URLSearchParams(location.hash.slice(1));
    if (state.has("i")) input.value = state.get("i") ?? "";
    mode = state.get("mode") === "icons" ? "icons" : "marquee";
    direction = state.get("direction") === "right" ? "right" : "left";
    surface = state.get("surface") === "light" ? "light" : "dark";
    order = state.get("order") === "shuffle" ? "shuffle" : "repeat";
    const storedSeed = state.get("seed");
    if (
      storedSeed &&
      /^\d+$/.test(storedSeed) &&
      Number(storedSeed) <= 4294967295
    )
      seed = Number(storedSeed);
    for (const [key, control] of Object.entries(controls)) {
      const value = state.get(key);
      if (value !== null && /^\d+$/.test(value)) {
        control.value = String(
          Math.min(
            Number(control.max),
            Math.max(Number(control.min), Number(value)),
          ),
        );
      }
    }
    modeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    });
    directionButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.direction === direction),
      );
    });
    document
      .querySelectorAll<HTMLButtonElement>("button[data-surface]")
      .forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.surface === surface),
        );
      });
    stage.dataset.surface = surface;
    orderButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.order === order),
      );
    });
  }

  function renderControls() {
    for (const [key, control] of Object.entries(controls)) {
      element<HTMLOutputElement>(`${key}-value`).textContent =
        control.value + (key === "speed" ? " px/s" : " px");
    }
    controls.width.disabled = mode === "icons";
    controls.speed.disabled = mode === "icons";
    directionButtons.forEach((button) => {
      button.disabled = mode === "icons";
    });
    pause.disabled = mode === "icons";
    pause.textContent = paused && mode === "marquee" ? "Resume" : "Pause";
    pause.setAttribute("aria-pressed", String(paused && mode === "marquee"));
    orderButtons.forEach((button) => {
      button.disabled = mode === "icons";
    });
    element("shuffle-note").hidden = order !== "shuffle" || mode === "icons";
  }

  function renderSnippet() {
    const labels = { markdown: "Markdown", html: "HTML", url: "URL" };
    const snippetUrl = `./icon-${mode === "marquee" ? "marquee" : "row"}.svg`;
    const htmlUrl = snippetUrl
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;");
    snippet.value = !exportUrl
      ? ""
      : format === "markdown"
        ? `![My tech stack](${snippetUrl})`
        : format === "html"
          ? `<img src="${htmlUrl}" alt="My tech stack" />`
          : exportUrl;
    copy.replaceChildren(document.createTextNode(`Copy ${labels[format]}`));
    const symbol = document.createElement("span");
    symbol.textContent = "⧉";
    symbol.setAttribute("aria-hidden", "true");
    copy.append(symbol);
  }

  function renderPreview() {
    if (!svg) return;
    livePreview.show(
      svg,
      currentSvgs.length,
      renderOptions(),
      mode === "marquee",
      surface,
    );
    livePreview.setPaused(paused);
    preview.hidden = false;
    empty.hidden = true;
  }

  function renderOptions() {
    return {
      widthPx: Number(controls.width.value),
      heightPx: Number(controls.height.value),
      gapPx: Number(controls.gap.value),
      speedPxPerS: Number(controls.speed.value),
      direction,
      order,
      seed,
    };
  }

  function reorder(from: number, to: number) {
    const list = names();
    if (
      from < 0 ||
      to < 0 ||
      from >= list.length ||
      to >= list.length ||
      from === to
    )
      return;
    const [item] = list.splice(from, 1);
    if (item === undefined) return;
    list.splice(to, 0, item);
    input.value = list.join(",");
    changed();
    (selected.children[to] as HTMLElement | undefined)?.focus();
    notify(`Moved ${item} to position ${to + 1}.`);
  }

  function renderSelected() {
    selected.replaceChildren();
    const list = names();
    element("selection-count").textContent = String(list.length);
    list.forEach((name, index) => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.draggable = true;
      li.setAttribute(
        "aria-label",
        name +
          ", position " +
          (index + 1) +
          ". Alt plus left or right arrow to move.",
      );
      if (nameSet.has(canonical(name)) || customLogos.has(name)) {
        const img = document.createElement("img");
        img.src =
          customLogos.get(name)?.dataUrl ??
          `/v1/icons?i=${encodeURIComponent(name)}&height=24`;
        img.alt = "";
        li.append(img);
      }
      const label = document.createElement("span");
      label.textContent = customLogos.get(name)?.label ?? name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${name}`);
      remove.addEventListener("click", () => {
        const current = names();
        current.splice(index, 1);
        input.value = current.join(",");
        changed();
        (
          selected.children[Math.min(index, current.length - 1)] as
            | HTMLElement
            | undefined
        )?.focus();
      });
      li.append(label, remove);
      li.addEventListener("keydown", (event) => {
        if (event.altKey && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault();
          reorder(index, index + (event.key === "ArrowLeft" ? -1 : 1));
        }
      });
      li.addEventListener("dragstart", (event) => {
        dragIndex = index;
        li.classList.add("dragging");
        event.dataTransfer?.setData("text/plain", String(index));
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      });
      li.addEventListener("dragover", (event) => {
        event.preventDefault();
        li.classList.add("drag-over");
      });
      li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
      li.addEventListener("drop", (event) => {
        event.preventDefault();
        reorder(dragIndex, index);
        dragIndex = -1;
      });
      li.addEventListener("dragend", () => {
        dragIndex = -1;
        selected.querySelectorAll("li").forEach((item) => {
          item.classList.remove("dragging", "drag-over");
        });
      });
      selected.append(li);
    });
  }

  function renderCatalog() {
    const query = search.value.trim().toLowerCase();
    const matchingAliases = new Set(
      Object.entries(data.aliases)
        .filter(([alias]) => alias.includes(query))
        .map(([, name]) => name),
    );
    const filtered = [...customLogos.keys(), ...allNames].filter(
      (name) =>
        name.includes(query) ||
        matchingAliases.has(name) ||
        customLogos.get(name)?.label.toLowerCase().includes(query),
    );
    const chosen = new Set(names().map(canonical));
    element("results-count").textContent =
      filtered.length + (filtered.length === 1 ? " icon" : " icons");
    catalog.replaceChildren();
    for (const name of filtered.slice(0, visibleCount)) {
      const button = document.createElement("button");
      button.className = "icon-option";
      button.type = "button";
      button.dataset.icon = name;
      button.title = customLogos.get(name)?.label ?? name;
      button.setAttribute("aria-pressed", String(chosen.has(name)));
      button.setAttribute(
        "aria-label",
        (chosen.has(name) ? "Remove " : "Add ") + name,
      );
      const img = document.createElement("img");
      img.src =
        customLogos.get(name)?.dataUrl ??
        `/v1/icons?i=${encodeURIComponent(name)}&height=40`;
      img.alt = "";
      img.loading = "lazy";
      img.width = 35;
      img.height = 35;
      const label = document.createElement("span");
      label.textContent = customLogos.get(name)?.label ?? name;
      button.append(img, label);
      button.addEventListener("click", () => {
        const list = names();
        if (list.some((item) => canonical(item) === name)) {
          input.value = list
            .filter((item) => canonical(item) !== name)
            .join(",");
        } else if (list.length >= data.maxIcons) {
          notify(
            "You can use up to " +
              data.maxIcons +
              " icons. Remove one to add another.",
            true,
          );
          return;
        } else {
          input.value = [...list, name].join(",");
        }
        changed();
        catalog
          .querySelector<HTMLButtonElement>(`[data-icon="${name}"]`)
          ?.focus();
      });
      catalog.append(button);
    }
    element("catalog-empty").hidden = filtered.length > 0;
    element("show-more").hidden = filtered.length <= visibleCount;
  }

  function invalidate() {
    clearTimeout(timer);
    requestId += 1;
    request?.abort();
    setExportEnabled(false);
    exportUrl = "";
    svg = "";
    livePreview.clear();
    renderSnippet();
    preview.hidden = true;
    empty.hidden = false;
    empty.textContent = "Updating your preview…";
  }

  async function update() {
    const id = requestId;
    const list = names();
    if (!list.length) {
      empty.textContent = "Add a few icons to get things moving.";
      input.removeAttribute("aria-invalid");
      notify("Pick icons below or choose a stack preset.");
      return;
    }
    if (list.length > data.maxIcons) {
      empty.textContent = "Your lineup is too long.";
      notify(`Use up to ${data.maxIcons} icons.`, true);
      return;
    }
    request = new AbortController();
    const query = params().toString().replaceAll("%2C", ",");
    const path = `/v1/${mode}?${query}`;
    try {
      const known = list.filter(
        (name) => nameSet.has(canonical(name)) || customLogos.has(name),
      );
      const unknown = list.filter((name) => !known.includes(name));
      if (!known.length)
        throw new Error(
          "No known icons. Pick a logo below or add your own files.",
        );
      const missing = [
        ...new Set(
          known
            .filter(
              (name) =>
                !customLogos.has(name) && !assetCache.has(canonical(name)),
            )
            .map(canonical),
        ),
      ];
      if (missing.length) {
        const res = await fetch(
          `/v1/assets?i=${missing.map(encodeURIComponent).join(",")}`,
          { signal: request.signal },
        );
        if (!res.ok)
          throw new Error(
            "Could not load your icons. Check your connection and try again.",
          );
        const assets = (await res.json()) as {
          names: string[];
          svgs: string[];
        };
        if (id !== requestId) return;
        assets.names.forEach((name, i) => {
          const asset = assets.svgs[i];
          if (asset) assetCache.set(name, asset);
        });
      }
      if (id !== requestId) return;
      currentSvgs = known.map(
        (name) =>
          customLogos.get(name)?.svg ?? assetCache.get(canonical(name)) ?? "",
      );
      if (currentSvgs.some((asset) => !asset))
        throw new Error("Some icons could not be loaded. Please try again.");
      svg =
        mode === "marquee"
          ? renderer.marquee(currentSvgs, renderOptions())
          : renderer.icons(currentSvgs, renderOptions());
      hasLocal = known.some((name) => customLogos.has(name));
      share.disabled = hasLocal;
      formatButtons.forEach((button) => {
        button.disabled = hasLocal && button.dataset.format === "url";
      });
      if (hasLocal && format === "url") {
        format = "markdown";
        formatButtons.forEach((button) => {
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.format === format),
          );
        });
      }
      exportUrl = hasLocal
        ? `./icon-${mode === "marquee" ? "marquee" : "row"}.svg`
        : location.origin + path;
      element("export-note").textContent = hasLocal
        ? "Download the SVG beside your README. Your logos stay in this browser until reloaded; editor links cannot include them."
        : "Download the SVG beside your README, then paste the snippet. The URL tab needs a publicly reachable instance.";
      renderPreview();
      renderSnippet();
      setExportEnabled(true);
      input.removeAttribute("aria-invalid");
      notify(
        unknown.length ? `Unknown icons skipped: ${unknown.join(", ")}` : "",
      );
      element("preview-info").textContent =
        controls.height.value +
        " px icons / " +
        (mode === "marquee"
          ? `${controls.width.value} px canvas`
          : "Static row");
    } catch (error) {
      if (id !== requestId) return;
      input.setAttribute("aria-invalid", "true");
      empty.textContent = "Check your icon names to continue.";
      notify(
        error instanceof Error
          ? error.message
          : "Could not load the preview. Check your connection and try again.",
        true,
      );
    }
  }

  function changed() {
    invalidate();
    renderSelected();
    renderCatalog();
    renderControls();
    saveState();
    timer = setTimeout(update, 180);
  }

  async function copyText(text: string, success: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify(success);
    } catch {
      snippet.value = text;
      snippet.focus();
      snippet.select();
      notify(
        "Clipboard unavailable. Select the code above and copy it manually.",
        true,
      );
    }
  }

  input.addEventListener("input", changed);
  search.addEventListener("input", () => {
    visibleCount = 24;
    renderCatalog();
  });
  element("show-more").addEventListener("click", () => {
    visibleCount += 24;
    renderCatalog();
  });
  element("clear").addEventListener("click", () => {
    input.value = "";
    changed();
    input.focus();
  });
  Object.values(controls).forEach((control) => {
    control.addEventListener("input", () => {
      invalidate();
      renderControls();
      saveState();
      timer = setTimeout(update, 120);
    });
  });
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.mode === "icons" ? "icons" : "marquee";
      modeButtons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      changed();
    });
  });
  directionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      direction = button.dataset.direction === "right" ? "right" : "left";
      directionButtons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      changed();
    });
  });
  orderButtons.forEach((button) => {
    button.addEventListener("click", () => {
      order = button.dataset.order === "shuffle" ? "shuffle" : "repeat";
      if (order === "shuffle")
        seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
      orderButtons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      changed();
    });
  });
  element("add-logos").addEventListener("click", () => logoInput.click());
  logoInput.addEventListener("change", async () => {
    const files = Array.from(logoInput.files ?? []);
    const button = element<HTMLButtonElement>("add-logos");
    button.disabled = true;
    let added = 0;
    const failures: string[] = [];
    for (const file of files) {
      if (
        customLogos.size >= data.maxLogoCount ||
        names().length >= data.maxIcons
      ) {
        failures.push(
          `Use up to ${data.maxLogoCount} local logos and ${data.maxIcons} icons total.`,
        );
        break;
      }
      try {
        const logo = await readLogo(file, data.maxLogoBytes, data.logoRasterPx);
        const key = `custom-${++logoCounter}`;
        customLogos.set(key, logo);
        input.value = [...names(), key].join(",");
        added++;
      } catch (error) {
        failures.push(
          error instanceof Error ? error.message : "Could not read a logo.",
        );
      }
    }
    logoInput.value = "";
    button.disabled = false;
    element("logo-status").textContent = [
      added
        ? `Added ${added} ${added === 1 ? "logo" : "logos"}. Download your SVG before reloading.`
        : "",
      ...failures,
    ]
      .filter(Boolean)
      .join(" ");
    if (added) changed();
  });
  formatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      format =
        button.dataset.format === "html"
          ? "html"
          : button.dataset.format === "url"
            ? "url"
            : "markdown";
      formatButtons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      renderSnippet();
    });
  });
  document
    .querySelectorAll<HTMLButtonElement>("[data-preset]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        input.value = presets[button.dataset.preset ?? ""] ?? input.value;
        changed();
      });
    });
  document
    .querySelectorAll<HTMLButtonElement>("button[data-surface]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        surface = button.dataset.surface ?? "dark";
        stage.dataset.surface = surface;
        livePreview.setTheme(surface);
        document.querySelectorAll("button[data-surface]").forEach((item) => {
          if (item instanceof HTMLButtonElement)
            item.setAttribute("aria-pressed", String(item === button));
        });
        saveState();
      });
    });
  pause.addEventListener("click", () => {
    paused = !paused;
    renderControls();
    livePreview.setPaused(paused);
  });
  copy.addEventListener("click", () => {
    if (exportUrl) void copyText(snippet.value, "Copied. Ready to paste.");
  });
  share.addEventListener("click", () => {
    saveState();
    void copyText(location.href, "Editor link copied with your settings.");
  });
  download.addEventListener("click", () => {
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `icon-${mode === "marquee" ? "marquee" : "row"}.svg`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("SVG download started.");
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !(event.target instanceof HTMLInputElement) &&
      !(event.target instanceof HTMLTextAreaElement) &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
      search.focus();
    }
  });
  document
    .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    .forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView();
        if (link.classList.contains("skip-link"))
          input.focus({ preventScroll: true });
      });
    });
  window.addEventListener("hashchange", () => {
    if (location.hash.startsWith("#i=")) {
      restoreState();
      changed();
    }
  });

  restoreState();
  changed();
}

export const script = `(${composer.toString()})(${JSON.stringify({
  names: iconNames,
  aliases: config.icons.aliases,
  maxIcons: config.icons.maxPerRequest,
  maxLogoBytes: config.landing.maxLogoBytes,
  maxLogoCount: config.landing.maxLogoCount,
  logoRasterPx: config.landing.logoRasterPx,
})}, (${createSvgRenderer.toString()})(${JSON.stringify(rendererSettings)}, ${scopeIds.toString()}), ${createLivePreview.toString()}, ${readLocalLogo.toString()});`;
