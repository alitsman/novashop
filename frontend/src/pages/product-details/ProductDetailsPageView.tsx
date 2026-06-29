import { Link } from "react-router-dom";
import noProductsFoundImage from "../../assets/no_products_found.png";
import { ActionLink } from "../../components/common/action-link";
import { EmptyState } from "../../components/common/empty-state";
import { ErrorState } from "../../components/common/error-state";
import { Loader } from "../../components/common/loader";
import { AddToCartControl } from "../../components/products";
import type { Product } from "../../types/product";
import "./product-details-page.css";

type ProductDetailsPageViewProps = {
  product: Product | null;
  loadingMessage: string | null;
  errorMessage: string | null;
  notFoundMessage: string | null;
};

export function ProductDetailsPageView({
  product,
  loadingMessage,
  errorMessage,
  notFoundMessage,
}: ProductDetailsPageViewProps) {
  return (
    <section
      className="product-details-page"
      aria-labelledby="product-details-title"
    >
      {!product && !notFoundMessage && (
        <h1 id="product-details-title" className="product-details-page__title">
          Product details
        </h1>
      )}

      {loadingMessage && (
        <div className="product-details-page__loading">
          <Loader message={loadingMessage} />
        </div>
      )}

      {errorMessage && (
        <ErrorState
          title="Failed to load product."
          description={errorMessage}
        />
      )}

      {notFoundMessage && (
        <>
          <h1
            id="product-details-title"
            className="product-details-page__title"
          >
            Product details
          </h1>

          <EmptyState
            imageSrc={noProductsFoundImage}
            title="Product not found."
            description={notFoundMessage}
          >
            <ActionLink to="/products">Back to products</ActionLink>
          </EmptyState>
        </>
      )}

      {product && (
        <article className="product-details-page__content">
          <div className="product-details-page__image-wrapper">
            <img
              className="product-details-page__image"
              src={product.imageUrl}
              alt={product.title}
            />
          </div>

          <div className="product-details-page__info">
            <p className="product-details-page__category">{product.category}</p>

            <h1
              id="product-details-title"
              className="product-details-page__title"
            >
              {product.title}
            </h1>

            <p className="product-details-page__description">
              {product.description}
            </p>

            <p className="product-details-page__price">
              ${product.price.toFixed(2)}
            </p>

            <AddToCartControl product={product} variant="full" />

            <Link className="product-details-page__back-link" to="/products">
              Back to products
            </Link>
          </div>
        </article>
      )}
    </section>
  );
}
