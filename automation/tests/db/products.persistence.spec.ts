import { expect, test } from "../../src/fixtures";
import { createProductViaApi, loginViaApi } from "../../src/helpers";
import { ADMIN_USER } from "../../src/test-data";

type ProductPersistenceRow = {
  id: string;
  deletedAt: Date | null;
};

test.describe("Product persistence", () => {
  // The API returns 404 for both soft-deleted and physically deleted products.
  // This DB check proves that the row still exists and only deleted_at was set.
  test("soft delete: keeps the product row and sets deleted_at", async ({ request, dbPool }) => {
    const adminToken = await loginViaApi(request, ADMIN_USER);
    const createdProduct = await createProductViaApi(request, adminToken);

    const productPersistenceQuery = `
      SELECT
        id,
        deleted_at AS "deletedAt"
      FROM products
      WHERE id = $1;
    `;

    const productBeforeDeleteResult = await dbPool.query<ProductPersistenceRow>(
      productPersistenceQuery,
      [createdProduct.id],
    );

    expect(productBeforeDeleteResult.rows).toEqual([
      {
        id: createdProduct.id,
        deletedAt: null,
      },
    ]);

    const deleteResponse = await request.delete(`/products/${createdProduct.id}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(deleteResponse.status()).toBe(204);

    const productAfterDeleteResult = await dbPool.query<ProductPersistenceRow>(
      productPersistenceQuery,
      [createdProduct.id],
    );

    expect(productAfterDeleteResult.rows).toEqual([
      {
        id: createdProduct.id,
        deletedAt: expect.any(Date),
      },
    ]);
  });
});
