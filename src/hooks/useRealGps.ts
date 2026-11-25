import { useCallback, useEffect, useRef, useState } from "react";

export interface RealGpsState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  heading: number | null;
  status: "SEARCHING" | "LOCKED" | "ERROR";
  errorMessage: string | null;
  retry: () => void;
}

export function useRealGps(enabled: boolean): RealGpsState {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsHeading, setGpsHeading] = useState<number | null>(null);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [status, setStatus] = useState<"SEARCHING" | "LOCKED" | "ERROR">(
    "SEARCHING",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const watchIdRef = useRef<number | null>(null);

  const retry = useCallback(() => {
    setStatus("SEARCHING");
    setErrorMessage(null);
    setAttempt((a) => a + 1);
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
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy));
        if (
          typeof pos.coords.heading === "number" &&
          !Number.isNaN(pos.coords.heading)
        ) {
          setGpsHeading(Math.round(pos.coords.heading));
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

  // Bussola magnetica iOS/Android per cono visivo e Wayfinder anche da fermo
  useEffect(() => {
    if (!enabled) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const ev = event as DeviceOrientationEvent & {
        webkitCompassHeading?: number;
      };
      if (
        typeof ev.webkitCompassHeading === "number" &&
        !Number.isNaN(ev.webkitCompassHeading)
      ) {
        setCompassHeading(Math.round(ev.webkitCompassHeading));
      } else if (event.absolute && typeof event.alpha === "number") {
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
  }, [enabled]);

  return {
    lat,
    lng,
    accuracy,
    heading: compassHeading ?? gpsHeading,
    status,
    errorMessage,
    retry,
  };
}
