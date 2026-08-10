const DEFAULT_PORT = 4000;

const parsePort = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsedPort = Number(value);

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return parsedPort;
};

const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  port: parsePort(process.env.PORT),
  databaseUrl: requireEnv("DATABASE_URL", process.env.DATABASE_URL),
  jwtSecret: requireEnv("JWT_SECRET", process.env.JWT_SECRET),
};
