import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_SANDBOX_URL?.trim();
const BOND_APP_ID = process.env.BOND_APP_ID?.trim();
const BOND_APP_SECRET = process.env.BOND_APP_SECRET?.trim();

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

  const authorization = request.headers.get("authorization");
  const payload = await request.json();

  try {
    const response = await fetch(`${API_URL}/bills/airtime`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "app-id": BOND_APP_ID,
        "app-secret": BOND_APP_SECRET,
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json(
      data ?? {
        message: response.ok
          ? "Airtime request completed"
          : "Airtime request failed",
      },
      { status: response.status },
    );
  } catch (error) {
    console.error("Airtime proxy error:", error);

    return NextResponse.json(
      { message: "Unable to reach airtime service" },
      { status: 502 },
    );
  }
}
