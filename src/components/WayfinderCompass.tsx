import React from "react";
import {
  type PoiDefinition,
  getEffectiveUnlockRadius,
  haversineMeters,
} from "../../shared/pois";
import type { RealGpsState } from "../hooks/useRealGps";
import { sound8bit } from "../utils/sound8bit";

interface WayfinderCompassProps {
  targetPoi: PoiDefinition;
  gps: RealGpsState;
  prestige: number;
  onOpenPoi: (poi: PoiDefinition) => void;
  onClearTarget: () => void;
}

function computeBearingDegrees(
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

function cardinalLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(deg / 45) % 8];
}

export const WayfinderCompass: React.FC<WayfinderCompassProps> = ({
  targetPoi,
  gps,
  prestige,
  onOpenPoi,
  onClearTarget,
}) => {
  const hasGps = gps.lat !== null && gps.lng !== null;
  const distance = hasGps
    ? Math.round(
        haversineMeters(gps.lat!, gps.lng!, targetPoi.lat, targetPoi.lng),
      )
    : null;
  const bearing = hasGps
    ? computeBearingDegrees(gps.lat!, gps.lng!, targetPoi.lat, targetPoi.lng)
    : null;

  const arrowRotation =
    bearing !== null
      ? gps.heading !== null
        ? (bearing - gps.heading + 360) % 360
        : bearing
      : 0;

  const effectiveRadius = getEffectiveUnlockRadius(targetPoi, prestige);
  const gpsMargin = Math.min(Math.max(gps.accuracy || 0, 0), 45);
  const inRange = distance !== null && distance <= effectiveRadius + gpsMargin;

  return (
    <div className="fixed bottom-[78px] left-2 right-2 z-[690] pointer-events-none">
      <div
        className={`max-w-xl mx-auto pointer-events-auto border-[3px] px-2.5 py-2 shadow-[4px_4px_0_#000] flex items-center justify-between gap-2 ${
          inRange
            ? "bg-[#102a1d]/95 border-[#38e54d]"
            : "bg-[#141b33]/95 border-[#4cc9f0]"
        }`}
      >
        {/* Quadrante Bussola Pixel */}
        <div className="w-11 h-11 bg-[#0b0e1a] border-2 border-[#ffd166] flex flex-col items-center justify-center shrink-0 relative">
          <span className="font-pixel text-[6px] text-[#94a3b8] leading-none">
            {gps.heading !== null ? "DIR" : "NORD"}
          </span>
          <span
            className="text-xl leading-none text-[#ffd166] transition-transform duration-200 inline-block"
            style={{ transform: `rotate(${arrowRotation}deg)` }}
          >
            ▲
          </span>
          {bearing !== null && (
            <span className="font-pixel text-[6px] text-[#4cc9f0] leading-none">
              {cardinalLabel(bearing)}
            </span>
          )}
        </div>

        {/* Info Tappa e Distanza */}
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-[7px] text-[#ffd166] truncate">
            🧭 ROTTA: {targetPoi.icon} {targetPoi.name}
          </p>
          <p className="text-lg text-white leading-tight truncate">
            {distance === null ? (
              "Attesa segnale GPS..."
            ) : inRange ? (
              <strong className="text-[#38e54d]">
                ✅ SEI IN ZONA ({distance}m)! Scatta ora
              </strong>
            ) : (
              <>
                Distanza:{" "}
                <strong className="text-[#4cc9f0]">{distance}m</strong> (target
                ≤{effectiveRadius}m)
              </>
            )}
          </p>
        </div>

        {/* Azioni */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              sound8bit.click();
              onOpenPoi(targetPoi);
            }}
            className={`nes-btn px-2.5 py-2 text-[8px] ${
              inRange ? "bg-[#38e54d] text-black" : "bg-[#ffd166] text-black"
            }`}
          >
            📸 APRI
          </button>
          <button
            type="button"
            onClick={() => {
              sound8bit.click();
              onClearTarget();
            }}
            className="nes-btn w-8 h-8 bg-[#ff4d6d] text-white text-[8px]"
            title="Chiudi bussola"
          >
            X
          </button>
        </div>
      </div>
    </div>
  );
};
