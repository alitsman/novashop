import type { RefObject, SubmitEvent } from "react";
import { Button } from "../../common/button";
import { SelectField } from "../../common/select-field";
import { TextareaField } from "../../common/textarea-field";
import { TextField } from "../../common/text-field";
import {
  DeliveryMethod,
  PaymentMethod,
  type CheckoutForm as CheckoutFormValues,
} from "../../../types/checkout";
import type { CheckoutFormErrors } from "../../../pages/checkout/checkoutValidation";
import "./checkout-form.css";

type CheckoutFormProps = {
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

export function CheckoutForm({
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
}: CheckoutFormProps) {
  const hasFormErrors = Object.keys(formErrors).length > 0;

  return (
    <form className="checkout-form" noValidate onSubmit={onSubmit}>
      <div className="checkout-form__grid">
        <div className="checkout-form__row checkout-form__row--two-columns">
          <TextField
            id="checkout-full-name"
            name="fullName"
            label="Full name"
            autoComplete="name"
            inputRef={fullNameInputRef}
            value={formValues.fullName}
            onChange={onFullNameChange}
            required
            error={formErrors.fullName}
          />

          <TextField
            id="checkout-phone"
            name="phone"
            label="Phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            inputRef={phoneInputRef}
            value={formValues.phone}
            onChange={onPhoneChange}
            required
            error={formErrors.phone}
          />
        </div>

        <TextareaField
          id="checkout-address"
          name="address"
          label="Delivery address"
          rows={4}
          autoComplete="street-address"
          textareaRef={addressTextareaRef}
          value={formValues.address}
          onChange={onAddressChange}
          required
          error={formErrors.address}
        />

        <div className="checkout-form__row checkout-form__row--two-columns">
          <SelectField
            id="checkout-delivery-method"
            name="deliveryMethod"
            label="Delivery method"
            value={formValues.deliveryMethod}
            onChange={(value) => {
              onDeliveryMethodChange(
                value as CheckoutFormValues["deliveryMethod"],
              );
            }}
          >
            <option value={DeliveryMethod.Standard}>Standard delivery</option>
            <option value={DeliveryMethod.Express}>Express delivery</option>
          </SelectField>

          <SelectField
            id="checkout-payment-method"
            name="paymentMethod"
            label="Payment method"
            value={formValues.paymentMethod}
            onChange={(value) => {
              onPaymentMethodChange(
                value as CheckoutFormValues["paymentMethod"],
              );
            }}
          >
            <option value={PaymentMethod.Cash}>Cash</option>
            <option value={PaymentMethod.Card}>Card</option>
          </SelectField>
        </div>
      </div>

      <div className="checkout-form__footer">
        {hasFormErrors && (
          <p className="checkout-form__error-summary" role="alert">
            Please fix the highlighted fields before placing your order.
          </p>
        )}

        {submitError && (
          <p className="checkout-form__error-summary" role="alert">
            {submitError}
          </p>
        )}

        <div className="checkout-form__actions">
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Placing order..." : "Place order"}
          </Button>
        </div>

        <p className="checkout-form__required-note">
          Required fields are marked with{" "}
          <span className="checkout-form__required-mark" aria-hidden="true">
            *
          </span>
          .
        </p>
      </div>
    </form>
  );
}
