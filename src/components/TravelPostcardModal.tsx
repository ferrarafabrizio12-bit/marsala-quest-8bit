import React, { useEffect, useMemo, useState } from "react";
import { MARSALA_POIS } from "../../shared/pois";
import { getTitleById } from "../../shared/cosmetics";
import type { UnlockData, UserProfile } from "../types/game";
import { renderAvatarSvgString } from "../utils/avatarPixels";
import { shareOrSaveDataUrl } from "../utils/shareImage";
import { sound8bit } from "../utils/sound8bit";

interface TravelPostcardModalProps {
  user: UserProfile;
  unlocks: Record<string, UnlockData>;
  easterEggsCount: number;
  totalXp: number;
  onClose: () => void;
}

const API_BASE = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

function loadImage(
  src: string,
  crossOrigin?: string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function lngToTileX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

/**
 * Renderizza la mappa reale OpenStreetMap di Marsala (tasselli via proxy CORS-safe +
 * puzzle Voronoi colorato per i POI sbloccati / grigio per i POI mancanti + i 20 marker).
 */
async function renderMarsalaRealMapSnapshot(
  width: number,
  height: number,
  unlocks: Record<string, UnlockData>,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0b192c";
  ctx.fillRect(0, 0, width, height);

  const lats = MARSALA_POIS.map((p) => p.lat);
  const lngs = MARSALA_POIS.map((p) => p.lng);
  const minLat = Math.min(...lats) - 0.012;
  const maxLat = Math.max(...lats) + 0.012;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

  const zoom = 13;
  const topTy = latToTileY(maxLat, zoom);
  const bottomTy = latToTileY(minLat, zoom);
  const spanY = bottomTy - topTy;
  const spanX = spanY * (width / height);

  const centerTx = lngToTileX(centerLng, zoom);
  const leftTx = centerTx - spanX / 2;
  const rightTx = centerTx + spanX / 2;

  const tilePxSize = width / spanX;

  const projectLatLng = (lat: number, lng: number) => ({
    x: (lngToTileX(lng, zoom) - leftTx) * tilePxSize,
    y: (latToTileY(lat, zoom) - topTy) * tilePxSize,
  });

  // 1. Scarica e disegna tutti i tasselli OpenStreetMap di Marsala (con margine extra per coprire ogni bordo)
  const startTx = Math.floor(leftTx) - 1;
  const endTx = Math.ceil(rightTx) + 1;
  const startTy = Math.floor(topTy) - 1;
  const endTy = Math.ceil(bottomTy) + 1;

  const tileJobs: Array<
    Promise<{ img: HTMLImageElement; tx: number; ty: number } | null>
  > = [];

  for (let tx = startTx; tx <= endTx; tx++) {
    for (let ty = startTy; ty <= endTy; ty++) {
      const tileUrl = `${API_BASE}/api/map-tile/${zoom}/${tx}/${ty}.png`;
      tileJobs.push(
        loadImage(tileUrl, "anonymous")
          .then((img) => ({ img, tx, ty }))
          .catch(() => null),
      );
    }
  }

  const tiles = await Promise.all(tileJobs);

  ctx.save();
  ctx.filter = "saturate(1.22) contrast(1.06)";
  for (const t of tiles) {
    if (!t) continue;
    const dx = (t.tx - leftTx) * tilePxSize;
    const dy = (t.ty - topTy) * tilePxSize;
    ctx.drawImage(t.img, dx, dy, tilePxSize + 1, tilePxSize + 1);
  }
  ctx.restore();

  // 2. Applica il Puzzle Voronoi: tessere sbloccate a colori, tessere mancanti in grigio
  const unlockedCount = Object.keys(unlocks).length;
  if (unlockedCount < MARSALA_POIS.length) {
    const step = 4;
    const gw = Math.ceil(width / step);
    const gh = Math.ceil(height / step);

    const fogCanvas = document.createElement("canvas");
    fogCanvas.width = gw;
    fogCanvas.height = gh;
    const fctx = fogCanvas.getContext("2d")!;
    const imgData = fctx.createImageData(gw, gh);
    const data = imgData.data;

    const count = MARSALA_POIS.length;
    const pxArr = new Float32Array(count);
    const pyArr = new Float32Array(count);
    const unlArr = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      const p = MARSALA_POIS[i];
      const pt = projectLatLng(p.lat, p.lng);
      pxArr[i] = pt.x / step;
      pyArr[i] = pt.y / step;
      unlArr[i] = unlocks[p.id] ? 1 : 0;
    }

    const ownerGrid = new Int16Array(gw * gh);

    for (let y = 0; y < gh; y++) {
      const rowOffset = y * gw;
      for (let x = 0; x < gw; x++) {
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < count; i++) {
          const dx = x - pxArr[i];
          const dy = y - pyArr[i];
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDist) {
            bestDist = d2;
            bestIdx = i;
          }
        }
        ownerGrid[rowOffset + x] = bestIdx;
        const pIdx = (rowOffset + x) * 4;
        if (unlArr[bestIdx]) {
          data[pIdx] = 0;
          data[pIdx + 1] = 0;
          data[pIdx + 2] = 0;
          data[pIdx + 3] = 0;
        } else {
          data[pIdx] = 128;
          data[pIdx + 1] = 128;
          data[pIdx + 2] = 128;
          data[pIdx + 3] = 255;
        }
      }
    }

    fctx.putImageData(imgData, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = "color";
    ctx.drawImage(fogCanvas, 0, 0, gw, gh, 0, 0, width, height);
    ctx.restore();

    if (unlockedCount > 0) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 209, 102, 0.55)";
      for (let y = 1; y < gh; y++) {
        const rowOffset = y * gw;
        for (let x = 1; x < gw; x++) {
          const cur = ownerGrid[rowOffset + x];
          const left = ownerGrid[rowOffset + x - 1];
          const up = ownerGrid[rowOffset - gw + x];
          if (
            (cur !== left && unlArr[cur] !== unlArr[left]) ||
            (cur !== up && unlArr[cur] !== unlArr[up])
          ) {
            ctx.fillRect(x * step, y * step, step, step);
          }
        }
      }
      ctx.restore();
    }
  }

  // 3. Disegna tutti i 20 marker POI sopra la mappa
  for (const poi of MARSALA_POIS) {
    const u = unlocks[poi.id];
    const pt = projectLatLng(poi.lat, poi.lng);

    if (u) {
      ctx.fillStyle = u.isHolo ? "#e879f9" : "#ffd166";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.fillRect(pt.x - 11, pt.y - 11, 22, 22);
      ctx.strokeRect(pt.x - 11, pt.y - 11, 22, 22);

      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("★", pt.x, pt.y + 5);
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2.5;
      ctx.fillRect(pt.x - 9, pt.y - 9, 18, 18);
      ctx.strokeRect(pt.x - 9, pt.y - 9, 18, 18);

      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("?", pt.x, pt.y + 5);
    }
  }

  ctx.textAlign = "left";
  return canvas;
}

