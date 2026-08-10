import type { SeedUserData, User, UserDbRow, UserInsertData } from "./userTypes.js";

export const mapSeedUserToUserInsertData = (
  user: SeedUserData,
  passwordHash: string,
): UserInsertData => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password_hash: passwordHash,
    role: user.role,
  };
};

export const mapUserRowToUser = (row: UserDbRow): User => {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
};
