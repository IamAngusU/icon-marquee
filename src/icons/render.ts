const ICON_SIZE = 256;
const ICON_GAP = 44;
const OUTPUT_HEIGHT = 48;

export function renderIconRow(svgs: readonly string[]): string {
  const stride = ICON_SIZE + ICON_GAP;
  const width = svgs.length * stride - ICON_GAP;
  const outputWidth = Math.round((width * OUTPUT_HEIGHT) / ICON_SIZE);
  const icons = svgs
    .map(
      (svg, index) =>
        `<g transform="translate(${index * stride}, 0)">${svg}</g>`,
    )
    .join("");

  return `<svg width="${outputWidth}" height="${OUTPUT_HEIGHT}" viewBox="0 0 ${width} ${ICON_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">${icons}</svg>`;
}
