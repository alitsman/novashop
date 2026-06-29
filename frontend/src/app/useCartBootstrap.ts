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
  isAuthRestored: boolean;
};

export function useCartBootstrap({ isAuthRestored }: UseCartBootstrapParams) {
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector(selectCurrentUser);
  const cartItems = useAppSelector(selectCartItems);
  const cartOwnerUserId = useAppSelector(selectCartOwnerUserId);

  const currentUserId = currentUser?.id ?? null;

  useEffect(() => {
    if (!isAuthRestored) {
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
  }, [currentUserId, dispatch, isAuthRestored]);

  const isCartRestored =
    isAuthRestored && (!currentUserId || cartOwnerUserId === currentUserId);

  useEffect(() => {
    if (!isCartRestored || !currentUserId) {
      return;
    }

    cartService.saveCartItems(currentUserId, cartItems);
  }, [cartItems, currentUserId, isCartRestored]);

  return isCartRestored;
}
