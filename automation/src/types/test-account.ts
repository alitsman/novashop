export type UserRole = "user" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type TestAccount = {
  user: AuthUser;
  password: string;
};

/**
 * Test data for an account that has not been registered yet.
 * The database assigns the id and the server assigns the role.
 */
export type NewAccount = {
  user: Omit<AuthUser, "id" | "role">;
  password: string;
};
