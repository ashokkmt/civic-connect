export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-9rem)] overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#1173d4]/18 blur-3xl" />
        <div className="absolute -bottom-36 left-8 h-80 w-80 rounded-full bg-sky-400/16 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute -bottom-28 right-8 h-72 w-72 rounded-full bg-indigo-400/14 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_0.6px,transparent_0.6px)] bg-[size:22px_22px] opacity-30 dark:bg-[radial-gradient(#334155_0.6px,transparent_0.6px)]" />
      </div>
      <main className="relative mx-auto w-full max-w-7xl px-6 py-6 lg:px-8">{children}</main>
    </div>
  );
}
