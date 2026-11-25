import React, { useEffect, useState } from "react";
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

export const TravelPostcardModal: React.FC<TravelPostcardModalProps> = ({
  user,
  unlocks,
  easterEggsCount,
  totalXp,
  onClose,
}) => {
  const [postcardUrl, setPostcardUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const unlockedList = Object.values(unlocks);
  const unlockedCount = unlockedList.length;
  const percent = Math.round((unlockedCount / MARSALA_POIS.length) * 100);
  const titleObj = getTitleById(user.title);

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
      ctx.fillText("MARSALA QUEST 8-BIT", W / 2, 130);

      ctx.fillStyle = "#4cc9f0";
      ctx.font = "bold 28px monospace";
      ctx.fillText("CARTOLINA DI VIAGGIO • LILIBEO", W / 2, 178);

      // Box Giocatore + Avatar
      ctx.fillStyle = "#141b33";
      ctx.fillRect(76, 220, W - 152, 260);
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 6;
      ctx.strokeRect(76, 220, W - 152, 260);

      try {
        const svgStr = renderAvatarSvgString(user.avatar, 160, 196);
        const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
        const avatarImg = await loadImage(svgUrl);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(avatarImg, 110, 250, 160, 196);
        ctx.imageSmoothingEnabled = true;
      } catch {
        // Fallback se SVG non renderizzato
      }

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px monospace";
      ctx.fillText(
        user.prestige > 0
          ? `${user.nickname} ★P${user.prestige}`
          : user.nickname,
        300,
        310,
      );

      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 28px monospace";
      ctx.fillText(`${titleObj.label}`, 300, 362);

      ctx.fillStyle = "#38e54d";
      ctx.font = "bold 30px monospace";
      ctx.fillText(
        `${totalXp} XP  •  ${unlockedCount}/${MARSALA_POIS.length} (${percent}%)`,
        300,
        416,
      );

      ctx.fillStyle = "#f0abfc";
      ctx.font = "24px monospace";
      ctx.fillText(
        `STREAK: ${user.bountyStreak}g  •  SEGRETI: ${easterEggsCount}`,
        300,
        456,
      );

      // Radar Mappa di Marsala (luoghi illuminati vs oscurati)
      const mapX = 76;
      const mapY = 515;
      const mapW = W - 152;
      const mapH = 660;

      ctx.fillStyle = "#070b17";
      ctx.fillRect(mapX, mapY, mapW, mapH);
      ctx.strokeStyle = "#4cc9f0";
      ctx.lineWidth = 6;
      ctx.strokeRect(mapX, mapY, mapW, mapH);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 22px monospace";
      ctx.fillText("RADAR TERRITORIO DI MARSALA", mapX + 26, mapY + 42);

      const [[minLat, minLng], [maxLat, maxLng]] = MARSALA_BOUNDS;
      const pad = 70;
      const project = (lat: number, lng: number) => {
        const nx = (lng - minLng) / (maxLng - minLng);
        const ny = 1 - (lat - minLat) / (maxLat - minLat);
        return {
          x: mapX + pad + nx * (mapW - pad * 2),
          y: mapY + pad + 20 + ny * (mapH - pad * 2 - 20),
        };
      };

      // Linea costa stilizzata di Marsala / Stagnone
      const coastPoints: [number, number][] = [
        [37.882, 12.466],
        [37.855, 12.463],
        [37.835, 12.456],
        [37.812, 12.437],
        [37.796, 12.425],
        [37.783, 12.442],
        [37.762, 12.463],
        [37.734, 12.482],
      ];
      ctx.strokeStyle = "rgba(76, 201, 240, 0.35)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      coastPoints.forEach(([clat, clng], i) => {
        const pt = project(clat, clng);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Punti POI sul radar
      for (const poi of MARSALA_POIS) {
        const u = unlocks[poi.id];
        const pt = project(poi.lat, poi.lng);
        if (u) {
          ctx.fillStyle = u.isHolo
            ? "rgba(232, 121, 249, 0.22)"
            : "rgba(255, 209, 102, 0.22)";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 26, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = u.isHolo ? "#e879f9" : "#ffd166";
          ctx.fillRect(pt.x - 10, pt.y - 10, 20, 20);
        } else {
          ctx.fillStyle = "#334155";
          ctx.fillRect(pt.x - 7, pt.y - 7, 14, 14);
        }
      }

      // Ultime / Migliori 3 Card conquistate
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 26px monospace";
      ctx.fillText("LE MIE CARD CONQUISTATE", 76, 1235);

      const featured = [...unlockedList]
        .sort(
          (a, b) =>
            Number(b.isHolo) - Number(a.isHolo) ||
            Number(b.edition !== "standard") -
              Number(a.edition !== "standard") ||
            b.xpEarned - a.xpEarned,
        )
        .slice(0, 3);

      if (featured.length === 0) {
        ctx.fillStyle = "#141b33";
        ctx.fillRect(76, 1265, W - 152, 420);
        ctx.strokeStyle = "#2e3d6b";
        ctx.lineWidth = 4;
        ctx.strokeRect(76, 1265, W - 152, 420);
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.font = "28px monospace";
        ctx.fillText(
          "Esplora Marsala per collezionare le tue Card!",
          W / 2,
          1480,
        );
      } else {
        const cardW = 292;
        const cardH = 390;
        const gap = 26;
        for (let i = 0; i < featured.length; i++) {
          const item = featured[i];
          const cx = 76 + i * (cardW + gap);
          const cy = 1265;
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
    unlockedList,
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
      <div className="nes-box-gold w-full sm:max-w-md max-h-[90dvh] overflow-y-auto p-4 safe-bottom text-center">
        <div className="flex justify-between items-center border-b-[3px] border-[#2e3d6b] pb-2.5 mb-3">
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

        {postcardUrl ? (
          <img
            src={postcardUrl}
            alt="Cartolina Marsala Quest"
            className="mx-auto max-h-[58dvh] w-auto border-[3px] border-[#4cc9f0] shadow-[4px_4px_0_#000] mb-3"
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
