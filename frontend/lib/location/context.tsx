"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { Location } from "@/lib/location/types";
import { clearStoredLocation, readStoredLocation, writeStoredLocation } from "@/lib/location/storage";
import { isValidLocation } from "@/lib/location/validation";

type LocationContextValue = {
  location: Location | null;
  setLocation: (next: Location) => boolean;
  clearLocation: () => void;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<Location | null>(null);

  useEffect(() => {
    const stored = readStoredLocation();
    if (stored) {
      setLocationState(stored);
    }
  }, []);

  const setLocation = useCallback((next: Location) => {
    if (!isValidLocation(next)) {
      return false;
    }
    setLocationState(next);
    writeStoredLocation(next);
    return true;
  }, []);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    clearStoredLocation();
  }, []);

  const value = useMemo(
    () => ({ location, setLocation, clearLocation }),
    [location, setLocation, clearLocation]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = React.useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return ctx;
}
