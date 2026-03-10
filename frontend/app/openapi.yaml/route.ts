import { NextResponse } from "next/server";

export async function GET() {
  const backendBase = process.env.BACKEND_BASE_URL;

  if (!backendBase) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONFIG_MISSING",
          message: "BACKEND_BASE_URL is not set",
        },
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${backendBase}/openapi.yaml`, {
      method: "GET",
      cache: "no-store",
    });

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": "application/yaml; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "Backend is unreachable",
        },
      },
      { status: 503 }
    );
  }
}
