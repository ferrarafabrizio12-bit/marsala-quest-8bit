import React, { useEffect, useState } from "react";
import {
  type AvatarConfig,
  DEFAULT_AVATAR,
  getTitleById,
} from "../../shared/cosmetics";
import { renderAvatarSvgString } from "../utils/avatarPixels";
import { shareOrSaveDataUrl } from "../utils/shareImage";
import { sound8bit } from "../utils/sound8bit";

interface LilibeoMedalModalProps {
  nickname: string;
  totalXp: number;
  easterEggCount: number;
  prestige?: number;
  avatar?: AvatarConfig;
  titleId?: string;
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

export const LilibeoMedalModal: React.FC<LilibeoMedalModalProps> = ({
  nickname,
  totalXp,
  easterEggCount,
  prestige = 0,
  avatar = DEFAULT_AVATAR,
  titleId = "title-novizio",
  onClose,
}) => {
  const [medalPng, setMedalPng] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const titleObj = getTitleById(titleId);

  useEffect(() => {
    let cancelled = false;

    const renderMedal = async () => {
      const W = 900;
      const H = 1220;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      const isMythic = prestige >= 2;
      const isPlatinum = prestige === 1;

      const primaryRing = isMythic
        ? "#e879f9"
        : isPlatinum
          ? "#38bdf8"
          : "#ffd166";
      const secondaryRing = isMythic
        ? "#ffd166"
        : isPlatinum
          ? "#bae6fd"
          : "#f59e0b";
      const shieldBg = isMythic
        ? "#3b0764"
        : isPlatinum
          ? "#1e1b4b"
          : "#7f1d1d";
      const ribbonMain = isMythic
        ? "#a21caf"
        : isPlatinum
          ? "#0284c7"
          : "#dc2626";
      const ribbonSide = isMythic
        ? "#ffd166"
        : isPlatinum
          ? "#e0f2fe"
          : "#fbbf24";

      // Sfondo notte stellata Lilibeo
      ctx.fillStyle = "#090d1a";
      ctx.fillRect(0, 0, W, H);

      // Raggi di luce dietro la medaglia
      const cx = W / 2;
      const cy = 470;
      for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI) / 8;
        ctx.fillStyle =
          i % 2 === 0
            ? "rgba(255, 209, 102, 0.05)"
            : "rgba(76, 201, 240, 0.03)";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 520, cy + Math.sin(angle) * 520);
        ctx.lineTo(
          cx + Math.cos(angle + Math.PI / 16) * 520,
          cy + Math.sin(angle + Math.PI / 16) * 520,
        );
        ctx.closePath();
        ctx.fill();
      }

      // Cornice esterna doppia 8-bit
      ctx.strokeStyle = primaryRing;
      ctx.lineWidth = 16;
      ctx.strokeRect(16, 16, W - 32, H - 32);

      ctx.strokeStyle = "#4cc9f0";
      ctx.lineWidth = 5;
      ctx.strokeRect(38, 38, W - 76, H - 76);

      // Intestazione
      ctx.textAlign = "center";
      ctx.fillStyle = "#38e54d";
      ctx.font = "bold 22px monospace";
      ctx.fillText("★ QUEST COMPLETATA AL 100% ★", cx, 94);

      ctx.fillStyle = primaryRing;
      ctx.font = "bold 38px monospace";
      const medalHeadline =
        prestige > 0
          ? `MEDAGLIA PRESTIGIO ★P${prestige}`
          : "MEDAGLIA D'ORO DI LILIBEO";
      ctx.fillText(medalHeadline, cx, 146);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 20px monospace";
      ctx.fillText(
        prestige > 0
          ? `ORDINE SUPREMO DI MARSALA • GRADO ${prestige}`
          : "ORDINE CIVICO DI MARSALA • CAPO BOEO",
        cx,
        180,
      );

      // --- NASTRO SUPERIORE ---
      const ribTop = 212;
      const ribH = 92;
      // Nastro sinistro e destro
      ctx.fillStyle = ribbonMain;
      ctx.fillRect(cx - 110, ribTop, 220, ribH);
      ctx.fillStyle = ribbonSide;
      ctx.fillRect(cx - 86, ribTop, 24, ribH);
      ctx.fillRect(cx + 62, ribTop, 24, ribH);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - 12, ribTop, 24, ribH);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 6;
      ctx.strokeRect(cx - 110, ribTop, 220, ribH);

      // Fibbia d'oro di aggancio
      ctx.fillStyle = secondaryRing;
      ctx.fillRect(cx - 64, ribTop + ribH - 12, 128, 28);
      ctx.strokeRect(cx - 64, ribTop + ribH - 12, 128, 28);

