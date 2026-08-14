import type { AuthUser } from "./test-account";

export type LoginResponse = {
  token: string;
  user: AuthUser;
};
