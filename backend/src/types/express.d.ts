import type { AuthTokenPayload } from "../modules/auth/authToken.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export {};
