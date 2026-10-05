import { expect, test } from "bun:test";
import { createMotionTools } from "./motion";

const motion = createMotionTools();

test("live shuffle avoids recent repeats indefinitely, in either direction", () => {
  for (const count of [1, 2, 3, 6, 9, 100]) {
    const next = motion.shuffle(count);
    const result = Array.from({ length: 2000 }, next);
    const cooldown = Math.min(count - 1, Math.floor(count / 2));
    for (let i = cooldown; i < result.length; i++)
      for (let d = 1; d <= cooldown; d++) {
        if (result[i] === result[i - d])
          throw new Error(`Cooldown violated: ${count}`);
      }
    const counts = Array.from(
      { length: count },
      (_, icon) => result.filter((value) => value === icon).length,
    );
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(2);
  }
});

test("Bézier speed interpolation is bounded and has exact endpoints", () => {
  expect(motion.ease(0, [0.42, 0, 0.58, 1])).toBe(0);
  expect(motion.ease(1, [0.42, 0, 0.58, 1])).toBe(1);
  expect(motion.ease(0.5, [0.42, 0, 0.58, 1])).toBeCloseTo(0.5, 4);
  let last = 0;
  for (let p = 0; p <= 1; p += 0.01) {
    const value = motion.ease(p, [0.25, 0.1, 0.25, 1]);
    expect(value).toBeGreaterThanOrEqual(last);
    expect(value).toBeLessThanOrEqual(1);
    last = value;
  }
});
