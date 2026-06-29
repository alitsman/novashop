import { useEffect, useState } from "react";
import { restoreAuth } from "../features/auth/authSlice";
import { useAppDispatch } from "./hooks";

export function useAuthBootstrap() {
  const dispatch = useAppDispatch();
  const [isAuthRestored, setIsAuthRestored] = useState(false);

  useEffect(() => {
    let isEffectActive = true;

    dispatch(restoreAuth()).finally(() => {
      if (isEffectActive) {
        setIsAuthRestored(true);
      }
    });

    return () => {
      isEffectActive = false;
    };
  }, [dispatch]);

  return isAuthRestored;
}
