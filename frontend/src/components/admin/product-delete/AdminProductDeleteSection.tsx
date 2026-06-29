import { Button, ButtonVariant } from "../../common/button";
import { ConfirmDialog } from "../../common/confirm-dialog";
import "./admin-product-delete-section.css";

type AdminProductDeleteSectionProps = {
  productTitle: string;
  isConfirmOpen: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  onOpenConfirm: () => void;
  onCloseConfirm: () => void;
  onConfirmDelete: () => void;
};

export function AdminProductDeleteSection({
  productTitle,
  isConfirmOpen,
  isDeleting,
  deleteError,
  onOpenConfirm,
  onCloseConfirm,
  onConfirmDelete,
}: AdminProductDeleteSectionProps) {
  return (
    <section
      className="admin-product-delete-section"
      aria-labelledby="admin-product-delete-title"
    >
      <div className="admin-product-delete-section__content">
        <h2
          id="admin-product-delete-title"
          className="admin-product-delete-section__title"
        >
          Delete product
        </h2>

        <p className="admin-product-delete-section__description">
          This action permanently removes the product from the catalog. It
          cannot be undone.
        </p>

        {deleteError && (
          <p className="admin-product-delete-section__error" role="alert">
            {deleteError}
          </p>
        )}

        <Button
          type="button"
          variant={ButtonVariant.DangerOutline}
          disabled={isDeleting}
          aria-busy={isDeleting}
          onClick={onOpenConfirm}
        >
          {isDeleting ? "Deleting..." : "Delete product"}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete product?"
        description={`Are you sure you want to delete "${productTitle}"? This action cannot be undone.`}
        confirmLabel="Delete product"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={onConfirmDelete}
        onCancel={onCloseConfirm}
      />
    </section>
  );
}
