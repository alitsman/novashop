import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearSelectedProduct,
  fetchProductById,
  ProductsRequestStatus,
  selectProductDetailError,
  selectProductDetailsStatus,
  selectSelectedProduct,
} from "../../features/products/productsSlice";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ProductDetailsPageView } from "./ProductDetailsPageView";

export function ProductDetailsPage() {
  const dispatch = useAppDispatch();
  const { productId } = useParams();

  const product = useAppSelector(selectSelectedProduct);
  const detailStatus = useAppSelector(selectProductDetailsStatus);
  const detailError = useAppSelector(selectProductDetailError);

  const isLoading = detailStatus === ProductsRequestStatus.Loading;
  const hasError = detailStatus === ProductsRequestStatus.Failed;
  const isLoaded = detailStatus === ProductsRequestStatus.Succeeded;
  const isNotFound = isLoaded && product === null;

  const documentTitle = isNotFound ? "Product not found" : (product?.title ?? "Product details");

  useDocumentTitle(documentTitle);

  const loadingMessage = isLoading ? "Loading product..." : null;
  const errorMessage = hasError ? detailError : null;
  const notFoundMessage = isNotFound
    ? "This product does not exist or is no longer available."
    : null;

  useEffect(() => {
    if (!productId) {
      return;
    }

    void dispatch(fetchProductById(productId));

    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, productId]);

  return (
    <ProductDetailsPageView
      product={product}
      loadingMessage={loadingMessage}
      errorMessage={errorMessage}
      notFoundMessage={notFoundMessage}
    />
  );
}
