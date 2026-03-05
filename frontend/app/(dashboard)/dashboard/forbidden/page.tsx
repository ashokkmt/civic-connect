export default function ForbiddenPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Access denied</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        You do not have access to this section. Use the dashboard home to navigate to a role that
        matches your account.
      </p>
    </section>
  );
}
