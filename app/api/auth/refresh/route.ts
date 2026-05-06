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
    access_token?: unknown;
    refreshToken?: unknown;
    refresh_token?: unknown;
    data?: {
      accessToken?: unknown;
      access_token?: unknown;
      refreshToken?: unknown;
      refresh_token?: unknown;
    };
  };

  const snakeCaseTokenName =
    tokenName === "accessToken" ? "access_token" : "refresh_token";
  const token =
    responseData.data?.[tokenName] ??
    responseData.data?.[snakeCaseTokenName] ??
    responseData[tokenName] ??
    responseData[snakeCaseTokenName];

  return typeof token === "string" && token.length > 0 ? token : undefined;
}

function removeTokens(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const responseData = payload as {
    accessToken?: unknown;
    access_token?: unknown;
    refreshToken?: unknown;
    refresh_token?: unknown;
    data?: Record<string, unknown>;
  };

  if (!responseData.data || typeof responseData.data !== "object") {
    const rest = { ...responseData };
    delete rest.accessToken;
    delete rest.access_token;
    delete rest.refreshToken;
    delete rest.refresh_token;

    return rest;
  }

  const data = { ...responseData.data };
  delete data.accessToken;
  delete data.access_token;
  delete data.refreshToken;
  delete data.refresh_token;
  const rest = { ...responseData };
  delete rest.accessToken;
  delete rest.access_token;
  delete rest.refreshToken;
  delete rest.refresh_token;

  return {
    ...rest,
    data,
  };
}

function getObjectKeys(value: unknown) {
  return value && typeof value === "object" ? Object.keys(value) : [];
}

function getDebugToken(value: string | undefined) {
  return value
    ? { present: true, length: value.length, prefix: value.slice(0, 8) }
    : { present: false };
}

function getSetCookieHeaders(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const setCookie = response.headers.get("set-cookie");
  return setCookie ? [setCookie] : [];
}

function getSetCookieNames(setCookieHeaders: string[]) {
  return setCookieHeaders
    .map((setCookie) => setCookie.split(";")[0]?.split("=")[0]?.trim())
    .filter(Boolean);
}

function getTokenFromSetCookie(setCookieHeaders: string[], name: string) {
  for (const setCookie of setCookieHeaders) {
    const [cookiePair] = setCookie.split(";");
    const [rawName, ...rawValue] = cookiePair.trim().split("=");

    if (rawName === name && rawValue.length > 0) {
      return rawValue.join("=");
    }
  }

  return undefined;
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

  console.log("[auth refresh] incoming cookie", {
    hasRefreshCookie: Boolean(refreshToken),
    refreshToken: getDebugToken(refreshToken),
  });

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
      Cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}`,
    },
    body: JSON.stringify({
      refreshToken,
      refresh_token: refreshToken,
    }),
  });
  const data = await upstreamResponse.json().catch(() => null);
  const setCookieHeaders = getSetCookieHeaders(upstreamResponse);
  const nextAccessToken =
    extractToken(data, "accessToken") ??
    getTokenFromSetCookie(setCookieHeaders, ACCESS_COOKIE_NAME);
  const nextRefreshToken =
    extractToken(data, "refreshToken") ??
    getTokenFromSetCookie(setCookieHeaders, REFRESH_COOKIE_NAME);

  console.log("[auth refresh] upstream result", {
    status: upstreamResponse.status,
    topLevelKeys: getObjectKeys(data),
    dataKeys:
      data && typeof data === "object" && "data" in data
        ? getObjectKeys(data.data)
        : [],
    nextAccessToken: getDebugToken(nextAccessToken),
    nextRefreshToken: getDebugToken(nextRefreshToken),
    upstreamSetCookieNames: getSetCookieNames(setCookieHeaders),
    willSetAccessCookie: upstreamResponse.ok && Boolean(nextAccessToken),
    willSetRefreshCookie: upstreamResponse.ok && Boolean(nextRefreshToken),
  });

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
