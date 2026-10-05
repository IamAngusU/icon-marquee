import { config } from "../config";
import { iconNames } from "../utils/registry";

type ComposerData = {
  names: readonly string[];
  aliases: Readonly<Record<string, string>>;
  maxIcons: number;
};

function composer(data: ComposerData) {
  function element<T extends HTMLElement>(id: string): T {
    const found = document.getElementById(id);
    if (!found) throw new Error(`Missing editor element: ${id}`);
    return found as T;
  }

  const input = element<HTMLInputElement>("icons");
  const preview = element<HTMLImageElement>("preview");
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
  let previewUrl = "";
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
    history.replaceState(null, "", `#${state.toString()}`);
  }

  function restoreState() {
    const state = new URLSearchParams(location.hash.slice(1));
    if (state.has("i")) input.value = state.get("i") ?? "";
    mode = state.get("mode") === "icons" ? "icons" : "marquee";
    direction = state.get("direction") === "right" ? "right" : "left";
    surface = state.get("surface") === "light" ? "light" : "dark";
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
  }

  function renderSnippet() {
    const labels = { markdown: "Markdown", html: "HTML", url: "URL" };
    const htmlUrl = exportUrl
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;");
    snippet.value = !exportUrl
      ? ""
      : format === "markdown"
        ? `![My tech stack](${exportUrl})`
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
    const contents =
      paused && mode === "marquee"
        ? svg.replace(
            "</svg>",
            "<style>.track{animation-play-state:paused!important}</style></svg>",
          )
        : svg;
    const next = URL.createObjectURL(
      new Blob([contents], { type: "image/svg+xml" }),
    );
    preview.src = next;
    preview.hidden = false;
    empty.hidden = true;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = next;
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
      if (nameSet.has(canonical(name))) {
        const img = document.createElement("img");
        img.src = `/v1/icons?i=${encodeURIComponent(name)}&height=24`;
        img.alt = "";
        li.append(img);
      }
      const label = document.createElement("span");
      label.textContent = name;
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
    const filtered = allNames.filter(
      (name) => name.includes(query) || matchingAliases.has(name),
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
      button.title = name;
      button.setAttribute("aria-pressed", String(chosen.has(name)));
      button.setAttribute(
        "aria-label",
        (chosen.has(name) ? "Remove " : "Add ") + name,
      );
      const img = document.createElement("img");
      img.src = `/v1/icons?i=${encodeURIComponent(name)}&height=40`;
      img.alt = "";
      img.loading = "lazy";
      img.width = 35;
      img.height = 35;
      const label = document.createElement("span");
      label.textContent = name;
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
    request = new AbortController();
    const query = params().toString().replaceAll("%2C", ",");
    const path = `/v1/${mode}?${query}`;
    try {
      const res = await fetch(path, { signal: request.signal });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(
          body.error ||
            "The image could not be generated. Try another icon list.",
        );
      }
      const result = await res.text();
      if (id !== requestId) return;
      svg = result;
      exportUrl = location.origin + path;
      renderPreview();
      renderSnippet();
      setExportEnabled(true);
      input.removeAttribute("aria-invalid");
      const skipped = res.headers.get("X-Unknown-Icons");
      notify(
        skipped
          ? "Unknown icons skipped: " +
              skipped.split(",").map(decodeURIComponent).join(", ")
          : "",
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
    renderPreview();
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
})});`;
