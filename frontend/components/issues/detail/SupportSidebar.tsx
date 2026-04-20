"use client";

import { useState } from "react";
import { CitizenIssueActions } from "@/components/issues/CitizenIssueActions";

type SupportSidebarProps = {
  issueId: string;
  status: string;
  isReporter: boolean;
  isSupporter: boolean;
  isFlagged?: boolean;
  supporterCount?: number;
  flagsCount?: number;
};

export function SupportSidebar({
  issueId,
  status,
  isReporter,
  isSupporter,
  isFlagged,
  supporterCount = 0,
  flagsCount = 0,
}: SupportSidebarProps) {
  const [supporters, setSupporters] = useState(supporterCount);
  const [flags, setFlags] = useState(flagsCount);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{supporters}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Supporters</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{flags}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Flags</p>
        </div>
      </div>

      <CitizenIssueActions
        issueId={issueId}
        status={status}
        isReporter={isReporter}
        isSupporter={isSupporter}
        isFlagged={isFlagged}
        layout="stacked"
        onSupportStateChange={(nextSupported, previousSupported) => {
          if (nextSupported && !previousSupported) {
            setSupporters((count) => count + 1);
          }
        }}
        onFlagStateChange={(nextFlagged, previousFlagged) => {
          if (nextFlagged && !previousFlagged) {
            setFlags((count) => count + 1);
          }
        }}
      />

      <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
        High support counts prioritize this issue for municipal budget allocation.
      </p>
    </section>
  );
}