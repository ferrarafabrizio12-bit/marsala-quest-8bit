import { useCallback, useEffect, useState } from "react";

export interface RealGpsState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  status: "SEARCHING" | "LOCKED" | "DENIED" | "UNAVAILABLE" | "ERROR";
  errorMessage: string | null;
  lastUpdate: number | null;
  retry: () => void;
}

export function useRealGps(enabled: boolean): RealGpsState {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<RealGpsState, "retry">>({
    lat: null,
    lng: null,
    accuracy: null,
    status: "SEARCHING",
    errorMessage: null,
    lastUpdate: null,
  });

  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (!("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        status: "UNAVAILABLE",
        errorMessage: "Browser non compatibile con il GPS.",
      }));
      return;
    }

    if (!window.isSecureContext) {
      setState((prev) => ({
        ...prev,
        status: "ERROR",
        errorMessage:
          "GPS bloccato in HTTP: apri l’app dal link HTTPS di Vercel.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, status: "SEARCHING", errorMessage: null }));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          status: "LOCKED",
          errorMessage: null,
          lastUpdate: Date.now(),
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState((prev) => ({
            ...prev,
            status: "DENIED",
            errorMessage:
              "Permesso posizione negato. Attivalo su Impostazioni > Safari/Chrome > Posizione e premi RIPROVA.",
          }));
        } else {
          setState((prev) => ({
            ...prev,
            status: "ERROR",
            errorMessage:
              "Segnale GPS debole. Spostati all’aperto e premi RIPROVA.",
          }));
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, attempt]);

  return { ...state, retry };
}
