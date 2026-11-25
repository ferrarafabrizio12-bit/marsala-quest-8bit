import React, { useEffect, useMemo, useState } from "react";
import { MARSALA_BOUNDS, MARSALA_POIS } from "../../shared/pois";
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Disegna la mappa cartografica 8-bit completa di Marsala (terraferma, Stagnone, Isola Longa,
 * Mozia, Capo Boeo, arterie stradali e puzzle Voronoi colorato per i POI sbloccati).
 * 100% locale su canvas: zero riquadri bianchi o blocchi CORS su iOS/Android.
 */
function renderMarsalaCartographicMap(
  width: number,
  height: number,
  unlocks: Record<string, UnlockData>,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const [[southLat, westLng], [northLat, eastLng]] = MARSALA_BOUNDS;
  const cosLat = Math.cos((37.81 * Math.PI) / 180);
  const rawW = (eastLng - westLng) * cosLat;
  const rawH = northLat - southLat;

  const pad = 26;
  const scale = Math.min((width - pad * 2) / rawW, (height - pad * 2) / rawH);
  const offsetX = (width - rawW * scale) / 2;
  const offsetY = (height - rawH * scale) / 2;

  const project = (lat: number, lng: number) => ({
    x: offsetX + (lng - westLng) * cosLat * scale,
    y: offsetY + (northLat - lat) * scale,
  });

  // 1. Mare Mediterraneo & Laguna dello Stagnone
  const seaGrad = ctx.createLinearGradient(0, 0, width, height);
  seaGrad.addColorStop(0, "#092442");
  seaGrad.addColorStop(1, "#06172b");
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, 0, width, height);

  // Griglia nautica 8-bit
  ctx.strokeStyle = "rgba(76, 201, 240, 0.12)";
  ctx.lineWidth = 1.5;
  for (let gx = 0; gx < width; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = 0; gy < height; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }

  // 2. Poligono terraferma di Marsala (da Torre San Teodoro fino a Petrosino/Torrazza)
  const mainlandCoords: [number, number][] = [
    [37.902, 12.467],
    [37.902, 12.548],
    [37.718, 12.548],
    [37.718, 12.482],
    [37.734, 12.478],
    [37.752, 12.467],
    [37.768, 12.458],
    [37.783, 12.444],
    [37.793, 12.435],
    [37.801, 12.425],
    [37.812, 12.436],
    [37.824, 12.456],
    [37.832, 12.467],
    [37.848, 12.466],
    [37.868, 12.474],
    [37.884, 12.465],
  ];

  const isolaLongaCoords: [number, number][] = [
    [37.884, 12.454],
    [37.872, 12.457],
    [37.854, 12.447],
    [37.846, 12.442],
    [37.852, 12.436],
    [37.872, 12.445],
  ];

  const moziaCoords: [number, number][] = [
    [37.872, 12.466],
    [37.871, 12.471],
    [37.865, 12.471],
    [37.865, 12.465],
  ];

  const tracePoly = (coords: [number, number][]) => {
    ctx.beginPath();
    coords.forEach(([lat, lng], i) => {
      const pt = project(lat, lng);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
  };

  // Terra base
  ctx.fillStyle = "#1e3a2f";
  tracePoly(mainlandCoords);
  ctx.fill();

  ctx.fillStyle = "#254739";
  tracePoly(isolaLongaCoords);
  ctx.fill();
  tracePoly(moziaCoords);
  ctx.fill();

  // 3. Puzzle Voronoi colorato sulle zone sbloccate della cartolina
  const unlockedCount = Object.keys(unlocks).length;
  if (unlockedCount > 0) {
    const step = 4;
    const gw = Math.ceil(width / step);
    const gh = Math.ceil(height / step);
    const puzzleCanvas = document.createElement("canvas");
    puzzleCanvas.width = gw;
    puzzleCanvas.height = gh;
    const pctx = puzzleCanvas.getContext("2d")!;
    const pImg = pctx.createImageData(gw, gh);
    const pData = pImg.data;

    const count = MARSALA_POIS.length;
    const pxArr = new Float32Array(count);
    const pyArr = new Float32Array(count);
    const unlArr = new Uint8Array(count);
    const holoArr = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      const p = MARSALA_POIS[i];
      const pt = project(p.lat, p.lng);
      pxArr[i] = pt.x / step;
      pyArr[i] = pt.y / step;
      const u = unlocks[p.id];
      unlArr[i] = u ? 1 : 0;
      holoArr[i] = u?.isHolo ? 1 : 0;
    }

    for (let y = 0; y < gh; y++) {
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
        const idx = (y * gw + x) * 4;
        if (unlArr[bestIdx]) {
          if (holoArr[bestIdx]) {
            pData[idx] = 217;
            pData[idx + 1] = 70;
            pData[idx + 2] = 239;
            pData[idx + 3] = 85;
          } else {
            pData[idx] = 56;
            pData[idx + 1] = 229;
            pData[idx + 2] = 77;
            pData[idx + 3] = 85;
          }
        }
      }
    }

    pctx.putImageData(pImg, 0, 0);
    ctx.drawImage(puzzleCanvas, 0, 0, gw, gh, 0, 0, width, height);
  }

  // Bordo costa dorato 8-bit
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 3.5;
  tracePoly(mainlandCoords);
  ctx.stroke();

  ctx.strokeStyle = "#4cc9f0";
  ctx.lineWidth = 2.5;
  tracePoly(isolaLongaCoords);
  ctx.stroke();
  tracePoly(moziaCoords);
  ctx.stroke();

  // 4. Strade principali di Marsala (SP21, Via Mazara, SS115, Centro)
  const roads: [number, number][][] = [
    // SP21 Lungomare dello Stagnone -> Centro
    [
      [37.882, 12.466],
      [37.855, 12.467],
      [37.83, 12.467],
      [37.812, 12.448],
      [37.798, 12.437],
    ],
    // Via Mazara -> Lido Signorino -> Torrazza
    [
      [37.798, 12.437],
      [37.783, 12.446],
      [37.768, 12.46],
      [37.751, 12.47],
      [37.73, 12.482],
    ],
    // SS115 verso Trapani
    [
      [37.801, 12.442],
      [37.828, 12.488],
      [37.865, 12.515],
    ],
  ];

  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  for (const road of roads) {
    ctx.beginPath();
    road.forEach(([lat, lng], i) => {
      const pt = project(lat, lng);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Etichette geografiche
  ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
  ctx.font = "bold 17px monospace";
  const stagnonePos = project(37.862, 12.456);
  ctx.fillText("STAGNONE", stagnonePos.x - 45, stagnonePos.y);
  const capoPos = project(37.801, 12.425);
  ctx.fillText("CAPO BOEO", capoPos.x - 10, capoPos.y - 14);

  // 5. Tutti i 20 marker POI sopra la mappa
  for (const poi of MARSALA_POIS) {
    const u = unlocks[poi.id];
    const pt = project(poi.lat, poi.lng);

    if (u) {
      ctx.fillStyle = u.isHolo ? "#e879f9" : "#ffd166";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.fillRect(pt.x - 10, pt.y - 10, 20, 20);
      ctx.strokeRect(pt.x - 10, pt.y - 10, 20, 20);

      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("★", pt.x, pt.y + 5);
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.fillRect(pt.x - 8, pt.y - 8, 16, 16);
      ctx.strokeRect(pt.x - 8, pt.y - 8, 16, 16);

      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("?", pt.x, pt.y + 4);
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

      // Mappa 8-bit completa di Marsala con puzzle colorato
      const mapX = 76;
      const mapY = 486;
      const mapW = W - 152;
      const mapH = 660;

      const mapSnapshot = renderMarsalaCartographicMap(mapW, mapH, unlocks);
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
