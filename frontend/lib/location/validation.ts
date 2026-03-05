import type { Location } from "@/lib/location/types";

export function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidLocation(location: Location) {
  return isValidLatitude(location.lat) && isValidLongitude(location.lng);
}
