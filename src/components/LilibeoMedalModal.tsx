import React, { useEffect, useState } from "react";
import {
  type AvatarConfig,
  MAX_PRESTIGE,
  TOTAL_MARSALA_POIS,
  getTitleById,
  hasCompletedMaxPrestige,
} from "../../shared/cosmetics";
import { renderAvatarSvgString } from "../utils/avatarPixels";
import { shareOrSaveDataUrl } from "../utils/shareImage";
import { sound8bit } from "../utils/sound8bit";

interface LilibeoMedalModalProps {
  nickname: string;
  totalXp: number;
  easterEggCount: number;
  prestige: number;
  unlockedCount: number;
  isSuperuser?: boolean;
  avatar: AvatarConfig;
  titleId: string;
  onClose: () => void;
}

type MedalVariant = "creator" | "immortal" | "standard";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawPixelStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  fill: string,
  stroke = "#000000",
) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawPixelLightning(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale = 1,
) {
  const pts: [number, number][] = [
    [6, -34],
    [-22, 4],
    [-2, 4],
    [-10, 34],
    [22, -4],
    [2, -4],
  ];
  ctx.beginPath();
  pts.forEach(([px, py], i) => {
    const x = cx + px * scale;
    const y = cy + py * scale;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "#ffd166";
  ctx.fill();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawPixelDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.85, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.85, cy);
  ctx.closePath();
  const grad = ctx.createLinearGradient(
    cx - size,
    cy - size,
    cx + size,
    cy + size,
  );
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.45, "#7dd3fc");
  grad.addColorStop(1, "#0284c7");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy - size * 0.62);
  ctx.lineTo(cx + size * 0.45, cy);
  ctx.lineTo(cx, cy + size * 0.35);
  ctx.lineTo(cx - size * 0.45, cy);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fill();
}

