import { Link } from "react-router-dom";
import emptyCartImage from "../../assets/empty_cart.png";
import { CartQuantityControl } from "../../components/cart";
import { ActionLink } from "../../components/common/action-link";
import { Button, ButtonVariant } from "../../components/common/button";
import { EmptyState } from "../../components/common/empty-state";
import "./cart-page.css";

export type CartPageItemViewModel = {
  productId: string;
  title: string;
  imageUrl: string;
  quantity: number;
  stock: number;
  priceText: string;
  itemTotalText: string;
};

type CartPageViewProps = {
  isEmpty: boolean;
  items: CartPageItemViewModel[];
  totalPriceText: string;
  totalQuantityText: string;
  onRequestRemoveItem: (productId: string) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
};

export function CartPageView({
  isEmpty,
  items,
  totalPriceText,
  totalQuantityText,
  onRequestRemoveItem,
  onQuantityChange,
}: CartPageViewProps) {
  return (
    <section className="cart-page" aria-labelledby="cart-title">
      <header className="cart-page__header">
        <div>
          <h1 className="cart-page__title" id="cart-title">
            Cart
          </h1>

          <p className="cart-page__description">
            Review the products currently added to your cart.
          </p>
        </div>

        {!isEmpty && (
          <Link className="cart-page__continue-link" to="/products">
            Continue shopping
          </Link>
        )}
      </header>

      {isEmpty ? (
        <EmptyState
          imageSrc={emptyCartImage}
          title="Your cart is empty"
          description="Add products to your cart to start shopping."
        >
          <ActionLink to="/products">Go to products</ActionLink>
        </EmptyState>
      ) : (
        <div className="cart-page__content">
          <ul className="cart-page__list" aria-label="Cart items">
            {items.map((item) => (
              <li className="cart-page__item" key={item.productId}>
                <article
                  className="cart-page__card"
                  aria-labelledby={`cart-item-${item.productId}-title`}
                >
                  <div className="cart-page__product">
                    <img
                      className="cart-page__image"
                      src={item.imageUrl}
                      alt={item.title}
                    />

                    <div className="cart-page__item-info">
                      <h2
                        className="cart-page__item-title"
                        id={`cart-item-${item.productId}-title`}
                      >
                        {item.title}
                      </h2>

                      <p className="cart-page__item-price">{item.priceText}</p>
                    </div>
                  </div>

                  <div className="cart-page__item-actions">
                    <CartQuantityControl
                      productId={item.productId}
                      title={item.title}
                      quantity={item.quantity}
                      stock={item.stock}
                      onQuantityChange={onQuantityChange}
                    />

                    <div className="cart-page__item-footer">
                      <p className="cart-page__item-total">
                        {item.itemTotalText}
                      </p>

                      <Button
                        className="cart-page__remove-button"
                        variant={ButtonVariant.DangerOutline}
                        aria-label={`Remove ${item.title} from cart`}
                        onClick={() => onRequestRemoveItem(item.productId)}
                      >
                        Remove item
                      </Button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <aside
            className="cart-page__summary"
            aria-labelledby="cart-summary-title"
          >
            <h2 className="cart-page__summary-title" id="cart-summary-title">
              Order summary
            </h2>

            <div className="cart-page__summary-details">
              <p className="cart-page__summary-text">{totalQuantityText}</p>

              <p className="cart-page__summary-total" aria-live="polite">
                {totalPriceText}
              </p>
            </div>

            <ActionLink className="cart-page__checkout-link" to="/checkout">
              Go to checkout
            </ActionLink>
          </aside>
        </div>
      )}
    </section>
  );
}
