import type { ErrorRequestHandler } from "express";

import { AppError } from "../errors/index.js";

const getErrorType = (error: unknown): unknown => {
  return typeof error === "object" && error !== null && "type" in error ? error.type : undefined;
};

// Registered right after express.json(), so it receives only errors from body parsing.
// It turns client mistakes into 4xx AppErrors; any other error goes on unchanged.
export const jsonBodyErrorHandler: ErrorRequestHandler = (error, _request, _response, next) => {
  const errorType = getErrorType(error);

  if (errorType === "entity.parse.failed") {
    next(new AppError("Request body must be valid JSON", 400, "INVALID_JSON"));
    return;
  }

  if (errorType === "entity.too.large") {
    next(new AppError("Request body is too large", 413, "PAYLOAD_TOO_LARGE"));
    return;
  }

  next(error);
};
