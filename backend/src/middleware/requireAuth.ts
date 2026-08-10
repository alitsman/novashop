import type { RequestHandler } from "express";

import { AppError } from "../errors/index.js";
import { verifyAuthToken } from "../modules/auth/index.js";

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorizationHeader = request.get("authorization");

  if (authorizationHeader === undefined) {
    throw new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED");
  }

  const [scheme, token, extraPart] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || token === undefined || extraPart !== undefined) {
    throw new AppError("Invalid authorization header", 401, "INVALID_AUTHORIZATION_HEADER");
  }

  request.auth = verifyAuthToken(token);

  next();
};
