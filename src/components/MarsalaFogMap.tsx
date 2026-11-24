import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  MARSALA_BOUNDS,
  MARSALA_CENTER,
  MARSALA_POIS,
  type PoiDefinition,
  haversineMeters,
} from "../../shared/pois";
import type { RealGpsState } from "../hooks/useRealGps";
import type { UnlockData } from "../types/game";
import { sound8bit } from "../utils/sound8bit";

interface MarsalaFogMapProps {
  gps: RealGpsState;
  unlocks: Record<string, UnlockData>;
  justSyncedPoiId: string | null;
  onSelectPoi: (poi: PoiDefinition) => void;
}

interface ScreenCircle {
  id: string;
  x: number;
  y: number;
  r: number;
}

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MarsalaFogMap: React.FC<MarsalaFogMapProps> = ({
  gps,
  unlocks,
  justSyncedPoiId,
  onSelectPoi,
}) => {
  const colorContainerRef = useRef<HTMLDivElement | null>(null);
  const greyContainerRef = useRef<HTMLDivElement | null>(null);
  const mainContainerRef = useRef<HTMLDivElement | null>(null);

  const colorMapRef = useRef<L.Map | null>(null);
  const greyMapRef = useRef<L.Map | null>(null);
  const mainMapRef = useRef<L.Map | null>(null);

  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const poiMarkersRef = useRef(new Map<string, L.Marker>());
  const playerMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  const [rings, setRings] = useState<ScreenCircle[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(14);

  const unlocksRef = useRef(unlocks);
  unlocksRef.current = unlocks;

  const isMapCompleted = Object.keys(unlocks).length >= MARSALA_POIS.length;

  // Ricalcola la maschera grigio -> colore su ogni movimento/zoom o nuovo sblocco
  const updateFogAndSync = () => {
    const mainMap = mainMapRef.current;
    const colorMap = colorMapRef.current;
    const greyMap = greyMapRef.current;
    const greyEl = greyContainerRef.current;
    if (!mainMap || !colorMap || !greyMap || !greyEl) return;

    const center = mainMap.getCenter();
    const zoom = mainMap.getZoom();
    setZoomLevel(zoom);

    colorMap.setView(center, zoom, { animate: false });
    greyMap.setView(center, zoom, { animate: false });

    const currentUnlocks = unlocksRef.current;
    const unlockedCount = Object.keys(currentUnlocks).length;

    // 100% completato: nessuna nebbia grigia
    if (unlockedCount >= MARSALA_POIS.length) {
      greyEl.style.opacity = "0";
      greyEl.style.maskImage = "none";
      greyEl.style.setProperty("-webkit-mask-image", "none");
      setRings([]);
      return;
    }

    greyEl.style.opacity = "1";

    // 0 punti sbloccati: 100% mappa grigia senza alcun buco
    if (unlockedCount === 0) {
      greyEl.style.maskImage = "none";
      greyEl.style.setProperty("-webkit-mask-image", "none");
      setRings([]);
      return;
    }

    const size = mainMap.getSize();
    const scale = 3; // 1/3 risoluzione per 60fps fluidi su smartphone e PC
    const cw = Math.max(1, Math.ceil(size.x / scale));
    const ch = Math.max(1, Math.ceil(size.y / scale));

    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement("canvas");
    }
    const canvas = maskCanvasRef.current;
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    const ctx = canvas.getContext("2d")!;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, cw, ch);
    // Nero opaco = mostra la mappa GRIGIA ovunque
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, cw, ch);

    // Ritaglia buchi trasparenti SOLO attorno ai POI sbloccati -> rivela la mappa a COLORI sotto
    ctx.globalCompositeOperation = "destination-out";

    const nextRings: ScreenCircle[] = [];
    for (const poi of MARSALA_POIS) {
      if (!currentUnlocks[poi.id]) continue;
      const pt = mainMap.latLngToContainerPoint([poi.lat, poi.lng]);
      const metersPerPixel =
        (156543.03392 * Math.cos((poi.lat * Math.PI) / 180)) /
        Math.pow(2, zoom);
      const r = poi.fogRevealRadiusMeters / metersPerPixel;

      nextRings.push({ id: poi.id, x: pt.x, y: pt.y, r });

      const cx = pt.x / scale;
      const cy = pt.y / scale;
      const cr = Math.max(2, r / scale);

      const grad = ctx.createRadialGradient(cx, cy, cr * 0.72, cx, cy, cr);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }

    const maskUrl = `url(${canvas.toDataURL("image/png")})`;
    greyEl.style.maskImage = maskUrl;
    greyEl.style.setProperty("-webkit-mask-image", maskUrl);
    greyEl.style.maskSize = "100% 100%";
    greyEl.style.setProperty("-webkit-mask-size", "100% 100%");
    greyEl.style.maskRepeat = "no-repeat";
    greyEl.style.setProperty("-webkit-mask-repeat", "no-repeat");

    setRings(nextRings);
  };

  // Inizializza i 3 layer Leaflet sincronizzati su tutta Marsala
  useEffect(() => {
    if (
      !colorContainerRef.current ||
      !greyContainerRef.current ||
      !mainContainerRef.current ||
      mainMapRef.current
    ) {
      return;
    }

    const sharedStaticOpts: L.MapOptions = {
      center: MARSALA_CENTER,
      zoom: 14,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: MARSALA_BOUNDS,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      zoomAnimation: false,
      fadeAnimation: false,
    };

    const colorMap = L.map(colorContainerRef.current, sharedStaticOpts);
    L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(colorMap);

    const greyMap = L.map(greyContainerRef.current, sharedStaticOpts);
    L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(greyMap);

    const mainMap = L.map(mainContainerRef.current, {
      center: MARSALA_CENTER,
      zoom: 14,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: MARSALA_BOUNDS,
      maxBoundsViscosity: 0.85,
      zoomControl: false,
      zoomAnimation: false,
      fadeAnimation: false,
    });

    mainMap.attributionControl.setPrefix(
      "© OpenStreetMap • MARSALA QUEST 8-BIT",
    );

    colorMapRef.current = colorMap;
    greyMapRef.current = greyMap;
    mainMapRef.current = mainMap;

    const handleSync = () => updateFogAndSync();
    mainMap.on("move zoom zoomend resize", handleSync);
    updateFogAndSync();

    return () => {
      mainMap.off("move zoom zoomend resize", handleSync);
      mainMap.remove();
      greyMap.remove();
      colorMap.remove();
      mainMapRef.current = null;
      greyMapRef.current = null;
      colorMapRef.current = null;
      poiMarkersRef.current.clear();
      playerMarkerRef.current = null;
      accuracyCircleRef.current = null;
    };
  }, []);

  // Aggiorna la maschera appena cambiano gli sblocchi
  useEffect(() => {
    updateFogAndSync();
  }, [unlocks]);

  // Marker Pixel-Art 8-Bit dei 20 POI reali di Marsala
  useEffect(() => {
    const map = mainMapRef.current;
    if (!map) return;

    MARSALA_POIS.forEach((poi) => {
      const unlocked = Boolean(unlocks[poi.id]);
      const dist =
        gps.lat !== null && gps.lng !== null
          ? haversineMeters(gps.lat, gps.lng, poi.lat, poi.lng)
          : null;
      const inRange =
        dist !== null &&
        dist <= poi.unlockRadiusMeters + Math.min(gps.accuracy || 0, 45);

      const bg = unlocked ? "#ffd166" : inRange ? "#38e54d" : "#1e293b";
      const border = unlocked ? "#ffffff" : inRange ? "#fef08a" : "#94a3b8";
      const symbol = unlocked ? "★" : inRange ? "!" : "?";
      const symbolColor = unlocked || inRange ? "#000000" : "#ffd166";
      const bounce = inRange && !unlocked ? "pixel-bounce" : "";

      const html = `
        <div class="relative flex flex-col items-center ${bounce}" style="transform: translate(-50%, -50%); cursor: pointer;">
          <div style="
            width: 34px;
            height: 34px;
            background: ${bg};
            border: 3px solid ${border};
            box-shadow: inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.4), 3px 3px 0 #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Press Start 2P', monospace;
            font-size: 13px;
            color: ${symbolColor};
          ">
            ${symbol}
          </div>
          <span style="
            margin-top: 3px;
            background: rgba(11, 14, 26, 0.94);
            color: ${unlocked ? "#ffd166" : inRange ? "#38e54d" : "#e2e8f0"};
            border: 2px solid ${unlocked ? "#ffd166" : "#000"};
            padding: 0px 5px;
            font-family: 'VT323', monospace;
            font-size: 15px;
            line-height: 1.15;
            white-space: nowrap;
            box-shadow: 2px 2px 0 #000;
          ">${poi.icon} ${poi.name}</span>
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
      } else {
        const marker = L.marker([poi.lat, poi.lng], {
          icon,
          zIndexOffset: unlocked ? 520 : inRange ? 600 : 480,
        }).addTo(map);
        marker.on("click", () => {
          sound8bit.click();
          onSelectPoi(poi);
        });
        poiMarkersRef.current.set(poi.id, marker);
      }
    });
  }, [unlocks, gps.lat, gps.lng, gps.accuracy, onSelectPoi]);

  // Sprite 8-Bit dell'Esploratore sulla posizione GPS reale
  useEffect(() => {
    const map = mainMapRef.current;
    if (!map || gps.lat === null || gps.lng === null) return;

    const playerIcon = L.divIcon({
      className: "bg-transparent border-0",
      html: `
        <div style="transform: translate(-50%, -50%);" class="flex flex-col items-center">
          <svg width="30" height="34" viewBox="0 0 12 14" style="image-rendering: pixelated; filter: drop-shadow(2px 2px 0 #000);">
            <rect x="3" y="0" width="6" height="2" fill="#ff4d6d"/>
            <rect x="2" y="2" width="8" height="2" fill="#ff4d6d"/>
            <rect x="3" y="4" width="6" height="3" fill="#ffcdb2"/>
            <rect x="4" y="5" width="1" height="1" fill="#000"/>
            <rect x="7" y="5" width="1" height="1" fill="#000"/>
            <rect x="2" y="7" width="8" height="4" fill="#4cc9f0"/>
            <rect x="3" y="11" width="2" height="3" fill="#1e293b"/>
            <rect x="7" y="11" width="2" height="3" fill="#1e293b"/>
          </svg>
          <span style="
            background: #4cc9f0;
            color: #000;
            font-family: 'Press Start 2P', monospace;
            font-size: 7px;
            padding: 1px 4px;
            border: 2px solid #000;
          ">TU</span>
        </div>
      `,
      iconSize: [0, 0],
    });

    if (!playerMarkerRef.current) {
      playerMarkerRef.current = L.marker([gps.lat, gps.lng], {
        icon: playerIcon,
        zIndexOffset: 900,
      }).addTo(map);
    } else {
      playerMarkerRef.current.setLatLng([gps.lat, gps.lng]);
    }

    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle([gps.lat, gps.lng], {
        radius: gps.accuracy || 20,
        color: "#4cc9f0",
        fillColor: "#4cc9f0",
        fillOpacity: 0.16,
        weight: 2,
        dashArray: "4 4",
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng([gps.lat, gps.lng]);
      accuracyCircleRef.current.setRadius(gps.accuracy || 20);
    }
  }, [gps.lat, gps.lng, gps.accuracy]);

  const syncedRing = justSyncedPoiId
    ? rings.find((r) => r.id === justSyncedPoiId)
    : null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0b0e1a]">
      {/* LAYER 1: Mappa di Marsala a COLORI (rivelata solo dove la maschera grigia si apre) */}
      <div
        ref={colorContainerRef}
        className="absolute inset-0 z-0 pointer-events-none marsala-color-map"
      />

      {/* LAYER 2: Mappa di Marsala GRIGIA (mascherata dinamicamente via Canvas 2D) */}
      <div
        ref={greyContainerRef}
        className="absolute inset-0 z-10 pointer-events-none marsala-grey-map transition-opacity duration-1000"
      />

      {/* LAYER 3: Bordi dorati 8-bit delle aree colorate + onda sincronizzazione */}
      <svg className="absolute inset-0 w-full h-full z-[15] pointer-events-none">
        {!isMapCompleted &&
          rings.map((c) => (
            <circle
              key={`ring-${c.id}`}
              cx={c.x}
              cy={c.y}
              r={Math.max(c.r - 3, 4)}
              fill="none"
              stroke="rgba(255, 209, 102, 0.72)"
              strokeWidth="2.5"
              strokeDasharray="8 6"
            />
          ))}
        {syncedRing && (
          <circle
            cx={syncedRing.x}
            cy={syncedRing.y}
            r={syncedRing.r * 0.65}
            fill="none"
            stroke="#ffd166"
            strokeWidth="6"
            className="sync-shockwave"
            style={{ transformOrigin: `${syncedRing.x}px ${syncedRing.y}px` }}
          />
        )}
      </svg>

      {/* LAYER 4: Mappa interattiva trasparente (drag, zoom, marker 8-bit e GPS) */}
      <div
        ref={mainContainerRef}
        className="absolute inset-0 z-20 marsala-main-map"
      />

      {/* Controlli Zoom & GPS posizionati sopra la Bottom Dock per uso a una mano */}
      <div className="absolute right-2.5 bottom-24 flex flex-col gap-2 z-[600]">
        <button
          onClick={() => {
            sound8bit.click();
            mainMapRef.current?.zoomIn();
          }}
          title="Zoom In"
          className="nes-btn w-12 h-12 bg-[#141b33] text-[#ffd166] text-base flex items-center justify-center"
        >
          +
        </button>
        <div className="bg-[#0b0e1a]/95 border-2 border-[#f4f1de] text-center font-pixel text-[7px] py-0.5 text-[#4cc9f0]">
          Z{zoomLevel}
        </div>
        <button
          onClick={() => {
            sound8bit.click();
            mainMapRef.current?.zoomOut();
          }}
          title="Zoom Out"
          className="nes-btn w-12 h-12 bg-[#141b33] text-[#ffd166] text-base flex items-center justify-center"
        >
          -
        </button>
        <button
          onClick={() => {
            sound8bit.click();
            mainMapRef.current?.fitBounds(
              [
                [37.725, 12.42],
                [37.912, 12.52],
              ],
              { padding: [35, 35], animate: false },
            );
          }}
          title="Mostra tutta Marsala"
          className="nes-btn w-12 h-12 bg-[#26335c] text-[#38e54d] text-lg flex items-center justify-center"
        >
          🗺️
        </button>
        <button
          onClick={() => {
            sound8bit.click();
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
