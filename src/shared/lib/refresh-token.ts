import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_MAX_AGE_SECONDS, AUTH_ROUTES, REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_MAX_AGE_SECONDS } from '@/features/feature/constants/auth.constants';
import type { TokenResponse } from '@/features/feature/types/auth.types';

function resolveApiBaseUrl() {
  return process.env.API_URL?.replace(/\/$/, '') ?? process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000';
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse | null> {
  try {
    const response = await fetch(`${resolveApiBaseUrl()}${AUTH_ROUTES.refresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TokenResponse;
  } catch {
    return null;
  }
}

export function applyAuthCookies(response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } }, tokens: TokenResponse) {
  const secure = process.env.NODE_ENV === 'production';
  const accessMaxAge = tokens.expires_in || ACCESS_TOKEN_MAX_AGE_SECONDS;

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: accessMaxAge,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookiesOnResponse(response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } }) {
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
