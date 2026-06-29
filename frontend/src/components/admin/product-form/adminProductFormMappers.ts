import type { ProductInput } from "../../../types/product";
import type { AdminProductFormValues } from "./adminProductFormTypes";

export const emptyAdminProductFormValues: AdminProductFormValues = {
  title: "",
  price: "",
  category: "",
  stock: "",
  imageUrl: "",
  description: "",
};

export const getAdminProductFormValuesFromProductInput = (
  productInput: ProductInput,
): AdminProductFormValues => {
  return {
    title: productInput.title,
    price: String(productInput.price),
    category: productInput.category,
    stock: String(productInput.stock),
    imageUrl: productInput.imageUrl,
    description: productInput.description,
  };
};

export const getProductInputFromAdminProductFormValues = (
  formValues: AdminProductFormValues,
): ProductInput => {
  return {
    title: formValues.title.trim(),
    price: Number(formValues.price),
    category: formValues.category.trim(),
    stock: Number(formValues.stock),
    imageUrl: formValues.imageUrl.trim(),
    description: formValues.description.trim(),
  };
};
