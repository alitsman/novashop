import type { RefObject, SubmitEvent } from "react";
import { Link } from "react-router-dom";
import emptyCartImage from "../../assets/empty_cart.png";
import { CheckoutForm } from "../../components/checkout";
import { ActionLink } from "../../components/common/action-link";
import { EmptyState } from "../../components/common/empty-state";
import type { CheckoutForm as CheckoutFormValues } from "../../types/checkout";
import type { CheckoutFormErrors } from "./checkoutValidation";
import "./checkout-page.css";

export type CheckoutOrderItemViewModel = {
  productId: string;
  title: string;
  quantityText: string;
  priceText: string;
  itemTotalText: string;
};

type CheckoutPageViewProps = {
  isCartEmpty: boolean;
  orderItems: CheckoutOrderItemViewModel[];
  totalQuantityText: string;
  totalPriceText: string;
  formValues: CheckoutFormValues;
  formErrors: CheckoutFormErrors;
  submitError: string | null;
  isSubmitting: boolean;
  fullNameInputRef: RefObject<HTMLInputElement | null>;
  phoneInputRef: RefObject<HTMLInputElement | null>;
  addressTextareaRef: RefObject<HTMLTextAreaElement | null>;
  onFullNameChange: (fullName: string) => void;
  onPhoneChange: (phone: string) => void;
  onAddressChange: (address: string) => void;
  onDeliveryMethodChange: (
    deliveryMethod: CheckoutFormValues["deliveryMethod"],
  ) => void;
  onPaymentMethodChange: (
    paymentMethod: CheckoutFormValues["paymentMethod"],
  ) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export function CheckoutPageView({
  isCartEmpty,
  orderItems,
  totalQuantityText,
  totalPriceText,
  formValues,
  formErrors,
  submitError,
  isSubmitting,
  fullNameInputRef,
  phoneInputRef,
  addressTextareaRef,
  onFullNameChange,
  onPhoneChange,
  onAddressChange,
  onDeliveryMethodChange,
  onPaymentMethodChange,
  onSubmit,
}: CheckoutPageViewProps) {
  return (
    <section className="checkout-page" aria-labelledby="checkout-title">
      <header className="checkout-page__header">
        <div>
          <h1 className="checkout-page__title" id="checkout-title">
            Checkout
          </h1>

          <p className="checkout-page__description">
            Review your order before adding delivery and payment details.
          </p>
        </div>

        {!isCartEmpty && (
          <Link className="checkout-page__secondary-link" to="/cart">
            Back to cart
          </Link>
        )}
      </header>

      {isCartEmpty ? (
        <EmptyState
          imageSrc={emptyCartImage}
          title="Your cart is empty"
          description="Add products to your cart before continuing to checkout."
        >
          <ActionLink to="/products">Go to products</ActionLink>
        </EmptyState>
      ) : (
        <div className="checkout-page__content">
          <aside
            className="checkout-page__summary"
            aria-labelledby="checkout-summary-title"
          >
            <h2
              className="checkout-page__summary-title"
              id="checkout-summary-title"
            >
              Order summary
            </h2>

            <ul
              className="checkout-page__summary-list"
              aria-label="Order items"
            >
              {orderItems.map((item) => (
                <li
                  className="checkout-page__summary-item"
                  key={item.productId}
                >
                  <div className="checkout-page__summary-item-main">
                    <h3 className="checkout-page__summary-item-title">
                      {item.title}
                    </h3>

                    <p className="checkout-page__summary-item-meta">
                      {item.quantityText} × {item.priceText}
                    </p>
                  </div>

                  <p className="checkout-page__summary-item-total">
                    {item.itemTotalText}
                  </p>
                </li>
              ))}
            </ul>

            <div className="checkout-page__summary-footer">
              <p className="checkout-page__summary-quantity">
                {totalQuantityText}
              </p>

              <p className="checkout-page__summary-total" aria-live="polite">
                {totalPriceText}
              </p>
            </div>
          </aside>

          <section
            className="checkout-page__form-section"
            aria-labelledby="checkout-form-title"
          >
            <h2
              className="checkout-page__section-title"
              id="checkout-form-title"
            >
              Delivery details
            </h2>

            <CheckoutForm
              formValues={formValues}
              formErrors={formErrors}
              submitError={submitError}
              isSubmitting={isSubmitting}
              fullNameInputRef={fullNameInputRef}
              phoneInputRef={phoneInputRef}
              addressTextareaRef={addressTextareaRef}
              onFullNameChange={onFullNameChange}
              onPhoneChange={onPhoneChange}
              onAddressChange={onAddressChange}
              onDeliveryMethodChange={onDeliveryMethodChange}
              onPaymentMethodChange={onPaymentMethodChange}
              onSubmit={onSubmit}
            />
          </section>
        </div>
      )}
    </section>
  );
}
