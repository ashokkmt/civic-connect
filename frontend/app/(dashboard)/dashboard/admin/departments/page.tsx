"use client";

import { useState } from "react";
import { FormError } from "@/components/forms/FormError";

type AdminResponse = {
  success: boolean;
  requestId?: string;
  error?: { message?: string };
};

export default function AdminDepartmentsPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const payload = (await response.json()) as AdminResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to create department.");
        return;
      }

      setSuccess("Department created successfully.");
      setName("");
    } catch {
      setError("Unable to create department.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Admin</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Create department</h1>
      </header>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <label className="space-y-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Department name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
            required
          />
        </label>

        <FormError message={error} />
        {success ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p> : null}
        {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {loading ? "Creating..." : "Create department"}
        </button>
      </form>
    </section>
  );
}
