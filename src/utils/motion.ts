export type PauseStyle = "instant" | "ease" | "bezier";
export type MotionSettings = {
  pauseStyle: PauseStyle;
  pauseDuration: number;
  bezier: [number, number, number, number];
  hoverPause: boolean;
};

// Shared, bounded motion helpers; serialized into the browser with the composer.
export function createMotionTools() {
  function shuffle(count: number, random: () => number = Math.random) {
    const recent: number[] = [];
    const blocked = new Set<number>();
    const uses = Array<number>(count).fill(0);
    const cooldown = Math.min(count - 1, Math.max(1, Math.floor(count / 2)));
    return () => {
      let leastUsed = Number.POSITIVE_INFINITY;
      let balanced: number[] = [];
      for (let i = 0; i < count; i++) {
        if (blocked.has(i)) continue;
        const total = uses[i] ?? 0;
        if (total < leastUsed) {
          leastUsed = total;
          balanced = [];
        }
        if (total === leastUsed) balanced.push(i);
      }
      const chosen =
        balanced[
          Math.min(balanced.length - 1, Math.floor(random() * balanced.length))
        ] ?? 0;
      uses[chosen] = (uses[chosen] ?? 0) + 1;
      recent.push(chosen);
      blocked.add(chosen);
      if (recent.length > cooldown) blocked.delete(recent.shift() ?? -1);
      return chosen;
    };
  }

  function ease(progress: number, points: readonly number[]) {
    const [x1 = 0.42, y1 = 0, x2 = 0.58, y2 = 1] = points;
    const cubic = (t: number, a: number, b: number) =>
      3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
    let low = 0;
    let high = 1;
    for (let i = 0; i < 20; i++) {
      const t = (low + high) / 2;
      if (cubic(t, x1, x2) < progress) low = t;
      else high = t;
    }
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    return cubic((low + high) / 2, y1, y2);
  }

  return { shuffle, ease };
}
