import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../../components/common/confirm-dialog";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  removeFromCart,
  selectCartItems,
  selectCartTotalPrice,
  selectCartTotalQuantity,
  selectIsCartEmpty,
  setQuantity,
} from "../../features/cart/cartSlice";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { CartPageView, type CartPageItemViewModel } from "./CartPageView";

export function CartPage() {
  useDocumentTitle("Cart");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const cartItems = useAppSelector(selectCartItems);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const totalQuantity = useAppSelector(selectCartTotalQuantity);
  const isEmpty = useAppSelector(selectIsCartEmpty);

  const [productIdPendingRemoval, setProductIdPendingRemoval] = useState<string | null>(null);
  const [invalidQuantityProductIds, setInvalidQuantityProductIds] = useState<Set<string>>(
    () => new Set(),
  );

  const itemPendingRemoval = cartItems.find((cartItem) => {
    return cartItem.productId === productIdPendingRemoval;
  });

  const items: CartPageItemViewModel[] = cartItems.map((cartItem) => {
    const itemTotalPrice = cartItem.price * cartItem.quantity;

    return {
      productId: cartItem.productId,
      title: cartItem.title,
      imageUrl: cartItem.imageUrl,
      quantity: cartItem.quantity,
      stock: cartItem.stock,
      priceText: `Price: $${cartItem.price.toFixed(2)}`,
      itemTotalText: `Item total: $${itemTotalPrice.toFixed(2)}`,
    };
  });

  const totalPriceText = `Total: $${totalPrice.toFixed(2)}`;
  const totalQuantityText =
    totalQuantity === 1 ? "1 item in cart" : `${totalQuantity} items in cart`;
  const hasInvalidQuantity = invalidQuantityProductIds.size > 0;

  const handleRequestRemoveItem = (productId: string) => {
    setProductIdPendingRemoval(productId);
  };

  const handleCancelRemoveItem = () => {
    setProductIdPendingRemoval(null);
  };

  const handleConfirmRemoveItem = () => {
    if (!productIdPendingRemoval) {
      return;
    }

    dispatch(removeFromCart(productIdPendingRemoval));
    setProductIdPendingRemoval(null);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    dispatch(setQuantity({ productId, quantity }));
  };

  const handleQuantityValidityChange = useCallback((productId: string, isValid: boolean) => {
    setInvalidQuantityProductIds((currentProductIds) => {
      const shouldBeInvalid = !isValid;

      if (currentProductIds.has(productId) === shouldBeInvalid) {
        return currentProductIds;
      }

      const nextProductIds = new Set(currentProductIds);

      if (shouldBeInvalid) {
        nextProductIds.add(productId);
      } else {
        nextProductIds.delete(productId);
      }

      return nextProductIds;
    });
  }, []);

  const handleCheckout = () => {
    if (hasInvalidQuantity) {
      return;
    }

    void navigate("/checkout");
  };

  return (
    <>
      <CartPageView
        isEmpty={isEmpty}
        items={items}
        totalPriceText={totalPriceText}
        totalQuantityText={totalQuantityText}
        hasInvalidQuantity={hasInvalidQuantity}
        onRequestRemoveItem={handleRequestRemoveItem}
        onQuantityChange={handleQuantityChange}
        onQuantityValidityChange={handleQuantityValidityChange}
        onCheckout={handleCheckout}
      />

      <ConfirmDialog
        isOpen={Boolean(itemPendingRemoval)}
        title="Remove item from cart?"
        description={
          itemPendingRemoval
            ? `Are you sure you want to remove ${itemPendingRemoval.title} from your cart?`
            : ""
        }
        confirmLabel="Remove item"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmRemoveItem}
        onCancel={handleCancelRemoveItem}
      />
    </>
  );
}
