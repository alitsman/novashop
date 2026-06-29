import { useRef, useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearAuthError,
  registerUser,
  selectAuthError,
  selectAuthStatus,
} from "../../features/auth/authSlice";
import { AuthRequestStatus, type RegisterData } from "../../types/auth";
import { RegisterPageView } from "./RegisterPageView";
import {
  validateRegisterForm,
  type RegisterFormErrors,
} from "./registerValidation";

const initialRegisterFormValues: RegisterData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const registerFailedMessage =
  "We could not create your account. Please try again.";

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement | null>(null);

  const [formValues, setFormValues] = useState<RegisterData>(
    initialRegisterFormValues,
  );
  const [formErrors, setFormErrors] = useState<RegisterFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitting = authStatus === AuthRequestStatus.Loading;

  const focusFirstInvalidField = (validationErrors: RegisterFormErrors) => {
    if (validationErrors.name) {
      nameInputRef.current?.focus();
      return;
    }

    if (validationErrors.email) {
      emailInputRef.current?.focus();
      return;
    }

    if (validationErrors.password) {
      passwordInputRef.current?.focus();
      return;
    }

    if (validationErrors.confirmPassword) {
      confirmPasswordInputRef.current?.focus();
    }
  };

  const clearFieldError = (fieldName: keyof RegisterData) => {
    setFormErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];

      return nextErrors;
    });
  };

  const clearSubmitState = () => {
    setSubmitError(null);

    if (authError) {
      dispatch(clearAuthError());
    }
  };

  const handleNameChange = (name: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      name,
    }));

    clearFieldError("name");
    clearSubmitState();
  };

  const handleEmailChange = (email: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      email,
    }));

    clearFieldError("email");
    clearSubmitState();
  };

  const handlePasswordChange = (password: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      password,
    }));

    clearFieldError("password");
    clearFieldError("confirmPassword");
    clearSubmitState();
  };

  const handleConfirmPasswordChange = (confirmPassword: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      confirmPassword,
    }));

    clearFieldError("confirmPassword");
    clearSubmitState();
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateRegisterForm(formValues);
    const hasValidationErrors = Object.keys(validationErrors).length > 0;

    if (hasValidationErrors) {
      setFormErrors(validationErrors);
      setSubmitError(null);
      dispatch(clearAuthError());
      focusFirstInvalidField(validationErrors);
      return;
    }

    setFormErrors({});
    setSubmitError(null);
    dispatch(clearAuthError());

    try {
      await dispatch(
        registerUser({
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          password: formValues.password,
          confirmPassword: formValues.confirmPassword,
        }),
      ).unwrap();

      setFormValues(initialRegisterFormValues);
      navigate("/products", { replace: true });
    } catch (error) {
      setSubmitError(typeof error === "string" ? error : registerFailedMessage);
    }
  };

  return (
    <RegisterPageView
      formValues={formValues}
      formErrors={formErrors}
      submitError={submitError ?? authError}
      isSubmitting={isSubmitting}
      nameInputRef={nameInputRef}
      emailInputRef={emailInputRef}
      passwordInputRef={passwordInputRef}
      confirmPasswordInputRef={confirmPasswordInputRef}
      onNameChange={handleNameChange}
      onEmailChange={handleEmailChange}
      onPasswordChange={handlePasswordChange}
      onConfirmPasswordChange={handleConfirmPasswordChange}
      onSubmit={handleSubmit}
    />
  );
}
