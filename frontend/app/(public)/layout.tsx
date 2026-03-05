import { PublicNavbar } from "@/components/layout/PublicNavbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-7xl px-6 lg:px-8">{children}</main>
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-zinc-600 dark:text-zinc-300 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-semibold text-zinc-900 dark:text-white">CivicConnect</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Community issue reporting and transparency.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <span className="text-zinc-500 dark:text-zinc-400">Built for civic clarity</span>
            <span className="text-zinc-500 dark:text-zinc-400">Privacy-first reporting</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
