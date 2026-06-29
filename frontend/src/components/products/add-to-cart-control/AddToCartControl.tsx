import type { Product } from "../../../types/product";
import {
  AddToCartControlView,
  type AddToCartControlVariant,
} from "./AddToCartControlView";
import { useAddToCartControl } from "./useAddToCartControl";

type AddToCartControlProps = {
  product: Product;
  variant?: AddToCartControlVariant;
};

export function AddToCartControl({
  product,
  variant = "full",
}: AddToCartControlProps) {
  const controlProps = useAddToCartControl({
    product,
    variant,
  });

  return <AddToCartControlView variant={variant} {...controlProps} />;
}
