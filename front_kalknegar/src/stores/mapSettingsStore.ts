import { defineStore } from "pinia";
import { type CoordinateFormatType } from "@/composables/geoShowLocation";
import { useLocalStorage } from "@vueuse/core";
import { DEFAULT_BASEMAP_ID } from "@/config/constants";

const LEGACY_BASE_LAYER_STORAGE_KEY = "baseLayerName";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  const payloadPart = parts[1];
  const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  try {
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function resolveCurrentUserBaseLayerStorageKey(): string {
  if (typeof window === "undefined") {
    return `${LEGACY_BASE_LAYER_STORAGE_KEY}:anonymous`;
  }

  const token = window.localStorage.getItem("access_token");
  if (!token) {
    return `${LEGACY_BASE_LAYER_STORAGE_KEY}:anonymous`;
  }

  const payload = decodeJwtPayload(token);
  const uid = payload?.uid;
  const username = payload?.sub;

  const userIdentifier =
    (typeof uid === "string" && uid.trim().length > 0 && uid.trim()) ||
    (typeof username === "string" && username.trim().length > 0 && username.trim()) ||
    "anonymous";

  return `${LEGACY_BASE_LAYER_STORAGE_KEY}:${userIdentifier}`;
}

function resolveInitialBaseLayerName(storageKey: string): string {
  if (typeof window === "undefined") {
    return DEFAULT_BASEMAP_ID;
  }

  const userScopedValue = window.localStorage.getItem(storageKey);
  if (userScopedValue && userScopedValue.trim().length > 0) {
    return userScopedValue;
  }

  const legacyValue = window.localStorage.getItem(LEGACY_BASE_LAYER_STORAGE_KEY);
  if (legacyValue && legacyValue.trim().length > 0) {
    return legacyValue;
  }

  return DEFAULT_BASEMAP_ID;
}

const USER_BASE_LAYER_STORAGE_KEY = resolveCurrentUserBaseLayerStorageKey();

export interface MapSettingsState {
  showLocation: boolean;
  coordinateFormat: CoordinateFormatType;
  baseLayerName: string;
  showScaleLine: boolean;
  showDayNightTerminator: boolean;
}
export const useMapSettingsStore = defineStore("mapSettings", {
  state: () => ({
    showLocation: useLocalStorage("showLocation", true),
    coordinateFormat: useLocalStorage<CoordinateFormatType>(
      "coordinateFormat",
      "DecimalDegrees",
    ),
    showScaleLine: useLocalStorage("showScaleLine", true),
    baseLayerName: useLocalStorage(
      USER_BASE_LAYER_STORAGE_KEY,
      resolveInitialBaseLayerName(USER_BASE_LAYER_STORAGE_KEY),
    ),
    showDayNightTerminator: useLocalStorage("showDayNightTerminator", true),
  }),
});
