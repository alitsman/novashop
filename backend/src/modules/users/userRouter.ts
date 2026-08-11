import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { getMe } from "./userController.js";

export const userRouter = Router();

userRouter.get("/me", requireAuth, getMe);
