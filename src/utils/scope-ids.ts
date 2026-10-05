// Prefixes an icon's ids and every reference to them so icons can share one document.
export function scopeIds(svg: string, prefix: string): string {
  const ID_ATTR = /(\s)id="([^"]*)"/g;
  const ID_REF = /#([A-Za-z_][\w-]*)/g;
  const ids = new Set(Array.from(svg.matchAll(ID_ATTR), (match) => match[2]));
  if (ids.size === 0) {
    return svg;
  }

  return svg
    .replace(
      ID_ATTR,
      (_, space: string, id: string) => `${space}id="${prefix}-${id}"`,
    )
    .replace(ID_REF, (ref, id: string) =>
      ids.has(id) ? `#${prefix}-${id}` : ref,
    );
}
