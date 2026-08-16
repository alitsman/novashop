import { Router } from "express";

import { validateRequest } from "../../middleware/index.js";

import { login, register } from "./authController.js";
import { loginSchema, registerSchema } from "./authSchema.js";

export const authRouter = Router();

authRouter.post("/login", validateRequest(loginSchema), login);
authRouter.post("/register", validateRequest(registerSchema), register);
