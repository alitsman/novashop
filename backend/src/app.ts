import cors from "cors";
import express from "express";

import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "novashop-backend",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);
