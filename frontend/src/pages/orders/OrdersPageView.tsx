import { Link } from "react-router-dom";
import noProductsFoundImage from "../../assets/no_products_found.png";
import { ActionLink } from "../../components/common/action-link";
import { EmptyState } from "../../components/common/empty-state";
import { ErrorState } from "../../components/common/error-state";
import { Loader } from "../../components/common/loader";
import "./orders-page.css";

export type OrdersPageOrderItemViewModel = {
  productId: string;
  title: string;
  quantityText: string;
  priceText: string;
  itemTotalText: string;
};

export type OrdersPageOrderViewModel = {
  id: string;
  title: string;
  createdAtText: string;
  customerName: string;
  address: string;
  deliveryMethodText: string;
  paymentMethodText: string;
  totalPriceText: string;
  itemsCountText: string;
  items: OrdersPageOrderItemViewModel[];
};

type OrdersPageViewProps = {
  orders: OrdersPageOrderViewModel[];
  isLoading: boolean;
  errorMessage: string | null;
};

export function OrdersPageView({
  orders,
  isLoading,
  errorMessage,
}: OrdersPageViewProps) {
  const hasOrders = !isLoading && !errorMessage && orders.length > 0;
  const isEmpty = !isLoading && !errorMessage && orders.length === 0;

  return (
    <section className="orders-page" aria-labelledby="orders-title">
      <header className="orders-page__header">
        <div>
          <h1 className="orders-page__title" id="orders-title">
            My Orders
          </h1>

          <p className="orders-page__description">
            Review your previous purchases and delivery details.
          </p>
        </div>

        {hasOrders && (
          <Link className="orders-page__secondary-link" to="/products">
            Continue shopping
          </Link>
        )}
      </header>

      {isLoading && (
        <div className="orders-page__loading">
          <Loader message="Loading orders..." />
        </div>
      )}

      {errorMessage && (
        <ErrorState title="Failed to load orders." description={errorMessage} />
      )}

      {isEmpty && (
        <EmptyState
          imageSrc={noProductsFoundImage}
          title="No orders yet"
          description="Complete your first checkout to see your order history here."
        >
          <ActionLink to="/products">Go to products</ActionLink>
        </EmptyState>
      )}

      {hasOrders && (
        <ul className="orders-page__list" aria-label="Orders">
          {orders.map((order) => (
            <li className="orders-page__item" key={order.id}>
              <article
                className="orders-page__card"
                aria-labelledby={`order-${order.id}-title`}
                data-testid={`order-card-${order.id}`}
              >
                <header className="orders-page__card-header">
                  <div>
                    <h2
                      className="orders-page__card-title"
                      id={`order-${order.id}-title`}
                    >
                      {order.title}
                    </h2>

                    <p className="orders-page__card-date">
                      Placed on {order.createdAtText}
                    </p>
                  </div>

                  <p className="orders-page__card-total">
                    {order.totalPriceText}
                  </p>
                </header>

                <dl className="orders-page__details">
                  <div className="orders-page__detail">
                    <dt className="orders-page__detail-label">Items</dt>
                    <dd className="orders-page__detail-value">
                      {order.itemsCountText}
                    </dd>
                  </div>

                  <div className="orders-page__detail">
                    <dt className="orders-page__detail-label">Customer</dt>
                    <dd className="orders-page__detail-value">
                      {order.customerName}
                    </dd>
                  </div>

                  <div className="orders-page__detail">
                    <dt className="orders-page__detail-label">Delivery</dt>
                    <dd className="orders-page__detail-value">
                      {order.deliveryMethodText}
                    </dd>
                  </div>

                  <div className="orders-page__detail">
                    <dt className="orders-page__detail-label">Payment</dt>
                    <dd className="orders-page__detail-value">
                      {order.paymentMethodText}
                    </dd>
                  </div>

                  <div className="orders-page__detail orders-page__detail--wide">
                    <dt className="orders-page__detail-label">Address</dt>
                    <dd className="orders-page__detail-value">
                      {order.address}
                    </dd>
                  </div>
                </dl>

                <section
                  className="orders-page__items-section"
                  aria-labelledby={`order-${order.id}-items-title`}
                >
                  <h3
                    className="orders-page__items-title"
                    id={`order-${order.id}-items-title`}
                  >
                    Ordered products
                  </h3>

                  <ul
                    className="orders-page__products"
                    aria-label={`Products in ${order.title}`}
                  >
                    {order.items.map((item) => (
                      <li className="orders-page__product" key={item.productId}>
                        <div className="orders-page__product-main">
                          <p className="orders-page__product-title">
                            {item.title}
                          </p>

                          <p className="orders-page__product-meta">
                            {item.quantityText} × {item.priceText}
                          </p>
                        </div>

                        <p className="orders-page__product-total">
                          {item.itemTotalText}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
