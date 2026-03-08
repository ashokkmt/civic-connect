"use client";

import { useState } from "react";

type CitizenIssueActionsProps = {
  issueId: string;
  status: string;
  isReporter: boolean;
  isSupporter: boolean;
};

type ActionResponse = {
  success: boolean;
  error?: { code?: string; message?: string };
};

export function CitizenIssueActions({ issueId, status, isReporter, isSupporter }: CitizenIssueActionsProps) {
  const [supportLoading, setSupportLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSupport = !isReporter && !isSupporter;
  const canConfirmResolution = isReporter && status === "RESOLVED";

  const supportIssue = async () => {
    setSupportLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/citizen/issues/${issueId}/support`, {
        method: "POST",
      });

      const payload = (await response.json()) as ActionResponse;

      if (!response.ok || !payload.success) {
        if (response.status === 409 || payload.error?.code === "DUPLICATE_SUPPORT") {
          setMessage("You already support this issue.");
          return;
        }
        setError(payload.error?.message ?? "Unable to support this issue.");
        return;
      }

      setMessage("Support added successfully.");
    } catch {
      setError("Unable to support this issue.");
    } finally {
      setSupportLoading(false);
    }
  };

  const confirmResolution = async () => {
    setConfirmLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/citizen/issues/${issueId}/confirm-resolution`, {
        method: "POST",
      });

      const payload = (await response.json()) as ActionResponse;

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to confirm resolution.");
        return;
      }

      setMessage("Resolution confirmed. Awaiting authority head closure.");
    } catch {
      setError("Unable to confirm resolution.");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Actions</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={supportIssue}
          disabled={!canSupport || supportLoading}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200"
        >
          {supportLoading ? "Adding support..." : isSupporter ? "Supported" : "Support issue"}
        </button>

        <button
          type="button"
          onClick={confirmResolution}
          disabled={!canConfirmResolution || confirmLoading}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {confirmLoading ? "Confirming..." : "Confirm resolution"}
        </button>
      </div>

      {message ? <p className="text-xs text-emerald-700 dark:text-emerald-300">{message}</p> : null}
      {error ? <p className="text-xs text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
