import { expect, test } from "bun:test";
import { config } from "../config";
import { createPresetCodec, type EffectPreset } from "./preset";

const defaults = {
  ...config.landing.effectDefaults,
  bezier: [...config.landing.effectDefaults.bezier],
} as EffectPreset;
const codec = createPresetCodec(defaults);

test("flat YAML presets round-trip and allow safe custom settings", () => {
  expect(codec.parse(codec.stringify(defaults))).toEqual(defaults);
  expect(
    codec.parse(
      'effect: "chrome"\nintensity: 20 # subtle\npauseStyle: bezier\nbezier: [0.2, 0.1, 0.8, 1]\nhoverPause: true',
    ),
  ).toMatchObject({
    effect: "chrome",
    intensity: 20,
    hoverPause: true,
    bezier: [0.2, 0.1, 0.8, 1],
  });
});

test("rejects unsupported code, references, fields, duplicates and out-of-range data", () => {
  for (const text of [
    "effect: <script>",
    "effect: &x glint",
    "js: alert(1)",
    "effect: glint\neffect: none",
    "intensity: 101",
    "pauseDuration: 0",
    "bezier: [0, -1, 1, 1]",
    "bezier: [0, 1]",
    "hoverPause: yes",
    "x".repeat(4097),
  ]) {
    expect(() => codec.parse(text)).toThrow();
  }
});
