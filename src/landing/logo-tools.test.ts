import { expect, test } from "bun:test";
import { config } from "../config";
import { renderIconRow } from "../utils/render";
import { createLogoTools } from "./logo-tools";

const tools = createLogoTools(config.landing.logoAppearance);
const size = 32;
const png = "data:image/png;base64,aGVsbG8=";
function pixels(pixel: (x: number, y: number) => number[]) {
  const result = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) result.set(pixel(x, y), (y * size + x) * 4);
  return result;
}
const inside = (x: number, y: number) => x > 8 && x < 24 && y > 8 && y < 24;

test("dark and light transparent marks both become adaptive without losing alpha", () => {
  for (const color of [
    [29, 29, 29],
    [241, 240, 233],
  ]) {
    const source = pixels((x, y) => [...color, inside(x, y) ? 128 : 0]);
    const result = tools.analyze(source, size);
    expect(result.automatic).toBe(true);
    expect(result.mask[(16 * size + 16) * 4 + 3]).toBe(128);
    expect(result.mask[3]).toBe(0);
  }
});

test("black-on-white and white-on-black tiles remove only the solid background", () => {
  for (const invert of [false, true]) {
    const result = tools.analyze(
      pixels((x, y) => {
        const color = inside(x, y) !== invert ? 29 : 255;
        return [color, color, color, 255];
      }),
      size,
    );
    expect(result.automatic).toBe(true);
    expect(result.mask[3]).toBe(0);
    expect(result.mask[(16 * size + 16) * 4 + 3]).toBe(255);
  }
});

test("colored marks, grayscale gradients and blank images are not recolored automatically", () => {
  for (const source of [
    pixels((x, y) => [35, 80, 225, inside(x, y) ? 255 : 0]),
    pixels((x) => [x * 8, x * 8, x * 8, 255]),
    pixels(() => [255, 255, 255, 255]),
    pixels(() => [0, 0, 0, 0]),
  ])
    expect(tools.analyze(source, size).automatic).toBe(false);
});

test("all uploads use the same radius; automatic theme rules survive scoping and export", () => {
  const auto = tools.render(png, png, true);
  const original = tools.render(png, png, true, "original");
  expect(auto.adaptive).toBe(true);
  expect(original.adaptive).toBe(false);
  expect(tools.render(png, png, false).adaptive).toBe(false);
  expect(tools.render(png, png, false, "monochrome").adaptive).toBe(true);
  for (const logo of [auto, original]) expect(logo.svg).toContain('rx="40"');
  expect(original.svg).not.toContain('id="logo-shape"');
  expect(auto.svg).toContain("prefers-color-scheme: light");
  const svg = renderIconRow([auto.svg, auto.svg]);
  expect(svg).toContain('mask="url(#i0-logo-shape)"');
  expect(svg).toContain('mask="url(#i1-logo-shape)"');
  expect(svg).toContain("#i0-custom-logo .logo-ink");
  expect(svg).toContain("#i1-custom-logo .logo-ink");
});

test("logo renderer rejects foreign URLs and uploaded markup", () => {
  for (const unsafe of [
    "https://example.com/x.png",
    "data:image/svg+xml,<svg/>",
    'x" onload="alert(1)',
  ]) {
    expect(() => tools.render(unsafe, png, true)).toThrow();
    expect(() => tools.render(png, unsafe, true)).toThrow();
  }
});
