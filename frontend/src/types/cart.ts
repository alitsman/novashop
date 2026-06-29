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
};
