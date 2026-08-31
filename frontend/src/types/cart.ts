export const CartRequestStatus = {
  Idle: "idle",
  Loading: "loading",
  Succeeded: "succeeded",
  Failed: "failed",
} as const;

export type CartRequestStatus = (typeof CartRequestStatus)[keyof typeof CartRequestStatus];

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
};

export type CartState = {
  items: CartItem[];
  error: string | null;
  ownerUserId: string | null;
  syncStatus: CartRequestStatus;
  syncRequestId: string | null;
  syncError: string | null;
};
