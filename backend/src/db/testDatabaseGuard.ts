const TEST_DATABASE_NAME = "novashop_test";
const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

const parseDatabaseUrl = (databaseUrl: string): URL => {
  try {
    return new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid URL.");
  }
};

const getDatabaseName = (databaseUrl: URL): string => {
  try {
    return decodeURIComponent(databaseUrl.pathname.slice(1));
  } catch {
    throw new Error("DATABASE_URL contains an invalid database name.");
  }
};

/**
 * Throws an error if the URL does not point to the test database.
 * The error message does not include the full URL because the URL may contain a password.
 */
export const assertTestDatabaseUrl = (databaseUrl: string): void => {
  const parsedDatabaseUrl = parseDatabaseUrl(databaseUrl);

  if (!POSTGRES_PROTOCOLS.has(parsedDatabaseUrl.protocol)) {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }

  const databaseName = getDatabaseName(parsedDatabaseUrl);

  if (databaseName !== TEST_DATABASE_NAME) {
    throw new Error(
      `Refusing to reset database "${databaseName || "<empty>"}". Expected "${TEST_DATABASE_NAME}".`,
    );
  }
};
