import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type { RootState } from "../../app/store";
import { authService } from "../../services/authService";
import type {
  AuthResponse,
  AuthState,
  LoginCredentials,
  RegisterData,
} from "../../types/auth";
import { AuthRequestStatus } from "../../types/auth";

const initialState: AuthState = {
  user: null,
  token: null,
  status: AuthRequestStatus.Idle,
  error: null,
};

export const restoreAuth = createAsyncThunk<AuthResponse | null, void>(
  "auth/restoreAuth",
  async () => {
    return authService.restoreAuthFromStorage();
  },
);

export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }

    return rejectWithValue("Failed to login");
  }
});

export const registerUser = createAsyncThunk<
  AuthResponse,
  RegisterData,
  { rejectValue: string }
>("auth/registerUser", async (data, { rejectWithValue }) => {
  try {
    return await authService.register(data);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }

    return rejectWithValue("Failed to register");
  }
});

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }

      return rejectWithValue("Failed to logout");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(authState) {
      authState.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreAuth.fulfilled, (authState, action) => {
        if (!action.payload) {
          authState.user = null;
          authState.token = null;
          authState.status = AuthRequestStatus.Idle;
          authState.error = null;
          return;
        }

        authState.user = action.payload.user;
        authState.token = action.payload.token;
        authState.status = AuthRequestStatus.Succeeded;
        authState.error = null;
      })
      .addCase(loginUser.pending, (authState) => {
        authState.status = AuthRequestStatus.Loading;
        authState.error = null;
      })
      .addCase(loginUser.fulfilled, (authState, action) => {
        authState.user = action.payload.user;
        authState.token = action.payload.token;
        authState.status = AuthRequestStatus.Succeeded;
        authState.error = null;
      })
      .addCase(loginUser.rejected, (authState, action) => {
        authState.user = null;
        authState.token = null;
        authState.status = AuthRequestStatus.Failed;
        authState.error = action.payload ?? "Failed to login";
      })
      .addCase(registerUser.pending, (authState) => {
        authState.status = AuthRequestStatus.Loading;
        authState.error = null;
      })
      .addCase(registerUser.fulfilled, (authState, action) => {
        authState.user = action.payload.user;
        authState.token = action.payload.token;
        authState.status = AuthRequestStatus.Succeeded;
        authState.error = null;
      })
      .addCase(registerUser.rejected, (authState, action) => {
        authState.user = null;
        authState.token = null;
        authState.status = AuthRequestStatus.Failed;
        authState.error = action.payload ?? "Failed to register";
      })
      .addCase(logoutUser.pending, (authState) => {
        authState.status = AuthRequestStatus.Loading;
        authState.error = null;
      })
      .addCase(logoutUser.fulfilled, (authState) => {
        authState.user = null;
        authState.token = null;
        authState.status = AuthRequestStatus.Idle;
        authState.error = null;
      })
      .addCase(logoutUser.rejected, (authState, action) => {
        authState.status = AuthRequestStatus.Failed;
        authState.error = action.payload ?? "Failed to logout";
      });
  },
});

export const selectCurrentUser = (rootState: RootState) => rootState.auth.user;
export const selectAuthToken = (rootState: RootState) => rootState.auth.token;
export const selectAuthStatus = (rootState: RootState) => rootState.auth.status;
export const selectAuthError = (rootState: RootState) => rootState.auth.error;

export const selectIsAuthenticated = (rootState: RootState) => {
  return Boolean(rootState.auth.user && rootState.auth.token);
};

export const { clearAuthError } = authSlice.actions;

export const authReducer = authSlice.reducer;
