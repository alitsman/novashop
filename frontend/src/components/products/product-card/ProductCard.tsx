import { Link } from "react-router-dom";
import type { Product } from "../../../types/product";
import { AddToCartControl } from "../add-to-cart-control";
import "./product-card.css";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article
      className="product-card"
      aria-labelledby={`product-${product.id}-title`}
    >
      <img
        className="product-card__image"
        src={product.imageUrl}
        alt={product.title}
      />

      <div className="product-card__content">
        <p className="product-card__category">{product.category}</p>

        <h2 className="product-card__title" id={`product-${product.id}-title`}>
          {product.title}
        </h2>

        <p className="product-card__description">{product.description}</p>

        <p className="product-card__price">${product.price.toFixed(2)}</p>

        <AddToCartControl product={product} variant="compact" />

        <Link
          className="product-card__link"
          to={`/products/${product.id}`}
          aria-label={`View details for ${product.title}`}
        >
          View details
        </Link>
      </div>
    </article>
  );
}
