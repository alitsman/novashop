import type { User } from "./user";

export const AuthRequestStatus = {
  Idle: "idle",
  Loading: "loading",
  Succeeded: "succeeded",
  Failed: "failed",
} as const;

export type AuthRequestStatus =
  (typeof AuthRequestStatus)[keyof typeof AuthRequestStatus];

export type AuthState = {
  user: User | null;
  token: string | null;
  status: AuthRequestStatus;
  error: string | null;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};
