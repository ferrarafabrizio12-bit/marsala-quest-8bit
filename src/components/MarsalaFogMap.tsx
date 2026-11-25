import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  MARSALA_BOUNDS,
  MARSALA_CENTER,
  MARSALA_POIS,
  type PoiDefinition,
  getAdaptiveFogRadiusMeters,
  haversineMeters,
} from "../../shared/pois";
import type { AvatarConfig } from "../../shared/cosmetics";
import type { RealGpsState } from "../hooks/useRealGps";
import type { UnlockData } from "../types/game";
import { renderAvatarSvgString } from "../utils/avatarPixels";
import type { WalkingRouteData } from "../utils/walkingRoute";
import { sound8bit } from "../utils/sound8bit";

interface MarsalaFogMapProps {
  gps: RealGpsState;
  avatar: AvatarConfig;
  dailyBountyPoiId: string;
  selectedPoi: PoiDefinition | null;
  navTargetPoi: PoiDefinition | null;
  walkingRoute: WalkingRouteData | null;
  unlocks: Record<string, UnlockData>;
  justSyncedPoiId: string | null;
  onSelectPoi: (poi: PoiDefinition) => void;
  onOpenWardrobe: () => void;
  onFitMarsalaTap: () => void;
}

interface SyncPulse {
  x: number;
  y: number;
  r: number;
}

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const MAX_ZOOM = 18;
const FULL_MARSALA_CENTER: [number, number] = [37.813, 12.465];

const getResponsiveMinZoom = (): number =>
  typeof window !== "undefined" && window.innerWidth < 768 ? 11 : 12;

