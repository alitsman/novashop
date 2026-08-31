import { ApiError } from "../../services/apiClient";
import { sessionExpired } from "./authSlice";

export const handleRequestError = (
  error: unknown,
  fallbackMessage: string,
  {
    dispatch,
    sessionToken,
  }: {
    dispatch: (action: ReturnType<typeof sessionExpired>) => void;
    sessionToken: string | null;
  },
): string => {
  if (error instanceof ApiError && error.statusCode === 401) {
    dispatch(sessionExpired(sessionToken));
  }

  return error instanceof Error ? error.message : fallbackMessage;
};
