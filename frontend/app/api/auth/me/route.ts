import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "auth_token";

export async function GET() {
  const backendBase = process.env.BACKEND_BASE_URL;

  if (!backendBase) {
    return NextResponse.json(
      { success: false, error: { code: "CONFIG_MISSING", message: "BACKEND_BASE_URL is not set" } },
      { status: 500 }
    );
  }

  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Missing auth token" } },
      { status: 401 }
    );
  }

  const response = await fetch(`${backendBase}/api/v1/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await response.json().catch(() => ({
    success: false,
    error: { code: "INVALID_RESPONSE", message: "Backend returned invalid JSON" },
  }));

  return NextResponse.json(payload, { status: response.status || 500 });
}
