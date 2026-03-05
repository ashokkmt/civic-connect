import { NextResponse } from "next/server";

const TOKEN_COOKIE = "auth_token";

export async function POST(request: Request) {
  const body = await request.json();
  const backendBase = process.env.BACKEND_BASE_URL;

  if (!backendBase) {
    return NextResponse.json(
      { success: false, error: { code: "CONFIG_MISSING", message: "BACKEND_BASE_URL is not set" } },
      { status: 500 }
    );
  }

  const response = await fetch(`${backendBase}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({
    success: false,
    error: { code: "INVALID_RESPONSE", message: "Backend returned invalid JSON" },
  }));

  if (!response.ok || !payload?.success) {
    return NextResponse.json(payload, { status: response.status || 500 });
  }

  const token = payload?.data?.token as string | undefined;
  const next = NextResponse.json(payload, { status: 200 });

  if (token) {
    next.cookies.set({
      name: TOKEN_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return next;
}
