import type { RequestHandler } from "express";

import { getCurrentUser } from "./userService.js";

export const getMe: RequestHandler = async (request, response) => {
  const auth = request.auth;

  if (auth === undefined) {
    throw new Error("Authenticated request is missing auth context");
  }

  const user = await getCurrentUser(auth.userId);

  response.status(200).json(user);
};
