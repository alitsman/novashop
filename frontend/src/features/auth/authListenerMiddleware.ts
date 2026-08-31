import { createListenerMiddleware } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { authStorage } from "../../services/authStorage";
import { invalidateCartSync } from "../cart/cartSlice";
import { resetOrders } from "../orders/ordersSlice";
import { selectAuthToken, selectCurrentUser, sessionExpired } from "./authSlice";

export const authListenerMiddleware = createListenerMiddleware();

const startAuthListening = authListenerMiddleware.startListening.withTypes<RootState>();

startAuthListening({
  actionCreator: sessionExpired,
  effect: (action, listenerApi) => {
    // The reducer protects Redux state; this check protects storage from stale actions.
    const previousToken = selectAuthToken(listenerApi.getOriginalState());

    if (!previousToken || previousToken !== action.payload) {
      return;
    }

    authStorage.clearSession();
  },
});

startAuthListening({
  predicate: (_, currentState, previousState) => {
    return (
      selectAuthToken(currentState) !== selectAuthToken(previousState) ||
      selectCurrentUser(currentState)?.id !== selectCurrentUser(previousState)?.id
    );
  },
  effect: (_, listenerApi) => {
    // Orders are private, so clear them when the session changes.
    listenerApi.dispatch(resetOrders());
    listenerApi.dispatch(invalidateCartSync());
  },
});
