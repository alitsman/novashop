import type { User } from "../types/user";
import { UserRole } from "../types/user";

export type MockUserWithPassword = User & {
  password: string;
};

export const mockUsers: MockUserWithPassword[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Admin User",
    email: "admin@test.com",
    password: "admin123",
    role: UserRole.Admin,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Regular User",
    email: "user@test.com",
    password: "user123",
    role: UserRole.User,
  },
];
