import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_SANDBOX_URL?.trim();
const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";
const ACCESS_TOKEN_MAX_AGE_SECONDS = 80 * 60;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function extractToken(payload: unknown, tokenName: "accessToken" | "refreshToken") {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const responseData = payload as {
    accessToken?: unknown;
    refreshToken?: unknown;
    data?: {
      accessToken?: unknown;
      refreshToken?: unknown;
    };
  };

  const token = responseData.data?.[tokenName] ?? responseData[tokenName];

  return typeof token === "string" && token.length > 0 ? token : undefined;
}

function removeTokens(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const responseData = payload as {
    accessToken?: unknown;
    refreshToken?: unknown;
    data?: Record<string, unknown>;
  };

  if (!responseData.data || typeof responseData.data !== "object") {
    const rest = { ...responseData };
    delete rest.accessToken;
    delete rest.refreshToken;

    return rest;
  }

  const data = { ...responseData.data };
  delete data.accessToken;
  delete data.refreshToken;
  const rest = { ...responseData };
  delete rest.accessToken;
  delete rest.refreshToken;

  return {
    ...rest,
    data,
  };
}

function setAuthCookies(
  response: NextResponse,
  accessToken?: string,
  refreshToken?: string,
) {
  if (accessToken) {
    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1",
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
  }

  if (refreshToken) {
    response.cookies.set({
      name: REFRESH_COOKIE_NAME,
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }
}

export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_SANDBOX_URL is not configured" },
      { status: 500 },
    );
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { message: "Refresh token missing" },
      { status: 401 },
    );
  }

  const upstreamResponse = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await upstreamResponse.json().catch(() => null);
  const nextAccessToken = extractToken(data, "accessToken");
  const nextRefreshToken = extractToken(data, "refreshToken");

  const response = NextResponse.json(
    removeTokens(
      data ?? {
        message: upstreamResponse.ok
          ? "Session refreshed"
          : "Session refresh failed",
      },
    ),
    { status: upstreamResponse.status },
  );

  if (upstreamResponse.ok) {
    setAuthCookies(response, nextAccessToken, nextRefreshToken);
  }

  return response;
}
