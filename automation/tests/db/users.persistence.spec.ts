import { randomUUID } from "node:crypto";

import type { APIRequestContext } from "@playwright/test";

import { expect, test } from "../../src/fixtures";
import type { AuthResponse } from "../../src/types";

type UserPersistenceRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
  updated_at: Date;
};

type UserPasswordHashRow = {
  passwordHash: string;
};

const PLAINTEXT_PASSWORD = "Password123!";

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

async function registerUserWithPasswordViaApi(
  request: APIRequestContext,
  name: string,
  password: string,
): Promise<AuthResponse> {
  const response = await request.post("/auth/register", {
    data: {
      name,
      email: `password-storage-${randomUUID()}@test.com`,
      password,
    },
  });

  if (response.status() !== 201) {
    throw new Error(`User setup failed: expected status 201, received ${response.status()}`);
  }

  return (await response.json()) as AuthResponse;
}

test.describe("User persistence", () => {
  // The API cannot show how passwords are stored.
  // SELECT * is intentional: it catches extra columns,
  // including a plaintext password column.
  // A valid new column will require this test to be updated.
  test("password storage: stores only the bcrypt hash, never plaintext", async ({
    request,
    dbPool,
  }) => {
    const registeredUser = await registerUserWithPasswordViaApi(
      request,
      "Password Storage User",
      PLAINTEXT_PASSWORD,
    );

    const userResult = await dbPool.query<UserPersistenceRow>(
      `
        SELECT *
        FROM users
        WHERE id = $1;
      `,
      [registeredUser.user.id],
    );

    expect(userResult.rows).toEqual([
      {
        id: registeredUser.user.id,
        name: registeredUser.user.name,
        email: registeredUser.user.email,
        password_hash: expect.stringMatching(BCRYPT_HASH_PATTERN),
        role: "user",
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      },
    ]);
  });

  // The API never returns password hashes, so it cannot show whether users share
  // one bcrypt salt. The same password must produce different hashes for
  // different users.
  test("same password: stores different bcrypt hashes for different users", async ({
    request,
    dbPool,
  }) => {
    const firstRegisteredUser = await registerUserWithPasswordViaApi(
      request,
      "First Salt User",
      PLAINTEXT_PASSWORD,
    );

    const secondRegisteredUser = await registerUserWithPasswordViaApi(
      request,
      "Second Salt User",
      PLAINTEXT_PASSWORD,
    );

    const registeredUserIds = [firstRegisteredUser.user.id, secondRegisteredUser.user.id];

    const passwordHashResult = await dbPool.query<UserPasswordHashRow>(
      `
        SELECT
          password_hash AS "passwordHash"
        FROM users
        WHERE id = ANY($1::uuid[]);
      `,
      [registeredUserIds],
    );

    expect(passwordHashResult.rows).toHaveLength(2);

    const storedPasswordHashes = passwordHashResult.rows.map(({ passwordHash }) => passwordHash);

    // Set size 2 means the same password produced two different bcrypt hashes.
    expect(new Set(storedPasswordHashes).size).toBe(2);
  });
});
