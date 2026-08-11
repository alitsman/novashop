import type { RequestHandler } from "express";

import type { LoginInput } from "./authSchema.js";
import { loginUser, type LoginResult } from "./authService.js";

export const login: RequestHandler<Record<string, never>, LoginResult, LoginInput> = async (
  request,
  response,
) => {
  const result = await loginUser(request.body);

  response.status(200).json(result);
};
