import { env } from "../config/env";
import { authStorage } from "./authStorage";

export class ApiError extends Error {
  readonly statusCode: number | null;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, statusCode: number | null, code: string, details?: unknown) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  requiresAuth?: boolean;
  signal?: AbortSignal;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (!isRecord(value)) {
    return false;
  }

  const error = value.error;

  if (!isRecord(error)) {
    return false;
  }

  return typeof error.code === "string" && typeof error.message === "string";
};

const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${env.apiUrl}${normalizedPath}`;
};

const readResponseBody = async (response: Response): Promise<unknown> => {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
};

const createResponseError = (response: Response, responseBody: unknown): ApiError => {
  if (isApiErrorResponse(responseBody)) {
    return new ApiError(
      responseBody.error.message,
      response.status,
      responseBody.error.code,
      responseBody.error.details,
    );
  }

  return new ApiError(
    `Request failed with status ${response.status}.`,
    response.status,
    "HTTP_ERROR",
  );
};

export const apiRequest = async <ResponseBody>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ResponseBody> => {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.requiresAuth) {
    const token = authStorage.getToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError("Unable to connect to the server.", null, "NETWORK_ERROR");
  }

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw createResponseError(response, responseBody);
  }

  if (response.status === 204) {
    return undefined as ResponseBody;
  }

  if (responseBody === null || typeof responseBody === "string") {
    throw new ApiError(
      "The server returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  return responseBody as ResponseBody;
};
