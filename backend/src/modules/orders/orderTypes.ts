export const DeliveryMethod = {
  Standard: "standard",
  Express: "express",
} as const;

export type DeliveryMethod = (typeof DeliveryMethod)[keyof typeof DeliveryMethod];

export const PaymentMethod = {
  Cash: "cash",
  Card: "card",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderInput = {
  items: CreateOrderItemInput[];
  fullName: string;
  phone: string;
  address: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
};

export type OrderItem = {
  productId: string;
  title: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  orderNumber: number;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  fullName: string;
  phone: string;
  address: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  createdAt: string;
};

export type OrderDbRow = {
  id: string;
  order_number: string;
  user_id: string;
  total_price: string;
  full_name: string;
  phone: string;
  address: string;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  created_at: Date;
};

export type OrderItemDbRow = {
  order_id: string;
  product_id: string;
  title: string;
  price: string;
  quantity: number;
  line_number: number;
};
