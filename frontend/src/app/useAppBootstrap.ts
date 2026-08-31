import { useEffect } from "react";
import { ordersService } from "../services/ordersService";
import { useAuthBootstrap } from "./useAuthBootstrap";
import { useCartBootstrap } from "./useCartBootstrap";

export function useAppBootstrap() {
  const isAuthResolved = useAuthBootstrap();
  const isCartRestored = useCartBootstrap({ isAuthResolved });

  useEffect(() => {
    // Remove orders saved by the old localStorage service.
    ordersService.clearLegacyOrders();
  }, []);

  return isAuthResolved && isCartRestored;
}
