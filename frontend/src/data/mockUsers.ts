import type { User } from "../types/user";
import { UserRole } from "../types/user";

export type MockUserWithPassword = User & {
  password: string;
};

export const mockUsers: MockUserWithPassword[] = [
  {
    id: "user-1",
    name: "Regular User",
    email: "user@test.com",
    password: "user123",
    role: UserRole.User,
  },
  {
    id: "user-2",
    name: "Admin User",
    email: "admin@test.com",
    password: "admin123",
    role: UserRole.Admin,
  },
];
