import "server-only";

import {
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from "@/shared/lib/auth-cookies";
import { ApiError } from "@/shared/lib/errors";
import { verifyAccessToken } from "@/shared/lib/jwt";
import { refreshAccessToken } from "@/shared/lib/refresh-token";

function resolveApiBaseUrl() {
  const fromEnv = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  return fromEnv?.replace(/\/$/, "") ?? "http://localhost:8000";
}

type RequestOptions = {
  headers?: HeadersInit;
  body?: unknown;
  cache?: RequestCache;
  auth?: boolean;
};

async function getAuthorizationHeader(): Promise<HeadersInit> {
  const accessToken = await getAccessTokenFromCookies();
  if (accessToken && (await verifyAccessToken(accessToken))) {
    return { Authorization: `Bearer ${accessToken}` };
  }

  const refreshToken = await getRefreshTokenFromCookies();
  if (!refreshToken) {
    return {};
  }

  const tokens = await refreshAccessToken(refreshToken);
  if (!tokens) {
    return {};
  }

  await setAuthCookies(tokens);
  return { Authorization: `Bearer ${tokens.access_token}` };
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const data = (await response.json()) as {
      error?: { code?: string; message?: string };
      detail?: string | Array<{ msg?: string }>;
    };

    if (data.error?.message) {
      return new ApiError(data.error.message, response.status, data.error.code ?? "request_failed");
    }

    if (typeof data.detail === "string") {
      return new ApiError(data.detail, response.status);
    }

    if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      return new ApiError(data.detail[0].msg, response.status);
    }
  } catch {
    // Fall through to status text.
  }

  return new ApiError(
    response.statusText || `Request failed with status ${response.status}`,
    response.status,
  );
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const authHeaders = options.auth === false ? {} : await getAuthorizationHeader();

  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Server-only HTTP client. Attaches Bearer token from httpOnly cookies. */
export const serverApiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
