import { pool } from "../../db/index.js";
import { AppError } from "../../errors/index.js";
import { mapUserRowToUser } from "./userMapper.js";
import type { User, UserDbRow } from "./userTypes.js";

export async function getCurrentUser(userId: string): Promise<User> {
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
        WHERE id = $1;
      `,
    [userId],
  );

  const userRow = result.rows[0];

  if (userRow === undefined) {
    throw new AppError("Invalid authentication token", 401, "INVALID_TOKEN");
  }

  return mapUserRowToUser(userRow);
}
