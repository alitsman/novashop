import type { CheckoutForm } from "../../types/checkout";

export type CheckoutFormErrors = Partial<Record<keyof CheckoutForm, string>>;

const fullNameAllowedCharactersPattern = /^[\p{L}\p{M} .'\u2019-]+$/u;
const phoneAllowedCharactersPattern = /^[0-9+\s()-]+$/;
const unicodeLetterPattern = /\p{L}/u;
const unicodeLetterOrDigitPattern = /[\p{L}\p{N}]/u;
const angleBracketsPattern = /[<>]/;

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

const getPhoneDigits = (phone: string) => {
  return phone.replace(/\D/g, "");
};

const getPlusSignCount = (value: string) => {
  return value.match(/\+/g)?.length ?? 0;
};

export const validateCheckoutForm = (
  formValues: CheckoutForm,
): CheckoutFormErrors => {
  const formErrors: CheckoutFormErrors = {};

  const fullName = formValues.fullName.trim();
  const phone = formValues.phone.trim();
  const address = formValues.address.trim();

  if (!fullName) {
    formErrors.fullName = "Full name is required.";
  } else if (hasDisallowedControlCharacters(fullName)) {
    formErrors.fullName = "Remove hidden control characters from full name.";
  } else if (angleBracketsPattern.test(fullName)) {
    formErrors.fullName = "Remove angle brackets (< >) from full name.";
  } else if (fullName.length < 2) {
    formErrors.fullName = "Full name must be at least 2 characters.";
  } else if (fullName.length > 80) {
    formErrors.fullName = "Full name must be 80 characters or less.";
  } else if (!unicodeLetterPattern.test(fullName)) {
    formErrors.fullName = "Full name must contain at least one letter.";
  } else if (!fullNameAllowedCharactersPattern.test(fullName)) {
    formErrors.fullName =
      "Use only letters, spaces, apostrophes, periods, or hyphens in full name.";
  }

  if (!phone) {
    formErrors.phone = "Phone number is required.";
  } else if (hasDisallowedControlCharacters(phone)) {
    formErrors.phone = "Remove hidden control characters from phone number.";
  } else if (!phoneAllowedCharactersPattern.test(phone)) {
    formErrors.phone =
      "Use only digits, spaces, +, hyphens, or parentheses in phone number.";
  } else if (getPlusSignCount(phone) > 1) {
    formErrors.phone = "Use only one plus sign in phone number.";
  } else if (phone.includes("+") && !phone.startsWith("+")) {
    formErrors.phone = "Move the plus sign to the beginning of phone number.";
  } else {
    const phoneDigits = getPhoneDigits(phone);

    if (phoneDigits.length < 7) {
      formErrors.phone = "Phone number looks too short.";
    } else if (phoneDigits.length > 15) {
      formErrors.phone = "Phone number looks too long.";
    }
  }

  if (!address) {
    formErrors.address = "Delivery address is required.";
  } else if (hasDisallowedControlCharacters(address)) {
    formErrors.address =
      "Remove hidden control characters from delivery address.";
  } else if (angleBracketsPattern.test(address)) {
    formErrors.address = "Remove angle brackets (< >) from delivery address.";
  } else if (address.length < 5) {
    formErrors.address = "Delivery address must be at least 5 characters.";
  } else if (address.length > 200) {
    formErrors.address = "Delivery address must be 200 characters or less.";
  } else if (!unicodeLetterOrDigitPattern.test(address)) {
    formErrors.address =
      "Delivery address must contain at least one letter or digit.";
  }

  return formErrors;
};
