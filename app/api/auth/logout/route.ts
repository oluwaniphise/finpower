import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_SANDBOX_URL?.trim();
const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

export async function POST() {
  if (API_URL) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
    }).catch(() => null);
  }

  const response = NextResponse.json({ message: "logged out" });

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1",
    maxAge: 0,
  });

  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
