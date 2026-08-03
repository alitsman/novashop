import type { TestAccount } from "../types";

// These accounts intentionally mirror frontend/src/data/mockUsers.ts.
// Automation does not import frontend implementation files, so changes
// to the application's mock users must be reflected here.
export const REGULAR_USER: TestAccount = {
  user: {
    id: "user-1",
    name: "Regular User",
    email: "user@test.com",
    role: "user",
  },
  password: "user123",
};

export const ADMIN_USER: TestAccount = {
  user: {
    id: "user-2",
    name: "Admin User",
    email: "admin@test.com",
    role: "admin",
  },
  password: "admin123",
};
