import type { RefObject, SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { AuthPageLayout } from "../../components/auth/auth-page-layout";
import { Button } from "../../components/common/button";
import { TextField } from "../../components/common/text-field";
import type { RegisterData } from "../../types/auth";
import type { RegisterFormErrors } from "./registerValidation";

type RegisterPageViewProps = {
  formValues: RegisterData;
  formErrors: RegisterFormErrors;
  submitError: string | null;
  isSubmitting: boolean;
  nameInputRef: RefObject<HTMLInputElement | null>;
  emailInputRef: RefObject<HTMLInputElement | null>;
  passwordInputRef: RefObject<HTMLInputElement | null>;
  confirmPasswordInputRef: RefObject<HTMLInputElement | null>;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export function RegisterPageView({
  formValues,
  formErrors,
  submitError,
  isSubmitting,
  nameInputRef,
  emailInputRef,
  passwordInputRef,
  confirmPasswordInputRef,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: RegisterPageViewProps) {
  return (
    <AuthPageLayout
      titleId="register-title"
      title="Create an account"
      description="Create your NovaShop account to shop, manage your cart, and view your orders."
      footer={
        <p className="auth-page-layout__switch-text">
          Already have an account?{" "}
          <Link className="auth-page-layout__switch-link" to="/login">
            Sign in
          </Link>
          .
        </p>
      }
    >
      <form
        className="auth-page-layout__form"
        noValidate
        aria-labelledby="register-title"
        onSubmit={onSubmit}
      >
        <TextField
          id="register-name"
          name="name"
          label="Name"
          autoComplete="name"
          inputRef={nameInputRef}
          value={formValues.name}
          onChange={onNameChange}
          required
          error={formErrors.name}
        />

        <TextField
          id="register-email"
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          inputRef={emailInputRef}
          value={formValues.email}
          onChange={onEmailChange}
          required
          error={formErrors.email}
        />

        <TextField
          id="register-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          inputRef={passwordInputRef}
          value={formValues.password}
          onChange={onPasswordChange}
          required
          hint="Use at least 8 characters, including an uppercase letter, a number, and a special character."
          error={formErrors.password}
        />

        <TextField
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          inputRef={confirmPasswordInputRef}
          value={formValues.confirmPassword}
          onChange={onConfirmPasswordChange}
          required
          error={formErrors.confirmPassword}
        />

        <div className="auth-page-layout__form-footer">
          {submitError && (
            <p className="auth-page-layout__error-summary" role="alert">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>

          {isSubmitting && (
            <p className="auth-page-layout__status" role="status">
              Creating your account, please wait.
            </p>
          )}

          <p className="auth-page-layout__required-note">
            Required fields are marked with{" "}
            <span
              className="auth-page-layout__required-mark"
              aria-hidden="true"
            >
              *
            </span>
            .
          </p>
        </div>
      </form>
    </AuthPageLayout>
  );
}
