import { expect, test as base } from "@playwright/test";
import { Pool } from "pg";

const EXPECTED_TEST_DATABASE_NAME = "novashop_test";

type DatabaseNameRow = {
  databaseName: string;
};

type DatabaseWorkerFixtures = {
  dbPool: Pool;
};

export const test = base.extend<Record<never, never>, DatabaseWorkerFixtures>({
  dbPool: [
    async (_fixtures, use) => {
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        throw new Error(
          "DATABASE_URL is required to create the database fixture",
        );
      }

      const dbPool = new Pool({
        connectionString: databaseUrl,
      });

      try {
        const databaseResult = await dbPool.query<DatabaseNameRow>(
          `SELECT current_database() AS "databaseName";`,
        );

        const databaseName = databaseResult.rows[0]?.databaseName;

        if (databaseName !== EXPECTED_TEST_DATABASE_NAME) {
          throw new Error(
            `Database fixture expected "${EXPECTED_TEST_DATABASE_NAME}" but connected to "${databaseName ?? "<unknown>"}"`,
          );
        }

        await use(dbPool);
      } finally {
        await dbPool.end();
      }
    },
    {
      scope: "worker",
    },
  ],
});

export { expect };
