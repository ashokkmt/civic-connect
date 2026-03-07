"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FormActions } from "@/components/forms/FormActions";
import { FormError } from "@/components/forms/FormError";
import { SelectField } from "@/components/forms/SelectField";
import { TextArea } from "@/components/forms/TextArea";
import { TextField } from "@/components/forms/TextField";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useLocation } from "@/lib/location/context";
import { isValidLocation } from "@/lib/location/validation";
import { departmentOptions } from "@/lib/config/departments";

type CreateResponse = {
  success: boolean;
  data?: {
    created?: boolean;
    supporterAdded?: boolean;
    issueId?: string;
    mergedIntoIssueId?: string;
  };
  error?: { message?: string };
};

export default function CitizenCreateIssuePage() {
  const router = useRouter();
  const { location } = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState(departmentOptions[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const locationReady = useMemo(() => location && isValidLocation(location), [location]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!locationReady || !location) {
      setError("Set your location before reporting an issue.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    if (!departmentId) {
      setError("Select a department before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/citizen/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          imageUrls: [],
          departmentId,
          location: { lat: location.lat, lng: location.lng },
        }),
      });

      const payload = (await response.json()) as CreateResponse;
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to create issue");
        return;
      }

      const created = payload.data?.created;
      const issueId = payload.data?.issueId || payload.data?.mergedIntoIssueId;

      if (created) {
        setSuccessMessage("Issue submitted for review.");
      } else {
        setSuccessMessage("Issue matched an existing report. Your support was added.");
      }

      if (issueId) {
        router.push(`/dashboard/citizen/issues/${issueId}`);
      }
    } catch {
      setError("Unable to create issue");
    } finally {
      setSubmitting(false);
    }
  };

  if (!locationReady) {
    return (
      <EmptyState
        title="Location required"
        description="Set your location on the public homepage before reporting an issue."
      />
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Citizen</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Report a new issue</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Submit a local issue for authority review. Departments below are temporary and should match your backend IDs.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <TextField
          id="issue-title"
          label="Issue title"
          value={title}
          onChange={setTitle}
          placeholder="e.g. Streetlight outage near bus stop"
          required
        />
        <TextArea
          id="issue-description"
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Share as much detail as possible."
          required
          rows={5}
        />
        <SelectField
          id="department"
          label="Department"
          value={departmentId}
          onChange={setDepartmentId}
          options={departmentOptions.map((option) => ({
            value: option.id,
            label: option.name,
          }))}
          helperText="Update department IDs in lib/config/departments.ts to match your backend."
          required
        />

        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <FormError message={error} />

        <FormActions
          submitLabel="Submit issue"
          isSubmitting={submitting}
          secondaryAction={<Link href="/dashboard/citizen/issues">Back to issues</Link>}
        />
      </form>
    </section>
  );
}
