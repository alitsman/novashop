import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../../components/common/confirm-dialog";
import { useAppDispatch, useAppSelector, useAppStore } from "../../app/hooks";
import { selectAuthToken, selectCurrentUser } from "../../features/auth/authSlice";
import {
  invalidateCartSync,
  removeFromCart,
  selectCartCheckoutError,
  selectCartItems,
  selectCartOwnerUserId,
  selectCartSyncError,
  selectCartSyncStatus,
  selectCartTotalPrice,
  selectCartTotalQuantity,
  selectIsCartEmpty,
  setQuantity,
  syncCart,
} from "../../features/cart/cartSlice";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { CartRequestStatus } from "../../types/cart";
import { CartPageView, type CartPageItemViewModel } from "./CartPageView";

type CartQuantityValidationState = {
  invalidProductIds: Set<string>;
  checkoutAttempted: boolean;
};

export function CartPage() {
  useDocumentTitle("Cart");

  const dispatch = useAppDispatch();
  const store = useAppStore();
  const navigate = useNavigate();

  const hasInitializedCartRef = useRef(false);
  const quantityInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const currentUser = useAppSelector(selectCurrentUser);
  const sessionToken = useAppSelector(selectAuthToken);
  const cartOwnerUserId = useAppSelector(selectCartOwnerUserId);
  const cartItems = useAppSelector(selectCartItems);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const totalQuantity = useAppSelector(selectCartTotalQuantity);
  const isEmpty = useAppSelector(selectIsCartEmpty);
  const syncStatus = useAppSelector(selectCartSyncStatus);
  const syncError = useAppSelector(selectCartSyncError);
  const cartCheckoutError = useAppSelector(selectCartCheckoutError);

  const [productIdPendingRemoval, setProductIdPendingRemoval] = useState<string | null>(null);

  const [quantityValidation, setQuantityValidation] = useState<CartQuantityValidationState>(() => ({
    invalidProductIds: new Set(),
    checkoutAttempted: false,
  }));

  const currentUserId = currentUser?.id;

  useEffect(() => {
    if (hasInitializedCartRef.current) {
      return;
    }

    // StrictMode replays effects; reset once per page mount.
    hasInitializedCartRef.current = true;
    dispatch(invalidateCartSync());
  }, [dispatch]);

  useEffect(() => {
    if (
      !currentUserId ||
      !sessionToken ||
      cartOwnerUserId !== currentUserId ||
      isEmpty ||
      syncStatus !== CartRequestStatus.Idle
    ) {
      return;
    }

    // The first effect run may have already started this request.
    if (selectCartSyncStatus(store.getState()) !== CartRequestStatus.Idle) {
      return;
    }

    void dispatch(syncCart());
  }, [dispatch, store, currentUserId, sessionToken, cartOwnerUserId, isEmpty, syncStatus]);

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

  const hasInvalidQuantity = quantityValidation.invalidProductIds.size > 0;
  const quantityError =
    quantityValidation.checkoutAttempted && hasInvalidQuantity
      ? "Enter a valid quantity for each cart item before checkout."
      : null;

  const isSyncing =
    syncStatus === CartRequestStatus.Idle || syncStatus === CartRequestStatus.Loading;
  const canCheckout = Boolean(
    currentUserId &&
    sessionToken &&
    cartOwnerUserId === currentUserId &&
    !isEmpty &&
    syncStatus === CartRequestStatus.Succeeded &&
    !cartCheckoutError,
  );
  const showRetrySync = syncStatus === CartRequestStatus.Failed;

  let checkoutError: string | null = null;

  if (syncStatus === CartRequestStatus.Failed) {
    checkoutError = syncError ?? "Failed to check cart. Please try again.";
  } else if (syncStatus === CartRequestStatus.Succeeded) {
    checkoutError = cartCheckoutError ?? quantityError;
  }

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

  const handleQuantityInputRef = useCallback(
    (productId: string, input: HTMLInputElement | null) => {
      if (input) {
        quantityInputRefs.current.set(productId, input);
        return;
      }

      quantityInputRefs.current.delete(productId);
    },
    [],
  );

  const handleQuantityValidityChange = useCallback((productId: string, isValid: boolean) => {
    setQuantityValidation((currentValidation) => {
      const shouldBeInvalid = !isValid;

      if (currentValidation.invalidProductIds.has(productId) === shouldBeInvalid) {
        return currentValidation;
      }

      const nextInvalidProductIds = new Set(currentValidation.invalidProductIds);

      if (shouldBeInvalid) {
        nextInvalidProductIds.add(productId);
      } else {
        nextInvalidProductIds.delete(productId);
      }

      return {
        invalidProductIds: nextInvalidProductIds,
        checkoutAttempted: nextInvalidProductIds.size > 0 && currentValidation.checkoutAttempted,
      };
    });
  }, []);

  const handleRetrySync = () => {
    if (isSyncing || isEmpty) {
      return;
    }

    void dispatch(syncCart());
  };

  const handleCheckout = () => {
    if (!canCheckout) {
      return;
    }

    if (hasInvalidQuantity) {
      setQuantityValidation((currentValidation) => {
        if (currentValidation.checkoutAttempted) {
          return currentValidation;
        }

        return {
          ...currentValidation,
          checkoutAttempted: true,
        };
      });

      const firstInvalidItem = cartItems.find((item) =>
        quantityValidation.invalidProductIds.has(item.productId),
      );

      if (firstInvalidItem) {
        quantityInputRefs.current.get(firstInvalidItem.productId)?.focus();
      }

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
        checkoutError={checkoutError}
        isSyncing={isSyncing}
        canCheckout={canCheckout}
        showRetrySync={showRetrySync}
        onRequestRemoveItem={handleRequestRemoveItem}
        onQuantityChange={handleQuantityChange}
        onQuantityValidityChange={handleQuantityValidityChange}
        onQuantityInputRef={handleQuantityInputRef}
        onRetrySync={handleRetrySync}
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
