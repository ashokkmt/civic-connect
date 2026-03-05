import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type MeResponse = {
  success: boolean;
  data?: { user?: { role?: string; authoritySubRole?: string } };
};

function roleRedirectUrl(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  return url;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard/forbidden")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.redirect(roleRedirectUrl(request, "/login"));
  }

  if (pathname === "/dashboard") {
    return NextResponse.next();
  }

  const meResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
  });

  const payload = (await meResponse.json()) as MeResponse;
  const role = payload.data?.user?.role;
  const subRole = payload.data?.user?.authoritySubRole;

  if (pathname.startsWith("/dashboard/citizen") && role !== "CITIZEN") {
    return NextResponse.redirect(roleRedirectUrl(request, "/dashboard/forbidden"));
  }

  if (pathname.startsWith("/dashboard/head")) {
    const isHead = role === "AUTHORITY" && subRole === "HEAD";
    if (!isHead) {
      return NextResponse.redirect(roleRedirectUrl(request, "/dashboard/forbidden"));
    }
  }

  if (pathname.startsWith("/dashboard/worker")) {
    const isWorker = role === "AUTHORITY" && subRole === "WORKER";
    if (!isWorker) {
      return NextResponse.redirect(roleRedirectUrl(request, "/dashboard/forbidden"));
    }
  }

  if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
    return NextResponse.redirect(roleRedirectUrl(request, "/dashboard/forbidden"));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
