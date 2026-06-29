import { useEffect, useMemo, useRef, useState, type SubmitEvent } from "react";
import {
  emptyAdminProductFormValues,
  getAdminProductFormValuesFromProductInput,
  getProductInputFromAdminProductFormValues,
} from "./adminProductFormMappers";
import type {
  AdminProductFormErrors,
  AdminProductFormValues,
  UseAdminProductFormParams,
} from "./adminProductFormTypes";
import { validateAdminProductForm } from "./adminProductFormValidation";
import type { AdminProductFormViewProps } from "./AdminProductFormView";

const adminProductFormValueFieldNames = Object.keys(
  emptyAdminProductFormValues,
) as Array<keyof AdminProductFormValues>;

const areAdminProductFormValuesEqual = (
  previousValues: AdminProductFormValues,
  currentValues: AdminProductFormValues,
) => {
  return adminProductFormValueFieldNames.every((fieldName) => {
    return previousValues[fieldName] === currentValues[fieldName];
  });
};

export type UseAdminProductFormResult = {
  formValues: AdminProductFormValues;
  viewProps: AdminProductFormViewProps;
};

export function useAdminProductForm({
  mode,
  product = null,
  submitError,
  isSubmitting,
  onSubmit,
  onCancel,
  onClearSubmitError,
}: UseAdminProductFormParams): UseAdminProductFormResult {
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const priceInputRef = useRef<HTMLInputElement | null>(null);
  const categoryInputRef = useRef<HTMLInputElement | null>(null);
  const stockInputRef = useRef<HTMLInputElement | null>(null);
  const imageUrlInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const sourceFormValues = useMemo(() => {
    if (!product) {
      return emptyAdminProductFormValues;
    }

    return getAdminProductFormValuesFromProductInput(product);
  }, [product]);

  const previousSourceFormValuesRef = useRef(sourceFormValues);

  const [currentFormValues, setCurrentFormValues] =
    useState<AdminProductFormValues>(sourceFormValues);
  const [formErrors, setFormErrors] = useState<AdminProductFormErrors>({});

  useEffect(() => {
    if (
      areAdminProductFormValuesEqual(
        previousSourceFormValuesRef.current,
        sourceFormValues,
      )
    ) {
      return;
    }

    previousSourceFormValuesRef.current = sourceFormValues;
    setCurrentFormValues(sourceFormValues);
    setFormErrors({});
  }, [sourceFormValues]);

  const focusFirstInvalidField = (validationErrors: AdminProductFormErrors) => {
    if (validationErrors.title) {
      titleInputRef.current?.focus();
      return;
    }

    if (validationErrors.price) {
      priceInputRef.current?.focus();
      return;
    }

    if (validationErrors.category) {
      categoryInputRef.current?.focus();
      return;
    }

    if (validationErrors.stock) {
      stockInputRef.current?.focus();
      return;
    }

    if (validationErrors.imageUrl) {
      imageUrlInputRef.current?.focus();
      return;
    }

    if (validationErrors.description) {
      descriptionTextareaRef.current?.focus();
    }
  };

  const clearFieldError = (fieldName: keyof AdminProductFormValues) => {
    setFormErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];

      return nextErrors;
    });
  };

  const updateField = (
    fieldName: keyof AdminProductFormValues,
    value: string,
  ) => {
    setCurrentFormValues((currentValues) => {
      return {
        ...currentValues,
        [fieldName]: value,
      };
    });

    clearFieldError(fieldName);
    onClearSubmitError();
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    onClearSubmitError();

    const validationErrors = validateAdminProductForm(currentFormValues);
    const hasValidationErrors = Object.keys(validationErrors).length > 0;

    if (hasValidationErrors) {
      setFormErrors(validationErrors);
      focusFirstInvalidField(validationErrors);
      return;
    }

    setFormErrors({});
    void onSubmit(getProductInputFromAdminProductFormValues(currentFormValues));
  };

  return {
    formValues: currentFormValues,
    viewProps: {
      mode,
      formValues: currentFormValues,
      formErrors,
      submitError,
      isSubmitting,
      titleInputRef,
      priceInputRef,
      categoryInputRef,
      stockInputRef,
      imageUrlInputRef,
      descriptionTextareaRef,
      onTitleChange: (value) => updateField("title", value),
      onPriceChange: (value) => updateField("price", value),
      onCategoryChange: (value) => updateField("category", value),
      onStockChange: (value) => updateField("stock", value),
      onImageUrlChange: (value) => updateField("imageUrl", value),
      onDescriptionChange: (value) => updateField("description", value),
      onSubmit: handleSubmit,
      onCancel,
    },
  };
}
