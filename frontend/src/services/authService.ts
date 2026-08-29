import type { AuthResponse, LoginCredentials, RegisterData } from "../types/auth";
import type { User } from "../types/user";
import { ApiError, apiRequest } from "./apiClient";
import { authStorage } from "./authStorage";

type RegisterRequest = Pick<RegisterData, "name" | "email" | "password">;

const saveAuthResponse = (authResponse: AuthResponse): void => {
  authStorage.setToken(authResponse.token);
  authStorage.clearLegacyAuthData();
};

export const authService = {
  async restoreAuthFromStorage(): Promise<AuthResponse | null> {
    authStorage.clearLegacyAuthData();

    const token = authStorage.getToken();

    if (!token) {
      return null;
    }

    try {
      const user = await apiRequest<User>("/me", {
        requiresAuth: true,
      });

      return {
        user,
        token,
      };
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        authStorage.clearSession();

        return null;
      }

      throw error;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const authResponse = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: credentials,
    });

    saveAuthResponse(authResponse);

    return authResponse;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const registerRequest: RegisterRequest = {
      name: data.name,
      email: data.email,
      password: data.password,
    };

    const authResponse = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: registerRequest,
    });

    saveAuthResponse(authResponse);

    return authResponse;
  },

  logout(): void {
    authStorage.clearSession();
  },
};
