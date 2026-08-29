import { storage } from "../utils/storage";

const AUTH_TOKEN_STORAGE_KEY = "novashop-auth-token";
const LEGACY_AUTH_USER_STORAGE_KEY = "novashop-auth-user";
const LEGACY_AUTH_USERS_STORAGE_KEY = "novashop-auth-users";

const clearToken = (): void => {
  storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

const clearLegacyAuthData = (): void => {
  storage.removeItem(LEGACY_AUTH_USER_STORAGE_KEY);
  storage.removeItem(LEGACY_AUTH_USERS_STORAGE_KEY);
};

export const authStorage = {
  getToken(): string | null {
    return storage.getItem<string | null>(AUTH_TOKEN_STORAGE_KEY, null);
  },

  setToken(token: string): void {
    storage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  },

  clearToken,

  clearLegacyAuthData,

  clearSession(): void {
    clearToken();
    clearLegacyAuthData();
  },
};
