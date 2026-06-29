import { useEffect, useState } from "react";
import { useAuthBootstrap } from "./useAuthBootstrap";
import { useCartBootstrap } from "./useCartBootstrap";

const MIN_BOOTSTRAP_DURATION_MS = 1000;

export function useAppBootstrap() {
  const isAuthRestored = useAuthBootstrap();
  const isCartRestored = useCartBootstrap({ isAuthRestored });
  const [isMinDurationElapsed, setIsMinDurationElapsed] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsMinDurationElapsed(true);
    }, MIN_BOOTSTRAP_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return isAuthRestored && isCartRestored && isMinDurationElapsed;
}
