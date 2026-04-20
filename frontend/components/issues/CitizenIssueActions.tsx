"use client";

import { useState } from "react";

type CitizenIssueActionsProps = {
  issueId: string;
  status: string;
  isReporter: boolean;
  isSupporter: boolean;
  isFlagged?: boolean;
  onSupportStateChange?: (nextSupported: boolean, previousSupported: boolean) => void;
  onFlagStateChange?: (nextFlagged: boolean, previousFlagged: boolean) => void;
  layout?: "inline" | "stacked";
};

type ActionResponse = {
  success: boolean;
  error?: { code?: string; message?: string };
};

export function CitizenIssueActions({
  issueId,
  status,
  isReporter,
  isSupporter,
  isFlagged = false,
  onSupportStateChange,
  onFlagStateChange,
  layout = "inline",
}: CitizenIssueActionsProps) {
  const [supportLoading, setSupportLoading] = useState(false);
  const [flagLoading, setFlagLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [supported, setSupported] = useState(isSupporter);
  const [flagged, setFlagged] = useState(isFlagged);
  const [confirmed, setConfirmed] = useState(status === "AWAITING_HEAD_CLOSURE" || status === "CLOSED");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const oneActionTaken = supported || flagged;
  const canSupport = !isReporter && !oneActionTaken;
  const canFlag = !isReporter && !oneActionTaken;
  const canConfirmResolution = isReporter && status === "RESOLVED" && !confirmed;

  const applyConflictState = (message?: string) => {
    const normalized = message?.toLowerCase() ?? "";
    if (normalized.includes("flag")) {
      setFlagged(true);
      setSupported(false);
      return;
    }
    setSupported(true);
    setFlagged(false);
  };

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
        if (
          response.status === 409 &&
          (payload.error?.code === "DUPLICATE_SUPPORT" || payload.error?.code === "ACTION_ALREADY_TAKEN")
        ) {
          applyConflictState(payload.error?.message);
          setMessage(payload.error?.message ?? "You already support this issue.");
          return;
        }
        setError(payload.error?.message ?? "Unable to support this issue.");
        return;
      }

      onSupportStateChange?.(true, supported);
      setSupported(true);
      setFlagged(false);
      setMessage("Support added successfully.");
    } catch {
      setError("Unable to support this issue.");
    } finally {
      setSupportLoading(false);
    }
  };

  const flagIssue = async () => {
    setFlagLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/citizen/issues/${issueId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Citizen flagged this issue for review" }),
      });

      const payload = (await response.json()) as ActionResponse;

      if (!response.ok || !payload.success) {
        if (
          response.status === 409 &&
          (payload.error?.code === "DUPLICATE_FLAG" || payload.error?.code === "ACTION_ALREADY_TAKEN")
        ) {
          applyConflictState(payload.error?.message);
          setMessage(payload.error?.message ?? "You already flagged this issue.");
          return;
        }
        setError(payload.error?.message ?? "Unable to flag this issue.");
        return;
      }

      onFlagStateChange?.(true, flagged);
      setFlagged(true);
      setSupported(false);
      setMessage("Issue flagged for admin review.");
    } catch {
      setError("Unable to flag this issue.");
    } finally {
      setFlagLoading(false);
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

      setConfirmed(true);
      setMessage("Resolution confirmed. Awaiting authority head closure.");
    } catch {
      setError("Unable to confirm resolution.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const stacked = layout === "stacked";

  return (
    <div className={`space-y-3 ${stacked ? "" : "rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"}`}>
      {!stacked ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Actions</p>
      ) : null}

      <div className={stacked ? "space-y-2" : "flex flex-wrap items-center gap-2"}>
        <button
          type="button"
          onClick={supportIssue}
          disabled={!canSupport || supportLoading}
          className={`rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            stacked
              ? "w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
              : "text-zinc-700 hover:bg-[var(--surface)] dark:text-zinc-200"
          }`}
        >
          {supportLoading ? "Supporting..." : supported ? "Supported" : "Support Issue"}
        </button>

        <button
          type="button"
          onClick={flagIssue}
          disabled={!canFlag || flagLoading}
          className={`rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            stacked
              ? "w-full text-zinc-700 hover:bg-[var(--surface-muted)] dark:text-zinc-200"
              : "text-zinc-700 hover:bg-[var(--surface)] dark:text-zinc-200"
          }`}
        >
          {flagLoading ? "Flagging..." : flagged ? "Flagged" : "Flag Issue"}
        </button>

        {isReporter ? (
          <button
            type="button"
            onClick={confirmResolution}
            disabled={!canConfirmResolution || confirmLoading}
            className={`rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 ${
              stacked ? "w-full" : ""
            }`}
          >
            {confirmLoading ? "Confirming..." : confirmed ? "Confirmed" : "Confirm resolution"}
          </button>
        ) : null}
      </div>

      {message ? <p className="text-xs text-emerald-700 dark:text-emerald-300">{message}</p> : null}
      {error ? <p className="text-xs text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
