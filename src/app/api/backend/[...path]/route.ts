import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/features/feature/constants/auth.constants';
import { verifyAccessToken } from '@/shared/lib/jwt';
import { applyAuthCookies, clearAuthCookiesOnResponse, refreshAccessToken } from '@/shared/lib/refresh-token';

function resolveApiBaseUrl() {
  return process.env.API_URL?.replace(/\/$/, '') ?? process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000';
}

async function resolveAccessToken(): Promise<{
  token: string | null;
  refreshed: Awaited<ReturnType<typeof refreshAccessToken>>;
}> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value ?? null;

  if (accessToken && (await verifyAccessToken(accessToken))) {
    return { token: accessToken, refreshed: null };
  }

  if (!refreshToken) {
    return { token: null, refreshed: null };
  }

  const refreshed = await refreshAccessToken(refreshToken);
  return { token: refreshed?.access_token ?? null, refreshed };
}

async function proxy(request: NextRequest, pathParts: string[]) {
  const targetPath = `/${pathParts.join('/')}${request.nextUrl.search}`;
  const { token, refreshed } = await resolveAccessToken();

  if (!token) {
    const response = NextResponse.json({ error: { code: 'unauthorized', message: 'Not authenticated' } }, { status: 401 });
    clearAuthCookiesOnResponse(response);
    return response;
  }

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }
  headers.set('authorization', `Bearer ${token}`);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const upstream = await fetch(`${resolveApiBaseUrl()}${targetPath}`, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: 'no-store',
  });

  const responseBody = await upstream.arrayBuffer();
  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });

  if (refreshed) {
    applyAuthCookies(response, refreshed);
  }

  return response;
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
