import { useAuthBootstrap } from "./useAuthBootstrap";
import { useCartBootstrap } from "./useCartBootstrap";

export function useAppBootstrap() {
  const isAuthResolved = useAuthBootstrap();
  const isCartRestored = useCartBootstrap({ isAuthResolved });

  return isAuthResolved && isCartRestored;
}
