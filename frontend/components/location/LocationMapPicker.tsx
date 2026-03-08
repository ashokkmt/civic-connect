"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import type { Location } from "@/lib/location/types";

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

let leafletIconConfigured = false;

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
};

export function LocationMapPicker({ value, onPick }: LocationMapPickerProps) {
  configureLeafletIcon();

  const center: [number, number] = value ? [value.lat, value.lng] : DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <MapContainer center={center} zoom={value ? 14 : 5} className="h-64 w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PickerEvents onPick={onPick} />
        {value ? <Marker position={[value.lat, value.lng]} /> : null}
      </MapContainer>
    </div>
  );
}
