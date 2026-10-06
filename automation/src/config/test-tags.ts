// Central registry of every test tag supported by NovaShop automation.
//
// Use these constants in tests instead of raw tag strings.
// Feature tags describe the functional capability whose risk a test verifies;
// they are independent of the Playwright layer or project that executes the test.
// Future FEATURE filtering must be derived from this registry, so feature names and tags
// keep a single source of truth.
export const FeatureTag = {
  Auth: "@feature-auth",
  Shell: "@feature-shell",
  Catalog: "@feature-catalog",
  ProductDetails: "@feature-product-details",
  AddToCart: "@feature-add-to-cart",
  Cart: "@feature-cart",
  Checkout: "@feature-checkout",
  Orders: "@feature-orders",
  AdminProducts: "@feature-admin-products",
  Platform: "@feature-platform",
} as const;

// Suite tags are independent of feature ownership.
// A test can belong to one or more features and optionally to a suite such as smoke.
export const SuiteTag = {
  Smoke: "@suite-smoke",
} as const;
