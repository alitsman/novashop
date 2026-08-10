export const UserRole = {
  User: "user",
  Admin: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type SeedUserData = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type UserDbRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
};

export type UserInsertData = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
};
