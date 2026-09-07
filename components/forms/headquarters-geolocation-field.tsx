"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import { Crosshair, Loader2, MapPin, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const LocationMapPicker = dynamic(
  () => import("@/components/location-map-picker"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted/40 text-muted-foreground flex h-64 w-full items-center justify-center rounded-md border text-sm">
        Chargement de la carte...
      </div>
    ),
  },
);

export type GeolocationSource = "DEVICE" | "MAP" | "MANUAL";

export type GeolocationValue = {
  latitude: string;
  longitude: string;
  accuracyMeters: string;
  source: GeolocationSource | "";
};

const SOURCE_LABELS: Record<GeolocationSource, string> = {
  DEVICE: "Position de l'appareil",
  MAP: "Choisie sur la carte",
  MANUAL: "Saisie manuelle",
};

const toNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.length) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export function HeadquartersGeolocationField({
  value,
  onChange,
  label = "Géolocalisation du siège (optionnel)",
}: {
  value: GeolocationValue;
  onChange: (value: GeolocationValue) => void;
  label?: string;
}) {
  const [mode, setMode] = useState<"map" | "manual">("map");
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latitude = toNumber(value.latitude);
  const longitude = toNumber(value.longitude);

  const setCoordinates = (
    coordinates: { latitude: number; longitude: number; accuracyMeters?: number },
    source: GeolocationSource,
  ) => {
    onChange({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      accuracyMeters:
        coordinates.accuracyMeters !== undefined
          ? String(Math.round(coordinates.accuracyMeters))
          : "",
      source,
    });
  };

  const locateDevice = (silent = false) => {
    setError(null);

    if (!("geolocation" in navigator)) {
      if (!silent) {
        setError("La géolocalisation n'est pas disponible sur cet appareil.");
      }
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setCoordinates(
          {
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            accuracyMeters: position.coords.accuracy,
          },
          "DEVICE",
        );
      },
      (positionError) => {
        setIsLocating(false);
        // A silent auto-attempt just leaves the map ready for a manual pick.
        if (silent) return;
        setError(
          positionError.code === positionError.PERMISSION_DENIED
            ? "Accès à la position refusé. Choisissez le point sur la carte ou saisissez les coordonnées."
            : "Impossible de récupérer la position de l'appareil.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  // Capture the device position once, so the map opens on the right place.
  const hasAutoLocated = useRef(false);
  useEffect(() => {
    if (hasAutoLocated.current) return;
    hasAutoLocated.current = true;
    if (value.latitude || value.longitude) return;

    // Deferred so the first paint is not blocked by the permission prompt.
    const timer = setTimeout(() => locateDevice(true), 0);
    return () => clearTimeout(timer);
    // Runs once on mount; locateDevice only reads stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = () =>
    onChange({ latitude: "", longitude: "", accuracyMeters: "", source: "" });

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <p className="text-muted-foreground text-xs">
        Enregistrez la position de votre appareil, placez le point sur la carte,
        ou saisissez les coordonnées à la main.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => locateDevice()}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Crosshair />
          )}
          {isLocating ? "Localisation..." : "Utiliser ma position"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMode(mode === "map" ? "manual" : "map")}
        >
          {mode === "map" ? <Pencil /> : <MapPin />}
          {mode === "map" ? "Saisie manuelle" : "Choisir sur la carte"}
        </Button>
        {(value.latitude || value.longitude) && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Effacer
          </Button>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {mode === "map" ? (
        <>
          <LocationMapPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(coordinates) => setCoordinates(coordinates, "MAP")}
          />
          <p className="text-muted-foreground text-xs">
            Cliquez sur la carte ou déplacez le marqueur pour ajuster la
            position.
          </p>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="headquarters-latitude">Latitude</FieldLabel>
            <Input
              id="headquarters-latitude"
              type="number"
              step="any"
              value={value.latitude}
              onChange={(event) =>
                onChange({
                  ...value,
                  latitude: event.target.value,
                  source: "MANUAL",
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="headquarters-longitude">Longitude</FieldLabel>
            <Input
              id="headquarters-longitude"
              type="number"
              step="any"
              value={value.longitude}
              onChange={(event) =>
                onChange({
                  ...value,
                  longitude: event.target.value,
                  source: "MANUAL",
                })
              }
            />
          </div>
        </div>
      )}

      {latitude !== null && longitude !== null && (
        <p className="text-muted-foreground text-xs">
          {latitude}, {longitude}
          {value.source ? ` — ${SOURCE_LABELS[value.source]}` : ""}
          {value.accuracyMeters ? ` (± ${value.accuracyMeters} m)` : ""}
        </p>
      )}
    </Field>
  );
}
