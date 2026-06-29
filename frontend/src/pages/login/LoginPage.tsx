import { useRef, useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  loginUser,
  clearAuthError,
  selectAuthError,
  selectAuthStatus,
} from "../../features/auth/authSlice";
import { AuthRequestStatus, type LoginCredentials } from "../../types/auth";
import { LoginPageView } from "./LoginPageView";
import { validateLoginForm, type LoginFormErrors } from "./loginValidation";

const initialLoginFormValues: LoginCredentials = {
  email: "",
  password: "",
};

const loginFailedMessage = "Email address or password is incorrect.";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);

  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const [formValues, setFormValues] = useState<LoginCredentials>(
    initialLoginFormValues,
  );
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitting = authStatus === AuthRequestStatus.Loading;

  const focusFirstInvalidField = (validationErrors: LoginFormErrors) => {
    if (validationErrors.email) {
      emailInputRef.current?.focus();
      return;
    }

    if (validationErrors.password) {
      passwordInputRef.current?.focus();
    }
  };

  const clearFieldError = (fieldName: keyof LoginCredentials) => {
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

  const handleEmailChange = (email: string) => {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        email,
      };
    });

    clearFieldError("email");
    clearSubmitState();
  };

  const handlePasswordChange = (password: string) => {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        password,
      };
    });

    clearFieldError("password");
    clearSubmitState();
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateLoginForm(formValues);
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
        loginUser({
          email: formValues.email.trim(),
          password: formValues.password,
        }),
      ).unwrap();

      setFormValues(initialLoginFormValues);
      navigate("/products", { replace: true });
    } catch {
      setSubmitError(loginFailedMessage);
    }
  };

  return (
    <LoginPageView
      formValues={formValues}
      formErrors={formErrors}
      submitError={submitError ?? authError}
      isSubmitting={isSubmitting}
      emailInputRef={emailInputRef}
      passwordInputRef={passwordInputRef}
      onEmailChange={handleEmailChange}
      onPasswordChange={handlePasswordChange}
      onSubmit={handleSubmit}
    />
  );
}
