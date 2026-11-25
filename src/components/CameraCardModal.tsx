import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  type CardEdition,
  type PoiDefinition,
  getCurrentCardEdition,
  getEffectiveUnlockRadius,
  haversineMeters,
} from "../../shared/pois";
import type { RealGpsState } from "../hooks/useRealGps";
import type { RetroTheme, UnlockData } from "../types/game";
import { shareOrSaveDataUrl } from "../utils/shareImage";
import { sound8bit } from "../utils/sound8bit";

interface CameraCardModalProps {
  poi: PoiDefinition;
  nickname: string;
  isSuperuser?: boolean;
  prestige: number;
  theme: RetroTheme;
  isDailyBounty: boolean;
  bountyCompletedToday: boolean;
  bountyBonusXp: number;
  gps: RealGpsState;
  existingUnlock?: UnlockData;
  onClose: () => void;
  onTrackWithCompass: (poi: PoiDefinition) => void;
  onSubmitUnlock: (photoDataUrl: string) => Promise<void>;
}

function wrapCanvasLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  } else if (lines.length === maxLines && words.length > 0) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth - 16) {
      lines[maxLines - 1] = `${last.slice(0, -3)}...`;
    }
  }

  return lines;
}

function renderCardCanvas(params: {
  sourceImage: HTMLImageElement | null;
  pixelFilter: boolean;
  poi: PoiDefinition;
  nickname: string;
  lat: number;
  lng: number;
  isHoloCard: boolean;
  prestige: number;
  rarity: number;
  potentialXp: number;
  isDailyBounty: boolean;
  edition: CardEdition;
}): string {
  const {
    sourceImage,
    pixelFilter,
    poi,
    nickname,
    lat,
    lng,
    isHoloCard,
    prestige,
    rarity,
    potentialXp,
    isDailyBounty,
    edition,
  } = params;

  const W = 540;
  const H = 780;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const isGolden = edition === "golden_hour";
  const isNight = edition === "night";

  ctx.fillStyle = isHoloCard
    ? "#1a1033"
    : isGolden
      ? "#24120c"
      : isNight
        ? "#070b1e"
        : "#0b0e1a";
  ctx.fillRect(0, 0, W, H);

  if (isHoloCard) {
    const holoGrad = ctx.createLinearGradient(0, 0, W, H);
    holoGrad.addColorStop(0, "#ffd166");
    holoGrad.addColorStop(0.35, "#4cc9f0");
    holoGrad.addColorStop(0.7, "#e879f9");
    holoGrad.addColorStop(1, "#ffd166");
    ctx.strokeStyle = holoGrad;
  } else if (isGolden) {
    const sunGrad = ctx.createLinearGradient(0, 0, W, H);
    sunGrad.addColorStop(0, "#ff9e00");
    sunGrad.addColorStop(0.5, "#ff4d6d");
    sunGrad.addColorStop(1, "#ffd166");
    ctx.strokeStyle = sunGrad;
  } else if (isNight) {
    const nightGrad = ctx.createLinearGradient(0, 0, W, H);
    nightGrad.addColorStop(0, "#38bdf8");
    nightGrad.addColorStop(0.5, "#818cf8");
    nightGrad.addColorStop(1, "#22d3ee");
    ctx.strokeStyle = nightGrad;
  } else {
    ctx.strokeStyle = "#ffd166";
  }
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, W - 14, H - 14);

  ctx.strokeStyle = isHoloCard
    ? "#f0abfc"
    : isGolden
      ? "#ff9e00"
      : isNight
        ? "#38bdf8"
        : "#4cc9f0";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // Header Card
  ctx.fillStyle = isHoloCard
    ? "#f0abfc"
    : isGolden
      ? "#ff9e00"
      : isNight
        ? "#38bdf8"
        : "#ffd166";
  ctx.font = "bold 19px monospace";
  const headerTag = isHoloCard
    ? `HOLO • PRESTIGIO ★${Math.max(1, prestige)}`
    : isGolden
      ? "GOLDEN HOUR EDITION"
      : isNight
        ? "NIGHT EDITION"
        : "MARSALA-DEX CARD";
  ctx.fillText(`${"★".repeat(rarity)} ${headerTag}`, 34, 54);

  ctx.fillStyle = "#38e54d";
  ctx.textAlign = "right";
  ctx.fillText(`+${potentialXp} XP`, W - 34, 54);
  ctx.textAlign = "left";

  // Riquadro foto centrale
  const px = 34;
  const py = 70;
  const pw = W - 68;
  const ph = 350;

  ctx.fillStyle = "#05070f";
  ctx.fillRect(px, py, pw, ph);

  if (sourceImage) {
    const scale = Math.max(pw / sourceImage.width, ph / sourceImage.height);
    const sw = pw / scale;
    const sh = ph / scale;
    const sx = (sourceImage.width - sw) / 2;
    const sy = (sourceImage.height - sh) / 2;

    if (pixelFilter) {
      const tmp = document.createElement("canvas");
      tmp.width = 135;
      tmp.height = 100;
      const tctx = tmp.getContext("2d")!;
      tctx.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, tmp.width, tmp.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, px, py, pw, ph);
      ctx.imageSmoothingEnabled = true;
    } else {
      ctx.drawImage(sourceImage, sx, sy, sw, sh, px, py, pw, ph);
    }
  } else {
    const skyGrad = ctx.createLinearGradient(px, py, px, py + ph);
    skyGrad.addColorStop(0, "#1e1b4b");
    skyGrad.addColorStop(0.65, "#312e81");
    skyGrad.addColorStop(0.65, "#0f172a");
    skyGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(px, py, pw, ph);

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(px + pw - 90, py + 82, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "96px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(poi.icon, px + pw / 2, py + 205);

    ctx.fillStyle = "#4cc9f0";
    ctx.font = "bold 18px monospace";
    ctx.fillText("MARSALA • LILIBEO 8-BIT", px + pw / 2, py + 305);
    ctx.textAlign = "left";
  }

  if (isHoloCard || isGolden || isNight) {
    const sheen = ctx.createLinearGradient(px, py, px + pw, py + ph);
    if (isGolden) {
      sheen.addColorStop(0, "rgba(255, 158, 0, 0.22)");
      sheen.addColorStop(1, "rgba(255, 77, 109, 0.16)");
    } else if (isNight) {
      sheen.addColorStop(0, "rgba(56, 189, 248, 0.18)");
      sheen.addColorStop(1, "rgba(129, 140, 248, 0.18)");
    } else {
      sheen.addColorStop(0, "rgba(255, 209, 102, 0.16)");
      sheen.addColorStop(0.5, "rgba(76, 201, 240, 0.18)");
      sheen.addColorStop(1, "rgba(232, 121, 249, 0.18)");
    }
    ctx.fillStyle = sheen;
    ctx.fillRect(px, py, pw, ph);
  }

  ctx.strokeStyle = isGolden ? "#ff9e00" : isNight ? "#38bdf8" : "#f4f1de";
  ctx.lineWidth = 4;
  ctx.strokeRect(px, py, pw, ph);

  // Nome monumento & zona
  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 24px monospace";
  ctx.fillText(poi.name.slice(0, 29), 34, 460);

  ctx.fillStyle = "#4cc9f0";
  ctx.font = "19px monospace";
  ctx.fillText(poi.zone.slice(0, 40), 34, 488);

  // Separatore descrizione dentro la Card
  ctx.strokeStyle = "rgba(76, 201, 240, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(34, 502);
  ctx.lineTo(W - 34, 502);
  ctx.stroke();

  // Descrizione & Curiosità dentro la Card
  ctx.fillStyle = "#f4f1de";
  ctx.font = "16px monospace";
  const descLines = wrapCanvasLines(ctx, poi.shortDesc, pw, 2);
  let textY = 524;
  for (const line of descLines) {
    ctx.fillText(line, 34, textY);
    textY += 21;
  }

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "15px monospace";
  const triviaLines = wrapCanvasLines(ctx, `💡 ${poi.trivia}`, pw, 3);
  textY += 4;
  for (const line of triviaLines) {
    ctx.fillText(line, 34, textY);
    textY += 20;
  }

  // Separatore metadati giocatore
  ctx.strokeStyle = "rgba(255, 209, 102, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(34, 654);
  ctx.lineTo(W - 34, 654);
  ctx.stroke();

  // Metadati certificati GPS
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "17px monospace";
  ctx.fillText(`PLAYER: ${nickname}`, 34, 680);

  ctx.fillText(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, 34, 706);

  const dateStr = new Date().toLocaleDateString("it-IT");
  ctx.fillStyle = isGolden ? "#ffb703" : isNight ? "#7dd3fc" : "#94a3b8";
  const footerTag = isGolden
    ? "SUNSET EDITION"
    : isNight
      ? "NIGHT EDITION"
      : isDailyBounty
        ? "DAILY BOUNTY"
        : "MARSALA QUEST 8-BIT";
  ctx.fillText(`${footerTag} • ${dateStr}`, 34, 740);

  return canvas.toDataURL("image/jpeg", 0.86);
}

