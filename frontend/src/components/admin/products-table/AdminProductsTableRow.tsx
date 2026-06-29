import { Link } from "react-router-dom";
import { useAdminProductDelete } from "../product-delete";
import { Button, ButtonVariant } from "../../common/button";
import { ConfirmDialog } from "../../common/confirm-dialog";
import type { Product } from "../../../types/product";

type AdminProductsTableRowProps = {
  product: Product;
  onProductDeleted: (productTitle: string) => void;
};

const formatPrice = (price: number) => {
  return `$${price.toFixed(2)}`;
};

export function AdminProductsTableRow({
  product,
  onProductDeleted,
}: AdminProductsTableRowProps) {
  const deleteFlow = useAdminProductDelete({
    productId: product.id,
    onDeleted: () => onProductDeleted(product.title),
  });

  return (
    <tr>
      <th
        className="admin-products-table__product-cell"
        scope="row"
        data-label="Product"
      >
        <div className="admin-products-table__product">
          <img
            className="admin-products-table__image"
            src={product.imageUrl}
            alt=""
            aria-hidden="true"
          />

          <div className="admin-products-table__product-text">
            <span className="admin-products-table__product-title">
              {product.title}
            </span>

            <span className="admin-products-table__product-description">
              {product.description}
            </span>
          </div>
        </div>
      </th>

      <td data-label="Category">{product.category}</td>
      <td data-label="Price">{formatPrice(product.price)}</td>
      <td data-label="Stock">{product.stock}</td>

      <td className="admin-products-table__actions-cell" data-label="Actions">
        <div className="admin-products-table__actions">
          <Link
            className="admin-products-table__edit-link"
            to={`/admin/products/${product.id}/edit`}
            aria-label={`Edit ${product.title}`}
          >
            Edit
          </Link>

          <Button
            type="button"
            variant={ButtonVariant.DangerOutline}
            disabled={deleteFlow.isDeleting}
            aria-busy={deleteFlow.isDeleting}
            aria-label={`Delete ${product.title}`}
            onClick={deleteFlow.openConfirm}
          >
            {deleteFlow.isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>

        <ConfirmDialog
          isOpen={deleteFlow.isConfirmOpen}
          title="Delete product?"
          description={`Are you sure you want to delete "${product.title}"? This action cannot be undone.`}
          confirmLabel="Delete product"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={deleteFlow.handleConfirm}
          onCancel={deleteFlow.closeConfirm}
        />
      </td>
    </tr>
  );
}
