export type ParsedNumber = { value: number | undefined } | { error: string };

export function optionalWholeNumber(
  name: string,
  value: string | undefined,
  min: number,
  max: number,
): ParsedNumber {
  if (value === undefined) {
    return { value: undefined };
  }

  const parsed = Number(value);
  if (
    !/^\d+$/.test(value) ||
    !Number.isInteger(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    return {
      error: `Query param '${name}' must be a whole number from ${min} to ${max}`,
    };
  }

  return { value: parsed };
}
