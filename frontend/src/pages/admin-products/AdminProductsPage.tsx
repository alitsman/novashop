import { useEffect } from "react";
import noProductsFoundImage from "../../assets/no_products_found.png";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { AdminProductsTable } from "../../components/admin/products-table";
import { ActionLink } from "../../components/common/action-link";
import { Button, ButtonVariant } from "../../components/common/button";
import { EmptyState } from "../../components/common/empty-state";
import { ErrorState } from "../../components/common/error-state";
import { Loader } from "../../components/common/loader";
import { useToast } from "../../components/common/toast";
import {
  clearProductsDeleteError,
  fetchProducts,
  ProductsRequestStatus,
  selectProducts,
  selectProductsDeleteError,
  selectProductsError,
  selectProductsListStatus,
} from "../../features/products/productsSlice";
import "./admin-products-page.css";

export function AdminProductsPage() {
  const dispatch = useAppDispatch();
  const showToast = useToast();

  const products = useAppSelector(selectProducts);
  const listStatus = useAppSelector(selectProductsListStatus);
  const loadError = useAppSelector(selectProductsError);
  const deleteError = useAppSelector(selectProductsDeleteError);

  const isLoadingProducts =
    listStatus === ProductsRequestStatus.Idle ||
    listStatus === ProductsRequestStatus.Loading;

  const hasLoadError = listStatus === ProductsRequestStatus.Failed;
  const isLoaded = listStatus === ProductsRequestStatus.Succeeded;
  const isProductsEmpty = isLoaded && products.length === 0;

  useEffect(() => {
    dispatch(clearProductsDeleteError());

    if (listStatus === ProductsRequestStatus.Idle) {
      dispatch(fetchProducts());
    }

    return () => {
      dispatch(clearProductsDeleteError());
    };
  }, [dispatch, listStatus]);

  const handleRetry = () => {
    dispatch(fetchProducts());
  };

  const handleProductDeleted = (productTitle: string) => {
    showToast(`Product "${productTitle}" deleted successfully.`);
  };

  return (
    <section
      className="admin-products-page"
      aria-labelledby="admin-products-title"
    >
      <div className="admin-products-page__header">
        <div className="admin-products-page__heading">
          <h1 id="admin-products-title" className="admin-products-page__title">
            Admin products
          </h1>

          <p className="admin-products-page__description">
            Manage catalog products. Create new products, edit existing product
            details, or delete products that should no longer be available.
          </p>
        </div>

        <ActionLink to="/admin/products/new">Create product</ActionLink>
      </div>

      {isLoadingProducts && (
        <div className="admin-products-page__status">
          <Loader message="Loading admin products..." />
        </div>
      )}

      {hasLoadError && (
        <ErrorState
          title="Failed to load admin products."
          description={loadError ?? "Please try again later."}
        >
          <Button
            type="button"
            variant={ButtonVariant.Secondary}
            onClick={handleRetry}
          >
            Try again
          </Button>
        </ErrorState>
      )}

      {deleteError && (
        <p className="admin-products-page__delete-error" role="alert">
          {deleteError}
        </p>
      )}

      {isProductsEmpty && (
        <EmptyState
          imageSrc={noProductsFoundImage}
          title="No products yet."
          description="Create the first product to make it available in the catalog."
        >
          <ActionLink to="/admin/products/new">Create product</ActionLink>
        </EmptyState>
      )}

      {isLoaded && products.length > 0 && (
        <AdminProductsTable
          products={products}
          onProductDeleted={handleProductDeleted}
        />
      )}
    </section>
  );
}
