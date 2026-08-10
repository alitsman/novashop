import type { AuthTokenPayload } from "../modules/auth/index.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export {};
