import assert from "node:assert/strict";

import type { PoolClient } from "pg";

import { FeatureTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import { createProductViaApi, loginViaApi, registerUserViaApi } from "../../src/helpers";
import { apiErrorResponseSchema } from "../../src/schemas";
import { ADMIN_USER, createOrderInput, createOrderItemInput } from "../../src/test-data";

type BackendPidRow = {
  pid: number;
};

type BlockedSessionCountRow = {
  blockedSessionCount: number;
};

async function rollbackTransactionIfOpen(
  client: PoolClient,
  transactionOpen: boolean,
): Promise<void> {
  if (transactionOpen) {
    await client.query("ROLLBACK");
  }
}

test.describe("Order concurrency", { tag: FeatureTag.Checkout }, () => {
  test("concurrent sale of the last item: the order sees the committed stock and returns INSUFFICIENT_STOCK", async ({
    request,
    dbPool,
  }) => {
    const customer = await registerUserViaApi(request);
    const adminToken = await loginViaApi(request, ADMIN_USER);
    const product = await createProductViaApi(request, adminToken, {
      stock: 1,
    });

    // A competing buyer sells the last item in a transaction that is not committed yet.
    const competingSale = await dbPool.connect();
    let transactionOpen = false;

    try {
      await competingSale.query("BEGIN");
      transactionOpen = true;

      await competingSale.query("UPDATE products SET stock = 0 WHERE id = $1", [product.id]);

      const pidResult = await competingSale.query<BackendPidRow>("SELECT pg_backend_pid() AS pid");
      const [pidRow] = pidResult.rows;

      assert(pidRow !== undefined, "Expected the competing sale transaction to have a backend PID");

      const orderResponsePromise = request.post("/orders", {
        headers: {
          Authorization: `Bearer ${customer.token}`,
        },
        data: createOrderInput([createOrderItemInput(product.id, 1)]),
      });

      // Barrier: the order request is waiting on the competing sale's row lock.
      await expect
        .poll(async () => {
          const result = await dbPool.query<BlockedSessionCountRow>(
            `SELECT count(*)::int AS "blockedSessionCount"
             FROM pg_stat_activity
             WHERE $1 = ANY(pg_blocking_pids(pid))`,
            [pidRow.pid],
          );

          return result.rows[0]?.blockedSessionCount;
        })
        .toBeGreaterThanOrEqual(1);

      await competingSale.query("COMMIT");
      transactionOpen = false;

      const orderResponse = await orderResponsePromise;

      expect(orderResponse.status()).toBe(409);

      const body = apiErrorResponseSchema.parse(await orderResponse.json());

      expect(body.error.code).toBe("INSUFFICIENT_STOCK");
    } finally {
      try {
        await rollbackTransactionIfOpen(competingSale, transactionOpen);
      } finally {
        competingSale.release();
      }
    }
  });
});
