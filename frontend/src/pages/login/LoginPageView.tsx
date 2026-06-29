import type { RefObject, SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { AuthPageLayout } from "../../components/auth/auth-page-layout";
import { Button } from "../../components/common/button";
import { TextField } from "../../components/common/text-field";
import type { LoginCredentials } from "../../types/auth";
import type { LoginFormErrors } from "./loginValidation";

type LoginPageViewProps = {
  formValues: LoginCredentials;
  formErrors: LoginFormErrors;
  submitError: string | null;
  isSubmitting: boolean;
  emailInputRef: RefObject<HTMLInputElement | null>;
  passwordInputRef: RefObject<HTMLInputElement | null>;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export function LoginPageView({
  formValues,
  formErrors,
  submitError,
  isSubmitting,
  emailInputRef,
  passwordInputRef,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginPageViewProps) {
  return (
    <AuthPageLayout
      titleId="login-title"
      title="Sign in"
      description="Sign in with your email address to continue shopping, manage your cart, and view orders."
      footer={
        <>
          <p className="auth-page-layout__switch-text">
            New to NovaShop?{" "}
            <Link className="auth-page-layout__switch-link" to="/register">
              Create an account
            </Link>
            .
          </p>

          <section
            className="auth-page-layout__demo-credentials"
            aria-labelledby="login-demo-credentials-title"
          >
            <h2
              id="login-demo-credentials-title"
              className="auth-page-layout__demo-title"
            >
              Demo accounts
            </h2>

            <p className="auth-page-layout__demo-text">
              Use these mock accounts to review the application as a regular
              user or as an administrator.
            </p>

            <dl className="auth-page-layout__demo-list">
              <div className="auth-page-layout__demo-item">
                <dt>User</dt>
                <dd>
                  <code className="auth-page-layout__demo-code">
                    user@test.com
                  </code>{" "}
                  / <code className="auth-page-layout__demo-code">user123</code>
                </dd>
              </div>

              <div className="auth-page-layout__demo-item">
                <dt>Admin</dt>
                <dd>
                  <code className="auth-page-layout__demo-code">
                    admin@test.com
                  </code>{" "}
                  /{" "}
                  <code className="auth-page-layout__demo-code">admin123</code>
                </dd>
              </div>
            </dl>
          </section>
        </>
      }
    >
      <form
        className="auth-page-layout__form"
        noValidate
        aria-labelledby="login-title"
        onSubmit={onSubmit}
      >
        <TextField
          id="login-email"
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
          id="login-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          inputRef={passwordInputRef}
          value={formValues.password}
          onChange={onPasswordChange}
          required
          error={formErrors.password}
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
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

          {isSubmitting && (
            <p className="auth-page-layout__status" role="status">
              Signing in, please wait.
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
