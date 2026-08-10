import { TokenExpiredError, sign, verify } from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppError } from "../../errors/index.js";
import { UserRole } from "../users/index.js";

type AuthTokenUser = {
  id: string;
  role: UserRole;
};

export type AuthTokenPayload = {
  userId: string;
  role: UserRole;
};

export function createAuthToken(user: AuthTokenUser): string {
  return sign(
    {
      role: user.role,
    },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: "7d",
    },
  );
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  let payload: string | JwtPayload;

  try {
    payload = verify(token, env.jwtSecret);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new AppError("Your session has expired", 401, "TOKEN_EXPIRED");
    }

    throw new AppError("Invalid authentication token", 401, "INVALID_TOKEN");
  }

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new AppError("Invalid authentication token", 401, "INVALID_TOKEN");
  }

  const role = payload.role;

  if (role !== UserRole.User && role !== UserRole.Admin) {
    throw new AppError("Invalid authentication token", 401, "INVALID_TOKEN");
  }

  return {
    userId: payload.sub,
    role,
  };
}
