import type { RequestHandler } from "express";

import type { LoginInput, RegisterInput } from "./authSchema.js";
import { loginUser, registerUser, type AuthResult } from "./authService.js";

export const login: RequestHandler<Record<string, never>, AuthResult, LoginInput> = async (
  request,
  response,
) => {
  const result = await loginUser(request.body);

  response.status(200).json(result);
};

export const register: RequestHandler<Record<string, never>, AuthResult, RegisterInput> = async (
  request,
  response,
) => {
  const result = await registerUser(request.body);

  response.status(201).json(result);
};
