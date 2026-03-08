import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "auth_token";

export async function GET(request: Request) {
  const backendBase = process.env.BACKEND_BASE_URL;

  if (!backendBase) {
    return NextResponse.json(
      { success: false, error: { code: "CONFIG_MISSING", message: "BACKEND_BASE_URL is not set" } },
      { status: 500 }
    );
  }

  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Missing auth token" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();
  const limit = searchParams.get("limit");
  if (limit) {
    query.set("limit", limit);
  }

  try {
    const response = await fetch(`${backendBase}/api/v1/authority/issues?${query.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const requestId = response.headers.get("X-Request-Id") ?? undefined;
    const payload = await response.json().catch(() => ({
      success: false,
      error: { code: "INVALID_RESPONSE", message: "Backend returned invalid JSON" },
    }));

    return NextResponse.json(requestId ? { ...payload, requestId } : payload, {
      status: response.status || 500,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "BACKEND_UNAVAILABLE", message: "Backend is unreachable" } },
      { status: 503 }
    );
  }
}
