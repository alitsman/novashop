import type { AuthUser } from "./test-account";

export type AuthResponse = {
  token: string;
  user: AuthUser;
};
