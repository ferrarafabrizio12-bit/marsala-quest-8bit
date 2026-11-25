import React from "react";
import {
  type PoiDefinition,
  getEffectiveUnlockRadius,
  haversineMeters,
} from "../../shared/pois";
import type { RealGpsState } from "../hooks/useRealGps";
import type { WalkingRouteData } from "../utils/walkingRoute";
import { sound8bit } from "../utils/sound8bit";

interface WayfinderCompassProps {
  targetPoi: PoiDefinition;
  walkingRoute: WalkingRouteData | null;
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

function cardinalItalian(deg: number): string {
  const dirs = [
    "NORD",
    "NORD-EST",
    "EST",
    "SUD-EST",
    "SUD",
    "SUD-OVEST",
    "OVEST",
    "NORD-OVEST",
  ];
  return dirs[Math.round(deg / 45) % 8];
}

function turnInstruction(relativeDeg: number): string {
  if (relativeDeg >= 330 || relativeDeg <= 30) return "⬆️ VAI DRITTO";
  if (relativeDeg > 30 && relativeDeg <= 125) return "↗️ GIRA A DESTRA";
  if (relativeDeg >= 235 && relativeDeg < 330) return "↖️ GIRA A SINISTRA";
  return "⬇️ DIETRO DI TE";
}

export const WayfinderCompass: React.FC<WayfinderCompassProps> = ({
  targetPoi,
  walkingRoute,
  gps,
  prestige,
  onOpenPoi,
  onClearTarget,
}) => {
  const hasGps = gps.lat !== null && gps.lng !== null;
  const airDistance = hasGps
    ? Math.round(
        haversineMeters(gps.lat!, gps.lng!, targetPoi.lat, targetPoi.lng),
      )
    : null;

  const displayDistance = walkingRoute
    ? walkingRoute.distanceMeters
    : airDistance;
  const aimPoint = walkingRoute?.nextWaypoint ?? [targetPoi.lat, targetPoi.lng];

  const bearing = hasGps
    ? computeBearingDegrees(gps.lat!, gps.lng!, aimPoint[0], aimPoint[1])
    : null;

  const hasOrientation = gps.heading !== null;
  const relativeAngle =
    bearing !== null
      ? hasOrientation
        ? (bearing - gps.heading! + 360) % 360
        : bearing
      : 0;

  const effectiveRadius = getEffectiveUnlockRadius(targetPoi, prestige);
  const gpsMargin = Math.min(Math.max(gps.accuracy || 0, 0), 45);
  const inRange =
    airDistance !== null && airDistance <= effectiveRadius + gpsMargin;

  const directionText =
    bearing === null
      ? "ATTESA GPS..."
      : hasOrientation
        ? turnInstruction(relativeAngle)
        : `VERSO ${cardinalItalian(bearing)}`;

  return (
    <div
      className={`border-[3px] px-2.5 py-2 shadow-[4px_4px_0_#000] flex items-center justify-between gap-2 ${
        inRange
          ? "bg-[#102a1d]/95 border-[#38e54d]"
          : "bg-[#141b33]/95 border-[#ffd166]"
      }`}
    >
      {/* Freccia Direzionale Grande e Chiara */}
      <div className="w-12 h-12 bg-[#0b0e1a] border-2 border-[#4cc9f0] flex flex-col items-center justify-center shrink-0">
        <span
          className="text-2xl leading-none text-[#ff4d6d] transition-transform duration-200 inline-block drop-shadow-[0_0_4px_rgba(255,209,102,0.8)]"
          style={{ transform: `rotate(${relativeAngle}deg)` }}
        >
          ▲
        </span>
        <span className="font-pixel text-[6px] text-[#ffd166] mt-1 leading-none">
          {hasOrientation ? "TU ▲" : "MAPPA"}
        </span>
      </div>

      {/* Info Strada, Direzione e Distanza */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-pixel text-[7px] text-[#ffd166] truncate">
            {targetPoi.icon} {targetPoi.name}
          </span>
        </div>

        <p className="font-pixel text-[8px] text-[#4cc9f0] leading-snug mt-0.5 truncate">
          {inRange ? "✅ SEI ARRIVATO!" : directionText}
        </p>

        <p className="text-lg text-white leading-none mt-0.5 truncate">
          {displayDistance === null ? (
            "Calcolo percorso..."
          ) : inRange ? (
            <strong className="text-[#38e54d]">
              Tocca APRI per scattare ({airDistance}m)
            </strong>
          ) : (
            <>
              <strong>{displayDistance}m</strong> a piedi
              {walkingRoute ? ` (~${walkingRoute.durationMinutes} min)` : ""}
            </>
          )}
        </p>
      </div>

      {/* Pulsanti Azione */}
      <div className="flex items-center gap-1.5 shrink-0">
        {gps.compassPermission === "prompt" && (
          <button
            type="button"
            onClick={() => {
              sound8bit.click();
              void gps.requestCompassPermission();
            }}
            className="nes-btn px-2 py-2 bg-[#4cc9f0] text-black text-[7px]"
            title="Attiva bussola telefono"
          >
            🧭
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            sound8bit.click();
            onOpenPoi(targetPoi);
          }}
          className={`nes-btn px-2.5 py-2.5 text-[8px] ${
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
          className="nes-btn w-9 h-9 bg-[#ff4d6d] text-white text-[9px]"
          title="Chiudi percorso"
        >
          X
        </button>
      </div>
    </div>
  );
};
