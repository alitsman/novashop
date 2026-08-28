import jsonwebtoken from "jsonwebtoken";

import type { UserRole } from "../types";

type CreateTestAuthTokenOptions = {
  sub: string;
  role?: UserRole;

  // Negative values create an already-expired token for TOKEN_EXPIRED tests.
  expiresInSeconds?: number;
  secret?: string;

  // HS256 matches the backend; HS512 exists only to test algorithm pinning.
  algorithm?: "HS256" | "HS512";
};

/**
 * Creates controlled JWT variants that the public login endpoint cannot issue.
 * Use it for authentication-boundary tests, not for login happy paths.
 */
export const createTestAuthToken = ({
  sub,
  role,
  expiresInSeconds = 300,
  secret,
  algorithm = "HS256",
}: CreateTestAuthTokenOptions): string => {
  const jwtSecret = secret ?? process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required to create a test authentication token");
  }

  // Omitting role creates a correctly signed token that reaches backend claim validation.
  const payload = role === undefined ? {} : { role };

  return jsonwebtoken.sign(payload, jwtSecret, {
    algorithm,
    subject: sub,
    expiresIn: expiresInSeconds,
  });
};
