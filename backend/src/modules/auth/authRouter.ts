import { Router } from "express";

import { validateRequest } from "../../middleware/index.js";

import { login } from "./authController.js";
import { loginSchema } from "./authSchema.js";

export const authRouter = Router();

authRouter.post("/login", validateRequest(loginSchema), login);
