import { useCallback, useEffect, useRef, useState } from "react";
import { haversineMeters } from "../../shared/pois";

export type CompassPermissionState =
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported";

export interface RealGpsState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  heading: number | null;
  hasLiveCompass: boolean;
  compassPermission: CompassPermissionState;
  requestCompassPermission: () => Promise<void>;
  status: "SEARCHING" | "LOCKED" | "ERROR";
  errorMessage: string | null;
  retry: () => void;
}

function computeStepBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.round(toDeg(Math.atan2(y, x))) + 360) % 360;
}

function getInitialCompassPermission(): CompassPermissionState {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
    return "unsupported";
  }
  const DevOrient = window.DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<"granted" | "denied">;
  };
  return typeof DevOrient.requestPermission === "function"
    ? "prompt"
    : "granted";
}

export function useRealGps(enabled: boolean): RealGpsState {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsHeading, setGpsHeading] = useState<number | null>(null);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [compassPermission, setCompassPermission] =
    useState<CompassPermissionState>(() => getInitialCompassPermission());
  const [status, setStatus] = useState<"SEARCHING" | "LOCKED" | "ERROR">(
    "SEARCHING",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const lastStepPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const retry = useCallback(() => {
    setStatus("SEARCHING");
    setErrorMessage(null);
    setAttempt((a) => a + 1);
  }, []);

  const requestCompassPermission = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    ) {
      setCompassPermission("unsupported");
      return;
    }
    const DevOrient = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof DevOrient.requestPermission === "function") {
      try {
        const res = await DevOrient.requestPermission();
        setCompassPermission(res === "granted" ? "granted" : "denied");
      } catch {
        // Ignora se non chiamato dentro un gesto diretto
      }
    } else {
      setCompassPermission("granted");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!("geolocation" in navigator)) {
      setStatus("ERROR");
      setErrorMessage("GPS non supportato dal browser.");
      return;
    }

    setStatus("SEARCHING");
    setErrorMessage(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;

        setLat(nextLat);
        setLng(nextLng);
        setAccuracy(Math.round(pos.coords.accuracy));

        if (
          typeof pos.coords.heading === "number" &&
          !Number.isNaN(pos.coords.heading)
        ) {
          setGpsHeading(Math.round(pos.coords.heading));
        } else if (lastStepPosRef.current) {
          const moved = haversineMeters(
            lastStepPosRef.current.lat,
            lastStepPosRef.current.lng,
            nextLat,
            nextLng,
          );
          if (moved >= 4) {
            setGpsHeading(
              computeStepBearing(
                lastStepPosRef.current.lat,
                lastStepPosRef.current.lng,
                nextLat,
                nextLng,
              ),
            );
            lastStepPosRef.current = { lat: nextLat, lng: nextLng };
          }
        } else {
          lastStepPosRef.current = { lat: nextLat, lng: nextLng };
        }

        setStatus("LOCKED");
        setErrorMessage(null);
      },
      (err) => {
        setStatus("ERROR");
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMessage(
            "Permesso GPS negato. Attiva la posizione per Marsala Quest.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMessage("Segnale GPS assente. Spostati all’aperto.");
        } else {
          setErrorMessage("Timeout GPS. Tocca RIPROVA.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 4000,
        timeout: 15000,
      },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, attempt]);

  // Bussola magnetica iOS/Android
  useEffect(() => {
    if (
      !enabled ||
      compassPermission === "denied" ||
      compassPermission === "unsupported"
    ) {
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const ev = event as DeviceOrientationEvent & {
        webkitCompassHeading?: number;
      };
      if (
        typeof ev.webkitCompassHeading === "number" &&
        !Number.isNaN(ev.webkitCompassHeading)
      ) {
        setCompassHeading(Math.round(ev.webkitCompassHeading));
        setCompassPermission("granted");
      } else if (event.absolute && typeof event.alpha === "number") {
        setCompassHeading(Math.round((360 - event.alpha) % 360));
        setCompassPermission("granted");
      } else if (
        typeof event.alpha === "number" &&
        compassPermission === "granted"
      ) {
        setCompassHeading(Math.round((360 - event.alpha) % 360));
      }
    };

    window.addEventListener(
      "deviceorientationabsolute",
      handleOrientation as EventListener,
    );
    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation as EventListener,
      );
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [enabled, compassPermission]);

  return {
    lat,
    lng,
    accuracy,
    heading: compassHeading ?? gpsHeading,
    hasLiveCompass: compassHeading !== null,
    compassPermission,
    requestCompassPermission,
    status,
    errorMessage,
    retry,
  };
}
