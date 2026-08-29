import type { TestAccount } from "../types";

// These accounts intentionally mirror backend/seed-data/users.json.
// Automation does not import application implementation files, so changes
// to the seeded accounts must be reflected here.
export const ADMIN_USER: TestAccount = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Admin User",
    email: "admin@test.com",
    role: "admin",
  },
  password: "Admin123!",
};

export const REGULAR_USER: TestAccount = {
  user: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Regular User",
    email: "user@test.com",
    role: "user",
  },
  password: "User123!",
};
