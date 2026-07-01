import type { ErrorRequestHandler } from "express";

import { AppError } from "../errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
      code: error.code,
    });

    return;
  }

  response.status(500).json({
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
};
