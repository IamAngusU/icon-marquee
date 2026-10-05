export type LogoThemeMode = "auto" | "original" | "monochrome";
export type LogoAppearance = { radius: number; dark: string; light: string };

// Work only on decoded pixels; source SVG markup is never inspected or inserted.
export function createLogoTools(appearance: LogoAppearance) {
  function analyze(pixels: Uint8ClampedArray, size: number) {
    let visible = 0;
    let neutral = 0;
    let dark = 0;
    let light = 0;
    let darkSum = 0;
    let lightSum = 0;
    let edgeDark = 0;
    let edgeLight = 0;
    let edgeCount = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const x = (i / 4) % size;
      const y = Math.floor(i / 4 / size);
      const edge =
        x < size * 0.06 ||
        y < size * 0.06 ||
        x >= size * 0.94 ||
        y >= size * 0.94;
      if (edge) edgeCount++;
      const alpha = (pixels[i + 3] ?? 0) / 255;
      if (alpha < 0.05) continue;
      const r = pixels[i] ?? 0;
      const g = pixels[i + 1] ?? 0;
      const b = pixels[i + 2] ?? 0;
      const luminance = (r + g + b) / 3;
      visible += alpha;
      if (Math.max(r, g, b) - Math.min(r, g, b) <= 18) neutral += alpha;
      if (luminance <= 96) {
        dark += alpha;
        darkSum += luminance * alpha;
        if (edge) edgeDark += alpha;
      }
      if (luminance >= 160) {
        light += alpha;
        lightSum += luminance * alpha;
        if (edge) edgeLight += alpha;
      }
    }
    const transparency = visible < size * size * 0.98;
    const flat = Math.max(dark, light) >= visible * 0.98;
    const edgeVisible = edgeDark + edgeLight;
    const hasBackground =
      !flat &&
      edgeVisible > edgeCount * 0.4 &&
      Math.max(edgeDark, edgeLight) > edgeVisible * 0.85;
    const automatic =
      visible > 0 &&
      neutral / visible >= 0.99 &&
      (dark + light) / visible >= 0.98 &&
      ((flat && transparency) || hasBackground);
    const backgroundLight = edgeLight >= edgeDark;
    const background = backgroundLight
      ? lightSum / (light || 1)
      : darkSum / (dark || 1);
    const foreground = backgroundLight
      ? darkSum / (dark || 1)
      : lightSum / (light || 1);
    const removeBackground =
      hasBackground && Math.abs(foreground - background) > 64;
    const mask = new Uint8ClampedArray(pixels.length);
    for (let i = 0; i < pixels.length; i += 4) {
      const luminance =
        ((pixels[i] ?? 0) + (pixels[i + 1] ?? 0) + (pixels[i + 2] ?? 0)) / 3;
      const coverage = removeBackground
        ? Math.min(
            1,
            Math.max(0, (luminance - background) / (foreground - background)),
          )
        : 1;
      mask[i] = mask[i + 1] = mask[i + 2] = 255;
      mask[i + 3] = (pixels[i + 3] ?? 0) * coverage;
    }
    return { automatic, mask };
  }

  function render(
    dataUrl: string,
    maskDataUrl: string,
    automatic: boolean,
    mode: LogoThemeMode = "auto",
  ) {
    for (const source of [dataUrl, maskDataUrl])
      if (!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(source))
        throw new Error("Only local PNG pixels can be rendered.");
    const adaptive = mode === "monochrome" || (mode === "auto" && automatic);
    const { radius, dark, light } = appearance;
    const svg = `<svg id="custom-logo" width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><style>#custom-logo .logo-background{fill:${dark}}#custom-logo .logo-ink{fill:${light}}@media (prefers-color-scheme: light){#custom-logo .logo-background{fill:${light}}#custom-logo .logo-ink{fill:${dark}}}</style><defs><clipPath id="logo-round"><rect width="256" height="256" rx="${radius}"/></clipPath>${adaptive ? `<mask id="logo-shape" maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256" style="mask-type:alpha"><image href="${maskDataUrl}" width="256" height="256"/></mask>` : ""}</defs><g clip-path="url(#logo-round)"><rect class="logo-background" width="256" height="256"/>${adaptive ? '<rect class="logo-ink" width="256" height="256" mask="url(#logo-shape)"/>' : `<image href="${dataUrl}" width="256" height="256"/>`}</g></svg>`;
    return {
      svg,
      thumbnail: `data:image/svg+xml,${encodeURIComponent(svg)}`,
      adaptive,
      themeMode: mode,
    };
  }
  return { analyze, render };
}
