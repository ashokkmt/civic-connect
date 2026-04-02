import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "auth_token";

type BackendResult = {
  response: Response;
  payload: any;
};

async function fetchBackend(url: string, token: string): Promise<BackendResult> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({
    success: false,
    error: { code: "INVALID_RESPONSE", message: "Backend returned invalid JSON" },
  }));

  return { response, payload };
}

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
  const limit = searchParams.get("limit") ?? "100";

  try {
    const [issuesResult, profileResult] = await Promise.all([
      fetchBackend(`${backendBase}/api/v1/authority/issues?limit=${encodeURIComponent(limit)}`, token),
      fetchBackend(`${backendBase}/api/v1/me`, token),
    ]);

    if (!issuesResult.response.ok) {
      return NextResponse.json(issuesResult.payload, { status: issuesResult.response.status || 500 });
    }

    const items = (issuesResult.payload?.data?.items ?? []) as Array<{ status?: string }>;
    const stats = {
      total: items.length,
      assigned: items.filter((item) => item.status === "ASSIGNED").length,
      inProgress: items.filter((item) => item.status === "IN_PROGRESS").length,
      resolved: items.filter((item) => item.status === "RESOLVED").length,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          profile: profileResult.response.ok ? profileResult.payload?.data?.user ?? null : null,
          issues: items,
          stats,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "BACKEND_UNAVAILABLE", message: "Backend is unreachable" } },
      { status: 503 }
    );
  }
}
