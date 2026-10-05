import { expect, test } from "bun:test";
import { config } from "../config";
import { createPresetCodec, type EffectPreset } from "./preset";
import { createProjectCodec, type MarqueeProject } from "./project";
import { iconNames } from "./registry";

const preset = createPresetCodec({
  ...config.landing.effectDefaults,
  bezier: [...config.landing.effectDefaults.bezier],
} as EffectPreset);
const codec = createProjectCodec(preset, config.landing.maxProjectBytes);
const project: MarqueeProject = {
  version: 1,
  names: ["js", "react"],
  width: 760,
  height: 64,
  gap: 16,
  speed: 40,
  mode: "marquee",
  direction: "right",
  order: "shuffle",
  seed: 42,
  surface: "light",
  effects: preset.parse(
    "effect: holo\neffectTiming: random\neffectArea: border\ntooltips: true",
  ),
  logos: [],
};
const svg = '<svg xmlns="http://www.w3.org/2000/svg"><title>Test</title></svg>';

test("SVG and HTML carry the same editable, versioned project", () => {
  const exported = codec.embed(svg, project);
  expect(codec.read(exported)).toEqual(project);
  expect(
    codec.read(`<!doctype html><html><body>${exported}</body></html>`),
  ).toEqual(project);
  expect(codec.embed(exported, project).match(/<metadata/g)).toHaveLength(1);
  expect(exported).not.toContain("<script");
  expect(
    codec.read(
      codec.embed(svg, { ...project, names: [...iconNames.slice(0, 100)] }),
    ).names,
  ).toHaveLength(100);
  for (const name of iconNames)
    expect(() => codec.validate({ ...project, names: [name] })).not.toThrow();
});

test("custom logo metadata stays escaped and uses embedded PNG only", () => {
  const local = {
    ...project,
    names: ["custom-1"],
    logos: [
      {
        key: "custom-1",
        label: "</metadata><script>alert(1)</script>",
        dataUrl: "data:image/png;base64,aGVsbG8=",
      },
    ],
  };
  const exported = codec.embed(svg, local);
  for (const themeMode of ["auto", "original", "monochrome"] as const) {
    const themed = {
      ...local,
      logos: local.logos.map((logo) => ({ ...logo, themeMode })),
    };
    expect(codec.read(codec.embed(svg, themed))).toEqual(themed);
  }
  expect(() =>
    codec.validate({
      ...local,
      logos: [{ ...local.logos[0], themeMode: "<script>" }],
    }),
  ).toThrow();
  expect(codec.read(exported)).toEqual(local);
  expect(exported).not.toContain("<script");
  for (const dataUrl of [
    "https://example.com/logo.png",
    "data:image/svg+xml;base64,aGVsbG8=",
    'data:image/png;base64,x" onload="x',
  ]) {
    expect(() =>
      codec.validate({ ...local, logos: [{ ...local.logos[0], dataUrl }] }),
    ).toThrow();
  }
});

test("invalid imports fail before replacing a design", () => {
  for (const input of [
    "<svg/>",
    "<script>alert(1)</script>",
    '<metadata id="icon-marquee-project">%not-json</metadata>',
    "x".repeat(config.landing.maxProjectBytes + 1),
  ])
    expect(() => codec.read(input)).toThrow();
  for (const mutation of [
    { version: 2 },
    { height: 1000 },
    { speed: NaN },
    { names: [] },
    { names: ["../secret"] },
    { names: ["custom-1"] },
    { effects: { effect: "<script>" } },
    { logos: [{}] },
    { seed: -1 },
    { mode: "unknown" },
    { logos: Array(21).fill({}) },
  ])
    expect(() => codec.validate({ ...project, ...mutation })).toThrow();
});
