import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_SANDBOX_URL?.trim();
const BOND_APP_ID = process.env.BOND_APP_ID?.trim();
const BOND_APP_SECRET = process.env.BOND_APP_SECRET?.trim();

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

function mergeCookieHeaders(
  currentCookieHeader: string | null,
  setCookieHeaders: string[],
) {
  const cookieMap = new Map<string, string>();

  for (const cookie of currentCookieHeader?.split(";") ?? []) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (!rawName || rawValue.length === 0) {
      continue;
    }

    cookieMap.set(rawName, rawValue.join("="));
  }

  for (const setCookie of setCookieHeaders) {
    const [cookiePair] = setCookie.split(";");
    const [rawName, ...rawValue] = cookiePair.trim().split("=");

    if (!rawName || rawValue.length === 0) {
      continue;
    }

    cookieMap.set(rawName, rawValue.join("="));
  }

  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function performAirtimeRequest(
  payload: unknown,
  cookieHeader: string | null,
) {
  return fetch(`${API_URL}/bills/airtime`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "app-id": BOND_APP_ID!,
      "app-secret": BOND_APP_SECRET!,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
}

export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_SANDBOX_URL is not configured" },
      { status: 500 },
    );
  }

  if (!BOND_APP_ID || !BOND_APP_SECRET) {
    return NextResponse.json(
      { message: "Bond credentials are not configured" },
      { status: 500 },
    );
  }

  const cookieHeader = request.headers.get("cookie");
  const payload = await request.json();

  try {
    let response = await performAirtimeRequest(payload, cookieHeader);
    const responseSetCookies: string[] = [];

    if (response.status === 401) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      });

      const refreshSetCookies = getSetCookieHeaders(refreshResponse);
      responseSetCookies.push(...refreshSetCookies);

      if (refreshResponse.ok) {
        const nextCookieHeader = mergeCookieHeaders(
          cookieHeader,
          refreshSetCookies,
        );
        response = await performAirtimeRequest(payload, nextCookieHeader);
      }
    }

    const data = await response.json().catch(() => null);
    const nextResponse = NextResponse.json(
      data ?? {
        message: response.ok
          ? "Airtime request completed"
          : "Airtime request failed",
      },
      { status: response.status },
    );

    for (const setCookie of responseSetCookies) {
      nextResponse.headers.append("set-cookie", setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error("Airtime proxy error:", error);

    return NextResponse.json(
      { message: "Unable to reach airtime service" },
      { status: 502 },
    );
  }
}
