"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FormActions } from "@/components/forms/FormActions";
import { FormError } from "@/components/forms/FormError";
import { SelectField } from "@/components/forms/SelectField";
import { TextArea } from "@/components/forms/TextArea";
import { TextField } from "@/components/forms/TextField";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { useLocation } from "@/lib/location/context";
import { isValidLocation } from "@/lib/location/validation";
import { departmentOptions } from "@/lib/config/departments";
import type { Location } from "@/lib/location/types";

const LocationMapPicker = dynamic(
  () => import("@/components/location/LocationMapPicker").then((module) => module.LocationMapPicker),
  { ssr: false }
);

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

type ReportIssueProps = {
  onSuccessNavigate?: (viewId: "my_issues") => void;
};

export function ReportIssue({ onSuccessNavigate }: ReportIssueProps) {
  const router = useRouter();
  const { location, setLocation } = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [departmentId, setDepartmentId] = useState(departmentOptions[0]?.id ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const locationReady = useMemo(() => location && isValidLocation(location), [location]);

  const applyLocation = (next: Location) => {
    const ok = setLocation(next);
    if (!ok) {
      setError("Invalid location selected.");
      return;
    }
    setError(null);
  };

  const detectDeviceLocation = () => {
    setError(null);
    if (typeof window === "undefined" || !window.navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        applyLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Unable to fetch your current location. Please check browser permissions.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

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

    if (isUploading) {
      setError("Wait for image uploads to complete before submitting.");
      return;
    }

    if (imageUrls.length === 0) {
      setError("Upload at least one image before submitting.");
      return;
    }

    if (uploadError) {
      setError(uploadError);
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
          imageUrls,
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
        return;
      }

      setTitle("");
      setDescription("");
      setImageUrls([]);
      if (onSuccessNavigate) {
        onSuccessNavigate("my_issues");
      }
    } catch {
      setError("Unable to create issue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <TextField
        id="citizen-report-title"
        label="Issue title"
        value={title}
        onChange={setTitle}
        placeholder="e.g. Streetlight outage near bus stop"
        required
      />
      <TextArea
        id="citizen-report-description"
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="Describe what is happening, where, and how urgent it is."
        required
        rows={5}
      />
      <SelectField
        id="citizen-report-department"
        label="Department"
        value={departmentId}
        onChange={setDepartmentId}
        options={departmentOptions.map((option) => ({ value: option.id, label: option.name }))}
        helperText="Department list currently comes from frontend config and should match backend IDs."
        required
      />

      <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Location</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Use your current location or click on the map to place the issue marker.
            </p>
          </div>
          <button
            type="button"
            onClick={detectDeviceLocation}
            disabled={locating}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200"
          >
            {locating ? "Fetching location..." : "Fetch current location"}
          </button>
        </div>

        <LocationMapPicker
          value={locationReady ? location : null}
          onPick={applyLocation}
          mapHeightClassName="h-72"
          selectedZoom={16}
        />

        <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
          {locationReady && location
            ? `Selected: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
            : "No location selected yet."}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Evidence images</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Upload one or more images before submission.
        </p>
        <ImageUploader
          value={imageUrls}
          onChange={setImageUrls}
          onUploadingChange={setIsUploading}
          onError={setUploadError}
        />
      </div>

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <FormError message={error ?? uploadError} />

      <FormActions
        submitLabel="Submit issue"
        isSubmitting={submitting || isUploading}
        secondaryAction={<Link href="/issues">Browse public issues</Link>}
      />
    </form>
  );
}
