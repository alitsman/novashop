import type { LoginCredentials } from "../../types/auth";

export type LoginFormErrors = Partial<Record<keyof LoginCredentials, string>>;

export const validateLoginForm = (
  formValues: LoginCredentials,
): LoginFormErrors => {
  const formErrors: LoginFormErrors = {};

  if (!formValues.email.trim()) {
    formErrors.email = "Email address is required.";
  }

  if (!formValues.password) {
    formErrors.password = "Password is required.";
  }

  return formErrors;
};
