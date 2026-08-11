import type { RequestHandler } from "express";

import { AppError } from "../errors/index.js";
import { verifyAuthToken } from "../modules/auth/authToken.js";

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorizationHeader = request.get("authorization");

  if (authorizationHeader === undefined) {
    throw new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED");
  }

  const [scheme, token, extraPart] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || token === undefined || extraPart !== undefined) {
    throw new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED");
  }

  request.auth = verifyAuthToken(token);

  next();
};
