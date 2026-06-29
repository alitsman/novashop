import type {
  AdminProductFormErrors,
  AdminProductFormValues,
} from "./adminProductFormTypes";

const maxProductTitleLength = 80;
const maxCategoryLength = 40;
const maxDescriptionLength = 300;
const maxPrice = 999_999;
const maxStock = 100_000;

const angleBracketsPattern = /[<>]/;
const unicodeLetterOrDigitPattern = /[\p{L}\p{N}]/u;

const hasDisallowedControlCharacters = (value: string) => {
  return Array.from(value).some((character) => {
    const characterCode = character.charCodeAt(0);

    const isAllowedWhitespace =
      characterCode === 9 || characterCode === 10 || characterCode === 13;

    return (
      !isAllowedWhitespace &&
      ((characterCode >= 0 && characterCode <= 31) || characterCode === 127)
    );
  });
};

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const validateAdminProductForm = (
  formValues: AdminProductFormValues,
): AdminProductFormErrors => {
  const formErrors: AdminProductFormErrors = {};

  const title = formValues.title.trim();
  const category = formValues.category.trim();
  const imageUrl = formValues.imageUrl.trim();
  const description = formValues.description.trim();

  const price = Number(formValues.price);
  const stock = Number(formValues.stock);

  if (!title) {
    formErrors.title = "Product title is required.";
  } else if (hasDisallowedControlCharacters(title)) {
    formErrors.title = "Remove hidden control characters from product title.";
  } else if (angleBracketsPattern.test(title)) {
    formErrors.title = "Remove angle brackets (< >) from product title.";
  } else if (title.length < 2) {
    formErrors.title = "Product title must be at least 2 characters.";
  } else if (title.length > maxProductTitleLength) {
    formErrors.title = `Product title must be ${maxProductTitleLength} characters or less.`;
  } else if (!unicodeLetterOrDigitPattern.test(title)) {
    formErrors.title =
      "Product title must contain at least one letter or digit.";
  }

  if (!formValues.price.trim()) {
    formErrors.price = "Price is required.";
  } else if (!Number.isFinite(price)) {
    formErrors.price = "Price must be a valid number.";
  } else if (price <= 0) {
    formErrors.price = "Price must be greater than 0.";
  } else if (price > maxPrice) {
    formErrors.price = `Price must be ${maxPrice} or less.`;
  }

  if (!category) {
    formErrors.category = "Category is required.";
  } else if (hasDisallowedControlCharacters(category)) {
    formErrors.category = "Remove hidden control characters from category.";
  } else if (angleBracketsPattern.test(category)) {
    formErrors.category = "Remove angle brackets (< >) from category.";
  } else if (category.length < 2) {
    formErrors.category = "Category must be at least 2 characters.";
  } else if (category.length > maxCategoryLength) {
    formErrors.category = `Category must be ${maxCategoryLength} characters or less.`;
  } else if (!unicodeLetterOrDigitPattern.test(category)) {
    formErrors.category = "Category must contain at least one letter or digit.";
  }

  if (!formValues.stock.trim()) {
    formErrors.stock = "Stock quantity is required.";
  } else if (!Number.isFinite(stock)) {
    formErrors.stock = "Stock quantity must be a valid number.";
  } else if (!Number.isInteger(stock)) {
    formErrors.stock = "Stock quantity must be a whole number.";
  } else if (stock < 0) {
    formErrors.stock = "Stock quantity cannot be negative.";
  } else if (stock > maxStock) {
    formErrors.stock = `Stock quantity must be ${maxStock} or less.`;
  }

  if (!imageUrl) {
    formErrors.imageUrl = "Image URL is required.";
  } else if (!isValidHttpUrl(imageUrl)) {
    formErrors.imageUrl = "Image URL must be a valid http or https URL.";
  }

  if (!description) {
    formErrors.description = "Description is required.";
  } else if (hasDisallowedControlCharacters(description)) {
    formErrors.description =
      "Remove hidden control characters from description.";
  } else if (angleBracketsPattern.test(description)) {
    formErrors.description = "Remove angle brackets (< >) from description.";
  } else if (description.length < 10) {
    formErrors.description = "Description must be at least 10 characters.";
  } else if (description.length > maxDescriptionLength) {
    formErrors.description = `Description must be ${maxDescriptionLength} characters or less.`;
  } else if (!unicodeLetterOrDigitPattern.test(description)) {
    formErrors.description =
      "Description must contain at least one letter or digit.";
  }

  return formErrors;
};
