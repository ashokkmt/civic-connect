export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center px-6">
        <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