export const LilibeoMedalModal: React.FC<LilibeoMedalModalProps> = ({
  nickname,
  totalXp,
  easterEggCount,
  prestige,
  unlockedCount,
  isSuperuser = false,
  avatar,
  titleId,
  onClose,
}) => {
  const isMaxPrestigeDone = hasCompletedMaxPrestige(prestige, unlockedCount);
  const defaultVariant: MedalVariant = isSuperuser
    ? "creator"
    : isMaxPrestigeDone
      ? "immortal"
      : "standard";

  const [variant, setVariant] = useState<MedalVariant>(defaultVariant);
  const [medalUrl, setMedalUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const titleObj = getTitleById(titleId);

  useEffect(() => {
    setVariant(defaultVariant);
  }, [defaultVariant]);

  useEffect(() => {
    let cancelled = false;

    const buildMedal = async () => {
      const W = 900;
      const H = 1260;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      const isCreator = variant === "creator";
      const isImmortal = variant === "immortal";

      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      if (isCreator) {
        bgGrad.addColorStop(0, "#07070d");
        bgGrad.addColorStop(0.5, "#1f0715");
        bgGrad.addColorStop(1, "#090910");
      } else if (isImmortal) {
        bgGrad.addColorStop(0, "#071526");
        bgGrad.addColorStop(0.5, "#112c4d");
        bgGrad.addColorStop(1, "#0a192f");
      } else {
        bgGrad.addColorStop(0, "#0b0e1a");
        bgGrad.addColorStop(0.5, prestige > 0 ? "#24123a" : "#141b33");
        bgGrad.addColorStop(1, "#0b0e1a");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = isCreator
        ? "rgba(255, 0, 84, 0.11)"
        : isImmortal
          ? "rgba(125, 211, 252, 0.12)"
          : "rgba(255, 209, 102, 0.08)";
      ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const outerStroke = isCreator
        ? "#ffd166"
        : isImmortal
          ? "#7dd3fc"
          : prestige > 0
            ? "#e879f9"
            : "#ffd166";
      const innerStroke = isCreator
        ? "#ff0054"
        : isImmortal
          ? "#ffd166"
          : "#4cc9f0";

      ctx.strokeStyle = outerStroke;
      ctx.lineWidth = 20;
      ctx.strokeRect(18, 18, W - 36, H - 36);

      ctx.strokeStyle = innerStroke;
      ctx.lineWidth = 6;
      ctx.strokeRect(42, 42, W - 84, H - 84);

      ctx.textAlign = "center";
      ctx.fillStyle = isCreator
        ? "#ff0054"
        : isImmortal
          ? "#7dd3fc"
          : "#4cc9f0";
      ctx.font = "bold 24px monospace";
      ctx.fillText(
        isCreator
          ? "⚡ EDIZIONE CREATORE SUPREMO ⚡"
          : isImmortal
            ? `⚜️ PRESTIGIO MASSIMO ★${MAX_PRESTIGE} COMPLETATO ⚜️`
            : prestige > 0
              ? `✦ ONORIFICENZA PRESTIGIO ★${prestige} ✦`
              : "★ ONORIFICENZA UFFICIALE 100% ★",
        W / 2,
        104,
      );

      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 42px monospace";
      ctx.fillText(
        isCreator
          ? "MEDAGLIA DEL CREATORE"
          : isImmortal
            ? "IMMORTALE DI LILIBEO"
            : "MEDAGLIA DI LILIBEO",
        W / 2,
        160,
      );

      const ribbonY = 196;
      const ribbonH = 175;
      const ribbonW = 190;
      const rx = (W - ribbonW) / 2;

      if (isCreator) {
        ctx.fillStyle = "#090d16";
        ctx.fillRect(rx, ribbonY, ribbonW, ribbonH);
        ctx.fillStyle = "#ff0054";
        ctx.fillRect(rx + 26, ribbonY, ribbonW - 52, ribbonH);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(rx + 74, ribbonY, ribbonW - 148, ribbonH);
      } else if (isImmortal) {
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(rx, ribbonY, ribbonW, ribbonH);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(rx + 30, ribbonY, ribbonW - 60, ribbonH);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(rx + 72, ribbonY, ribbonW - 144, ribbonH);
      } else {
        ctx.fillStyle = "#b91c1c";
        ctx.fillRect(rx, ribbonY, ribbonW, ribbonH);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(rx + 46, ribbonY, ribbonW - 92, ribbonH);
      }
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 6;
      ctx.strokeRect(rx, ribbonY, ribbonW, ribbonH);

      ctx.fillStyle = "#ffd166";
      ctx.fillRect(rx - 14, ribbonY + ribbonH - 18, ribbonW + 28, 28);
      ctx.strokeRect(rx - 14, ribbonY + ribbonH - 18, ribbonW + 28, 28);

      const cx = W / 2;
      const cy = 505;
      const outerR = 178;

      const glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 245);
      if (isCreator) {
        glow.addColorStop(0, "rgba(255, 0, 84, 0.55)");
        glow.addColorStop(0.55, "rgba(255, 209, 102, 0.25)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (isImmortal) {
        glow.addColorStop(0, "rgba(125, 211, 252, 0.65)");
        glow.addColorStop(0.55, "rgba(255, 209, 102, 0.28)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        glow.addColorStop(0, "rgba(255, 209, 102, 0.42)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 245, 0, Math.PI * 2);
      ctx.fill();

      if (isCreator) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i - Math.PI / 8;
          const px = cx + Math.cos(angle) * (outerR + 10);
          const py = cy + Math.sin(angle) * (outerR + 10);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        const octGrad = ctx.createLinearGradient(
          cx - outerR,
          cy - outerR,
          cx + outerR,
          cy + outerR,
        );
        octGrad.addColorStop(0, "#ffd166");
        octGrad.addColorStop(0.5, "#ff0054");
        octGrad.addColorStop(1, "#ffd166");
        ctx.fillStyle = octGrad;
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, outerR - 22, 0, Math.PI * 2);
        ctx.fillStyle = "#090d16";
        ctx.fill();
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, outerR - 44, 0, Math.PI * 2);
        ctx.strokeStyle = "#ff0054";
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.fillStyle = "#ffd166";
        ctx.fillRect(cx - 42, cy - 112, 84, 18);
        ctx.fillRect(cx - 42, cy - 128, 16, 16);
        ctx.fillRect(cx - 8, cy - 134, 16, 22);
        ctx.fillRect(cx + 26, cy - 128, 16, 16);
        ctx.fillStyle = "#ff0054";
        ctx.fillRect(cx - 6, cy - 108, 12, 10);

        drawPixelLightning(ctx, cx, cy + 16, 2.1);

        drawPixelStar(ctx, cx - 102, cy, 18, 8, "#ffd166");
        drawPixelStar(ctx, cx + 102, cy, 18, 8, "#ffd166");
      } else if (isImmortal) {
        const platGrad = ctx.createLinearGradient(
          cx - outerR,
          cy - outerR,
          cx + outerR,
          cy + outerR,
        );
        platGrad.addColorStop(0, "#ffffff");
        platGrad.addColorStop(0.35, "#7dd3fc");
        platGrad.addColorStop(0.7, "#ffd166");
        platGrad.addColorStop(1, "#e0f2fe");
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.fillStyle = platGrad;
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, outerR - 26, 0, Math.PI * 2);
        ctx.fillStyle = "#0c1f3a";
        ctx.fill();
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 6;
        ctx.stroke();

        drawPixelDiamond(ctx, cx, cy + 6, 78);

        for (let i = 0; i < MAX_PRESTIGE; i++) {
          const t = (i - 2) * 0.36;
          const sx = cx + Math.sin(t) * 118;
          const sy = cy - Math.cos(t) * 112;
          drawPixelStar(ctx, sx, sy, 18, 8, "#ffd166");
        }
      } else {
        const goldGrad = ctx.createLinearGradient(
          cx - outerR,
          cy - outerR,
          cx + outerR,
          cy + outerR,
        );
        if (prestige > 0) {
          goldGrad.addColorStop(0, "#ffd166");
          goldGrad.addColorStop(0.5, "#e879f9");
          goldGrad.addColorStop(1, "#4cc9f0");
        } else {
          goldGrad.addColorStop(0, "#fef08a");
          goldGrad.addColorStop(0.5, "#ffd166");
          goldGrad.addColorStop(1, "#d97706");
        }
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.fillStyle = goldGrad;
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, outerR - 24, 0, Math.PI * 2);
        ctx.fillStyle = "#141b33";
        ctx.fill();
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 5;
        ctx.stroke();

        drawPixelStar(ctx, cx, cy - 8, 72, 32, "#ffd166");

        const stars = Math.min(prestige, MAX_PRESTIGE);
        for (let i = 0; i < stars; i++) {
          const offset = (i - (stars - 1) / 2) * 44;
          drawPixelStar(ctx, cx + offset, cy + 92, 16, 7, "#f0abfc");
        }
      }

      const bannerW = 680;
      const bannerH = 60;
      const bx = (W - bannerW) / 2;
      const by = 716;
      ctx.fillStyle = isCreator
        ? "#9f1239"
        : isImmortal
          ? "#0284c7"
          : "#ffd166";
      ctx.fillRect(bx, by, bannerW, bannerH);
      ctx.strokeStyle = isCreator ? "#ffd166" : "#000000";
      ctx.lineWidth = 5;
      ctx.strokeRect(bx, by, bannerW, bannerH);

      ctx.fillStyle = isCreator || isImmortal ? "#ffffff" : "#000000";
      ctx.font = "bold 26px monospace";
      ctx.fillText(
        isCreator
          ? "ARCHITETTO DI LILIBEO • CREATOR"
          : isImmortal
            ? "IMMORTALE DI LILIBEO • ★P5 MAX"
            : prestige > 0
              ? `LEGGENDA DI MARSALA • ★P${prestige}`
              : "CONQUISTATORE DI MARSALA • 20/20",
        W / 2,
        by + 39,
      );

      const cardX = 76;
      const cardY = 812;
      const cardW = W - 152;
      const cardH = 264;
      ctx.fillStyle = isCreator ? "#120814" : "#141b33";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeStyle = outerStroke;
      ctx.lineWidth = 6;
      ctx.strokeRect(cardX, cardY, cardW, cardH);

      try {
        const svgStr = renderAvatarSvgString(avatar, 148, 185);
        const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
        const avatarImg = await loadImage(svgUrl);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(avatarImg, cardX + 34, cardY + 38, 148, 185);
        ctx.imageSmoothingEnabled = true;
      } catch {
        // Fallback se SVG non caricato
      }

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px monospace";
      const nickBadge = isCreator
        ? `${nickname} ⚡SU`
        : prestige > 0
          ? `${nickname} ★P${prestige}`
          : nickname;
      ctx.fillText(nickBadge, cardX + 216, cardY + 86);

      ctx.fillStyle = isCreator
        ? "#ff4d6d"
        : isImmortal
          ? "#7dd3fc"
          : "#ffd166";
      ctx.font = "bold 24px monospace";
      ctx.fillText(
        isCreator ? "Architetto di Lilibeo" : titleObj.label,
        cardX + 216,
        cardY + 132,
      );

      ctx.fillStyle = "#38e54d";
      ctx.font = "bold 26px monospace";
      ctx.fillText(
        `${totalXp} XP  •  ${unlockedCount}/${TOTAL_MARSALA_POIS} LUOGHI`,
        cardX + 216,
        cardY + 182,
      );

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "22px monospace";
      ctx.fillText(
        `SEGRETI: ${easterEggCount}/9  •  PRESTIGIO: ${prestige}/${MAX_PRESTIGE}`,
        cardX + 216,
        cardY + 224,
      );

      ctx.textAlign = "center";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "22px monospace";
      ctx.fillText(
        `MARSALA QUEST 8-BIT • ${new Date().toLocaleDateString("it-IT")} • MARSALA (TP)`,
        W / 2,
        1168,
      );

      if (!cancelled) {
        setMedalUrl(canvas.toDataURL("image/png"));
      }
    };

    void buildMedal();
    return () => {
      cancelled = true;
    };
  }, [
    variant,
    nickname,
    totalXp,
    easterEggCount,
    prestige,
    unlockedCount,
    avatar,
    titleObj,
  ]);

  const handleSaveOrShare = async () => {
    if (!medalUrl) return;
    sound8bit.prime();
    sound8bit.postcardPrint();
    setSharing(true);
    try {
      const label =
        variant === "creator"
          ? "Medaglia del Creatore Supremo"
          : variant === "immortal"
            ? "Medaglia Immortale di Lilibeo ★5"
            : "Medaglia di Lilibeo";
      await shareOrSaveDataUrl(
        medalUrl,
        `marsala-medaglia-${variant}-${nickname}.png`,
        `Marsala Quest 8-Bit • ${label}`,
        `Ho ottenuto la ${label} (${totalXp} XP) su Marsala Quest 8-Bit!`,
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
            {variant === "creator"
              ? "👑 MEDAGLIA CREATORE"
              : variant === "immortal"
                ? "⚜️ MEDAGLIA ★5 MAX"
                : "🏅 MEDAGLIA LILIBEO"}
          </h3>
          <button
            onClick={onClose}
            className="nes-btn w-10 h-10 bg-[#ff4d6d] text-white text-[10px]"
          >
            X
          </button>
        </div>

        {/* Selettore anteprima varianti (riservato al Superuser) */}
        {isSuperuser && (
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => {
                sound8bit.creatorSupreme();
                setVariant("creator");
              }}
              className={`nes-btn py-1.5 text-[7px] ${
                variant === "creator"
                  ? "bg-[#ff0054] text-white"
                  : "bg-[#26335c] text-slate-300"
              }`}
            >
              👑 CREATOR
            </button>
            <button
              type="button"
              onClick={() => {
                sound8bit.immortalPrestige5();
                setVariant("immortal");
              }}
              className={`nes-btn py-1.5 text-[7px] ${
                variant === "immortal"
                  ? "bg-[#38bdf8] text-black"
                  : "bg-[#26335c] text-slate-300"
              }`}
            >
              ⚜️ ★5 MAX
            </button>
            <button
              type="button"
              onClick={() => {
                sound8bit.victoryMedal();
                setVariant("standard");
              }}
              className={`nes-btn py-1.5 text-[7px] ${
                variant === "standard"
                  ? "bg-[#ffd166] text-black"
                  : "bg-[#26335c] text-slate-300"
              }`}
            >
              🏅 STANDARD
            </button>
          </div>
        )}

        {medalUrl ? (
          <img
            src={medalUrl}
            alt="Medaglia Marsala Quest 8-Bit"
            className="mx-auto max-h-[56dvh] w-auto border-[3px] border-[#ffd166] shadow-[4px_4px_0_#000] mb-3"
          />
        ) : (
          <div className="h-64 flex items-center justify-center font-pixel text-[9px] text-[#ffd166]">
            CONIAZIONE MEDAGLIA 8-BIT...
          </div>
        )}

        <button
          type="button"
          disabled={!medalUrl || sharing}
          onClick={() => void handleSaveOrShare()}
          className="nes-btn w-full py-3.5 bg-[#38e54d] text-black text-[9px]"
        >
          {sharing ? "APERTURA..." : "📲 Salva o Condividi"}
        </button>
      </div>
    </div>
  );
};
