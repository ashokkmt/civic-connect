"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import type { Location } from "@/lib/location/types";

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

let leafletIconConfigured = false;
let civicMarkerConfigured = false;
let civicMarkerIcon: L.Icon | null = null;

function configureLeafletIcon() {
  if (leafletIconConfigured) {
    return;
  }

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  leafletIconConfigured = true;
}

function getCivicMarkerIcon() {
  if (civicMarkerConfigured && civicMarkerIcon) {
    return civicMarkerIcon;
  }

  const svg = encodeURIComponent(`
    <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(8,47,73,0.45)"/>
        </filter>
      </defs>
      <path d="M15 1C8.373 1 3 6.373 3 13c0 8.8 10.215 20.315 11.182 21.39a1.1 1.1 0 0 0 1.636 0C16.785 33.315 27 21.8 27 13 27 6.373 21.627 1 15 1Z" fill="#0ea5e9" filter="url(#shadow)"/>
      <circle cx="15" cy="13" r="5" fill="#ffffff"/>
      <circle cx="15" cy="13" r="2.1" fill="#0284c7"/>
    </svg>
  `);

  civicMarkerIcon = L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [30, 42],
    iconAnchor: [15, 41],
    popupAnchor: [0, -36],
  });

  civicMarkerConfigured = true;
  return civicMarkerIcon;
}

type PickerEventsProps = {
  onPick: (next: Location) => void;
};

function PickerEvents({ onPick }: PickerEventsProps) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

type LocationMapPickerProps = {
  value: Location | null;
  onPick: (next: Location) => void;
  interactive?: boolean;
  mapHeightClassName?: string;
  defaultZoom?: number;
  selectedZoom?: number;
};

export function LocationMapPicker({
  value,
  onPick,
  interactive = true,
  mapHeightClassName = "h-64",
  defaultZoom = 5,
  selectedZoom = 14,
}: LocationMapPickerProps) {
  configureLeafletIcon();
  const markerIcon = getCivicMarkerIcon();

  const center: [number, number] = value ? [value.lat, value.lng] : DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <MapContainer
        center={center}
        zoom={value ? selectedZoom : defaultZoom}
        className={`${mapHeightClassName} w-full`}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {interactive ? <PickerEvents onPick={onPick} /> : null}
        {value ? <Marker position={[value.lat, value.lng]} icon={markerIcon} /> : null}
      </MapContainer>
    </div>
  );
}
