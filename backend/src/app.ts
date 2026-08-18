import cors from "cors";
import express from "express";

import { checkDbConnection } from "./db/index.js";
import { errorHandler, notFoundHandler } from "./middleware/index.js";

import { authRouter } from "./modules/auth/index.js";
import { productRouter } from "./modules/products/index.js";
import { userRouter } from "./modules/users/index.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "novashop-backend",
  });
});

app.get("/health/db", async (_request, response, next) => {
  try {
    await checkDbConnection();

    response.json({
      status: "ok",
      service: "novashop-backend",
      database: "connected",
    });
  } catch (error) {
    next(error);
  }
});

app.use("/auth", authRouter);
app.use("/products", productRouter);
app.use(userRouter);

app.use(notFoundHandler);
app.use(errorHandler);
