import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";
import { selectCurrentUser } from "../features/auth/authSlice";
import {
  resetCart,
  restoreCart,
  selectCartItems,
  selectCartOwnerUserId,
} from "../features/cart/cartSlice";
import { cartService } from "../services/cartService";

type UseCartBootstrapParams = {
  isAuthResolved: boolean;
};

export function useCartBootstrap({ isAuthResolved }: UseCartBootstrapParams) {
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector(selectCurrentUser);
  const cartItems = useAppSelector(selectCartItems);
  const cartOwnerUserId = useAppSelector(selectCartOwnerUserId);

  const currentUserId = currentUser?.id ?? null;

  useEffect(() => {
    if (!isAuthResolved) {
      return;
    }

    if (!currentUserId) {
      dispatch(resetCart());
      return;
    }

    const storedCartItems = cartService.getCartItems(currentUserId);

    dispatch(
      restoreCart({
        userId: currentUserId,
        items: storedCartItems,
      }),
    );
  }, [currentUserId, dispatch, isAuthResolved]);

  const isCartRestored = isAuthResolved && (!currentUserId || cartOwnerUserId === currentUserId);

  useEffect(() => {
    if (!isCartRestored || !currentUserId) {
      return;
    }

    cartService.saveCartItems(currentUserId, cartItems);
  }, [cartItems, currentUserId, isCartRestored]);

  // Another tab of the same user saved a newer cart. Load it into this tab's store;
  // otherwise this tab keeps its stale cart and its next save overwrites the newer one.
  // The browser fires "storage" only in other tabs and only when the value really changes,
  // so saving the restored cart again does not start an endless exchange between tabs.
  useEffect(() => {
    if (!isCartRestored || !currentUserId) {
      return;
    }

    const storageKey = cartService.getCartItemsStorageKey(currentUserId);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) {
        return;
      }

      dispatch(
        restoreCart({
          userId: currentUserId,
          items: cartService.getCartItems(currentUserId),
        }),
      );
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [currentUserId, dispatch, isCartRestored]);

  return isCartRestored;
}
