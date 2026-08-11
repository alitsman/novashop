import type { RequestHandler } from "express";

import { AppError } from "../errors/index.js";
import { UserRole } from "../modules/users/userTypes.js";

export function requireRole(requiredRole: UserRole): RequestHandler {
  return (request, _response, next) => {
    if (request.auth === undefined) {
      throw new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED");
    }

    if (request.auth.role !== requiredRole) {
      throw new AppError("You do not have permission to perform this action", 403, "FORBIDDEN");
    }

    next();
  };
}
