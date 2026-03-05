import { headers } from "next/headers";

type MeResponse = {
  success: boolean;
  data?: { user?: { email?: string; role?: string; authoritySubRole?: string } };
  error?: { message?: string };
};

async function getSession() {
  const headersList = headers();
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

export default async function DashboardHome() {
  const session = await getSession();
  const user = session.data?.user;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Dashboard</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Welcome to CivicConnect</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Phase 2 session wiring is active. Role routing will be added in Phase 3.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-zinc-600 dark:text-zinc-300">
        {session.success && user ? (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Session
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{user.email ?? "Unknown user"}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {user.role}{user.authoritySubRole ? ` · ${user.authoritySubRole}` : ""}
            </p>
          </div>
        ) : (
          <p>{session.error?.message ?? "Session unavailable. Login in Phase 2 to test."}</p>
        )}
      </div>
    </section>
  );
}
