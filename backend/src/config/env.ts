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

const parseHttpOrigin = (name: string, value: string | undefined): string => {
  const requiredValue = requireEnv(name, value);

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(requiredValue);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`${name} must use HTTP or HTTPS`);
  }

  if (
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error(`${name} must contain only an origin`);
  }

  return parsedUrl.origin;
};

export const env = {
  port: parsePort(process.env.PORT),
  frontendUrl: parseHttpOrigin("FRONTEND_URL", process.env.FRONTEND_URL),
  databaseUrl: requireEnv("DATABASE_URL", process.env.DATABASE_URL),
  jwtSecret: requireEnv("JWT_SECRET", process.env.JWT_SECRET),
};
