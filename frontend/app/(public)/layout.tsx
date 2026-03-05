import { PublicNavbar } from "@/components/layout/PublicNavbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-6xl px-6 py-12">{children}</main>
    </div>
  );
}
