import { useCallback, useEffect, useRef, useState } from "react";

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
  const watchIdRef = useRef<number | null>(null);
  const [state, setState] = useState<Omit<RealGpsState, "retry">>({
    lat: null,
    lng: null,
    accuracy: null,
    status: "SEARCHING",
    errorMessage: null,
    lastUpdate: null,
  });

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: Math.round(position.coords.accuracy),
      status: "LOCKED",
      errorMessage: null,
      lastUpdate: Date.now(),
    });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const detail = err.message ? ` (${err.message})` : "";
    if (err.code === err.PERMISSION_DENIED) {
      setState((prev) => ({
        ...prev,
        status: "DENIED",
        errorMessage: `GPS negato [code ${err.code}]${detail}. Tocca RIPROVA.`,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        status: "ERROR",
        errorMessage: `GPS non agganciato [code ${err.code}]${detail}. Tocca RIPROVA.`,
      }));
    }
  }, []);

  const startTracking = useCallback(() => {
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
        errorMessage: "GPS bloccato in HTTP: apri il link HTTPS di Vercel.",
      }));
      return;
    }

    clearWatch();
    setState((prev) => ({ ...prev, status: "SEARCHING", errorMessage: null }));

    const highOpts: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    };

    const lowOpts: PositionOptions = {
      enableHighAccuracy: false,
      maximumAge: 10000,
      timeout: 20000,
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSuccess(pos);
        clearWatch();
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          highOpts,
        );
      },
      (err) => {
        if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              handleSuccess(pos);
              clearWatch();
              watchIdRef.current = navigator.geolocation.watchPosition(
                handleSuccess,
                handleError,
                lowOpts,
              );
            },
            handleError,
            lowOpts,
          );
          return;
        }
        handleError(err);
      },
      highOpts,
    );
  }, [clearWatch, handleError, handleSuccess]);

  useEffect(() => {
    if (!enabled) {
      clearWatch();
      return;
    }
    startTracking();
    return clearWatch;
  }, [enabled, startTracking, clearWatch]);

  return { ...state, retry: startTracking };
}
