import type { MotionSettings } from "./motion";

export type EffectPreset = MotionSettings & {
  effect: "none" | "glint" | "chrome" | "holo";
  intensity: number;
  effectDuration: number;
  effectArea: "surface" | "border";
  effectTiming: "stagger" | "random" | "sync";
  effectCoverage: "all" | "some" | "selected";
  effectIcons: string;
  effectInterval: number;
  effectVariation: number;
  edgeFade: number;
  tooltips: boolean;
};

// Flat YAML scalars and one numeric flow sequence; no code, tags or aliases.
export function createPresetCodec(defaults: EffectPreset) {
  function parse(text: string): EffectPreset {
    if (text.length > 4096) throw new Error("Keep presets under 4 KB.");
    const result = {
      ...defaults,
      bezier: [...defaults.bezier],
    } as EffectPreset;
    const seen = new Set<string>();
    for (const line of text.split(/\r?\n/)) {
      const clean = line.replace(/\s+#.*$/, "").trim();
      if (!clean || clean.startsWith("#") || clean === "---") continue;
      const match = /^([a-zA-Z]+):\s*(.+)$/.exec(clean);
      if (!match) throw new Error("Use one key: value per line.");
      const key = match[1] ?? "";
      const value = (match[2] ?? "").replace(/^(['"])(.*)\1$/, "$2");
      if (seen.has(key)) throw new Error(`Duplicate key: ${key}`);
      seen.add(key);
      if (
        key === "effect" &&
        ["none", "glint", "chrome", "holo"].includes(value)
      )
        result.effect = value as EffectPreset["effect"];
      else if (key === "effectArea" && ["surface", "border"].includes(value))
        result.effectArea = value as EffectPreset["effectArea"];
      else if (
        key === "effectTiming" &&
        ["stagger", "random", "sync"].includes(value)
      )
        result.effectTiming = value as EffectPreset["effectTiming"];
      else if (
        key === "effectCoverage" &&
        ["all", "some", "selected"].includes(value)
      )
        result.effectCoverage = value as EffectPreset["effectCoverage"];
      else if (
        key === "effectIcons" &&
        value.length <= 2000 &&
        /^[a-z0-9+,\s-]*$/i.test(value)
      )
        result.effectIcons = value.trim().toLowerCase();
      else if (
        key === "pauseStyle" &&
        ["instant", "ease", "bezier"].includes(value)
      )
        result.pauseStyle = value as MotionSettings["pauseStyle"];
      else if (
        (key === "hoverPause" || key === "tooltips") &&
        ["true", "false"].includes(value)
      )
        result[key] = value === "true";
      else if (
        [
          "intensity",
          "effectDuration",
          "pauseDuration",
          "effectInterval",
          "effectVariation",
          "edgeFade",
        ].includes(key)
      ) {
        const limits: Record<string, [number, number]> = {
          intensity: [0, 100],
          effectDuration: [1, 20],
          pauseDuration: [100, 2000],
          effectInterval: [0, 30],
          effectVariation: [0, 100],
          edgeFade: [0, 96],
        };
        const bounds = limits[key] ?? [0, 0];
        const number = Number(value);
        if (
          !/^\d+(\.\d+)?$/.test(value) ||
          number < bounds[0] ||
          number > bounds[1]
        )
          throw new Error(`${key}: use ${bounds[0]}–${bounds[1]}.`);
        if (key === "intensity") result.intensity = number;
        else if (key === "effectDuration") result.effectDuration = number;
        else if (key === "pauseDuration") result.pauseDuration = number;
        else if (key === "effectInterval") result.effectInterval = number;
        else if (key === "effectVariation") result.effectVariation = number;
        else result.edgeFade = number;
      } else if (key === "bezier") {
        let points: unknown;
        try {
          points = JSON.parse(value);
        } catch {
          throw new Error("bezier: use [0.42, 0, 0.58, 1].");
        }
        if (
          !Array.isArray(points) ||
          points.length !== 4 ||
          points.some(
            (p) =>
              typeof p !== "number" || !Number.isFinite(p) || p < 0 || p > 1,
          )
        )
          throw new Error("bezier: four numbers between 0 and 1.");
        result.bezier = points as EffectPreset["bezier"];
      } else throw new Error(`Unknown key or unsupported value: ${key}`);
    }
    return result;
  }
  function stringify(preset: EffectPreset) {
    return `effect: ${preset.effect}\nintensity: ${preset.intensity}\neffectArea: ${preset.effectArea}\neffectTiming: ${preset.effectTiming}\neffectCoverage: ${preset.effectCoverage}\neffectIcons: "${preset.effectIcons}"\neffectDuration: ${preset.effectDuration}\neffectInterval: ${preset.effectInterval}\neffectVariation: ${preset.effectVariation}\nedgeFade: ${preset.edgeFade}\ntooltips: ${preset.tooltips}\npauseStyle: ${preset.pauseStyle}\npauseDuration: ${preset.pauseDuration}\nbezier: [${preset.bezier.join(", ")}]\nhoverPause: ${preset.hoverPause}`;
  }
  return { parse, stringify };
}
