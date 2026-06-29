import { mockUsers, type MockUserWithPassword } from "../data/mockUsers";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
} from "../types/auth";
import type { User } from "../types/user";
import { UserRole } from "../types/user";
import { storage } from "../utils/storage";
import { delay } from "../utils/delay";

const AUTH_TOKEN_STORAGE_KEY = "novashop-auth-token";
const AUTH_USER_STORAGE_KEY = "novashop-auth-user";
const AUTH_USERS_STORAGE_KEY = "novashop-auth-users";

const createAuthToken = (userId: string): string => {
  return `mock-token-${userId}-${crypto.randomUUID()}`;
};

const createUserId = (): string => {
  return `user-${crypto.randomUUID()}`;
};

const getStoredAuthUsers = (): MockUserWithPassword[] => {
  return storage.getItem<MockUserWithPassword[]>(
    AUTH_USERS_STORAGE_KEY,
    mockUsers,
  );
};

const saveStoredAuthUsers = (users: MockUserWithPassword[]): void => {
  storage.setItem<MockUserWithPassword[]>(AUTH_USERS_STORAGE_KEY, users);
};

const mapMockUserToUser = (mockUser: MockUserWithPassword): User => {
  return {
    id: mockUser.id,
    name: mockUser.name,
    email: mockUser.email,
    role: mockUser.role,
  };
};

const saveAuthResponse = (authResponse: AuthResponse): void => {
  storage.setItem<string>(AUTH_TOKEN_STORAGE_KEY, authResponse.token);
  storage.setItem<User>(AUTH_USER_STORAGE_KEY, authResponse.user);
};

export const authService = {
  restoreAuthFromStorage(): AuthResponse | null {
    const token = storage.getItem<string | null>(AUTH_TOKEN_STORAGE_KEY, null);
    const user = storage.getItem<User | null>(AUTH_USER_STORAGE_KEY, null);

    if (!token || !user) {
      return null;
    }

    return {
      user,
      token,
    };
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay();

    const authUsers = getStoredAuthUsers();
    const normalizedEmail = credentials.email.trim().toLowerCase();

    const mockUser = authUsers.find((user) => {
      return user.email.toLowerCase() === normalizedEmail;
    });

    if (!mockUser) {
      throw new Error("User not found");
    }

    if (mockUser.password !== credentials.password) {
      throw new Error("Invalid password");
    }

    const user = mapMockUserToUser(mockUser);

    const authResponse: AuthResponse = {
      user,
      token: createAuthToken(user.id),
    };

    saveAuthResponse(authResponse);

    return authResponse;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    await delay();

    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const authUsers = getStoredAuthUsers();
    const normalizedEmail = data.email.trim().toLowerCase();

    const emailAlreadyExists = authUsers.some((user) => {
      return user.email.toLowerCase() === normalizedEmail;
    });

    if (emailAlreadyExists) {
      throw new Error("Email already exists");
    }

    const newMockUser: MockUserWithPassword = {
      id: createUserId(),
      name: data.name.trim(),
      email: normalizedEmail,
      password: data.password,
      role: UserRole.User,
    };

    const updatedAuthUsers = [...authUsers, newMockUser];

    saveStoredAuthUsers(updatedAuthUsers);

    const user = mapMockUserToUser(newMockUser);

    const authResponse: AuthResponse = {
      user,
      token: createAuthToken(user.id),
    };

    saveAuthResponse(authResponse);

    return authResponse;
  },

  async logout(): Promise<void> {
    await delay();

    storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    storage.removeItem(AUTH_USER_STORAGE_KEY);
  },
};
