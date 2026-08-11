import { expect, test } from "@playwright/test";

import { REGULAR_USER } from "../../src/test-data";
import type { AuthUser } from "../../src/types";

type LoginResponse = {
  token: string;
  user: AuthUser;
};

const JWT_WITH_THREE_NON_EMPTY_BASE64URL_PARTS_SEPARATED_BY_DOTS =
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

test.describe("POST /auth/login", () => {
  test("valid credentials: returns a token and user", async ({ request }) => {
    const response = await request.post("/auth/login", {
      data: {
        email: REGULAR_USER.user.email,
        password: REGULAR_USER.password,
      },
    });

    expect(response.status()).toBe(200);

    const responseBody = (await response.json()) as LoginResponse;
    const { token, ...responseWithoutToken } = responseBody;

    expect(responseWithoutToken).toEqual({
      user: REGULAR_USER.user,
    });
    expect(token).toMatch(
      JWT_WITH_THREE_NON_EMPTY_BASE64URL_PARTS_SEPARATED_BY_DOTS,
    );
  });
});