      // --- RAMI D'ALLORO PIXELATI LATERALI ---
      ctx.fillStyle = "#38e54d";
      ctx.strokeStyle = "#052e16";
      ctx.lineWidth = 3;
      for (let side of [-1, 1]) {
        for (let step = 0; step < 7; step++) {
          const t = step / 6;
          const ang = Math.PI * 0.62 + t * (Math.PI * 0.72);
          const lx = cx + side * Math.sin(ang) * 212;
          const ly = cy + Math.cos(ang) * 205;
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(side * (-0.5 + t * 0.9));
          ctx.fillRect(-18, -9, 36, 18);
          ctx.strokeRect(-18, -9, 36, 18);
          ctx.restore();
        }
      }

      // --- CORPO PRINCIPALE DELLA MEDAGLIA ---
      // Alone esterno
      const glow = ctx.createRadialGradient(cx, cy, 120, cx, cy, 230);
      glow.addColorStop(
        0,
        isMythic ? "rgba(232, 121, 249, 0.35)" : "rgba(255, 209, 102, 0.32)",
      );
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 230, 0, Math.PI * 2);
      ctx.fill();

      // Disco esterno metallico
      ctx.fillStyle = primaryRing;
      ctx.beginPath();
      ctx.arc(cx, cy, 178, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#000000";
      ctx.stroke();

      // Anello interno con borchie pixel
      ctx.fillStyle = secondaryRing;
      ctx.beginPath();
      ctx.arc(cx, cy, 152, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#000000";
      ctx.stroke();

      for (let b = 0; b < 16; b++) {
        const ba = (b * Math.PI) / 8;
        const bx = cx + Math.cos(ba) * 165;
        const by = cy + Math.sin(ba) * 165;
        ctx.fillStyle = b % 2 === 0 ? "#ffffff" : "#000000";
        ctx.fillRect(bx - 4, by - 4, 8, 8);
      }

      // Scudo centrale smaltato
      ctx.fillStyle = shieldBg;
      ctx.beginPath();
      ctx.arc(cx, cy, 134, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#000000";
      ctx.stroke();

      // Corona turrita di Marsala (5 torri pixel)
      ctx.fillStyle = "#ffd166";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.fillRect(cx - 64, cy - 82, 128, 22);
      ctx.strokeRect(cx - 64, cy - 82, 128, 22);
      for (let t = 0; t < 5; t++) {
        const tx = cx - 64 + t * 27;
        ctx.fillRect(tx, cy - 102, 20, 20);
        ctx.strokeRect(tx, cy - 102, 20, 20);
      }

      // Emblema interno: Lira di Lilibeo + Onde del Mediterraneo
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cx - 42, cy - 42);
      ctx.quadraticCurveTo(cx - 52, cy + 28, cx, cy + 36);
      ctx.quadraticCurveTo(cx + 52, cy + 28, cx + 42, cy - 42);
      ctx.stroke();

      ctx.fillStyle = "#ffd166";
      ctx.fillRect(cx - 48, cy - 46, 96, 10);
      // Corde della lira
      ctx.lineWidth = 3;
      for (const offset of [-20, -7, 7, 20]) {
        ctx.beginPath();
        ctx.moveTo(cx + offset, cy - 36);
        ctx.lineTo(cx + offset * 0.7, cy + 32);
        ctx.stroke();
      }

      // Onde marine sotto lo stemma
      ctx.strokeStyle = "#4cc9f0";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 68, cy + 62);
      ctx.quadraticCurveTo(cx - 34, cy + 48, cx, cy + 62);
      ctx.quadraticCurveTo(cx + 34, cy + 76, cx + 68, cy + 62);
      ctx.stroke();

      // Stelle Prestigio attorno alla parte alta della medaglia
      const starCount = Math.min(5, Math.max(1, prestige + 1));
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px monospace";
      ctx.fillText("★".repeat(starCount), cx, cy + 106);

      // Cartiglio inferiore pulito e ben centrato (zero sovrapposizioni)
      const bannerY = cy + 154;
      ctx.fillStyle = "#0b0e1a";
      ctx.fillRect(cx - 190, bannerY, 380, 44);
      ctx.strokeStyle = primaryRing;
      ctx.lineWidth = 5;
      ctx.strokeRect(cx - 190, bannerY, 380, 44);

      ctx.fillStyle = primaryRing;
      ctx.font = "bold 21px monospace";
      ctx.fillText("LILYBAEUM • 397 A.C.", cx, bannerY + 29);

      // --- SCHEDA ONORE GIOCATORE & PRESTIGIO ---
      const cardY = 720;
      ctx.fillStyle = "#141b33";
      ctx.fillRect(72, cardY, W - 144, 340);
      ctx.strokeStyle = primaryRing;
      ctx.lineWidth = 6;
      ctx.strokeRect(72, cardY, W - 144, 340);

      // Avatar del giocatore dentro il diploma
      try {
        const svgStr = renderAvatarSvgString(avatar, 136, 168);
        const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
        const avatarImg = await loadImage(svgUrl);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(avatarImg, 108, cardY + 34, 136, 168);
        ctx.imageSmoothingEnabled = true;
      } catch {
        // Fallback silenzioso
      }

      ctx.textAlign = "left";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 20px monospace";
      ctx.fillText("CONFERITA A:", 276, cardY + 56);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px monospace";
      ctx.fillText(nickname.slice(0, 18), 276, cardY + 102);

      ctx.fillStyle = primaryRing;
      ctx.font = "bold 24px monospace";
      ctx.fillText(titleObj.label, 276, cardY + 142);

      ctx.fillStyle = "#f0abfc";
      ctx.font = "bold 22px monospace";
      ctx.fillText(
        prestige > 0
          ? `RANGO: PRESTIGIO ★P${prestige} (+${prestige * 25}% XP)`
          : "RANGO: ESPLORATORE COMPLETO (20/20)",
        276,
        cardY + 182,
      );

      // Separatore statistiche
      ctx.strokeStyle = "rgba(76, 201, 240, 0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(104, cardY + 222);
      ctx.lineTo(W - 104, cardY + 222);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#38e54d";
      ctx.font = "bold 26px monospace";
      ctx.fillText(
        `${totalXp} XP TOTALI  •  ${easterEggCount} SEGRETI SCOPERTI`,
        cx,
        cardY + 268,
      );

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "20px monospace";
      ctx.fillText(
        `CERTIFICATO UFFICIALE • ${new Date().toLocaleDateString("it-IT")}`,
        cx,
        cardY + 308,
      );

      // Footer
      ctx.fillStyle = "#64748b";
      ctx.font = "20px monospace";
      ctx.fillText("MARSALA QUEST 8-BIT • CRONACHE DI LILIBEO", cx, H - 56);

      if (!cancelled) {
        setMedalPng(canvas.toDataURL("image/png"));
      }
    };

    void renderMedal();
    return () => {
      cancelled = true;
    };
  }, [nickname, totalXp, easterEggCount, prestige, avatar, titleObj]);

  const handleDownloadMedal = async () => {
    if (!medalPng) return;
    sound8bit.click();
    setSaving(true);
    try {
      await shareOrSaveDataUrl(
        medalPng,
        `medaglia-lilibeo-${nickname.toLowerCase()}-p${prestige}.png`,
        "Medaglia di Lilibeo • Marsala Quest 8-Bit",
        `Ho ottenuto la Medaglia di Lilibeo (Prestigio ★P${prestige}, ${totalXp} XP) su Marsala Quest 8-Bit!`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/90 flex items-end sm:items-center justify-center sm:p-3">
      <div className="nes-box-gold w-full sm:max-w-md max-h-[92dvh] overflow-y-auto p-4 text-center safe-bottom">
        <div className="flex justify-between items-center border-b-[3px] border-[#2e3d6b] pb-2 mb-3">
          <span className="font-pixel text-[9px] text-[#38e54d]">
            ★ QUEST COMPLETATA {prestige > 0 ? `• ★P${prestige}` : ""}
          </span>
          <button
            onClick={onClose}
            className="nes-btn w-9 h-9 bg-[#ff4d6d] text-white text-[9px]"
          >
            X
          </button>
        </div>

        {medalPng ? (
          <img
            src={medalPng}
            alt="Medaglia di Lilibeo"
            className="mx-auto max-h-[58dvh] w-auto border-[3px] border-[#ffd166] shadow-[4px_4px_0_#000] mb-3"
          />
        ) : (
          <div className="h-72 flex items-center justify-center font-pixel text-[9px] text-[#ffd166]">
            CONIO MEDAGLIA 8-BIT...
          </div>
        )}

        <div className="space-y-2">
          <button
            type="button"
            disabled={!medalPng || saving}
            onClick={() => void handleDownloadMedal()}
            className="nes-btn w-full py-3.5 bg-[#ffd166] text-black text-[9px] disabled:opacity-50"
          >
            {saving ? "ESPORTAZIONE..." : "⬇️ Scarica Medaglia 🥇"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="nes-btn w-full py-2.5 bg-[#26335c] text-white text-[9px]"
          >
            MAPPA
          </button>
        </div>
      </div>
    </div>
  );
};