function computeBearing(
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

export const MarsalaFogMap: React.FC<MarsalaFogMapProps> = ({
  gps,
  avatar,
  dailyBountyPoiId,
  selectedPoi,
  navTargetPoi,
  walkingRoute,
  unlocks,
  justSyncedPoiId,
  onSelectPoi,
  onOpenWardrobe,
  onFitMarsalaTap,
}) => {
  const colorContainerRef = useRef<HTMLDivElement | null>(null);
  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const colorMapRef = useRef<L.Map | null>(null);
  const mainMapRef = useRef<L.Map | null>(null);

  const poiMarkersRef = useRef(new Map<string, L.Marker>());
  const playerMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const routeShadowRef = useRef<L.Polyline | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const [minZoom, setMinZoom] = useState<number>(() => getResponsiveMinZoom());

  const minZoomRef = useRef<number>(minZoom);
  minZoomRef.current = minZoom;

  const unlocksRef = useRef(unlocks);
  unlocksRef.current = unlocks;

  const onOpenWardrobeRef = useRef(onOpenWardrobe);
  onOpenWardrobeRef.current = onOpenWardrobe;

  const isMapCompleted = Object.keys(unlocks).length >= MARSALA_POIS.length;
  const showLabels = zoomLevel >= 15;

  // Disegna direttamente sul canvas GPU in mix-blend-mode: color (zero toDataURL, zero flicker)
  const drawFogCanvasAndSync = () => {
    const mainMap = mainMapRef.current;
    const colorMap = colorMapRef.current;
    const canvas = fogCanvasRef.current;
    if (!mainMap || !colorMap || !canvas) return;

    const center = mainMap.getCenter();
    const zoom = mainMap.getZoom();
    setZoomLevel(zoom);

    colorMap.setView(center, zoom, { animate: false });

    const size = mainMap.getSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.round(size.x * dpr));
    const targetH = Math.max(1, Math.round(size.y * dpr));

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, size.x, size.y);

    const currentUnlocks = unlocksRef.current;
    const unlockedCount = Object.keys(currentUnlocks).length;

    // Se tutti i 20 POI sono sbloccati, l'intera mappa resta a colori
    if (unlockedCount >= MARSALA_POIS.length) {
      return;
    }

    // Copertura grigia uniforme su tutta la mappa inesplorata
    ctx.fillStyle = "rgb(128, 128, 128)";
    ctx.fillRect(0, 0, size.x, size.y);

    if (unlockedCount === 0) {
      return;
    }

    // Sottrae le aree dei POI sbloccati con sfumatura morbida (senza cerchi tratteggiati)
    ctx.globalCompositeOperation = "destination-out";

    for (const poi of MARSALA_POIS) {
      if (!currentUnlocks[poi.id]) continue;

      const pt = mainMap.latLngToContainerPoint([poi.lat, poi.lng]);
      const metersPerPixel =
        (156543.03392 * Math.cos((poi.lat * Math.PI) / 180)) /
        Math.pow(2, zoom);
      const radiusMeters = getAdaptiveFogRadiusMeters(poi);
      const r = radiusMeters / metersPerPixel;

      if (
        pt.x + r < 0 ||
        pt.x - r > size.x ||
        pt.y + r < 0 ||
        pt.y - r > size.y
      ) {
        continue;
      }

      const grad = ctx.createRadialGradient(
        pt.x,
        pt.y,
        r * 0.68,
        pt.x,
        pt.y,
        r,
      );
      grad.addColorStop(0, "rgba(0, 0, 0, 1)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    if (
      !colorContainerRef.current ||
      !mainContainerRef.current ||
      mainMapRef.current
    ) {
      return;
    }

    const initialMinZoom = getResponsiveMinZoom();
    minZoomRef.current = initialMinZoom;

    const noZoomOpts: L.MapOptions = {
      center: MARSALA_CENTER,
      zoom: 14,
      minZoom: initialMinZoom,
      maxZoom: MAX_ZOOM,
      zoomControl: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      zoomSnap: 1,
      zoomDelta: 1,
      zoomAnimation: false,
      fadeAnimation: false,
    };

    const colorMap = L.map(colorContainerRef.current, {
      ...noZoomOpts,
      attributionControl: false,
      dragging: false,
    });
    L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(colorMap);

    const mainMap = L.map(mainContainerRef.current, {
      ...noZoomOpts,
      maxBounds: MARSALA_BOUNDS,
      maxBoundsViscosity: 1.0,
    });

    mainMap.attributionControl.setPrefix(
      "© OpenStreetMap • MARSALA QUEST 8-BIT",
    );

    colorMapRef.current = colorMap;
    mainMapRef.current = mainMap;

    const applyMinZoomLock = () => {
      const currentMin = minZoomRef.current;
      const z = mainMap.getZoom();

      if (z <= currentMin) {
        mainMap.dragging.disable();
        const c = mainMap.getCenter();
        if (
          Math.abs(c.lat - FULL_MARSALA_CENTER[0]) > 0.0005 ||
          Math.abs(c.lng - FULL_MARSALA_CENTER[1]) > 0.0005
        ) {
          mainMap.setView(FULL_MARSALA_CENTER, currentMin, { animate: false });
        }
      } else {
        mainMap.dragging.enable();
      }
      drawFogCanvasAndSync();
    };

    const handleSync = () => drawFogCanvasAndSync();
    const handleResize = () => {
      const nextMin = getResponsiveMinZoom();
      minZoomRef.current = nextMin;
      setMinZoom(nextMin);
      mainMap.setMinZoom(nextMin);
      colorMap.setMinZoom(nextMin);
      if (mainMap.getZoom() < nextMin) {
        mainMap.setZoom(nextMin, { animate: false });
      }
      applyMinZoomLock();
    };

    mainMap.on("move", handleSync);
    mainMap.on("zoomend", applyMinZoomLock);
    mainMap.on("resize", handleResize);
    applyMinZoomLock();

    return () => {
      mainMap.off("move", handleSync);
      mainMap.off("zoomend", applyMinZoomLock);
      mainMap.off("resize", handleResize);
      mainMap.remove();
      colorMap.remove();
      mainMapRef.current = null;
      colorMapRef.current = null;
      poiMarkersRef.current.clear();
      playerMarkerRef.current = null;
      accuracyCircleRef.current = null;
      routeShadowRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  useEffect(() => {
    drawFogCanvasAndSync();
  }, [unlocks]);

  useEffect(() => {
    const map = mainMapRef.current;
    if (!map || !selectedPoi) return;
    map.dragging.enable();
    map.setView([selectedPoi.lat, selectedPoi.lng], MAX_ZOOM, {
      animate: false,
    });
  }, [selectedPoi]);

  // Percorso stradale pedonale lungo le vie
  useEffect(() => {
    const map = mainMapRef.current;
    if (!map) return;

    if (routeShadowRef.current) {
      routeShadowRef.current.remove();
      routeShadowRef.current = null;
    }
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (navTargetPoi && gps.lat !== null && gps.lng !== null) {
      const pathCoords: [number, number][] = walkingRoute?.coordinates ?? [
        [gps.lat, gps.lng],
        [navTargetPoi.lat, navTargetPoi.lng],
      ];

      routeShadowRef.current = L.polyline(pathCoords, {
        color: "#0b0e1a",
        weight: 8,
        opacity: 0.9,
        lineCap: "square",
        lineJoin: "miter",
      }).addTo(map);

      routeLineRef.current = L.polyline(pathCoords, {
        color: "#ff4d6d",
        weight: 4,
        dashArray: "10 10",
        opacity: 1,
        lineCap: "square",
        lineJoin: "miter",
      }).addTo(map);
    }
  }, [navTargetPoi, walkingRoute, gps.lat, gps.lng]);

  useEffect(() => {
    const map = mainMapRef.current;
    if (!map) return;

    MARSALA_POIS.forEach((poi) => {
      const unlocked = Boolean(unlocks[poi.id]);
      const isHolo = Boolean(unlocks[poi.id]?.isHolo);
      const isBounty = poi.id === dailyBountyPoiId;
      const isTarget = navTargetPoi?.id === poi.id;

      const dist =
        gps.lat !== null && gps.lng !== null
          ? haversineMeters(gps.lat, gps.lng, poi.lat, poi.lng)
          : null;
      const inRange =
        dist !== null &&
        dist <= poi.unlockRadiusMeters + Math.min(gps.accuracy || 0, 45);

      const bg = unlocked
        ? isHolo
          ? "#e879f9"
          : "#ffd166"
        : inRange
          ? "#38e54d"
          : isBounty
            ? "#9333ea"
            : "#1e293b";
      const border = isTarget
        ? "#ff4d6d"
        : isBounty
          ? "#f0abfc"
          : unlocked
            ? "#ffffff"
            : inRange
              ? "#fef08a"
              : "#94a3b8";
      const symbol =
        isBounty && !unlocked ? "🎯" : unlocked ? "★" : inRange ? "!" : "?";
      const symbolColor = unlocked || inRange ? "#000000" : "#ffd166";
      const bounce =
        isBounty || isTarget
          ? "bounty-pulse"
          : inRange && !unlocked
            ? "pixel-bounce"
            : "";
      const shouldShowLabel = showLabels || inRange || isTarget;
      const boxSize = shouldShowLabel ? 34 : 26;
      const fontSize = shouldShowLabel ? 13 : 10;

      const labelHtml = shouldShowLabel
        ? `<span style="
            margin-top: 3px;
            background: rgba(11, 14, 26, 0.94);
            color: ${unlocked ? "#ffd166" : inRange ? "#38e54d" : "#e2e8f0"};
            border: 2px solid ${isTarget ? "#ff4d6d" : unlocked ? "#ffd166" : "#000"};
            padding: 0px 5px;
            font-family: 'VT323', monospace;
            font-size: 15px;
            line-height: 1.15;
            white-space: nowrap;
            box-shadow: 2px 2px 0 #000;
          ">${poi.icon} ${poi.name}</span>`
        : "";

      const html = `
        <div class="relative flex flex-col items-center ${bounce}" style="transform: translate(-50%, -50%); cursor: pointer;">
          <div style="
            width: ${boxSize}px;
            height: ${boxSize}px;
            background: ${bg};
            border: 3px solid ${border};
            box-shadow: inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.4), 3px 3px 0 #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Press Start 2P', monospace;
            font-size: ${fontSize}px;
            color: ${symbolColor};
          ">
            ${symbol}
          </div>
          ${labelHtml}
        </div>
      `;

      const icon = L.divIcon({
        className: "bg-transparent border-0",
        html,
        iconSize: [0, 0],
      });

      const existing = poiMarkersRef.current.get(poi.id);
      if (existing) {
        existing.setIcon(icon);
        existing.setZIndexOffset(
          isTarget ? 700 : inRange ? 650 : unlocked ? 540 : 480,
        );
      } else {
        const marker = L.marker([poi.lat, poi.lng], {
          icon,
          zIndexOffset: isTarget ? 700 : inRange ? 650 : unlocked ? 540 : 480,
        }).addTo(map);
        marker.on("click", () => {
          sound8bit.click();
          map.dragging.enable();
          map.setView([poi.lat, poi.lng], MAX_ZOOM, { animate: false });
          onSelectPoi(poi);
        });
        poiMarkersRef.current.set(poi.id, marker);
      }
    });
  }, [
    unlocks,
    gps.lat,
    gps.lng,
    gps.accuracy,
    showLabels,
    dailyBountyPoiId,
    navTargetPoi,
    onSelectPoi,
  ]);

  // Avatar giocatore + Freccia direzionale dietro allo sprite
  useEffect(() => {
    const map = mainMapRef.current;
    if (!map || gps.lat === null || gps.lng === null) return;

    const avatarSvg = renderAvatarSvgString(avatar, 36, 44);

    const fallbackAim =
      walkingRoute?.nextWaypoint ??
      (navTargetPoi ? [navTargetPoi.lat, navTargetPoi.lng] : null);
    const arrowDeg =
      gps.heading !== null
        ? gps.heading
        : fallbackAim
          ? computeBearing(gps.lat, gps.lng, fallbackAim[0], fallbackAim[1])
          : 0;

    const arrowHtml = `
      <div style="
        position: absolute;
        top: 24px;
        left: 50%;
        width: 84px;
        height: 84px;
        transform: translate(-50%, -50%) rotate(${arrowDeg}deg);
        transition: transform 160ms linear;
        pointer-events: none;
        z-index: 1;
      ">
        <svg viewBox="0 0 84 84" width="84" height="84">
          <rect
            x="39.75"
            y="16"
            width="4.5"
            height="26"
            fill="#ffd166"
            stroke="#000000"
            stroke-width="1.8"
          />
          <polygon
            points="42,4 33,17 51,17"
            fill="#ff4d6d"
            stroke="#000000"
            stroke-width="2"
          />
        </svg>
      </div>
    `;

    const playerIcon = L.divIcon({
      className: "bg-transparent border-0",
      html: `
        <div
          style="transform: translate(-50%, -62%); position: relative; cursor: pointer;"
          class="flex flex-col items-center"
          title="Tocca per personalizzare il tuo Look"
        >
          ${arrowHtml}
          <div style="position: relative; z-index: 10;" class="flex flex-col items-center">
            ${avatarSvg}
            <span style="
              margin-top: -2px;
              background: #4cc9f0;
              color: #000;
              font-family: 'Press Start 2P', monospace;
              font-size: 7px;
              padding: 1px 4px;
              border: 2px solid #000;
              box-shadow: 2px 2px 0 #000;
            ">TU</span>
          </div>
        </div>
      `,
      iconSize: [0, 0],
    });

    if (!playerMarkerRef.current) {
      const marker = L.marker([gps.lat, gps.lng], {
        icon: playerIcon,
        zIndexOffset: 900,
      }).addTo(map);
      marker.on("click", () => {
        sound8bit.click();
        void gps.requestCompassPermission();
        onOpenWardrobeRef.current();
      });
      playerMarkerRef.current = marker;
    } else {
      playerMarkerRef.current.setLatLng([gps.lat, gps.lng]);
      playerMarkerRef.current.setIcon(playerIcon);
    }

    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle([gps.lat, gps.lng], {
        radius: gps.accuracy || 20,
        color: "#4cc9f0",
        fillColor: "#4cc9f0",
        fillOpacity: 0.14,
        weight: 2,
        dashArray: "4 4",
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng([gps.lat, gps.lng]);
      accuracyCircleRef.current.setRadius(gps.accuracy || 20);
    }
  }, [
    gps.lat,
    gps.lng,
    gps.accuracy,
    gps.heading,
    avatar,
    navTargetPoi,
    walkingRoute,
  ]);

  let syncPulse: SyncPulse | null = null;
  if (justSyncedPoiId && mainMapRef.current) {
    const syncedPoi = MARSALA_POIS.find((p) => p.id === justSyncedPoiId);
    if (syncedPoi) {
      const pt = mainMapRef.current.latLngToContainerPoint([
        syncedPoi.lat,
        syncedPoi.lng,
      ]);
      const metersPerPixel =
        (156543.03392 * Math.cos((syncedPoi.lat * Math.PI) / 180)) /
        Math.pow(2, zoomLevel);
      syncPulse = {
        x: pt.x,
        y: pt.y,
        r: getAdaptiveFogRadiusMeters(syncedPoi) / metersPerPixel,
      };
    }
  }

  const hasCompassBar = Boolean(navTargetPoi && !selectedPoi);
  const baseBottomPx = isMapCompleted ? 118 : 80;
  const controlsBottomPx = hasCompassBar ? baseBottomPx + 88 : baseBottomPx;

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#0b0e1a]"
      style={{ isolation: "isolate" }}
    >
      {/* Mappa base a colori */}
      <div
        ref={colorContainerRef}
        className="absolute inset-0 z-0 pointer-events-none marsala-color-map"
      />

      {/* Nebbia grigia sincronizzata su GPU senza flicker */}
      <canvas
        ref={fogCanvasRef}
        style={{ mixBlendMode: "color" }}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />

      {/* Onda d'urto momentanea solo all'atto dello sblocco */}
      {syncPulse && (
        <svg className="absolute inset-0 w-full h-full z-[15] pointer-events-none">
          <circle
            cx={syncPulse.x}
            cy={syncPulse.y}
            r={syncPulse.r * 0.65}
            fill="none"
            stroke="#ffd166"
            strokeWidth="6"
            className="sync-shockwave"
            style={{ transformOrigin: `${syncPulse.x}px ${syncPulse.y}px` }}
          />
        </svg>
      )}

      {/* Layer interattivo marker & percorsi */}
      <div
        ref={mainContainerRef}
        className="absolute inset-0 z-20 marsala-main-map"
      />

      {/* Controlli Zoom / Mappa / GPS */}
      <div
        style={{
          bottom: `calc(${controlsBottomPx}px + env(safe-area-inset-bottom, 0px))`,
        }}
        className="absolute right-2.5 flex flex-col gap-1.5 z-[600] transition-all duration-200"
      >
        <button
          disabled={zoomLevel >= MAX_ZOOM}
          onClick={() => {
            sound8bit.click();
            mainMapRef.current?.zoomIn(1, { animate: false });
          }}
          title="Zoom In"
          className="nes-btn w-12 h-12 bg-[#141b33] text-[#ffd166] text-base flex items-center justify-center disabled:opacity-40"
        >
          +
        </button>
        <div className="bg-[#0b0e1a]/95 border-2 border-[#f4f1de] text-center font-pixel text-[7px] py-0.5 text-[#4cc9f0]">
          Z{zoomLevel}
        </div>
        <button
          disabled={zoomLevel <= minZoom}
          onClick={() => {
            sound8bit.click();
            mainMapRef.current?.zoomOut(1, { animate: false });
          }}
          title="Zoom Out"
          className="nes-btn w-12 h-12 bg-[#141b33] text-[#ffd166] text-base flex items-center justify-center disabled:opacity-40"
        >
          -
        </button>
        <button
          onClick={() => {
            sound8bit.click();
            mainMapRef.current?.setView(FULL_MARSALA_CENTER, minZoom, {
              animate: false,
            });
            onFitMarsalaTap();
          }}
          title="Mostra tutta Marsala"
          className="nes-btn w-12 h-12 bg-[#26335c] text-[#38e54d] text-lg flex items-center justify-center"
        >
          🗺️
        </button>
        <button
          onClick={() => {
            sound8bit.click();
            void gps.requestCompassPermission();
            if (gps.lat !== null && gps.lng !== null) {
              mainMapRef.current?.setView([gps.lat, gps.lng], 16, {
                animate: false,
              });
            } else {
              gps.retry();
            }
          }}
          title="Centra su di me (GPS)"
          className="nes-btn w-12 h-12 bg-[#4cc9f0] text-black text-lg flex items-center justify-center"
        >
          🎯
        </button>
      </div>
    </div>
  );
};
