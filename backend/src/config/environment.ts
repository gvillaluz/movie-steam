export interface AppEnvironment {
  PORT: number;
  HOST: string;
  NODE_ENV: 'development' | 'test' | 'production';
  TMDB_API_KEY?: string;
}

export function validateEnvironment(
  environment: Record<string, unknown>,
): AppEnvironment {
  const rawPort = environment.PORT ?? '5080';
  if (typeof rawPort !== 'string' || !/^\d+$/.test(rawPort)) {
    throw new Error('PORT must be an integer between 0 and 65535.');
  }
  const port = Number(rawPort);
  if (!Number.isSafeInteger(port) || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535.');
  }

  const host = environment.HOST ?? '127.0.0.1';
  if (typeof host !== 'string' || !host.trim()) {
    throw new Error('HOST must be a non-empty hostname or IP address.');
  }

  const nodeEnvironment = environment.NODE_ENV ?? 'development';
  if (
    nodeEnvironment !== 'development' &&
    nodeEnvironment !== 'test' &&
    nodeEnvironment !== 'production'
  ) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }

  const key = environment.TMDB_API_KEY;
  if (key !== undefined && (typeof key !== 'string' || !key.trim())) {
    throw new Error('TMDB_API_KEY must be non-empty when provided.');
  }
  return {
    PORT: port,
    HOST: host.trim(),
    NODE_ENV: nodeEnvironment,
    ...(typeof key === 'string' ? { TMDB_API_KEY: key.trim() } : {}),
  };
}
