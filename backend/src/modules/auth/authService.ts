import * as bcrypt from "bcrypt";

import { pool } from "../../db/index.js";
import { AppError } from "../../errors/index.js";
import { mapUserRowToUser } from "../users/userMapper.js";
import { UserRole, type User, type UserDbRow } from "../users/userTypes.js";

import type { LoginInput, RegisterInput } from "./authSchema.js";
import { createAuthToken } from "./authToken.js";

const PASSWORD_HASH_ROUNDS = 10;
const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

export type AuthResult = {
  token: string;
  user: User;
};

const isUniqueViolation = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === POSTGRES_UNIQUE_VIOLATION_CODE
  );
};

export async function loginUser(input: LoginInput): Promise<AuthResult> {
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

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);

  try {
    const result = await pool.query<UserDbRow>(
      `
        INSERT INTO users (
          name,
          email,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          name,
          email,
          password_hash,
          role,
          created_at,
          updated_at;
      `,
      [input.name, input.email, passwordHash, UserRole.User],
    );

    const userRow = result.rows[0];

    if (userRow === undefined) {
      throw new Error("The database did not return the created user.");
    }

    const user = mapUserRowToUser(userRow);
    const token = createAuthToken(user);

    return {
      token,
      user,
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
    }

    throw error;
  }
}
