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

export const env = {
  port: parsePort(process.env.PORT),
};
