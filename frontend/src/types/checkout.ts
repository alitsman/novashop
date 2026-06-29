export const DeliveryMethod = {
  Standard: "standard",
  Express: "express",
} as const;

export type DeliveryMethod =
  (typeof DeliveryMethod)[keyof typeof DeliveryMethod];

export const PaymentMethod = {
  Cash: "cash",
  Card: "card",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export type CheckoutForm = {
  fullName: string;
  phone: string;
  address: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
};