export const CameraCardModal: React.FC<CameraCardModalProps> = ({
  poi,
  nickname,
  isSuperuser = false,
  prestige,
  theme,
  isDailyBounty,
  bountyCompletedToday,
  bountyBonusXp,
  gps,
  existingUnlock,
  onClose,
  onTrackWithCompass,
  onSubmitUnlock,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(
    existingUnlock?.photoDataUrl || null,
  );
  const [pixelFilter, setPixelFilter] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rarity = poi.rarity ?? 2;
  const effectiveRadius = getEffectiveUnlockRadius(poi, prestige);
  const activeEdition = getCurrentCardEdition(theme);
  const displayedEdition = rawPhoto
    ? activeEdition
    : existingUnlock?.edition || activeEdition;

  const isHoloCard = Boolean(existingUnlock?.isHolo) || prestige > 0;
  const isNewSpecialEdition =
    activeEdition !== "standard" &&
    (!existingUnlock || existingUnlock.edition !== activeEdition);

  const baseXp =
    prestige > 0 ? Math.round(poi.xp * (1 + prestige * 0.25)) : poi.xp;
  const potentialXp = baseXp + (isNewSpecialEdition ? 50 : 0);

  const distance =
    gps.lat !== null && gps.lng !== null
      ? Math.round(haversineMeters(gps.lat, gps.lng, poi.lat, poi.lng))
      : null;

  const gpsMargin = Math.min(Math.max(gps.accuracy || 0, 0), 45);
  const isInRange =
    isSuperuser ||
    (distance !== null && distance <= effectiveRadius + gpsMargin);

  const canTakeNewShot =
    isSuperuser || !existingUnlock || isDailyBounty || isNewSpecialEdition;

  const buildCurrentCardDataUrl = useCallback(
    (sourceImage: HTMLImageElement | null) =>
      renderCardCanvas({
        sourceImage,
        pixelFilter,
        poi,
        nickname,
        lat: gps.lat ?? poi.lat,
        lng: gps.lng ?? poi.lng,
        isHoloCard,
        prestige,
        rarity,
        potentialXp,
        isDailyBounty,
        edition: activeEdition,
      }),
    [
      pixelFilter,
      poi,
      nickname,
      gps.lat,
      gps.lng,
      isHoloCard,
      prestige,
      rarity,
      potentialXp,
      isDailyBounty,
      activeEdition,
    ],
  );

  useEffect(() => {
    if (!rawPhoto) return;
    const img = new Image();
    img.onload = () => {
      setCardPreview(buildCurrentCardDataUrl(img));
    };
    img.src = rawPhoto;
  }, [rawPhoto, buildCurrentCardDataUrl]);

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        sound8bit.click();
        setRawPhoto(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!cardPreview) return;
    sound8bit.click();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmitUnlock(cardPreview);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Errore durante il salvataggio.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuperuserInstantUnlock = async () => {
    sound8bit.click();
    setSubmitting(true);
    setError(null);
    try {
      const cardDataUrl =
        rawPhoto && cardPreview ? cardPreview : buildCurrentCardDataUrl(null);
      await onSubmitUnlock(cardDataUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Errore durante lo sblocco Superuser.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveOrShareCard = async () => {
    if (!cardPreview) return;
    sound8bit.click();
    setSharing(true);
    try {
      await shareOrSaveDataUrl(
        cardPreview,
        `marsala-card-${poi.id}.jpg`,
        `Marsala Quest 8-Bit • ${poi.name}`,
        `Ho sbloccato la Card "${poi.name}" su Marsala Quest 8-Bit!`,
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] bg-black/85 flex items-end sm:items-center justify-center sm:p-3">
      <div
        className={`w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto p-4 safe-bottom ${
          isHoloCard ? "nes-box-gold holo-card" : "nes-box-gold"
        }`}
      >
        {/* Header POI */}
        <div className="flex justify-between items-start gap-2 border-b-[3px] border-[#2e3d6b] pb-2.5 mb-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="font-pixel text-[8px] text-[#38e54d]">
                {"★".repeat(rarity)} {poi.zone}
              </span>
              {isHoloCard && (
                <span className="bg-[#a21caf] border border-[#f0abfc] px-1.5 py-0.5 font-pixel text-[7px] text-white">
                  ✦ HOLO
                </span>
              )}
              {displayedEdition === "golden_hour" && (
                <span className="bg-[#b45309] border border-[#fbbf24] px-1.5 py-0.5 font-pixel text-[7px] text-[#fef08a]">
                  🌅 GOLDEN HOUR
                </span>
              )}
              {displayedEdition === "night" && (
                <span className="bg-[#1e3a8a] border border-[#38bdf8] px-1.5 py-0.5 font-pixel text-[7px] text-[#bae6fd]">
                  🌙 NIGHT
                </span>
              )}
            </div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#ffd166] leading-snug">
              {poi.icon} {poi.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="nes-btn w-10 h-10 bg-[#ff4d6d] text-white text-[10px] shrink-0"
          >
            X
          </button>
        </div>

        {/* Banner Edizione Speciale Oraria */}
        {activeEdition !== "standard" && (
          <div
            className={`mb-3 border-[3px] p-2.5 ${
              activeEdition === "golden_hour"
                ? "bg-[#2c1608] border-[#ff9e00]"
                : "bg-[#091534] border-[#38bdf8]"
            }`}
          >
            <p className="font-pixel text-[8px] text-[#ffd166]">
              {activeEdition === "golden_hour"
                ? `🌅 EDIZIONE GOLDEN HOUR ATTIVA (${isNewSpecialEdition ? "+50 XP BONUS" : "GIÀ OTTENUTA"})`
                : `🌙 EDIZIONE NOTTURNA ATTIVA (${isNewSpecialEdition ? "+50 XP BONUS" : "GIÀ OTTENUTA"})`}
            </p>
            <p className="text-lg text-[#f4f1de] leading-tight mt-1">
              {isNewSpecialEdition
                ? "Scatta sul posto ora per applicare la cornice speciale alla tua Card e guadagnare +50 XP!"
                : "Questa Card possiede già questa edizione speciale."}
            </p>
          </div>
        )}

        {/* Banner Obiettivo del Giorno */}
        {isDailyBounty && (
          <div className="mb-3 bg-[#2a153d] border-[3px] border-[#e879f9] p-2.5">
            <p className="font-pixel text-[8px] text-[#f0abfc]">
              🎯 OBIETTIVO DEL GIORNO (
              {bountyCompletedToday
                ? "GIÀ RISCOSSO OGGI"
                : `+${bountyBonusXp} XP BONUS`}
              )
            </p>
            <p className="text-lg text-[#f4f1de] leading-tight mt-1">
              {bountyCompletedToday
                ? "Bonus giornaliero di oggi già incassato! Puoi comunque aggiornare la foto."
                : `Scatta sul posto entro ${effectiveRadius}m per +${bountyBonusXp} XP extra e aumentare la streak!`}
            </p>
          </div>
        )}

        {/* Stato Distanza GPS + Tasto Bussola */}
        <div
          className={`border-[3px] p-2.5 mb-3 flex items-center justify-between gap-2 ${
            isInRange
              ? "border-[#38e54d] bg-[#102a1d]"
              : "border-[#ff4d6d] bg-[#36111c]"
          }`}
        >
          <div>
            <p className="font-pixel text-[8px] text-[#ffd166]">
              {distance !== null
                ? `DISTANZA: ${distance}m`
                : "RICERCA POSIZIONE GPS..."}
            </p>
            <p className="text-lg text-slate-200 leading-tight">
              Raggio richiesto: <strong>{effectiveRadius}m</strong>
              {isSuperuser ? " • ⚡ Bypass Superuser" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isInRange && (
              <span className="font-pixel text-[8px] px-2 py-1 bg-black/50 border border-white/30">
                ✅ IN ZONA
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                sound8bit.click();
                onTrackWithCompass(poi);
              }}
              className="nes-btn px-2.5 py-2 bg-[#4cc9f0] text-black text-[8px]"
            >
              🧭 GUIDAMI
            </button>
          </div>
        </div>

        {/* Anteprima Card (con descrizione e curiosità stampate dentro) */}
        {cardPreview ? (
          <div className="mb-3 flex flex-col items-center">
            <img
              src={cardPreview}
              alt={poi.name}
              className="max-h-[48dvh] w-auto border-[3px] border-[#ffd166] shadow-[4px_4px_0_#000]"
            />

            {rawPhoto && (
              <div className="w-full grid grid-cols-2 gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    sound8bit.click();
                    setPixelFilter((p) => !p);
                  }}
                  className={`nes-btn py-2 text-[8px] ${
                    pixelFilter
                      ? "bg-[#4cc9f0] text-black"
                      : "bg-[#26335c] text-white"
                  }`}
                >
                  👾 FILTRO 8-BIT: {pixelFilter ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="nes-btn py-2 bg-[#ffd166] text-black text-[8px]"
                >
                  🔄 RIFAI FOTO
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-3 border-[3px] border-[#2e3d6b] bg-[#090d18] p-3">
            <p className="text-xl text-[#f4f1de] leading-tight mb-1.5">
              {poi.shortDesc}
            </p>
            <p className="text-lg text-[#94a3b8] leading-tight">
              💡 {poi.trivia}
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFilePicked}
          className="hidden"
        />

        {error && (
          <div className="mb-3 bg-[#4c0519] border-2 border-[#ff4d6d] p-2 text-lg text-[#fecdd3]">
            ⚠ {error}
          </div>
        )}

        {/* Pulsanti Azione */}
        <div className="space-y-2">
          {canTakeNewShot && (
            <button
              type="button"
              disabled={!isInRange}
              onClick={() => fileInputRef.current?.click()}
              className="nes-btn w-full py-3 bg-[#ffd166] text-black text-[9px] disabled:opacity-45"
            >
              📷 FOTOCAMERA
            </button>
          )}

          {rawPhoto && cardPreview && (
            <button
              type="button"
              disabled={submitting || !isInRange}
              onClick={() => void handleConfirm()}
              className="nes-btn w-full py-3.5 bg-[#38e54d] text-black text-[10px] disabled:opacity-50"
            >
              {submitting
                ? "SINCRONIZZAZIONE..."
                : existingUnlock
                  ? "✨ AGGIORNA CARD"
                  : `★ SBLOCCA CARD (+${potentialXp} XP)`}
            </button>
          )}

          {isSuperuser && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSuperuserInstantUnlock()}
              className="nes-btn w-full py-3 bg-[#c026d3] text-white text-[8px] sm:text-[9px] disabled:opacity-50"
            >
              {submitting
                ? "SBLOCCO SUPERUSER..."
                : `⚡ SUPERUSER: SBLOCCA SENZA GPS / FOTO (+${potentialXp} XP)`}
            </button>
          )}

          {cardPreview && (existingUnlock || rawPhoto) && (
            <button
              type="button"
              disabled={sharing}
              onClick={() => void handleSaveOrShareCard()}
              className="nes-btn w-full py-3 bg-[#38e54d] text-black text-[9px] disabled:opacity-50"
            >
              {sharing ? "APERTURA..." : "📲 Salva o Condividi"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
