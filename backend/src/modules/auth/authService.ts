import * as bcrypt from "bcrypt";

import { pool } from "../../db/index.js";
import { AppError } from "../../errors/index.js";
import { mapUserRowToUser, type User, type UserDbRow } from "../users/index.js";

import type { LoginInput } from "./authSchema.js";
import { createAuthToken } from "./authToken.js";

export type LoginResult = {
  token: string;
  user: User;
};

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const result = await pool.query<UserDbRow>(
    `
      SELECT
        id,
        name,
        email,
        password_hash,
        role,
        created_at,
        updated_at
      FROM users
      WHERE email = $1;
    `,
    [input.email],
  );

  const userRow = result.rows[0];

  if (userRow === undefined) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await bcrypt.compare(input.password, userRow.password_hash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const user = mapUserRowToUser(userRow);
  const token = createAuthToken(user);

  return {
    token,
    user,
  };
}
