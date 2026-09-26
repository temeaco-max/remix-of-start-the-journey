import { useSyncExternalStore } from "react";

export type UserLocation = {
  kind: "geolocation";
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type UserLocationState = {
  geo: UserLocation | null;
  geoError: string | null;
  locating: boolean;
  shareLocation: () => void;
  clearGeo: () => void;
};

let geo: UserLocation | null = null;
let geoError: string | null = null;
let locating = false;
const listeners = new Set<() => void>();

let snapshot: UserLocationState = {
  geo,
  geoError,
  locating,
  shareLocation,
  clearGeo,
};

function emit() {
  snapshot = { geo, geoError, locating, shareLocation, clearGeo };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const serverSnapshot: UserLocationState = {
  geo: null,
  geoError: null,
  locating: false,
  shareLocation,
  clearGeo,
};

function getSnapshot(): UserLocationState {
  return snapshot;
}

function getServerSnapshot(): UserLocationState {
  return serverSnapshot;
}

export function shareLocation() {
  if (locating) return;
  if (typeof window === "undefined" || !("geolocation" in window.navigator)) {
    geoError = "Location sharing is not available in this browser.";
    emit();
    return;
  }
  locating = true;
  geoError = null;
  emit();
  window.navigator.geolocation.getCurrentPosition(
    (position) => {
      locating = false;
      geo = {
        kind: "geolocation",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy),
      };
      emit();
    },
    (error) => {
      locating = false;
      geoError =
        error.code === error.PERMISSION_DENIED
          ? "Location permission was denied. Kurukoo did not receive any coordinates."
          : "Could not read your location. You can type a landmark instead.";
      emit();
    },
    { timeout: 12000, maximumAge: 60000 },
  );
}

export function clearGeo() {
  geo = null;
  geoError = null;
  emit();
}

export function useUserLocation(): UserLocationState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
