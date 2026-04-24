"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { LocationSetupCard } from "@/components/location/LocationSetupCard";

type LocationModalProps = {
  open: boolean;
  onClose: () => void;
};

export function LocationModal({ open, onClose }: LocationModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Update your location</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Search, use your device location, or place the map pin.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Close location modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-4">
          <LocationSetupCard className="border-none bg-transparent p-0" />
        </div>

        <div className="flex justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#1173d4] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0f66bd]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
