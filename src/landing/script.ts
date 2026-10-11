import { config } from "../config";
import { createMotionTools } from "../utils/motion";
import { createPresetCodec, type EffectPreset } from "../utils/preset";
import { createProjectCodec, type MarqueeProject } from "../utils/project";
import { iconNames } from "../utils/registry";
import { rendererSettings } from "../utils/render";
import { scopeIds } from "../utils/scope-ids";
import { createSvgRenderer } from "../utils/svg";
import { createLogoTools, type LogoThemeMode } from "./logo-tools";
import { type LocalLogo, readLocalLogo } from "./logos";
import { createLivePreview } from "./preview";

type ComposerData = {
  names: readonly string[];
  aliases: Readonly<Record<string, string>>;
  maxIcons: number;
  maxLogoBytes: number;
  maxProjectBytes: number;
  maxLogoCount: number;
  logoRasterPx: number;
  staticSite: boolean;
  effects: EffectPreset;
};

function composer(
  data: ComposerData,
  renderer: ReturnType<typeof createSvgRenderer>,
  makePreview: typeof createLivePreview,
  readLogo: typeof readLocalLogo,
  motion: ReturnType<typeof createMotionTools>,
  codec: ReturnType<typeof createPresetCodec>,
  projectCodec: ReturnType<typeof createProjectCodec>,
  logoTools: ReturnType<typeof createLogoTools>,
) {
  function element<T extends HTMLElement>(id: string): T {
    const found = document.getElementById(id);
    if (!found) throw new Error(`Missing editor element: ${id}`);
    return found as T;
  }

  const input = element<HTMLInputElement>("icons");
  const preview = element<HTMLDivElement>("preview");
  const livePreview = makePreview(preview, motion);
  let effects = codec.parse("");
  const effectSelect = element<HTMLSelectElement>("effect");
  const pauseStyle = element<HTMLSelectElement>("pause-style");
  const hoverPause = element<HTMLInputElement>("hover-pause");
  const yaml = element<HTMLTextAreaElement>("effect-yaml");
  const effectFields = {
    effectArea: element<HTMLSelectElement>("effect-area"),
    effectTiming: element<HTMLSelectElement>("effect-timing"),
    effectCoverage: element<HTMLSelectElement>("effect-coverage"),
    effectIcons: element<HTMLInputElement>("effect-icons"),
    intensity: element<HTMLInputElement>("intensity"),
    effectDuration: element<HTMLInputElement>("effect-duration"),
    effectInterval: element<HTMLInputElement>("effect-interval"),
    effectVariation: element<HTMLInputElement>("effect-variation"),
    edgeFade: element<HTMLInputElement>("edge-fade"),
  };
  const tooltips = element<HTMLInputElement>("tooltips");
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
  const sourceButtons =
    document.querySelectorAll<HTMLButtonElement>("[data-source]");
  const githubRepository = element<HTMLInputElement>("github-repository");
  const githubInclude = element<HTMLInputElement>("github-include");
  const githubExclude = element<HTMLInputElement>("github-exclude");
  const githubConnect = element<HTMLButtonElement>("connect-github");
  const logoInput = element<HTMLInputElement>("logo-files");
  const customLogos = new Map<string, LocalLogo>();
  const assetCache = new Map<string, string>();
  let logoCounter = 0;
  let hasLocal = false;
  let currentSvgs: string[] = [];
  let currentNames: string[] = [];
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
  let catalogPage = 0;
  let requestId = 0;
  let request: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout>;
  let svg = "";
  let exportUrl = "";
  let dragIndex = -1;
  let source: "manual" | "github" = "manual";
  let manualLineup = input.value;
  let githubOwner = "";
  let githubRepo = "";
  let githubDetectedIcons: string[] = [];
  let githubLanguages: {
    name: string;
    percentage: number;
    icon?: string;
  }[] = [];
  let githubRequest: AbortController | undefined;

  const names = () =>
    input.value
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);
  const canonical = (name: string) =>
    Object.hasOwn(data.aliases, name) ? (data.aliases[name] ?? name) : name;
  const csv = (value: string) =>
    value
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);
  const thumbnail = (name: string, height: number) =>
    data.staticSite
      ? `./icons/${encodeURIComponent(canonical(name))}.svg`
      : `/v1/icons?i=${encodeURIComponent(name)}&height=${height}`;

  function notify(message: string, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
  }

  function setExportEnabled(enabled: boolean) {
    copy.disabled = !enabled;
    download.disabled = !enabled;
    element<HTMLButtonElement>("download-html").disabled = !enabled;
  }

  function params() {
    const params = new URLSearchParams();
    params.set("i", names().join(","));
    params.set("height", controls.height.value);
    params.set("gap", controls.gap.value);
    if (effects.effect !== "none") {
      params.set("effect", effects.effect);
      params.set("intensity", String(effects.intensity));
      params.set("effectDuration", String(effects.effectDuration));
      for (const key of [
        "effectArea",
        "effectTiming",
        "effectCoverage",
        "effectInterval",
        "effectVariation",
      ] as const)
        params.set(key, String(effects[key]));
      const indices = renderOptions().effectIndices;
      if (indices.length) params.set("effectIndices", indices.join(","));
    }
    params.set("edgeFade", String(effects.edgeFade));
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
    state.set("source", source);
    if (source === "github" && githubOwner && githubRepo) {
      state.set("repo", `${githubOwner}/${githubRepo}`);
      if (githubInclude.value.trim())
        state.set("include", githubInclude.value.trim());
      if (githubExclude.value.trim())
        state.set("exclude", githubExclude.value.trim());
    }
    state.set("mode", mode);
    state.set("width", controls.width.value);
    state.set("speed", controls.speed.value);
    state.set("direction", direction);
    state.set("surface", surface);
    state.set("order", order);
    state.set("seed", String(seed));
    state.set("fx", codec.stringify(effects));
    history.replaceState(null, "", `#${state.toString()}`);
  }

  function restoreState() {
    const state = new URLSearchParams(location.hash.slice(1));
    const preset = state.get("fx");
    if (preset) {
      try {
        effects = codec.parse(preset);
      } catch {
        effects = codec.parse("");
      }
    }
    syncEffectControls();
    livePreview.setMotion(effects);
    if (state.has("i")) input.value = state.get("i") ?? "";
    source = state.get("source") === "github" ? "github" : "manual";
    githubOwner = "";
    githubRepo = "";
    const storedRepo = state.get("repo") ?? "";
    const repoParts = storedRepo.split("/");
    if (repoParts.length === 2) {
      githubOwner = repoParts[0] ?? "";
      githubRepo = repoParts[1] ?? "";
      githubRepository.value = storedRepo;
    }
    githubInclude.value = state.get("include") ?? "";
    githubExclude.value = state.get("exclude") ?? "";
    if (source === "github") githubDetectedIcons = [...names().map(canonical)];
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
    renderSourceControls();
  }

  function syncEffectControls() {
    effectSelect.value = effects.effect;
    pauseStyle.value = effects.pauseStyle;
    hoverPause.checked = effects.hoverPause;
    tooltips.checked = effects.tooltips;
    for (const [key, field] of Object.entries(effectFields))
      field.value = String(effects[key as keyof typeof effectFields]);
    for (const [id, value, unit] of [
      ["edge-fade", effects.edgeFade, " px"],
      ["intensity", effects.intensity, "%"],
      ["effect-duration", effects.effectDuration, " s"],
      ["effect-interval", effects.effectInterval, " s"],
      ["effect-variation", effects.effectVariation, "%"],
    ] as const)
      element(`${id}-value`).textContent = value + unit;
    element("finish-controls").hidden = effects.effect === "none";
    element("effect-targets").hidden = effects.effectCoverage !== "selected";
    element("variation-control").hidden = effects.effectTiming !== "random";
    yaml.value = codec.stringify(effects);
    renderRanges();
  }

  function renderRanges() {
    document
      .querySelectorAll<HTMLInputElement>('input[type="range"]')
      .forEach((control) => {
        const min = Number(control.min);
        const span = Number(control.max) - min;
        const progress = span
          ? ((Number(control.value) - min) / span) * 100
          : 0;
        control.style.setProperty("--range-progress", `${progress}%`);
      });
  }

  function renderControls() {
    for (const [key, control] of Object.entries(controls)) {
      element<HTMLOutputElement>(`${key}-value`).textContent =
        control.value + (key === "speed" ? " px/s" : " px");
    }
    controls.width.disabled = mode === "icons";
    controls.speed.disabled = mode === "icons";
    effectFields.edgeFade.disabled = mode === "icons";
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
    renderRanges();
  }

  function renderSourceControls() {
    sourceButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.source === source),
      );
    });
    element("manual-source").hidden = source !== "manual";
    element("github-source").hidden = source !== "github";
    element("reorder-help").textContent =
      source === "github"
        ? "GitHub orders detected languages by code share. Pin or exclude icons to adjust the lineup."
        : "Drag to reorder. Or focus an icon and press Alt + arrow keys.";
    element("clear").textContent =
      source === "github" ? "Disconnect" : "Clear all";
    element<HTMLButtonElement>("add-logos").disabled = source === "github";
  }

  function githubStatus(message: string, connected = false) {
    const target = element("github-source-status");
    target.textContent = message;
    target.dataset.connected = String(connected);
  }

  function renderGithubLanguages() {
    const panel = element("detected-languages");
    const list = element("github-language-list");
    list.replaceChildren();
    panel.hidden = githubLanguages.length === 0;
    for (const language of githubLanguages) {
      const chip = document.createElement("span");
      chip.className = `language-chip${language.icon ? "" : " unsupported"}`;
      chip.textContent = language.name;
      const share = document.createElement("small");
      share.textContent = `${language.percentage}%`;
      chip.append(share);
      if (!language.icon) chip.title = "No matching bundled icon yet";
      list.append(chip);
    }
  }

  function showGithubConnected() {
    const unsupported = githubLanguages.filter(
      (language) => !language.icon,
    ).length;
    githubStatus(
      `Connected · ${githubDetectedIcons.length} ${githubDetectedIcons.length === 1 ? "icon" : "icons"}${unsupported ? ` · ${unsupported} without a match` : ""}`,
      true,
    );
  }

  function applyGithubLineup() {
    const excluded = new Set(csv(githubExclude.value).map(canonical));
    const pinned = csv(githubInclude.value)
      .map(canonical)
      .filter((name) => nameSet.has(name));
    const list = [
      ...new Set([
        ...githubDetectedIcons.filter((name) => !excluded.has(name)),
        ...pinned,
      ]),
    ].filter((name) => !excluded.has(name));
    input.value = list.join(",");
    const unknown = csv(githubInclude.value).filter(
      (name) => !nameSet.has(canonical(name)),
    );
    if (unknown.length)
      githubStatus(
        `Unknown pinned icons skipped: ${unknown.join(", ")}`,
        Boolean(githubOwner && githubRepo),
      );
    else if (githubOwner && githubRepo) showGithubConnected();
    changed();
  }

  function repositoryParts(value: string) {
    let text = value
      .trim()
      .replace(/\/$/, "")
      .replace(/\.git$/i, "");
    if (/^https?:\/\//i.test(text)) {
      try {
        const url = new URL(text);
        if (url.hostname.toLowerCase() !== "github.com") return;
        text = url.pathname.replace(/^\//, "");
      } catch {
        return;
      }
    }
    text = text.replace(/^github\.com\//i, "");
    const [owner, repo, extra] = text.split("/");
    if (
      extra ||
      !owner ||
      !repo ||
      !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(owner) ||
      !/^[a-z\d._-]{1,100}$/i.test(repo)
    )
      return;
    return { owner, repo };
  }

  function githubApiUrl(extension: "json" | "svg") {
    if (!githubOwner || !githubRepo) return "";
    return new URL(
      `./api/${encodeURIComponent(githubOwner)}/${encodeURIComponent(githubRepo)}.${extension}`,
      location.href,
    ).href;
  }

  function githubSvgUrl() {
    const url = new URL(githubApiUrl("svg"));
    const appearance = params();
    appearance.delete("i");
    if (mode === "icons") appearance.set("mode", "icons");
    else appearance.delete("mode");
    const include = csv(githubInclude.value);
    const exclude = csv(githubExclude.value);
    if (include.length) appearance.set("include", include.join(","));
    if (exclude.length) appearance.set("exclude", exclude.join(","));
    url.search = appearance.toString().replaceAll("%2C", ",");
    return url.href;
  }

  async function connectGithub() {
    const repository = repositoryParts(githubRepository.value);
    if (!repository) {
      githubRepository.setAttribute("aria-invalid", "true");
      githubStatus("Use a public GitHub URL or owner/repository.");
      return;
    }
    githubRequest?.abort();
    githubRequest = new AbortController();
    githubConnect.disabled = true;
    githubStatus("Reading languages from GitHub…");
    try {
      const endpoint = new URL(
        `./api/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}.json`,
        location.href,
      );
      const response = await fetch(endpoint, { signal: githubRequest.signal });
      const result = (await response.json()) as {
        error?: string;
        icons?: string[];
        languages?: {
          name: string;
          percentage: number;
          icon?: string;
        }[];
      };
      if (!response.ok)
        throw new Error(result.error ?? "Could not connect this repository.");
      githubOwner = repository.owner;
      githubRepo = repository.repo;
      githubDetectedIcons = result.icons ?? [];
      githubLanguages = result.languages ?? [];
      githubRepository.value = `${githubOwner}/${githubRepo}`;
      githubRepository.removeAttribute("aria-invalid");
      renderGithubLanguages();
      applyGithubLineup();
    } catch (error) {
      if (githubRequest.signal.aborted) return;
      githubRepository.setAttribute("aria-invalid", "true");
      githubStatus(
        error instanceof Error
          ? error.message
          : "Could not connect this repository.",
      );
    } finally {
      githubConnect.disabled = false;
    }
  }

  function switchSource(next: "manual" | "github") {
    if (source === next) return;
    if (source === "manual") manualLineup = input.value;
    source = next;
    if (source === "manual") input.value = manualLineup;
    else if (!githubDetectedIcons.length) input.value = "";
    renderSourceControls();
    if (source === "github" && githubDetectedIcons.length) {
      applyGithubLineup();
      githubRepository.focus();
      return;
    }
    changed();
    if (source === "github") githubRepository.focus();
  }

  function reconnectSavedGithub() {
    if (source === "github" && githubOwner && githubRepo) void connectGithub();
  }

  function renderSnippet() {
    if (svg)
      svg = projectCodec.embed(
        svg,
        projectState(
          names().filter(
            (name) => nameSet.has(canonical(name)) || customLogos.has(name),
          ),
        ),
      );
    const labels = { markdown: "Markdown", html: "HTML", url: "URL" };
    const automatic = source === "github" && githubOwner && githubRepo;
    const snippetUrl = automatic
      ? githubSvgUrl()
      : `./icon-${mode === "marquee" ? "marquee" : "row"}.svg`;
    const markdown = `[![My tech stack](${snippetUrl})](https://github.com/IamAngusU/icon-marquee)`;
    snippet.value = !exportUrl
      ? ""
      : format === "markdown"
        ? markdown
        : format === "html"
          ? automatic
            ? `<a href="https://github.com/IamAngusU/icon-marquee"><img src="${snippetUrl.replaceAll("&", "&amp;")}" alt="My tech stack" /></a>`
            : svg
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
      effects.tooltips
        ? currentNames.map(
            (name) => customLogos.get(name)?.label ?? canonical(name),
          )
        : [],
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
      ...effects,
      labels: effects.tooltips
        ? currentNames.map(
            (name) => customLogos.get(name)?.label ?? canonical(name),
          )
        : [],
      effectIndices: currentNames.flatMap((name, i) =>
        effects.effectIcons
          .split(",")
          .map((item) => canonical(item.trim()))
          .includes(canonical(name))
          ? [i]
          : [],
      ),
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
      const automatic =
        source === "github" && githubDetectedIcons.includes(canonical(name));
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.draggable = source === "manual";
      li.dataset.automatic = String(automatic);
      li.setAttribute(
        "aria-label",
        automatic
          ? `${name}, detected by GitHub, position ${index + 1}.`
          : name +
              ", position " +
              (index + 1) +
              (source === "manual"
                ? ". Alt plus left or right arrow to move."
                : ". Pinned icon."),
      );
      if (nameSet.has(canonical(name)) || customLogos.has(name)) {
        const img = document.createElement("img");
        img.src = customLogos.get(name)?.thumbnail ?? thumbnail(name, 24);
        img.alt = "";
        li.append(img);
      }
      const label = document.createElement("span");
      label.textContent = customLogos.get(name)?.label ?? name;
      if (automatic) {
        const origin = document.createElement("span");
        origin.className = "origin-badge";
        origin.textContent = "GitHub";
        li.append(label, origin);
      } else li.append(label);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${name}`);
      remove.addEventListener("click", () => {
        if (source === "github") {
          if (automatic) {
            githubExclude.value = [
              ...new Set([...csv(githubExclude.value), canonical(name)]),
            ].join(",");
          } else {
            githubInclude.value = csv(githubInclude.value)
              .filter((item) => canonical(item) !== canonical(name))
              .join(",");
          }
          applyGithubLineup();
          return;
        }
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
      li.append(remove);
      li.addEventListener("keydown", (event) => {
        if (
          source === "manual" &&
          event.altKey &&
          ["ArrowLeft", "ArrowRight"].includes(event.key)
        ) {
          event.preventDefault();
          reorder(index, index + (event.key === "ArrowLeft" ? -1 : 1));
        }
      });
      li.addEventListener("dragstart", (event) => {
        if (source !== "manual") return;
        dragIndex = index;
        li.classList.add("dragging");
        event.dataTransfer?.setData("text/plain", String(index));
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      });
      li.addEventListener("dragover", (event) => {
        if (source !== "manual") return;
        event.preventDefault();
        li.classList.add("drag-over");
      });
      li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
      li.addEventListener("drop", (event) => {
        if (source !== "manual") return;
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
    catalogPage = Math.min(
      catalogPage,
      Math.max(0, Math.ceil(filtered.length / 24) - 1),
    );
    for (const name of filtered.slice(
      catalogPage * 24,
      (catalogPage + 1) * 24,
    )) {
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
      img.src = customLogos.get(name)?.thumbnail ?? thumbnail(name, 40);
      img.alt = "";
      img.loading = "lazy";
      img.width = 35;
      img.height = 35;
      const label = document.createElement("span");
      label.textContent = customLogos.get(name)?.label ?? name;
      button.append(img, label);
      button.addEventListener("click", () => {
        const list = names();
        if (source === "github") {
          const detected = githubDetectedIcons.includes(name);
          if (list.some((item) => canonical(item) === name)) {
            if (detected)
              githubExclude.value = [
                ...new Set([...csv(githubExclude.value), name]),
              ].join(",");
            else
              githubInclude.value = csv(githubInclude.value)
                .filter((item) => canonical(item) !== name)
                .join(",");
          } else {
            githubExclude.value = csv(githubExclude.value)
              .filter((item) => canonical(item) !== name)
              .join(",");
            if (!detected)
              githubInclude.value = [
                ...new Set([...csv(githubInclude.value), name]),
              ].join(",");
          }
          applyGithubLineup();
          catalog
            .querySelector<HTMLButtonElement>(`[data-icon="${name}"]`)
            ?.focus();
          return;
        }
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
    element<HTMLButtonElement>("previous-icons").disabled = catalogPage === 0;
    element<HTMLButtonElement>("next-icons").disabled =
      (catalogPage + 1) * 24 >= filtered.length;
    element("catalog-page").textContent =
      `${filtered.length ? catalogPage * 24 + 1 : 0}–${Math.min((catalogPage + 1) * 24, filtered.length)} of ${filtered.length}`;
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
        if (data.staticSite) {
          await Promise.all(
            missing.map(async (name) => {
              const response = await fetch(thumbnail(name, 256), {
                signal: request?.signal,
              });
              if (!response.ok)
                throw new Error(`Could not load ${name}. Try again.`);
              const asset = await response.text();
              if (id === requestId) assetCache.set(name, asset);
            }),
          );
        } else {
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
      }
      if (id !== requestId) return;
      currentSvgs = known.map(
        (name) =>
          customLogos.get(name)?.svg ?? assetCache.get(canonical(name)) ?? "",
      );
      if (currentSvgs.some((asset) => !asset))
        throw new Error("Some icons could not be loaded. Please try again.");
      currentNames = known;
      if (mode === "marquee" && order === "shuffle") {
        currentNames = known.filter(
          (_, i) => currentSvgs.indexOf(currentSvgs[i] ?? "") === i,
        );
        currentSvgs = [...new Set(currentSvgs)];
      }
      svg =
        mode === "marquee"
          ? renderer.marquee(currentSvgs, renderOptions())
          : renderer.icons(currentSvgs, renderOptions());
      svg = projectCodec.embed(svg, projectState(known));
      hasLocal = known.some((name) => customLogos.has(name));
      const automatic = source === "github" && githubOwner && githubRepo;
      share.disabled = hasLocal;
      formatButtons.forEach((button) => {
        button.disabled =
          (hasLocal || (data.staticSite && !automatic)) &&
          button.dataset.format === "url";
        if (button.dataset.format === "url")
          button.hidden = data.staticSite && !automatic;
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
      exportUrl = automatic
        ? githubSvgUrl()
        : hasLocal || data.staticSite
          ? `./icon-${mode === "marquee" ? "marquee" : "row"}.svg`
          : `${location.origin}/v1/${mode}?${params().toString().replaceAll("%2C", ",")}`;
      element("export-note").textContent = automatic
        ? "Paste once. GitHub languages refresh automatically; download the SVG only when you want a frozen copy."
        : hasLocal
          ? "Download the SVG beside your README. Your logos stay in this browser until reloaded; editor links cannot include them."
          : "Download the SVG beside your README, then paste the snippet. One file adapts to light and dark.";
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

  function projectState(lineup = names()): MarqueeProject {
    return {
      version: 1,
      names: lineup,
      width: Number(controls.width.value),
      height: Number(controls.height.value),
      gap: Number(controls.gap.value),
      speed: Number(controls.speed.value),
      mode,
      direction,
      order,
      seed,
      surface: surface === "light" ? "light" : "dark",
      effects,
      logos: [...customLogos]
        .filter(([key]) => lineup.includes(key))
        .map(([key, logo]) => ({
          key,
          label: logo.label,
          dataUrl: logo.dataUrl,
          themeMode: logo.themeMode,
        })),
    };
  }

  let importing = false;
  async function importProject(text: string) {
    if (importing) return;
    importing = true;
    element<HTMLButtonElement>("import-project").disabled = true;
    const importStatus = element("import-status");
    importStatus.textContent = "Reading design…";
    try {
      const project = projectCodec.read(text);
      if (
        project.names.some(
          (name) =>
            !nameSet.has(canonical(name)) &&
            !project.logos.some((logo) => logo.key === name),
        )
      )
        throw new Error(
          "This project contains unknown icons. Your current design has not changed.",
        );
      const logos = new Map<string, LocalLogo>();
      for (const logo of project.logos) {
        const bytes = Uint8Array.from(
          atob(logo.dataUrl.split(",")[1] ?? ""),
          (c) => c.charCodeAt(0),
        );
        const clean = await readLogo(
          new File([bytes], `${logo.key}.png`, { type: "image/png" }),
          data.maxLogoBytes,
          data.logoRasterPx,
          logoTools,
        );
        logos.set(logo.key, {
          ...clean,
          label: logo.label,
          ...logoTools.render(
            clean.dataUrl,
            clean.maskDataUrl,
            clean.automatic,
            logo.themeMode ?? "auto",
          ),
        });
      }
      customLogos.clear();
      for (const [key, logo] of logos) customLogos.set(key, logo);
      logoCounter = Math.max(
        0,
        ...[...logos.keys()].map((key) => Number(key.slice(7))),
      );
      input.value = project.names.join(",");
      source = "manual";
      manualLineup = input.value;
      githubRequest?.abort();
      for (const [key, field] of Object.entries(controls))
        field.value = String(project[key as keyof typeof controls]);
      ({ mode, direction, order, seed, surface, effects } = project);
      paused = false;
      catalogPage = 0;
      search.value = "";
      syncEffectControls();
      livePreview.setMotion(effects);
      renderSourceControls();
      changed();
      element<HTMLTextAreaElement>("project-source").value = "";
      importStatus.textContent = `Design restored. ${project.names.length} icons${logos.size ? `, including ${logos.size} local ${logos.size === 1 ? "logo" : "logos"}` : ""}.`;
    } catch (error) {
      importStatus.textContent =
        error instanceof Error
          ? error.message
          : "Could not import this design.";
    } finally {
      importing = false;
      element<HTMLButtonElement>("import-project").disabled = false;
    }
  }

  async function importFile(file: File) {
    if (file.size > data.maxProjectBytes) {
      element("import-status").textContent = "Keep project files under 12 MB.";
      return;
    }
    await importProject(await file.text());
  }

  function changed() {
    invalidate();
    renderSelected();
    renderCatalog();
    renderLocalLogos();
    renderControls();
    saveState();
    timer = setTimeout(update, 180);
  }

  function renderLocalLogos() {
    const panel = element("local-logo-styles");
    const list = element("local-logo-options");
    panel.hidden = customLogos.size === 0;
    list.replaceChildren();
    for (const [key, logo] of customLogos) {
      const row = document.createElement("div");
      row.className = "local-logo-style";
      const label = document.createElement("label");
      label.htmlFor = `logo-theme-${key}`;
      label.textContent = logo.label;
      const description = document.createElement("small");
      description.textContent = logo.adaptive
        ? "Adaptive monochrome"
        : "Original colors";
      const select = document.createElement("select");
      select.className = "field-input";
      select.id = label.htmlFor;
      select.setAttribute("aria-label", `Colors for ${logo.label}`);
      for (const [value, text] of [
        ["auto", "Auto"],
        ["original", "Original colors"],
        ["monochrome", "Monochrome"],
      ]) {
        const option = document.createElement("option");
        option.value = value ?? "auto";
        option.textContent = text ?? "Auto";
        select.append(option);
      }
      select.value = logo.themeMode;
      select.addEventListener("change", () => {
        Object.assign(
          logo,
          logoTools.render(
            logo.dataUrl,
            logo.maskDataUrl,
            logo.automatic,
            select.value as LogoThemeMode,
          ),
        );
        changed();
        element<HTMLSelectElement>(select.id).focus({ preventScroll: true });
      });
      const name = document.createElement("div");
      name.append(label, description);
      row.append(name, select);
      list.append(row);
    }
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
  sourceButtons.forEach((button) => {
    button.addEventListener("click", () =>
      switchSource(button.dataset.source === "github" ? "github" : "manual"),
    );
  });
  githubConnect.addEventListener("click", () => void connectGithub());
  githubRepository.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void connectGithub();
    }
  });
  githubInclude.addEventListener("input", applyGithubLineup);
  githubExclude.addEventListener("input", applyGithubLineup);
  search.addEventListener("input", () => {
    catalogPage = 0;
    renderCatalog();
    catalog.scrollTop = 0;
  });
  for (const [id, step] of [
    ["previous-icons", -1],
    ["next-icons", 1],
  ] as const)
    element(id).addEventListener("click", () => {
      catalogPage += step;
      renderCatalog();
      catalog.scrollTop = 0;
    });
  const projectFile = element<HTMLInputElement>("project-file");
  element("open-project").addEventListener("click", () => projectFile.click());
  projectFile.addEventListener("change", () => {
    const file = projectFile.files?.[0];
    if (file) void importFile(file);
    projectFile.value = "";
  });
  element("import-project").addEventListener(
    "click",
    () =>
      void importProject(element<HTMLTextAreaElement>("project-source").value),
  );
  const importPanel = document.querySelector<HTMLElement>(".import-panel");
  importPanel?.addEventListener("dragover", (event) => {
    if (event.dataTransfer?.types.includes("Files")) {
      event.preventDefault();
      importPanel.classList.add("drag-over");
    }
  });
  importPanel?.addEventListener("dragleave", () =>
    importPanel.classList.remove("drag-over"),
  );
  importPanel?.addEventListener("drop", (event) => {
    event.preventDefault();
    importPanel.classList.remove("drag-over");
    importPanel.setAttribute("open", "");
    const file = event.dataTransfer?.files[0];
    if (file) void importFile(file);
  });
  element("clear").addEventListener("click", () => {
    if (source === "github") {
      githubRequest?.abort();
      githubOwner = "";
      githubRepo = "";
      githubDetectedIcons = [];
      githubLanguages = [];
      githubRepository.value = "";
      githubInclude.value = "";
      githubExclude.value = "";
      renderGithubLanguages();
      githubStatus(
        "Paste a public GitHub repository. No account or permissions needed.",
      );
      switchSource("manual");
      return;
    }
    input.value = "";
    manualLineup = "";
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
        const logo = await readLogo(
          file,
          data.maxLogoBytes,
          data.logoRasterPx,
          logoTools,
        );
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
        if (source === "github") switchSource("manual");
        input.value = presets[button.dataset.preset ?? ""] ?? input.value;
        manualLineup = input.value;
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
  effectSelect.addEventListener("change", () => {
    effects.effect = effectSelect.value as EffectPreset["effect"];
    syncEffectControls();
    changed();
  });
  for (const [key, field] of Object.entries(effectFields))
    field.addEventListener("input", () => {
      try {
        effects = codec.parse(
          codec.stringify({
            ...effects,
            [key]:
              typeof effects[key as keyof typeof effectFields] === "number"
                ? Number(field.value)
                : field.value,
          }),
        );
        syncEffectControls();
        changed();
      } catch {
        element("preset-status").textContent =
          "Use comma-separated icon names.";
      }
    });
  tooltips.addEventListener("change", () => {
    effects.tooltips = tooltips.checked;
    syncEffectControls();
    changed();
  });
  pauseStyle.addEventListener("change", () => {
    effects.pauseStyle = pauseStyle.value as EffectPreset["pauseStyle"];
    if (effects.pauseStyle === "bezier")
      yaml.closest("details")?.setAttribute("open", "");
    livePreview.setMotion(effects);
    yaml.value = codec.stringify(effects);
    saveState();
    renderSnippet();
  });
  hoverPause.addEventListener("change", () => {
    effects.hoverPause = hoverPause.checked;
    livePreview.setMotion(effects);
    yaml.value = codec.stringify(effects);
    saveState();
    renderSnippet();
  });
  element("apply-preset").addEventListener("click", () => {
    try {
      const next = codec.parse(yaml.value);
      const appearanceChanged = (
        Object.keys(next) as (keyof EffectPreset)[]
      ).some(
        (key) =>
          !["pauseStyle", "pauseDuration", "bezier", "hoverPause"].includes(
            key,
          ) && next[key] !== effects[key],
      );
      effects = next;
      syncEffectControls();
      livePreview.setMotion(effects);
      saveState();
      if (appearanceChanged) changed();
      else renderSnippet();
      element("preset-status").textContent = "Preset applied.";
    } catch (error) {
      element("preset-status").textContent =
        error instanceof Error ? error.message : "Check your preset.";
    }
  });
  element("copy-preset").addEventListener(
    "click",
    () => void copyText(codec.stringify(effects), "YAML preset copied."),
  );
  copy.addEventListener("click", () => {
    renderSnippet();
    if (exportUrl) void copyText(snippet.value, "Copied. Ready to paste.");
  });
  share.addEventListener("click", () => {
    saveState();
    void copyText(location.href, "Editor link copied with your settings.");
  });
  function downloadFile(html: boolean) {
    if (!svg) return;
    renderSnippet();
    const content = html
      ? `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Icon Marquee</title><style>:root{color-scheme:light dark}body{margin:32px}svg{max-width:100%;height:auto}</style><body>${svg}</body></html>`
      : svg;
    const url = URL.createObjectURL(
      new Blob([content], { type: html ? "text/html" : "image/svg+xml" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `icon-${mode === "marquee" ? "marquee" : "row"}.${html ? "html" : "svg"}`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(
      `${html ? "HTML" : "SVG"} download started. Reopen it here to edit.`,
    );
  }
  download.addEventListener("click", () => downloadFile(false));
  element("download-html").addEventListener("click", () => downloadFile(true));
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
      reconnectSavedGithub();
    }
  });

  restoreState();
  changed();
  reconnectSavedGithub();
}

export function createClientScript(staticSite = false) {
  const motion = `(${createMotionTools.toString()})()`;
  const defaults = JSON.stringify(config.landing.effectDefaults);
  return `(${composer.toString()})(${JSON.stringify({
    names: iconNames,
    aliases: config.icons.aliases,
    maxIcons: config.icons.maxPerRequest,
    maxLogoBytes: config.landing.maxLogoBytes,
    maxProjectBytes: config.landing.maxProjectBytes,
    maxLogoCount: config.landing.maxLogoCount,
    logoRasterPx: config.landing.logoRasterPx,
    staticSite,
    effects: config.landing.effectDefaults,
  })}, (${createSvgRenderer.toString()})(${JSON.stringify(rendererSettings)}, ${scopeIds.toString()}, ${motion}), ${createLivePreview.toString()}, ${readLocalLogo.toString()}, ${motion}, (${createPresetCodec.toString()})(${defaults}), (${createProjectCodec.toString()}) ((${createPresetCodec.toString()})(${defaults}), ${config.landing.maxProjectBytes}), (${createLogoTools.toString()})(${JSON.stringify(config.landing.logoAppearance)}));`;
}

export const script = createClientScript();
