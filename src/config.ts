function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} not configured`);
  }
  return value;
}

export const config = {
  appName: requireEnv("APP_NAME"),
} as const;
