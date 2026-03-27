import { NextResponse } from "next/server";

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INPUT", message: "q is required" } },
      { status: 400 }
    );
  }

  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get("limit") || "5"), 1), 10);

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(q)}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "CivicConnect/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: { code: "UPSTREAM_ERROR", message: "Location search provider failed" } },
        { status: 502 }
      );
    }

    const raw = (await response.json().catch(() => [])) as NominatimResult[];

    const items = raw
      .map((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }
        return {
          label: item.display_name || "Unknown place",
          lat,
          lng,
        };
      })
      .filter((item): item is { label: string; lat: number; lng: number } => item !== null);

    return NextResponse.json({ success: true, data: { items } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "BACKEND_UNAVAILABLE", message: "Unable to search locations" } },
      { status: 503 }
    );
  }
}
