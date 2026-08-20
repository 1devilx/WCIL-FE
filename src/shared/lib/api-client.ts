import { ApiError } from "@/shared/lib/errors";

type RequestOptions = {
  headers?: HeadersInit;
  body?: unknown;
  cache?: RequestCache;
  auth?: boolean;
};

/**
 * Browser HTTP client.
 * Authenticated calls go through the Next.js BFF (`/api/backend/...`)
 * so the httpOnly access token never touches JavaScript.
 */
function resolveBrowserBaseUrl(auth: boolean) {
  if (!auth) {
    return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
  }
  return "/api/backend";
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
  const useAuth = options.auth !== false;
  const base = resolveBrowserBaseUrl(useAuth);

  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache ?? "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
