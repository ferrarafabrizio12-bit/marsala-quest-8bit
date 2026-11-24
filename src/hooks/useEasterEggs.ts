import { useEffect, useRef } from "react";

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function useKonamiCode(onTrigger: () => void): void {
  const indexRef = useRef(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === KONAMI_SEQUENCE[indexRef.current]) {
        indexRef.current += 1;
        if (indexRef.current === KONAMI_SEQUENCE.length) {
          indexRef.current = 0;
          onTrigger();
        }
      } else {
        indexRef.current = 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onTrigger]);
}

export function isStagnoneSunsetHour(): boolean {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= 18 * 60 && mins <= 20 * 60 + 30;
}

export function isLilibeoNightHour(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 5;
}
