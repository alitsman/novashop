import type { Product } from "../../../types/product";
import { AdminProductsTableRow } from "./AdminProductsTableRow";
import "./admin-products-table.css";

type AdminProductsTableProps = {
  products: Product[];
  onProductDeleted: (productTitle: string) => void;
};

export function AdminProductsTable({
  products,
  onProductDeleted,
}: AdminProductsTableProps) {
  return (
    <div className="admin-products-table-wrapper">
      <table className="admin-products-table" aria-label="Admin products">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Category</th>
            <th scope="col">Price</th>
            <th scope="col">Stock</th>
            <th className="admin-products-table__actions-heading" scope="col">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <AdminProductsTableRow
              key={product.id}
              product={product}
              onProductDeleted={onProductDeleted}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
