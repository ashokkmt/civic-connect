import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        viewsEndpoint: "/api/dashboards/admin/views",
      },
    },
    { status: 200 }
  );
}
