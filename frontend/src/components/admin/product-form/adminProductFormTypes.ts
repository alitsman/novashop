import type { ProductInput } from "../../../types/product";

export type AdminProductFormMode = "create" | "edit";

export type AdminProductFormValues = {
  title: string;
  price: string;
  category: string;
  stock: string;
  imageUrl: string;
  description: string;
};

export type AdminProductFormErrors = Partial<
  Record<keyof AdminProductFormValues, string>
>;

export type UseAdminProductFormParams = {
  mode: AdminProductFormMode;
  product?: ProductInput | null;
  submitError: string | null;
  isSubmitting: boolean;
  onSubmit: (productInput: ProductInput) => void | Promise<void>;
  onCancel: () => void;
  onClearSubmitError: () => void;
};
