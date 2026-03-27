"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Camera, Info, LocateFixed, Search, SendHorizonal } from "lucide-react";
import { FormError } from "@/components/forms/FormError";
import { SelectField } from "@/components/forms/SelectField";
import { TextArea } from "@/components/forms/TextArea";
import { TextField } from "@/components/forms/TextField";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { useLocation } from "@/lib/location/context";
import { isValidLocation } from "@/lib/location/validation";
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

type DepartmentsResponse = {
  success: boolean;
  data?: { items?: Array<{ id: string; name: string }> };
  error?: { message?: string };
};

type LocationSearchResponse = {
  success: boolean;
  data?: { items?: Array<{ label: string; lat: number; lng: number }> };
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
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationResults, setLocationResults] = useState<Array<{ label: string; lat: number; lng: number }>>([]);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
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

  useEffect(() => {
    if (locationReady && location) {
      setLatInput(String(location.lat));
      setLngInput(String(location.lng));
    }
  }, [location, locationReady]);

  useEffect(() => {
    const loadDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const response = await fetch("/api/departments?limit=200", { method: "GET" });
        const payload = (await response.json()) as DepartmentsResponse;
        if (!response.ok || !payload.success) {
          return;
        }

        const items = payload.data?.items ?? [];
        setDepartments(items);
        if (!departmentId && items.length > 0) {
          setDepartmentId(items[0].id);
        }
      } catch {
        // Keep form usable even if departments lookup fails.
      } finally {
        setDepartmentsLoading(false);
      }
    };

    void loadDepartments();
  }, [departmentId]);

  const searchLocation = async () => {
    const query = locationQuery.trim();
    if (!query) {
      setLocationResults([]);
      return;
    }

    setSearchingLocation(true);
    try {
      const response = await fetch(`/api/location/search?q=${encodeURIComponent(query)}&limit=5`, {
        method: "GET",
      });
      const payload = (await response.json()) as LocationSearchResponse;
      if (!response.ok || !payload.success) {
        setLocationResults([]);
        setError(payload.error?.message ?? "Unable to search location.");
        return;
      }
      setLocationResults(payload.data?.items ?? []);
    } catch {
      setLocationResults([]);
      setError("Unable to search location.");
    } finally {
      setSearchingLocation(false);
    }
  };

  const applyManualCoordinates = () => {
    const lat = Number(latInput);
    const lng = Number(lngInput);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Latitude and longitude must be valid numbers.");
      return;
    }

    applyLocation({ lat, lng });
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
    <form onSubmit={submit} className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Report New Issue</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Help us improve your neighborhood by reporting local infrastructure or service problems.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-6 inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <Info className="h-5 w-5 text-sky-600" />
              Issue Details
            </h3>

            <div className="space-y-5">
              <TextField
                id="citizen-report-title"
                label="Issue title"
                value={title}
                onChange={setTitle}
                placeholder="e.g., Deep pothole on Main St"
                required
              />

              <SelectField
                id="citizen-report-department"
                label="Department"
                value={departmentId}
                onChange={setDepartmentId}
                options={
                  departments.length > 0
                    ? departments.map((option) => ({ value: option.id, label: option.name }))
                    : [{ value: "", label: departmentsLoading ? "Loading departments..." : "No departments available" }]
                }
                required
                helperText="Fetched from live department list"
              />

              <TextArea
                id="citizen-report-description"
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Provide as much detail as possible to help our crews find and fix the issue..."
                required
                rows={5}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-6 inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <Camera className="h-5 w-5 text-sky-600" />
              Evidence and Photos
            </h3>

            <ImageUploader
              value={imageUrls}
              onChange={setImageUrls}
              onUploadingChange={setIsUploading}
              onError={setUploadError}
            />

            {successMessage ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200">
                {successMessage}
              </div>
            ) : null}

            <div className="mt-4 flex justify-center">
              <div className="w-full max-w-md space-y-3 text-center">
                <FormError message={error ?? uploadError} />
                <button
                  type="submit"
                  disabled={submitting || isUploading}
                  className="mx-auto flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-4 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Submit Report
                  <SendHorizonal className="h-4 w-4" />
                </button>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <Link href="/issues" className="font-medium text-sky-700 hover:underline dark:text-sky-300">
                    Browse public issues
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <LocateFixed className="h-5 w-5 text-sky-600" />
              Location
            </h3>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search for address..."
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void searchLocation();
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 outline-none ring-sky-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => void searchLocation()}
                disabled={searchingLocation}
                className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searchingLocation ? "Searching..." : "Search"}
              </button>
            </div>

            {locationResults.length > 0 ? (
              <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/60">
                <ul className="space-y-1">
                  {locationResults.map((result) => (
                    <li key={`${result.lat},${result.lng}`}>
                      <button
                        type="button"
                        onClick={() => {
                          applyLocation({ lat: result.lat, lng: result.lng });
                          setLocationQuery(result.label);
                          setLocationResults([]);
                        }}
                        className="w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {result.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="number"
                step="any"
                value={latInput}
                onChange={(event) => setLatInput(event.target.value)}
                placeholder="Latitude"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <input
                type="number"
                step="any"
                value={lngInput}
                onChange={(event) => setLngInput(event.target.value)}
                placeholder="Longitude"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={applyManualCoordinates}
                className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Apply Manual Coordinates
              </button>
            </div>

            <div className="space-y-3">
              <LocationMapPicker
                value={locationReady ? location : null}
                onPick={applyLocation}
                mapHeightClassName="h-72"
                selectedZoom={16}
              />

              <button
                type="button"
                onClick={detectDeviceLocation}
                disabled={locating}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {locating ? "Fetching location..." : "Use Current Location"}
              </button>

              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                {locationReady && location
                  ? `Selected pin: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                  : "No location selected yet."}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-sky-200 bg-sky-50 p-6 dark:border-sky-900/40 dark:bg-sky-900/20">
            <h4 className="text-sm font-bold text-sky-700 dark:text-sky-300">Privacy Notice</h4>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Your report and location will be shared with the relevant city department. You can track progress in the My Issues view.
            </p>
          </section>
        </div>
      </div>
    </form>
  );
}
