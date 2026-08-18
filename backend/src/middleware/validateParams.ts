import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { AppError } from "../errors/index.js";

export const validateParams = (schema: ZodType): RequestHandler => {
  return (request, _response, next) => {
    const result = schema.safeParse(request.params);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));

      next(new AppError("Request validation failed", 400, "VALIDATION_ERROR", details));

      return;
    }

    request.params = result.data as typeof request.params;
    next();
  };
};
