import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MARSALA_BOUNDS,
  MARSALA_CENTER,
  MARSALA_POIS,
  type PoiDefinition,
  haversineMeters,
} from '../../shared/pois';
import type { AvatarConfig } from '../../shared/cosmetics';
import type { RealGpsState } from '../hooks/useRealGps';
import type { UnlockData } from '../types/game';
import { renderAvatarSvgString } from '../utils/avatarPixels';
import { sound8bit } from '../utils/sound8bit';

interface MarsalaFogMapProps {
  gps: RealGpsState;
  avatar: AvatarConfig;
  dailyBountyPoiId: string;
  unlocks: Record<string, UnlockData>;
  justSyncedPoiId: string | null;
  onSelectPoi: (poi: PoiDefinition) => void;
  onFitMarsalaTap: () => void;
}

interface ScreenCircle {
  id: string;
  x: number;
  y: number;
  r: number;
}

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MarsalaFogMap: React.FC<MarsalaFogMapProps> = ({
  gps,
  avatar,
  dailyBountyPoiId,
  unlocks,
  justSyncedPoiId,
  onSelectPoi,
  onFitMarsalaTap,
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
  const showLabels = zoomLevel >= 15;

  const updateFogAndSync = (syncView = true) => {
    const mainMap = mainMapRef.current;
    const colorMap = colorMapRef.current;
    const greyMap = greyMapRef.current;
    const greyEl = greyContainerRef.current;
    if (!mainMap || !colorMap || !greyMap || !greyEl) return;

    const center = mainMap.getCenter();
    const zoom = mainMap.getZoom();
    setZoomLevel(zoom);

    if (syncView) {
      colorMap.setView(center, zoom, { animate: false });
      greyMap.setView(center, zoom, { animate: false });
    }

    const mainPane = mainMap.getPane('mapPane');
    const colorPane = colorMap.getPane('mapPane');
    const greyPane = greyMap.getPane('mapPane');
    if (mainPane && colorPane && greyPane) {
      colorPane.style.transform = mainPane.style.transform;
      greyPane.style.transform = mainPane.style.transform;
    }

    const currentUnlocks = unlocksRef.current;
    const unlockedCount = Object.keys(currentUnlocks).length;

    if (unlockedCount >= MARSALA_POIS.length) {
      greyEl.style.opacity = '0';
      greyEl.style.maskImage = 'none';
      greyEl.style.setProperty('-webkit-mask-image', 'none');
      setRings([]);
      return;
    }

    greyEl.style.opacity = '1';

    if (unlockedCount === 0) {
      greyEl.style.maskImage = 'none';
      greyEl.style.setProperty('-webkit-mask-image', 'none');
      setRings([]);
      return;
    }

    const size = mainMap.getSize();
    const scale = 3;
    const cw = Math.max(1, Math.ceil(size.x / scale));
    const ch = Math.max(1, Math.ceil(size.y / scale));

    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement('canvas');
    }
    const canvas = maskCanvasRef.current;
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    const ctx = canvas.getContext('2d')!;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cw, ch);

    ctx.globalCompositeOperation = 'destination-out';

    const nextRings: ScreenCircle[] = [];
    for (const poi of MARSALA_POIS) {
      if (!currentUnlocks[poi.id]) continue;
      const pt = mainMap.latLngToContainerPoint([poi.lat, poi.lng]);
      const metersPerPixel =
        (156543.03392 * Math.cos((poi.lat * Math.PI) / 180)) / Math.pow(2, zoom);
      const r = poi.fogRevealRadiusMeters / metersPerPixel;

      nextRings.push({ id: poi.id, x: pt.x, y: pt.y, r });

      const cx = pt.x / scale;
      const cy = pt.y / scale;
      const cr = Math.max(2, r / scale);

      const grad = ctx.createRadialGradient(cx, cy, cr * 0.72, cx, cy, cr);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }

    const maskUrl = `url(${canvas.toDataURL('image/png')})`;
    greyEl.style.maskImage = maskUrl;
    greyEl.style.setProperty('-webkit-mask-image', maskUrl);
    greyEl.style.maskSize = '100% 100%';
    greyEl.style.setProperty('-webkit-mask-size', '100% 100%');
    greyEl.style.maskRepeat = 'no-repeat';
    greyEl.style.setProperty('-webkit-mask-repeat', 'no-repeat');

    setRings(nextRings);
  };

  useEffect(() => {
    if (
      !colorContainerRef.current ||
      !greyContainerRef.current ||
      !mainContainerRef.current ||
      mainMapRef.current
    ) {
      return;
    }

    const sharedBoundsOpts: L.MapOptions = {
      center: MARSALA_CENTER,
      zoom: 14,
      minZoom: 10,
      maxZoom: 18,
      maxBounds: MARSALA_BOUNDS,
      maxBoundsViscosity: 1.0,
      inertia: false,
      zoomControl: false,
      zoomAnimation: false,
      fadeAnimation: false,
    };

    const sharedStaticOpts: L.MapOptions = {
      ...sharedBoundsOpts,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    };

    const colorMap = L.map(colorContainerRef.current, sharedStaticOpts);
    L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(colorMap);

    const greyMap = L.map(greyContainerRef.current, sharedStaticOpts);
    L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(greyMap);

    const mainMap = L.map(mainContainerRef.current, sharedBoundsOpts);
    mainMap.attributionControl.setPrefix('© OpenStreetMap • MARSALA QUEST 8-BIT');

    colorMapRef.current = colorMap;
    greyMapRef.current = greyMap;
    mainMapRef.current = mainMap;

    const boundsObj = L.latLngBounds(MARSALA_BOUNDS);

    // Permette zoom-out completo su tutta Marsala e blocca il drag se l'area entra già nello schermo
    const syncFullMarsalaZoom = () => {
      const fullMarsalaZoom = Math.max(10, mainMap.getBoundsZoom(MARSALA_BOUNDS, false));
      mainMap.setMinZoom(fullMarsalaZoom);
      colorMap.setMinZoom(fullMarsalaZoom);
      greyMap.setMinZoom(fullMarsalaZoom);
      if (mainMap.getZoom() < fullMarsalaZoom) {
        mainMap.setZoom(fullMarsalaZoom, { animate: false });
      }

      const nw = mainMap.latLngToContainerPoint(boundsObj.getNorthWest());
      const se = mainMap.latLngToContainerPoint(boundsObj.getSouthEast());
      const size = mainMap.getSize();
      const fitsCompletely = se.x - nw.x <= size.x + 2 && se.y - nw.y <= size.y + 2;

      if (fitsCompletely) {
        mainMap.dragging.disable();
      } else {
        mainMap.dragging.enable();
      }

      updateFogAndSync(true);
    };

    // Blocco rigido frame-per-frame mentre tieni premuto il mouse/dito per trascinare
    const draggable = (mainMap.dragging as unknown as { _draggable?: L.Draggable })._draggable;
    let dragStartPanePos: L.Point | null = null;
    let dragStartNw: L.Point | null = null;
    let dragStartSe: L.Point | null = null;

    const onDragStart = () => {
      const pane = mainMap.getPane('mapPane');
      if (!pane) return;
      dragStartPanePos = L.DomUtil.getPosition(pane);
      dragStartNw = mainMap.latLngToContainerPoint(boundsObj.getNorthWest());
      dragStartSe = mainMap.latLngToContainerPoint(boundsObj.getSouthEast());
    };

    const onDrag = () => {
      const pane = mainMap.getPane('mapPane');
      if (!pane || !dragStartPanePos || !dragStartNw || !dragStartSe) return;

      const currentPos = L.DomUtil.getPosition(pane);
      const rawDx = currentPos.x - dragStartPanePos.x;
      const rawDy = currentPos.y - dragStartPanePos.y;
      const size = mainMap.getSize();

      const boundsW = dragStartSe.x - dragStartNw.x;
      const boundsH = dragStartSe.y - dragStartNw.y;

      const clampedDx =
        boundsW <= size.x
          ? 0
          : Math.min(-dragStartNw.x, Math.max(size.x - dragStartSe.x, rawDx));

      const clampedDy =
        boundsH <= size.y
          ? 0
          : Math.min(-dragStartNw.y, Math.max(size.y - dragStartSe.y, rawDy));

      const clampedPos = L.point(
        Math.round(dragStartPanePos.x + clampedDx),
        Math.round(dragStartPanePos.y + clampedDy)
      );
      L.DomUtil.setPosition(pane, clampedPos);
      updateFogAndSync(false);
    };

    const onDragEnd = () => {
      dragStartPanePos = null;
      dragStartNw = null;
      dragStartSe = null;
      updateFogAndSync(true);
    };

    draggable?.on('dragstart', onDragStart);
    draggable?.on('drag', onDrag);
    draggable?.on('dragend', onDragEnd);

    const handleMoveOrZoom = () => syncFullMarsalaZoom();
    mainMap.on('moveend zoomend viewreset resize', handleMoveOrZoom);
    syncFullMarsalaZoom();

    return () => {
      draggable?.off('dragstart', onDragStart);
      draggable?.off('drag', onDrag);
      draggable?.off('dragend', onDragEnd);
      mainMap.off('moveend zoomend viewreset resize', handleMoveOrZoom);
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

  useEffect(() => {
    updateFogAndSync(true);
  }, [unlocks]);

  useEffect(() => {
    const map = mainMapRef.current;
    if (!map) return;

    MARSALA_POIS.forEach((poi) => {
      const unlocked = Boolean(unlocks[poi.id]);
      const isHolo = Boolean(unlocks[poi.id]?.isHolo);
      const isBounty = poi.id === dailyBountyPoiId;

      const dist =
        gps.lat !== null && gps.lng !== null
          ? haversineMeters(gps.lat, gps.lng, poi.lat, poi.lng)
          : null;
      const inRange =
        dist !== null && dist <= poi.unlockRadiusMeters + Math.min(gps.accuracy || 0, 45);

      const bg = unlocked
        ? isHolo
          ? '#e879f9'
          : '#ffd166'
        : inRange
          ? '#38e54d'
          : isBounty
            ? '#9333ea'
            : '#1e293b';
      const border = isBounty
        ? '#f0abfc'
        : unlocked
          ? '#ffffff'
          : inRange
            ? '#fef08a'
            : '#94a3b8';
      const symbol = isBounty && !unlocked ? '🎯' : unlocked ? '★' : inRange ? '!' : '?';
      const symbolColor = unlocked || inRange ? '#000000' : '#ffd166';
      const bounce = isBounty ? 'bounty-pulse' : inRange && !unlocked ? 'pixel-bounce' : '';
      const shouldShowLabel = showLabels || inRange;
      const boxSize = shouldShowLabel ? 34 : 26;
      const fontSize = shouldShowLabel ? 13 : 10;

      const labelHtml = shouldShowLabel
        ? `<span style="
            margin-top: 3px;
            background: rgba(11, 14, 26, 0.94);
            color: ${unlocked ? '#ffd166' : inRange ? '#38e54d' : '#e2e8f0'};
            border: 2px solid ${unlocked ? '#ffd166' : '#000'};
            padding: 0px 5px;
            font-family: 'VT323', monospace;
            font-size: 15px;
            line-height: 1.15;
            white-space: nowrap;
            box-shadow: 2px 2px 0 #000;
          ">${poi.icon} ${poi.name}</span>`
        : '';

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
        className: 'bg-transparent border-0',
        html,
        iconSize: [0, 0],
      });

      const existing = poiMarkersRef.current.get(poi.id);
      if (existing) {
        existing.setIcon(icon);
        existing.setZIndexOffset(inRange ? 650 : unlocked ? 540 : 480);
      } else {
        const marker = L.marker([poi.lat, poi.lng], {
          icon,
          zIndexOffset: inRange ? 650 : unlocked ? 540 : 480,
        }).addTo(map);
        marker.on('click', () => {
          sound8bit.click();
          onSelectPoi(poi);
        });
        poiMarkersRef.current.set(poi.id, marker);
      }
    });
  }, [unlocks, gps.lat, gps.lng, gps.accuracy, showLabels, dailyBountyPoiId, onSelectPoi]);

  useEffect(() => {
    const map = mainMapRef.current;
    if (!map || gps.lat === null || gps.lng === null) return;

    const avatarSvg = renderAvatarSvgString(avatar, 34, 42);
    const playerIcon = L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div style="transform: translate(-50%, -62%);" class="flex flex-col items-center">
          ${avatarSvg}
          <span style="
            margin-top: -2px;
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
      playerMarkerRef.current.setIcon(playerIcon);
    }

    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle([gps.lat, gps.lng], {
        radius: gps.accuracy || 20,
        color: '#4cc9f0',
        fillColor: '#4cc9f0',
        fillOpacity: 0.16,
        weight: 2,
        dashArray: '4 4',
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng([gps.lat, gps.lng]);
      accuracyCircleRef.current.setRadius(gps.accuracy || 20);
    }
  }, [gps.lat, gps.lng, gps.accuracy, avatar]);

  const syncedRing = justSyncedPoiId ? rings.find((r) => r.id === justSyncedPoiId) : null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0b0e1a]">
      <div
        ref={colorContainerRef}
        className="absolute inset-0 z-0 pointer-events-none marsala-color-map"
      />

      <div
        ref={greyContainerRef}
        className="absolute inset-0 z-10 pointer-events-none marsala-grey-map transition-opacity duration-1000"
      />

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

      <div ref={mainContainerRef} className="absolute inset-0 z-20 marsala-main-map" />

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
            mainMapRef.current?.fitBounds(MARSALA_BOUNDS, {
              padding: [24, 24],
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
            if (gps.lat !== null && gps.lng !== null) {
              mainMapRef.current?.setView([gps.lat, gps.lng], 16, { animate: false });
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