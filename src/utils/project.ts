import type { LogoThemeMode } from "../landing/logo-tools";
import type { createPresetCodec, EffectPreset } from "./preset";

export type MarqueeProject = {
  version: 1;
  names: string[];
  width: number;
  height: number;
  gap: number;
  speed: number;
  mode: "marquee" | "icons";
  direction: "left" | "right";
  order: "repeat" | "shuffle";
  seed: number;
  surface: "light" | "dark";
  effects: EffectPreset;
  logos: {
    key: string;
    label: string;
    dataUrl: string;
    themeMode?: LogoThemeMode;
  }[];
};

// Read only our encoded JSON envelope; never parse or execute uploaded markup.
export function createProjectCodec(
  presets: ReturnType<typeof createPresetCodec>,
  maxBytes: number,
) {
  function validate(input: unknown): MarqueeProject {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new Error("Invalid project.");
    const data = input as Record<string, unknown>;
    if (data.version !== 1)
      throw new Error("This project version is not supported.");
    if (
      !Array.isArray(data.names) ||
      !data.names.length ||
      data.names.length > 100 ||
      data.names.some(
        (name) => typeof name !== "string" || !/^[a-z0-9+-]{1,80}$/.test(name),
      )
    )
      throw new Error("Invalid icon lineup.");
    for (const [key, min, max] of [
      ["width", 80, 1600],
      ["height", 20, 128],
      ["gap", 0, 96],
      ["speed", 5, 200],
      ["seed", 0, 4294967295],
    ] as const) {
      const n = data[key];
      if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max)
        throw new Error(`Invalid ${key}.`);
    }
    for (const [key, choices] of [
      ["mode", ["marquee", "icons"]],
      ["direction", ["left", "right"]],
      ["order", ["repeat", "shuffle"]],
      ["surface", ["light", "dark"]],
    ] as const) {
      if (!(choices as readonly unknown[]).includes(data[key]))
        throw new Error(`Invalid ${key}.`);
    }
    if (
      !data.effects ||
      typeof data.effects !== "object" ||
      Array.isArray(data.effects)
    )
      throw new Error("Missing effect settings.");
    const effects = presets.parse(
      Object.entries(data.effects)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join("\n"),
    );
    if (!Array.isArray(data.logos) || data.logos.length > 20)
      throw new Error("Invalid local logos.");
    const keys = new Set<string>();
    const logos = data.logos.map((logo: unknown) => {
      if (!logo || typeof logo !== "object")
        throw new Error("Invalid local logo.");
      const { key, label, dataUrl, themeMode } = logo as Record<
        string,
        unknown
      >;
      if (
        typeof key !== "string" ||
        !/^custom-\d{1,8}$/.test(key) ||
        keys.has(key) ||
        typeof label !== "string" ||
        label.length > 50 ||
        typeof dataUrl !== "string" ||
        dataUrl.length > 2097152 ||
        !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl)
      )
        throw new Error("Only embedded PNG logos are supported.");
      keys.add(key);
      if (
        themeMode !== undefined &&
        !["auto", "original", "monochrome"].includes(themeMode as string)
      )
        throw new Error("Invalid logo theme mode.");
      return {
        key,
        label,
        dataUrl,
        ...(themeMode === undefined
          ? {}
          : { themeMode: themeMode as LogoThemeMode }),
      };
    });
    if (
      data.names.some(
        (name: string) => name.startsWith("custom-") && !keys.has(name),
      )
    )
      throw new Error("A local logo is missing.");
    return {
      version: 1,
      names: [...data.names],
      width: data.width,
      height: data.height,
      gap: data.gap,
      speed: data.speed,
      mode: data.mode,
      direction: data.direction,
      order: data.order,
      seed: data.seed,
      surface: data.surface,
      effects,
      logos,
    } as MarqueeProject;
  }
  function encode(project: MarqueeProject) {
    const payload = encodeURIComponent(JSON.stringify(validate(project)));
    if (payload.length > maxBytes)
      throw new Error("Project is too large. Remove some local logos.");
    return payload;
  }
  function read(text: string) {
    if (text.length > maxBytes)
      throw new Error("Keep project files under 12 MB.");
    const match =
      /<metadata id="icon-marquee-project">([^<]+)<\/metadata>/.exec(text);
    if (!match?.[1])
      throw new Error(
        "No editable project found. Import a new Icon Marquee SVG or HTML export, or add this file under Your logos.",
      );
    try {
      return validate(JSON.parse(decodeURIComponent(match[1])));
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Invalid project data.",
      );
    }
  }
  function embed(svg: string, project: MarqueeProject) {
    const result = svg
      .replace(/<metadata id="icon-marquee-project">[^<]*<\/metadata>/g, "")
      .replace(
        /(<svg\b[^>]*>)/,
        `$1<metadata id="icon-marquee-project">${encode(project)}</metadata>`,
      );
    if (result.length > maxBytes - 1024)
      throw new Error("Export exceeds 12 MB. Remove some local logos.");
    return result;
  }
  return { read, embed, validate };
}
