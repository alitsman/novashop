import type { RegisterData } from "../../types/auth";

export type RegisterFormErrors = Partial<Record<keyof RegisterData, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uppercasePattern = /[A-Z]/;
const numberPattern = /\d/;
const specialCharacterPattern = /[^A-Za-z0-9\s]/;

export function validateRegisterForm(
  formValues: RegisterData,
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!formValues.name.trim()) {
    errors.name = "Name is required.";
  }

  const normalizedEmail = formValues.email.trim();

  if (!normalizedEmail) {
    errors.email = "Email address is required.";
  } else if (!emailPattern.test(normalizedEmail)) {
    errors.email = "Enter an email address with @ and a domain.";
  }

  if (!formValues.password) {
    errors.password = "Password is required.";
  } else if (formValues.password.length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  } else if (!uppercasePattern.test(formValues.password)) {
    errors.password = "Password must contain at least one uppercase letter.";
  } else if (!numberPattern.test(formValues.password)) {
    errors.password = "Password must contain at least one number.";
  } else if (!specialCharacterPattern.test(formValues.password)) {
    errors.password = "Password must contain at least one special character.";
  }

  if (!formValues.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (formValues.confirmPassword !== formValues.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
