import React, { useEffect, useMemo, useState } from "react";
import {
  MARSALA_BOUNDS,
  MARSALA_POIS,
  getAdaptiveFogRadiusMeters,
} from "../../shared/pois";
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

/** Disegna la mappa reale di Marsala con le zone conquistate a colori e il resto in grigio */
async function renderMarsalaMapSnapshot(
  width: number,
  height: number,
  unlocks: Record<string, UnlockData>,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Sfondo mare base
  ctx.fillStyle = "#0c2340";
  ctx.fillRect(0, 0, width, height);

  const [[southLat, westLng], [northLat, eastLng]] = MARSALA_BOUNDS;
  const zoom = 12;

  const minTx = lngToTileX(westLng, zoom);
  const maxTx = lngToTileX(eastLng, zoom);
  const minTy = latToTileY(northLat, zoom);
  const maxTy = latToTileY(southLat, zoom);

  const spanX = maxTx - minTx;
  const spanY = maxTy - minTy;
  const scale = Math.min(width / spanX, height / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  const projectLatLng = (lat: number, lng: number) => ({
    x: offsetX + (lngToTileX(lng, zoom) - minTx) * scale,
    y: offsetY + (latToTileY(lat, zoom) - minTy) * scale,
  });

  // 1. Disegna i tasselli cartografici reali di Marsala
  const startTileX = Math.floor(minTx);
  const endTileX = Math.floor(maxTx);
  const startTileY = Math.floor(minTy);
  const endTileY = Math.floor(maxTy);

  const tilePromises: Array<
    Promise<{ img: HTMLImageElement; tx: number; ty: number } | null>
  > = [];

  for (let tx = startTileX; tx <= endTileX; tx++) {
    for (let ty = startTileY; ty <= endTileY; ty++) {
      const url = `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}.png`;
      tilePromises.push(
        loadImage(url, "anonymous")
          .then((img) => ({ img, tx, ty }))
          .catch(() =>
            loadImage(
              `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
              "anonymous",
            )
              .then((img) => ({ img, tx, ty }))
              .catch(() => null),
          ),
      );
    }
  }

  const loadedTiles = await Promise.all(tilePromises);
  let hasRealTiles = false;

  for (const item of loadedTiles) {
    if (!item) continue;
    hasRealTiles = true;
    const dx = offsetX + (item.tx - minTx) * scale;
    const dy = offsetY + (item.ty - minTy) * scale;
    ctx.drawImage(item.img, dx, dy, scale + 0.5, scale + 0.5);
  }

  // Fallback vettoriale dettagliato se i tile non fossero raggiungibili offline
  if (!hasRealTiles) {
    const landPoly: [number, number][] = [
      [37.895, 12.468],
      [37.895, 12.535],
      [37.725, 12.535],
      [37.725, 12.482],
      [37.752, 12.468],
      [37.783, 12.442],
      [37.798, 12.425],
      [37.814, 12.438],
      [37.836, 12.458],
      [37.865, 12.464],
    ];
    ctx.fillStyle = "#2d4a3e";
    ctx.beginPath();
    landPoly.forEach(([lat, lng], idx) => {
      const p = projectLatLng(lat, lng);
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
  }

  // 2. Applica effetto grigio sulle zone non ancora esplorate (se < 20/20)
  const unlockedCount = Object.keys(unlocks).length;
  if (unlockedCount < MARSALA_POIS.length) {
    const fogLayer = document.createElement("canvas");
    fogLayer.width = width;
    fogLayer.height = height;
    const fctx = fogLayer.getContext("2d")!;

    fctx.fillStyle = "rgb(128, 128, 128)";
    fctx.fillRect(0, 0, width, height);

    fctx.globalCompositeOperation = "destination-out";
    const metersPerPixel =
      (156543.03392 * Math.cos((37.8 * Math.PI) / 180)) /
      Math.pow(2, zoom) /
      (scale / 256);

    for (const poi of MARSALA_POIS) {
      if (!unlocks[poi.id]) continue;
      const pt = projectLatLng(poi.lat, poi.lng);
      const r = Math.max(18, getAdaptiveFogRadiusMeters(poi) / metersPerPixel);
      const grad = fctx.createRadialGradient(
        pt.x,
        pt.y,
        r * 0.65,
        pt.x,
        pt.y,
        r,
      );
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      fctx.fillStyle = grad;
      fctx.beginPath();
      fctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      fctx.fill();
    }

    ctx.save();
    ctx.globalCompositeOperation = "color";
    ctx.drawImage(fogLayer, 0, 0);
    ctx.restore();
  }

  // 3. Disegna tutti i 20 marker POI sopra la mappa
  for (const poi of MARSALA_POIS) {
    const u = unlocks[poi.id];
    const pt = projectLatLng(poi.lat, poi.lng);

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

  // Selezione personalizzabile delle 3 Card in vetrina
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

  // Mantieni allineati gli ID selezionati se cambia l'elenco
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
      // Se ce ne sono già 3 selezionate, sostituisce la prima con la nuova scelta
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

      // Sfondo notte Lilibeo + griglia pixel
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

      // Cornice esterna cartuccia
      ctx.strokeStyle = user.prestige > 0 ? "#e879f9" : "#ffd166";
      ctx.lineWidth = 22;
      ctx.strokeRect(18, 18, W - 36, H - 36);

      ctx.strokeStyle = "#4cc9f0";
      ctx.lineWidth = 6;
      ctx.strokeRect(44, 44, W - 88, H - 88);

      // Titolo Cartolina
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

      // --- MAPPA REALE DI MARSALA (con zone sbloccate a colori + marker) ---
      const mapX = 76;
      const mapY = 486;
      const mapW = W - 152;
      const mapH = 660;

      const mapSnapshot = await renderMarsalaMapSnapshot(mapW, mapH, unlocks);
      ctx.drawImage(mapSnapshot, mapX, mapY, mapW, mapH);

      ctx.strokeStyle = "#4cc9f0";
      ctx.lineWidth = 6;
      ctx.strokeRect(mapX, mapY, mapW, mapH);

      // Etichetta in alto sulla mappa
      ctx.fillStyle = "rgba(11, 14, 26, 0.88)";
      ctx.fillRect(mapX + 16, mapY + 16, 440, 42);
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 3;
      ctx.strokeRect(mapX + 16, mapY + 16, 440, 42);

      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 21px monospace";
      ctx.fillText("MAPPA DI MARSALA • LILIBEO", mapX + 30, mapY + 44);

      // --- LE 3 CARD SCELTE IN VETRINA ---
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

      // Footer
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
