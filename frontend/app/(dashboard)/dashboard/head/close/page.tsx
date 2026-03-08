"use client";

import { useState } from "react";
import { FormError } from "@/components/forms/FormError";

type CloseResponse = {
  success: boolean;
  requestId?: string;
  error?: { message?: string };
};

export default function HeadClosePage() {
  const [issueId, setIssueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!issueId.trim()) {
      setError("Issue ID is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/head/issues/${issueId.trim()}/close`, { method: "POST" });
      const payload = (await response.json()) as CloseResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to close issue.");
        return;
      }

      setSuccess("Issue closed successfully.");
      setIssueId("");
    } catch {
      setError("Unable to close issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Authority head</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Close issue by ID</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Use this page for the final closure step when an issue is in AWAITING_HEAD_CLOSURE.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <label className="space-y-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Issue ID</span>
          <input
            value={issueId}
            onChange={(event) => setIssueId(event.target.value)}
            placeholder="Mongo ObjectID"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
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
          {loading ? "Closing..." : "Close issue"}
        </button>
      </form>
    </section>
  );
}
