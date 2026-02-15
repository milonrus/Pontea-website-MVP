import 'server-only';

const hasText = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export function getRequiredServerEnv(name: string): string {
  const value = process.env[name];

  if (!hasText(value)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalServerEnv(name: string): string | undefined {
  const value = process.env[name];
  return hasText(value) ? value : undefined;
}

export function getServerEnvInt(
  name: string,
  defaultValue: number,
  options?: { min?: number; max?: number }
): number {
  const raw = process.env[name];
  if (!hasText(raw)) {
    return defaultValue;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer`);
  }

  if (typeof options?.min === 'number' && parsed < options.min) {
    throw new Error(`Environment variable ${name} must be >= ${options.min}`);
  }

  if (typeof options?.max === 'number' && parsed > options.max) {
    throw new Error(`Environment variable ${name} must be <= ${options.max}`);
  }

  return parsed;
}
