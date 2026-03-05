import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const backendBase = process.env.BACKEND_BASE_URL;

  if (!backendBase) {
    return NextResponse.json(
      { success: false, error: { code: "CONFIG_MISSING", message: "BACKEND_BASE_URL is not set" } },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radiusMeters = searchParams.get("radiusMeters");
  const limit = searchParams.get("limit");

  if (!lat || !lng) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INPUT", message: "lat and lng are required" } },
      { status: 400 }
    );
  }

  const query = new URLSearchParams({ lat, lng });
  if (radiusMeters) query.set("radiusMeters", radiusMeters);
  if (limit) query.set("limit", limit);

  const response = await fetch(`${backendBase}/api/v1/issues?${query.toString()}`, {
    method: "GET",
  });

  const payload = await response.json().catch(() => ({
    success: false,
    error: { code: "INVALID_RESPONSE", message: "Backend returned invalid JSON" },
  }));

  return NextResponse.json(payload, { status: response.status || 500 });
}
