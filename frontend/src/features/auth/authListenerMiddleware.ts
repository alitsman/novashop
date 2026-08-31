import { createListenerMiddleware } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { authStorage } from "../../services/authStorage";
import { selectAuthToken, sessionExpired } from "./authSlice";

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
