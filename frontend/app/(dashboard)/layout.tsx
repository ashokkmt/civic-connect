import { headers } from "next/headers";
import { DashboardShell } from "@/components/layout/DashboardShell";

type MeResponse = {
  success: boolean;
  data?: { user?: { role?: string; authoritySubRole?: string } };
  error?: { message?: string };
};

async function getSession() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return { success: false, error: { message: "Host header missing" } } as MeResponse;
  }

  const response = await fetch(`${protocol}://${host}/api/auth/me`, {
    method: "GET",
    cache: "no-store",
    headers: {
      cookie: headersList.get("cookie") ?? "",
    },
  });

  return (await response.json()) as MeResponse;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = session.data?.user;

  return (
    <DashboardShell role={user?.role} authoritySubRole={user?.authoritySubRole}>
      {children}
    </DashboardShell>
  );
}
