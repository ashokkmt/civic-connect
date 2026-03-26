import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

const TOKEN_COOKIE = "auth_token";

async function proxy(request: Request, params: Params, method: "GET" | "PATCH" | "DELETE") {
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

  const { id } = await params.params;
  let body: unknown = undefined;
  if (method === "PATCH") {
    body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Invalid request body" } },
        { status: 400 }
      );
    }
  }

  try {
    const response = await fetch(`${backendBase}/api/v1/head/workers/${id}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "PATCH" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "PATCH" ? { body: JSON.stringify(body) } : {}),
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

export async function GET(request: Request, params: Params) {
  return proxy(request, params, "GET");
}

export async function PATCH(request: Request, params: Params) {
  return proxy(request, params, "PATCH");
}

export async function DELETE(request: Request, params: Params) {
  return proxy(request, params, "DELETE");
}
