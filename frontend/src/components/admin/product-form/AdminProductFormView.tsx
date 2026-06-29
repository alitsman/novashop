import type { RefObject, SubmitEvent } from "react";
import { Button, ButtonVariant } from "../../common/button";
import { TextareaField } from "../../common/textarea-field";
import { TextField } from "../../common/text-field";
import type {
  AdminProductFormErrors,
  AdminProductFormMode,
  AdminProductFormValues,
} from "./adminProductFormTypes";
import "./admin-product-form.css";

export type AdminProductFormViewProps = {
  mode: AdminProductFormMode;
  formValues: AdminProductFormValues;
  formErrors: AdminProductFormErrors;
  submitError: string | null;
  isSubmitting: boolean;
  titleInputRef: RefObject<HTMLInputElement | null>;
  priceInputRef: RefObject<HTMLInputElement | null>;
  categoryInputRef: RefObject<HTMLInputElement | null>;
  stockInputRef: RefObject<HTMLInputElement | null>;
  imageUrlInputRef: RefObject<HTMLInputElement | null>;
  descriptionTextareaRef: RefObject<HTMLTextAreaElement | null>;
  onTitleChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStockChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

const getFormBaseId = (mode: AdminProductFormMode) => {
  if (mode === "create") {
    return "admin-product-create-form";
  }

  return "admin-product-edit-form";
};

const getFormAccessibleName = (mode: AdminProductFormMode) => {
  if (mode === "create") {
    return "Create product form";
  }

  return "Edit product form";
};

const getSubmitButtonText = (mode: AdminProductFormMode) => {
  if (mode === "create") {
    return "Create product";
  }

  return "Save changes";
};

const getSubmittingButtonText = (mode: AdminProductFormMode) => {
  if (mode === "create") {
    return "Creating...";
  }

  return "Saving...";
};

export function AdminProductFormView({
  mode,
  formValues,
  formErrors,
  submitError,
  isSubmitting,
  titleInputRef,
  priceInputRef,
  categoryInputRef,
  stockInputRef,
  imageUrlInputRef,
  descriptionTextareaRef,
  onTitleChange,
  onPriceChange,
  onCategoryChange,
  onStockChange,
  onImageUrlChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
}: AdminProductFormViewProps) {
  const hasFormErrors = Object.keys(formErrors).length > 0;

  const formBaseId = getFormBaseId(mode);
  const formAccessibleName = getFormAccessibleName(mode);
  const submitButtonText = getSubmitButtonText(mode);
  const submittingButtonText = getSubmittingButtonText(mode);

  return (
    <div className="admin-product-form">
      <form
        className="admin-product-form__form"
        id={formBaseId}
        aria-label={formAccessibleName}
        noValidate
        onSubmit={onSubmit}
      >
        <div className="admin-product-form__grid">
          <TextField
            id={`${formBaseId}-title`}
            name="title"
            label="Product title"
            inputRef={titleInputRef}
            value={formValues.title}
            onChange={onTitleChange}
            required
            error={formErrors.title}
          />

          <div className="admin-product-form__row admin-product-form__row--two-columns">
            <TextField
              id={`${formBaseId}-price`}
              name="price"
              label="Price"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              inputRef={priceInputRef}
              value={formValues.price}
              onChange={onPriceChange}
              required
              hint="Use a positive number, for example 29.99."
              error={formErrors.price}
            />

            <TextField
              id={`${formBaseId}-stock`}
              name="stock"
              label="Stock"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              inputRef={stockInputRef}
              value={formValues.stock}
              onChange={onStockChange}
              required
              hint="Use a whole number. Zero means out of stock."
              error={formErrors.stock}
            />
          </div>

          <TextField
            id={`${formBaseId}-category`}
            name="category"
            label="Category"
            inputRef={categoryInputRef}
            value={formValues.category}
            onChange={onCategoryChange}
            required
            error={formErrors.category}
          />

          <TextField
            id={`${formBaseId}-image-url`}
            name="imageUrl"
            label="Image URL"
            type="url"
            inputRef={imageUrlInputRef}
            value={formValues.imageUrl}
            onChange={onImageUrlChange}
            required
            hint="Use an http or https image URL."
            error={formErrors.imageUrl}
          />

          <TextareaField
            id={`${formBaseId}-description`}
            name="description"
            label="Description"
            rows={5}
            textareaRef={descriptionTextareaRef}
            value={formValues.description}
            onChange={onDescriptionChange}
            required
            error={formErrors.description}
          />
        </div>

        <div className="admin-product-form__footer">
          {hasFormErrors && (
            <p className="admin-product-form__error-summary" role="alert">
              Please fix the highlighted fields before saving the product.
            </p>
          )}

          {submitError && (
            <p className="admin-product-form__error-summary" role="alert">
              {submitError}
            </p>
          )}

          <div className="admin-product-form__actions">
            <Button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? submittingButtonText : submitButtonText}
            </Button>

            <Button
              type="button"
              variant={ButtonVariant.Secondary}
              disabled={isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>

          <p className="admin-product-form__required-note">
            Required fields are marked with{" "}
            <span
              className="admin-product-form__required-mark"
              aria-hidden="true"
            >
              *
            </span>
            .
          </p>
        </div>
      </form>
    </div>
  );
}
