const DEFAULT_PORT = 4000;
const DEFAULT_CORS_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

export interface ApplicationEnvironment {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
}

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

function parseCorsOrigins(value: string | undefined): string[] {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_CORS_ORIGINS;
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.some((origin) => origin === "*")) {
    throw new Error("CORS_ORIGINS must list explicit origins");
  }

  return origins;
}

export function readEnvironment(): ApplicationEnvironment {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parsePort(process.env.PORT),
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  };
}
