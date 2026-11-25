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

  // Direzione geografica (0° = Nord) verso il prossimo incrocio/POI
  const targetBearing = hasGps
    ? computeBearingDegrees(gps.lat!, gps.lng!, aimPoint[0], aimPoint[1])
    : null;

  // Direzione verso cui stai puntando col telefono (0° = Nord, stesso riferimento della mappa)
  const phoneHeading = gps.heading;
  const arrowAngle = phoneHeading ?? targetBearing ?? 0;

  const relativeTurn =
    targetBearing !== null && phoneHeading !== null
      ? (targetBearing - phoneHeading + 360) % 360
      : null;

  const effectiveRadius = getEffectiveUnlockRadius(targetPoi, prestige);
  const gpsMargin = Math.min(Math.max(gps.accuracy || 0, 0), 45);
  const inRange =
    airDistance !== null && airDistance <= effectiveRadius + gpsMargin;

  const directionText =
    targetBearing === null
      ? "ATTESA GPS..."
      : relativeTurn !== null
        ? turnInstruction(relativeTurn)
        : `VERSO ${cardinalItalian(targetBearing)}`;

  return (
    <div
      className={`border-[3px] px-2.5 py-2 shadow-[4px_4px_0_#000] flex items-center justify-between gap-2 ${
        inRange
          ? "bg-[#102a1d]/95 border-[#38e54d]"
          : "bg-[#141b33]/95 border-[#ffd166]"
      }`}
    >
      {/* Quadrato Bussola con punti cardinali fissi (N/S/E/O) e freccia contenuta */}
      <button
        type="button"
        onClick={() => {
          sound8bit.click();
          void gps.requestCompassPermission();
        }}
        title="Bussola: tocca per calibrare"
        className="w-14 h-14 bg-[#0b0e1a] border-2 border-[#4cc9f0] relative overflow-hidden shrink-0 flex items-center justify-center p-0"
      >
        {/* Punti cardinali fissi */}
        <span className="absolute top-0.5 left-1/2 -translate-x-1/2 font-pixel text-[7px] text-[#ff4d6d] leading-none pointer-events-none">
          N
        </span>
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 font-pixel text-[7px] text-[#94a3b8] leading-none pointer-events-none">
          S
        </span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 font-pixel text-[7px] text-[#94a3b8] leading-none pointer-events-none">
          O
        </span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 font-pixel text-[7px] text-[#94a3b8] leading-none pointer-events-none">
          E
        </span>

        {/* Anello + Pallino meta + Freccia direzionale contenuta nel quadrato */}
        <svg viewBox="0 0 56 56" className="w-14 h-14 pointer-events-none">
          <circle
            cx="28"
            cy="28"
            r="15"
            fill="none"
            stroke="rgba(76, 201, 240, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* Indicatore direzione della meta sull'anello */}
          {targetBearing !== null && (
            <g transform={`rotate(${targetBearing} 28 28)`}>
              <circle
                cx="28"
                cy="13"
                r="3.2"
                fill="#38e54d"
                stroke="#000000"
                strokeWidth="1.2"
              />
            </g>
          )}

          {/* Freccia direzionale del telefono (sempre entro raggio 14px dal centro) */}
          <g
            transform={`rotate(${arrowAngle} 28 28)`}
            style={{ transition: "transform 160ms linear" }}
          >
            {/* Coda + asta freccia */}
            <rect
              x="26.2"
              y="22"
              width="3.6"
              height="15"
              fill="#ffd166"
              stroke="#000000"
              strokeWidth="1"
            />
            {/* Punta freccia ben definita */}
            <polygon
              points="28,14 21.5,23 34.5,23"
              fill="#ff4d6d"
              stroke="#000000"
              strokeWidth="1.2"
            />
            {/* Perno centrale */}
            <circle
              cx="28"
              cy="28"
              r="2.6"
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="1"
            />
          </g>
        </svg>
      </button>

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