export const TravelPostcardModal: React.FC<TravelPostcardModalProps> = ({
  user,
  unlocks,
  easterEggsCount,
  totalXp,
  onClose,
}) => {
  const [postcardUrl, setPostcardUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const unlockedList = useMemo(() => Object.values(unlocks), [unlocks]);
  const unlockedCount = unlockedList.length;
  const percent = Math.round((unlockedCount / MARSALA_POIS.length) * 100);
  const titleObj = getTitleById(user.title);

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    [...Object.values(unlocks)]
      .sort(
        (a, b) =>
          Number(b.isHolo) - Number(a.isHolo) ||
          Number(b.edition !== "standard") - Number(a.edition !== "standard") ||
          b.xpEarned - a.xpEarned,
      )
      .slice(0, 3)
      .map((u) => u.poiId),
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = prev.filter((id) => Boolean(unlocks[id]));
      if (valid.length > 0) return valid.slice(0, 3);
      return [...Object.values(unlocks)]
        .sort((a, b) => b.xpEarned - a.xpEarned)
        .slice(0, 3)
        .map((u) => u.poiId);
    });
  }, [unlocks]);

  const toggleFeaturedCard = (poiId: string) => {
    sound8bit.click();
    setSelectedIds((prev) => {
      if (prev.includes(poiId)) {
        return prev.filter((id) => id !== poiId);
      }
      if (prev.length < 3) {
        return [...prev, poiId];
      }
      return [...prev.slice(1), poiId];
    });
  };

  useEffect(() => {
    let cancelled = false;

    const buildPostcard = async () => {
      const W = 1080;
      const H = 1920;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#0b0e1a";
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(76, 201, 240, 0.08)";
      ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      ctx.strokeStyle = user.prestige > 0 ? "#e879f9" : "#ffd166";
      ctx.lineWidth = 22;
      ctx.strokeRect(18, 18, W - 36, H - 36);

      ctx.strokeStyle = "#4cc9f0";
      ctx.lineWidth = 6;
      ctx.strokeRect(44, 44, W - 88, H - 88);

      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 46px monospace";
      ctx.textAlign = "center";
      ctx.fillText("MARSALA QUEST 8-BIT", W / 2, 126);

      ctx.fillStyle = "#4cc9f0";
      ctx.font = "bold 26px monospace";
      ctx.fillText("CARTOLINA DI VIAGGIO • LILIBEO", W / 2, 172);

      // Box Giocatore + Avatar
      ctx.fillStyle = "#141b33";
      ctx.fillRect(76, 208, W - 152, 246);
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 6;
      ctx.strokeRect(76, 208, W - 152, 246);

      try {
        const svgStr = renderAvatarSvgString(user.avatar, 152, 186);
        const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
        const avatarImg = await loadImage(svgUrl);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(avatarImg, 108, 236, 152, 186);
        ctx.imageSmoothingEnabled = true;
      } catch {
        // Fallback se SVG non renderizzato
      }

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px monospace";
      ctx.fillText(
        user.prestige > 0
          ? `${user.nickname} ★P${user.prestige}`
          : user.nickname,
        292,
        292,
      );

      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 26px monospace";
      ctx.fillText(`${titleObj.label}`, 292, 342);

      ctx.fillStyle = "#38e54d";
      ctx.font = "bold 28px monospace";
      ctx.fillText(
        `${totalXp} XP  •  ${unlockedCount}/${MARSALA_POIS.length} (${percent}%)`,
        292,
        394,
      );

      ctx.fillStyle = "#f0abfc";
      ctx.font = "23px monospace";
      ctx.fillText(
        `STREAK: ${user.bountyStreak}g  •  SEGRETI: ${easterEggsCount}`,
        292,
        434,
      );

      // Mappa reale OpenStreetMap di Marsala con puzzle colorato
      const mapX = 76;
      const mapY = 486;
      const mapW = W - 152;
      const mapH = 660;

      const mapSnapshot = await renderMarsalaRealMapSnapshot(
        mapW,
        mapH,
        unlocks,
      );
      ctx.drawImage(mapSnapshot, mapX, mapY, mapW, mapH);

      ctx.strokeStyle = "#4cc9f0";
      ctx.lineWidth = 6;
      ctx.strokeRect(mapX, mapY, mapW, mapH);

      ctx.fillStyle = "rgba(11, 14, 26, 0.9)";
      ctx.fillRect(mapX + 16, mapY + 16, 440, 42);
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 3;
      ctx.strokeRect(mapX + 16, mapY + 16, 440, 42);

      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 21px monospace";
      ctx.fillText("MAPPA DI MARSALA • LILIBEO", mapX + 30, mapY + 44);

      // Le 3 Card selezionate in vetrina
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 26px monospace";
      ctx.fillText("LE MIE CARD CONQUISTATE", 76, 1200);

      const featured = selectedIds
        .map((id) => unlocks[id])
        .filter((u): u is UnlockData => Boolean(u))
        .slice(0, 3);

      if (featured.length === 0) {
        ctx.fillStyle = "#141b33";
        ctx.fillRect(76, 1230, W - 152, 430);
        ctx.strokeStyle = "#2e3d6b";
        ctx.lineWidth = 4;
        ctx.strokeRect(76, 1230, W - 152, 430);
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.font = "26px monospace";
        ctx.fillText(
          "Seleziona fino a 3 Card qui sopra per esporle!",
          W / 2,
          1455,
        );
      } else {
        const cardW = 292;
        const cardH = 422;
        const gap = 26;
        const totalRowW = featured.length * cardW + (featured.length - 1) * gap;
        const startX = (W - totalRowW) / 2;

        for (let i = 0; i < featured.length; i++) {
          const item = featured[i];
          const cx = startX + i * (cardW + gap);
          const cy = 1230;
          try {
            const cImg = await loadImage(item.photoDataUrl);
            ctx.drawImage(cImg, cx, cy, cardW, cardH);
          } catch {
            ctx.fillStyle = "#141b33";
            ctx.fillRect(cx, cy, cardW, cardH);
          }
          ctx.strokeStyle = item.isHolo ? "#e879f9" : "#ffd166";
          ctx.lineWidth = 6;
          ctx.strokeRect(cx, cy, cardW, cardH);
        }
      }

      ctx.textAlign = "center";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "24px monospace";
      ctx.fillText(
        `GENERATA IL ${new Date().toLocaleDateString("it-IT")} • MARSALA (TP)`,
        W / 2,
        1790,
      );

      if (!cancelled) {
        setPostcardUrl(canvas.toDataURL("image/png"));
      }
    };

    void buildPostcard();
    return () => {
      cancelled = true;
    };
  }, [
    user,
    unlocks,
    selectedIds,
    unlockedCount,
    percent,
    titleObj,
    totalXp,
    easterEggsCount,
  ]);

  const handleSaveOrShare = async () => {
    if (!postcardUrl) return;
    sound8bit.click();
    setSharing(true);
    try {
      await shareOrSaveDataUrl(
        postcardUrl,
        `marsala-cartolina-${user.nickname}.png`,
        "Marsala Quest 8-Bit",
        `Ho illuminato il ${percent}% di Marsala (${totalXp} XP) su Marsala Quest 8-Bit!`,
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/90 flex items-end sm:items-center justify-center sm:p-3">
      <div className="nes-box-gold w-full sm:max-w-md max-h-[92dvh] overflow-y-auto p-4 safe-bottom text-center">
        <div className="flex justify-between items-center border-b-[3px] border-[#2e3d6b] pb-2.5 mb-2.5">
          <h3 className="font-pixel text-[10px] text-[#ffd166]">
            📮 CARTOLINA DI VIAGGIO
          </h3>
          <button
            onClick={onClose}
            className="nes-btn w-10 h-10 bg-[#ff4d6d] text-white text-[10px]"
          >
            X
          </button>
        </div>

        {/* Selettore delle 3 Card migliori da esporre */}
        {unlockedList.length > 0 && (
          <div className="mb-3 bg-[#090d18] border-[3px] border-[#4cc9f0] p-2 text-left">
            <p className="font-pixel text-[7px] text-[#ffd166] mb-1.5">
              ★ SCEGLI LE 3 CARD IN VETRINA ({selectedIds.length}/3):
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {MARSALA_POIS.filter((p) => Boolean(unlocks[p.id])).map((poi) => {
                const u = unlocks[poi.id];
                const isSelected = selectedIds.includes(poi.id);
                const slotIndex = selectedIds.indexOf(poi.id);
                return (
                  <button
                    key={poi.id}
                    type="button"
                    onClick={() => toggleFeaturedCard(poi.id)}
                    className={`shrink-0 w-16 p-1 border-2 flex flex-col items-center gap-0.5 transition ${
                      isSelected
                        ? "border-[#38e54d] bg-[#102a1d]"
                        : "border-[#2e3d6b] bg-[#141b33] opacity-70"
                    }`}
                  >
                    <div className="relative w-full h-14 bg-black">
                      <img
                        src={u.photoDataUrl}
                        alt={poi.name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <span className="absolute top-0 right-0 bg-[#38e54d] text-black font-pixel text-[7px] px-1">
                          #{slotIndex + 1}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white truncate w-full text-center leading-tight">
                      {poi.icon} {poi.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {postcardUrl ? (
          <img
            src={postcardUrl}
            alt="Cartolina Marsala Quest"
            className="mx-auto max-h-[50dvh] w-auto border-[3px] border-[#4cc9f0] shadow-[4px_4px_0_#000] mb-3"
          />
        ) : (
          <div className="h-64 flex items-center justify-center font-pixel text-[9px] text-[#4cc9f0]">
            STAMPA CARTOLINA 8-BIT...
          </div>
        )}

        <button
          type="button"
          disabled={!postcardUrl || sharing}
          onClick={() => void handleSaveOrShare()}
          className="nes-btn w-full py-3.5 bg-[#38e54d] text-black text-[9px]"
        >
          {sharing ? "APERTURA..." : "📲 Salva o Condividi"}
        </button>
      </div>
    </div>
  );
};
