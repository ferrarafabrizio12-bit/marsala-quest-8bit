import React, { useEffect, useRef, useState } from "react";
import {
  type PoiDefinition,
  getCurrentCardEdition,
  getEffectiveUnlockRadius,
  haversineMeters,
} from "../../shared/pois";
import type { RealGpsState } from "../hooks/useRealGps";
import type { RetroTheme, UnlockData } from "../types/game";
import { sound8bit } from "../utils/sound8bit";

interface CameraCardModalProps {
  poi: PoiDefinition;
  nickname: string;
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

export const CameraCardModal: React.FC<CameraCardModalProps> = ({
  poi,
  nickname,
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(
    existingUnlock?.photoDataUrl || null,
  );
  const [pixelFilter, setPixelFilter] = useState(true);
  const [liveCameraOpen, setLiveCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    distance !== null && distance <= effectiveRadius + gpsMargin;

  // Puoi scattare se: POI nuovo, OPPURE Daily Bounty, OPPURE nuova Edizione Golden Hour / Notturna disponibile
  const canTakeNewShot =
    !existingUnlock || isDailyBounty || isNewSpecialEdition;

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setLiveCameraOpen(false);
  };

  useEffect(() => stopLiveCamera, []);

  // Genera la Trading Card 8-Bit (Standard, Holo, Golden Hour o Night Edition)
  useEffect(() => {
    if (!rawPhoto) return;
    const img = new Image();
    img.onload = () => {
      const W = 540;
      const H = 720;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      const isGolden = activeEdition === "golden_hour";
      const isNight = activeEdition === "night";

      // Sfondo cartuccia per edizione
      ctx.fillStyle = isHoloCard
        ? "#1a1033"
        : isGolden
          ? "#24120c"
          : isNight
            ? "#070b1e"
            : "#0b0e1a";
      ctx.fillRect(0, 0, W, H);

      // Cornice esterna
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

      // Intestazione Card
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
      ctx.fillText(`${"★".repeat(rarity)} ${headerTag}`, 34, 56);

      ctx.fillStyle = "#38e54d";
      ctx.textAlign = "right";
      ctx.fillText(`+${potentialXp} XP`, W - 34, 56);
      ctx.textAlign = "left";

      // Riquadro foto centrale
      const px = 34;
      const py = 74;
      const pw = W - 68;
      const ph = 410;

      ctx.fillStyle = "#05070f";
      ctx.fillRect(px, py, pw, ph);

      const scale = Math.max(pw / img.width, ph / img.height);
      const sw = pw / scale;
      const sh = ph / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;

      if (pixelFilter) {
        const tmp = document.createElement("canvas");
        tmp.width = 135;
        tmp.height = 102;
        const tctx = tmp.getContext("2d")!;
        tctx.drawImage(img, sx, sy, sw, sh, 0, 0, tmp.width, tmp.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, px, py, pw, ph);
        ctx.imageSmoothingEnabled = true;
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
      }

      // Riflesso diagonale per Edizioni Speciali / Holo
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

      // Titolo luogo e zona
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 25px monospace";
      ctx.fillText(poi.name.slice(0, 28), 34, 530);

      ctx.fillStyle = "#4cc9f0";
      ctx.font = "20px monospace";
      ctx.fillText(poi.zone.slice(0, 38), 34, 562);

      // Metadati certificati GPS
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "18px monospace";
      ctx.fillText(`PLAYER: ${nickname}`, 34, 606);

      const latStr = (gps.lat ?? poi.lat).toFixed(5);
      const lngStr = (gps.lng ?? poi.lng).toFixed(5);
      ctx.fillText(`GPS: ${latStr}, ${lngStr}`, 34, 636);

      const dateStr = new Date().toLocaleDateString("it-IT");
      ctx.fillStyle = isGolden ? "#ffb703" : isNight ? "#7dd3fc" : "#94a3b8";
      const footerTag = isGolden
        ? "SUNSET EDITION"
        : isNight
          ? "NIGHT EDITION"
          : isDailyBounty
            ? "DAILY BOUNTY"
            : "MARSALA QUEST 8-BIT";
      ctx.fillText(`${footerTag} • ${dateStr}`, 34, 674);

      setCardPreview(canvas.toDataURL("image/jpeg", 0.86));
    };
    img.src = rawPhoto;
  }, [
    rawPhoto,
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
  ]);

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

  const handleOpenLiveCamera = async () => {
    sound8bit.click();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setLiveCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      fileInputRef.current?.click();
    }
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 540;
    canvas
      .getContext("2d")!
      .drawImage(video, 0, 0, canvas.width, canvas.height);
    sound8bit.click();
    setRawPhoto(canvas.toDataURL("image/jpeg", 0.9));
    stopLiveCamera();
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

  const handleDownloadCard = () => {
    if (!cardPreview) return;
    sound8bit.click();
    const a = document.createElement("a");
    a.href = cardPreview;
    a.download = `marsala-card-${poi.id}.jpg`;
    a.click();
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
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
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

        {/* Descrizione & Curiosità */}
        <p className="text-xl text-[#f4f1de] leading-tight mb-1.5">
          {poi.shortDesc}
        </p>
        <p className="text-lg text-[#94a3b8] leading-tight mb-3">
          💡 {poi.trivia}
        </p>

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
            </p>
          </div>
          {isInRange ? (
            <span className="font-pixel text-[8px] px-2 py-1 bg-black/50 border border-white/30">
              ✅ IN ZONA
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                sound8bit.click();
                stopLiveCamera();
                onTrackWithCompass(poi);
              }}
              className="nes-btn px-2.5 py-2 bg-[#4cc9f0] text-black text-[8px] shrink-0"
            >
              🧭 GUIDAMI
            </button>
          )}
        </div>

        {/* Anteprima Card o Mirino Fotocamera */}
        {liveCameraOpen ? (
          <div className="mb-3 space-y-2">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-64 object-cover bg-black border-[3px] border-[#4cc9f0]"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCaptureFrame}
                className="nes-btn py-3 bg-[#38e54d] text-black text-[9px]"
              >
                📸 SCATTA ORA
              </button>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="nes-btn py-3 bg-[#26335c] text-white text-[9px]"
              >
                ANNULLA
              </button>
            </div>
          </div>
        ) : cardPreview ? (
          <div className="mb-3 flex flex-col items-center">
            <img
              src={cardPreview}
              alt={poi.name}
              className="max-h-[42dvh] w-auto border-[3px] border-[#ffd166] shadow-[4px_4px_0_#000]"
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
        ) : null}

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
          {canTakeNewShot && !liveCameraOpen && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!isInRange}
                onClick={() => fileInputRef.current?.click()}
                className="nes-btn py-3 bg-[#ffd166] text-black text-[8px] sm:text-[9px] disabled:opacity-45"
              >
                📷 FOTOCAMERA
              </button>
              <button
                type="button"
                disabled={!isInRange}
                onClick={() => void handleOpenLiveCamera()}
                className="nes-btn py-3 bg-[#4cc9f0] text-black text-[8px] sm:text-[9px] disabled:opacity-45"
              >
                🎥 MIRINO LIVE
              </button>
            </div>
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
                  ? "✨ AGGIORNA EDIZIONE CARD"
                  : `★ SBLOCCA CARD (+${potentialXp} XP)`}
            </button>
          )}

          {cardPreview && (
            <button
              type="button"
              onClick={handleDownloadCard}
              className="nes-btn w-full py-2.5 bg-[#26335c] text-[#ffd166] text-[8px]"
            >
              ⬇️ SCARICA CARD PNG SUL TELEFONO
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
