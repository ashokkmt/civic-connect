import type { Location } from "@/lib/location/types";
import { isValidLocation } from "@/lib/location/validation";

const STORAGE_KEY = "civic_location";

export function readStoredLocation(): Location | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Location;
    if (isValidLocation(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeStoredLocation(location: Location) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
}

export function clearStoredLocation() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}
