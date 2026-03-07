export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/18 blur-3xl" />
        <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-teal-400/16 blur-3xl" />
        <div className="absolute -bottom-24 right-8 h-64 w-64 rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5f5_0.6px,transparent_0.6px)] bg-[size:22px_22px] opacity-30 dark:bg-[radial-gradient(#1f2937_0.6px,transparent_0.6px)]" />
      </div>
      <main className="relative mx-auto w-full max-w-7xl px-6 lg:px-8">{children}</main>
    </div>
  );
}
