"use client";

import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";

const LocationMapPicker = dynamic(
  () => import("@/components/location/LocationMapPicker").then((module) => module.LocationMapPicker),
  { ssr: false }
);

type MapCardProps = {
  coordinates?: [number, number];
};

function mapLinkUrl(coordinates?: [number, number]) {
  if (!coordinates) {
    return "https://www.openstreetmap.org";
  }

  const [lng, lat] = coordinates;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

export function MapCard({ coordinates }: MapCardProps) {
  const mapUrl = mapLinkUrl(coordinates);
  const value = coordinates ? { lat: coordinates[1], lng: coordinates[0] } : null;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 dark:border-slate-800">
        <LocationMapPicker
          value={value}
          onPick={(next) => {
            void next;
          }}
          interactive={false}
          mapHeightClassName="h-44"
          selectedZoom={15}
          defaultZoom={12}
        />
      </div>

      <a
        href={mapUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700 transition hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-slate-800"
      >
        View on Map
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}