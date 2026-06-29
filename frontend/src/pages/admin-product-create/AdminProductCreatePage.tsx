import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  AdminProductFormView,
  useAdminProductForm,
} from "../../components/admin/product-form";
import { AdminProductPreview } from "../../components/admin/product-preview";
import { useToast } from "../../components/common/toast";
import {
  clearProductsMutationError,
  createProduct,
  ProductsRequestStatus,
  selectProductsMutationError,
  selectProductsMutationStatus,
} from "../../features/products/productsSlice";
import type { ProductInput } from "../../types/product";
import "./admin-product-create-page.css";

export function AdminProductCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const showToast = useToast();

  const mutationStatus = useAppSelector(selectProductsMutationStatus);
  const mutationError = useAppSelector(selectProductsMutationError);

  const isSubmitting = mutationStatus === ProductsRequestStatus.Loading;

  useEffect(() => {
    dispatch(clearProductsMutationError());

    return () => {
      dispatch(clearProductsMutationError());
    };
  }, [dispatch]);

  const handleClearSubmitError = () => {
    dispatch(clearProductsMutationError());
  };

  const handleSubmit = async (productInput: ProductInput) => {
    try {
      await dispatch(createProduct(productInput)).unwrap();

      showToast("Product created successfully.");
      navigate("/admin/products", { replace: true });
    } catch {
      // The rejected thunk already writes the readable error to mutationError.
    }
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  const form = useAdminProductForm({
    mode: "create",
    product: null,
    submitError: mutationError,
    isSubmitting,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    onClearSubmitError: handleClearSubmitError,
  });

  return (
    <section
      className="admin-product-create-page"
      aria-labelledby="admin-product-create-title"
    >
      <div className="admin-product-create-page__header">
        <h1
          id="admin-product-create-title"
          className="admin-product-create-page__title"
        >
          Create product
        </h1>

        <p className="admin-product-create-page__description">
          Add a new product to the catalog. The preview updates while you fill
          in the form.
        </p>
      </div>

      <div className="admin-product-create-page__layout">
        <AdminProductFormView {...form.viewProps} />

        <aside className="admin-product-create-page__sidebar">
          <AdminProductPreview {...form.formValues} />
        </aside>
      </div>
    </section>
  );
}
