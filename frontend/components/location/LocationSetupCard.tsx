"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormError } from "@/components/forms/FormError";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useLocation } from "@/lib/location/context";
import type { Location } from "@/lib/location/types";

const LocationMapPicker = dynamic(
  () => import("@/components/location/LocationMapPicker").then((module) => module.LocationMapPicker),
  { ssr: false }
);

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type LocationSetupCardProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function LocationSetupCard({
  title = "Set your location",
  description = "Choose your location using geolocation, map click, or place search.",
  className,
}: LocationSetupCardProps) {
  const { location, setLocation, clearLocation } = useLocation();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);

  const locationLabel = useMemo(() => {
    if (!location) {
      return "Not set";
    }
    return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
  }, [location]);

  const applyLocation = (next: Location) => {
    const ok = setLocation(next);
    if (!ok) {
      setError("Invalid location. Latitude must be between -90 and 90, longitude between -180 and 180.");
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
        setError("Unable to fetch your device location. Check browser permission settings.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    setError(null);

    try {
      const encoded = encodeURIComponent(query.trim());
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5`);
      if (!response.ok) {
        setError("Location search is currently unavailable.");
        setSearchResults([]);
        return;
      }

      const payload = (await response.json()) as SearchResult[];
      setSearchResults(payload);
    } catch {
      setError("Location search failed. Try again in a moment.");
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  useEffect(() => {
    const query = debouncedSearch.trim();
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    void runSearch(query);
  }, [debouncedSearch, runSearch]);

  return (
    <section className={`space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 ${className ?? ""}`}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{description}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 font-semibold">
          Current: {locationLabel}
        </span>
        <button
          type="button"
          onClick={detectDeviceLocation}
          disabled={locating}
          className="rounded-lg border border-[var(--border)] px-3 py-1 font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200"
        >
          {locating ? "Locating..." : "Use device location"}
        </button>
        <button
          type="button"
          onClick={() => {
            clearLocation();
            setSearchResults([]);
            setError(null);
          }}
          className="rounded-lg border border-[var(--border)] px-3 py-1 font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
        >
          Clear
        </button>
      </div>

      <LocationMapPicker value={location} onPick={applyLocation} />

      <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Optional place search
        </p>
        <div className="space-y-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for an area or landmark"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100"
          />
          {search.trim().length >= 3 && loadingSearch ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Searching locations...</p>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Type at least 3 characters to search.</p>
          )}
        </div>
        {searchResults.length > 0 ? (
          <ul className="space-y-2">
            {searchResults.map((result) => (
              <li key={result.place_id}>
                <button
                  type="button"
                  onClick={() =>
                    applyLocation({
                      lat: Number(result.lat),
                      lng: Number(result.lon),
                    })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-xs text-zinc-600 transition hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  {result.display_name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <FormError message={error} />
    </section>
  );
}
