import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { AdminProductDeleteSection } from "../../components/admin/product-delete";
import {
  AdminProductFormView,
  useAdminProductForm,
} from "../../components/admin/product-form";
import { AdminProductPreview } from "../../components/admin/product-preview";
import { ActionLink } from "../../components/common/action-link";
import { ErrorState } from "../../components/common/error-state";
import { Loader } from "../../components/common/loader";
import { useToast } from "../../components/common/toast";
import {
  clearProductsMutationError,
  clearSelectedProduct,
  fetchProductById,
  ProductsRequestStatus,
  selectProductDetailsStatus,
  selectProductsError,
  selectProductsMutationError,
  selectProductsMutationStatus,
  selectSelectedProduct,
  updateProduct,
} from "../../features/products/productsSlice";
import type { ProductInput } from "../../types/product";
import "./admin-product-edit-page.css";
import { useAdminProductDelete } from "../../components/admin/product-delete";

export function AdminProductEditPage() {
  const { productId } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const showToast = useToast();

  const product = useAppSelector(selectSelectedProduct);
  const detailStatus = useAppSelector(selectProductDetailsStatus);
  const loadError = useAppSelector(selectProductsError);
  const mutationStatus = useAppSelector(selectProductsMutationStatus);
  const mutationError = useAppSelector(selectProductsMutationError);

  const isLoadingProduct =
    detailStatus === ProductsRequestStatus.Idle ||
    detailStatus === ProductsRequestStatus.Loading;

  const isSubmitting = mutationStatus === ProductsRequestStatus.Loading;

  useEffect(() => {
    dispatch(clearProductsMutationError());

    if (productId) {
      dispatch(fetchProductById(productId));
    }

    return () => {
      dispatch(clearSelectedProduct());
      dispatch(clearProductsMutationError());
    };
  }, [dispatch, productId]);

  const handleClearSubmitError = () => {
    dispatch(clearProductsMutationError());
  };

  const handleSubmit = async (productInput: ProductInput) => {
    if (!productId) {
      return;
    }

    try {
      await dispatch(
        updateProduct({
          id: productId,
          data: productInput,
        }),
      ).unwrap();

      showToast("Product updated successfully.");
      navigate("/admin/products", { replace: true });
    } catch {
      // The rejected thunk already writes the readable error to mutationError.
    }
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  const handleDeleted = () => {
    showToast("Product deleted successfully.");
    navigate("/admin/products", { replace: true });
  };

  const form = useAdminProductForm({
    mode: "edit",
    product,
    submitError: mutationError,
    isSubmitting,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    onClearSubmitError: handleClearSubmitError,
  });

  const deleteFlow = useAdminProductDelete({
    productId: productId ?? "",
    onDeleted: handleDeleted,
  });

  if (!productId) {
    return (
      <section
        className="admin-product-edit-page"
        aria-labelledby="admin-product-edit-title"
      >
        <h1
          id="admin-product-edit-title"
          className="admin-product-edit-page__title"
        >
          Edit product
        </h1>

        <ErrorState
          title="Product ID is missing"
          description="The edit page cannot load a product without a product ID."
        >
          <ActionLink to="/admin/products">Back to admin products</ActionLink>
        </ErrorState>
      </section>
    );
  }

  if (isLoadingProduct) {
    return (
      <section
        className="admin-product-edit-page"
        aria-labelledby="admin-product-edit-title"
      >
        <h1
          id="admin-product-edit-title"
          className="admin-product-edit-page__title"
        >
          Edit product
        </h1>

        <div className="admin-product-edit-page__status">
          <Loader message="Loading product..." />
        </div>
      </section>
    );
  }

  if (detailStatus === ProductsRequestStatus.Failed) {
    return (
      <section
        className="admin-product-edit-page"
        aria-labelledby="admin-product-edit-title"
      >
        <h1
          id="admin-product-edit-title"
          className="admin-product-edit-page__title"
        >
          Edit product
        </h1>

        <ErrorState
          title="Failed to load product"
          description={loadError ?? "Please try again later."}
        >
          <ActionLink to="/admin/products">Back to admin products</ActionLink>
        </ErrorState>
      </section>
    );
  }

  if (!product) {
    return (
      <section
        className="admin-product-edit-page"
        aria-labelledby="admin-product-edit-title"
      >
        <h1
          id="admin-product-edit-title"
          className="admin-product-edit-page__title"
        >
          Edit product
        </h1>

        <ErrorState
          title="Product not found"
          description="The product may have been removed or the link may be incorrect."
        >
          <ActionLink to="/admin/products">Back to admin products</ActionLink>
        </ErrorState>
      </section>
    );
  }

  return (
    <section
      className="admin-product-edit-page"
      aria-labelledby="admin-product-edit-title"
    >
      <div className="admin-product-edit-page__header">
        <h1
          id="admin-product-edit-title"
          className="admin-product-edit-page__title"
        >
          Edit product
        </h1>

        <p className="admin-product-edit-page__description">
          Update product details. The preview reflects your changes before you
          save them.
        </p>
      </div>

      <div className="admin-product-edit-page__layout">
        <AdminProductFormView {...form.viewProps} />

        <aside className="admin-product-edit-page__sidebar">
          <AdminProductPreview {...form.formValues} />

          <AdminProductDeleteSection
            productTitle={product.title}
            isConfirmOpen={deleteFlow.isConfirmOpen}
            isDeleting={deleteFlow.isDeleting}
            deleteError={deleteFlow.deleteError}
            onOpenConfirm={deleteFlow.openConfirm}
            onCloseConfirm={deleteFlow.closeConfirm}
            onConfirmDelete={deleteFlow.handleConfirm}
          />
        </aside>
      </div>
    </section>
  );
}
