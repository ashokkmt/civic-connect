import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        endpoints: {
          citizen: "/api/dashboards/citizen",
          authorityHead: "/api/dashboards/authority-head",
          authorityWorker: "/api/dashboards/authority-worker",
          admin: "/api/dashboards/admin",
          adminViews: "/api/dashboards/admin/views",
        },
      },
    },
    { status: 200 }
  );
}
