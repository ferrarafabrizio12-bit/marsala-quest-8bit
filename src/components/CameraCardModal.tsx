import React, { useEffect, useRef, useState } from "react";
import { type PoiDefinition, haversineMeters } from "../../shared/pois";
import type { RealGpsState } from "../hooks/useRealGps";
import type { UnlockData } from "../types/game";
import { sound8bit } from "../utils/sound8bit";

interface CameraCardModalProps {
  poi: PoiDefinition;
  nickname: string;
  gps: RealGpsState;
  existingUnlock?: UnlockData;
  onClose: () => void;
  onSubmitUnlock: (photoDataUrl: string) => Promise<void>;
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  source: HTMLVideoElement | HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const sw =
    source instanceof HTMLVideoElement
      ? source.videoWidth
      : source.naturalWidth;
  const sh =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source.naturalHeight;
  if (!sw || !sh) return;

  const srcRatio = sw / sh;
  const dstRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sWidth = sw;
  let sHeight = sh;

  if (srcRatio > dstRatio) {
    sWidth = sh * dstRatio;
    sx = (sw - sWidth) / 2;
  } else {
    sHeight = sw / dstRatio;
    sy = (sh - sHeight) / 2;
  }

  ctx.drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
}

export const CameraCardModal: React.FC<CameraCardModalProps> = ({
  poi,
  nickname,
  gps,
  existingUnlock,
  onClose,
  onSubmitUnlock,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [pixelFilter, setPixelFilter] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(
    existingUnlock?.photoDataUrl || null,
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const distance =
    gps.lat !== null && gps.lng !== null
      ? Math.round(haversineMeters(gps.lat, gps.lng, poi.lat, poi.lng))
      : null;

  const allowedRadius =
    poi.unlockRadiusMeters + Math.min(gps.accuracy || 0, 45);
  const isInRange = distance !== null && distance <= allowedRadius;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Aggancia lo stream in modo affidabile su Safari iOS e Chrome Android
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.play().catch(() => {
        setCameraError(
          'Tocca il tasto "SCATTA DA FOTOCAMERA TELEFONO" per scattare.',
        );
      });
    }
  }, [cameraOpen]);

  const startLiveCamera = async () => {
    sound8bit.click();
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Usa il tasto "SCATTA DA FOTOCAMERA TELEFONO" qui sotto.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError(
        'Fotocamera live non autorizzata: usa il tasto "SCATTA DA FOTOCAMERA TELEFONO" qui sotto.',
      );
    }
  };

  const buildRetroCardDataUrl = (
    source: HTMLVideoElement | HTMLImageElement,
  ): string => {
    const W = 540;
    const H = 680;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#141b33";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, W - 14, H - 14);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    ctx.fillStyle = "#0b0e1a";
    ctx.fillRect(26, 26, W - 52, 56);
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 20px monospace";
    ctx.fillText(poi.name.toUpperCase().slice(0, 24), 38, 60);

    ctx.textAlign = "right";
    ctx.fillStyle = "#38e54d";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`+${poi.xp} XP`, W - 38, 60);
    ctx.textAlign = "left";

    const fx = 28;
    const fy = 96;
    const fw = W - 56;
    const fh = 370;

    if (pixelFilter) {
      const tiny = document.createElement("canvas");
      tiny.width = 120;
      tiny.height = 92;
      const tctx = tiny.getContext("2d")!;
      drawImageCover(tctx, source, 0, 0, tiny.width, tiny.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tiny, fx, fy, fw, fh);
    } else {
      drawImageCover(ctx, source, fx, fy, fw, fh);
    }

    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 6;
    ctx.strokeRect(fx, fy, fw, fh);

    ctx.fillStyle = "#1e294d";
    ctx.fillRect(28, 480, W - 56, 170);
    ctx.strokeStyle = "#4cc9f0";
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 480, W - 56, 170);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 22px monospace";
    ctx.fillText(
      "★".repeat(poi.rarity) +
        "☆".repeat(3 - poi.rarity) +
        "  MARSALA-DEX CARD",
      44,
      514,
    );

    ctx.fillStyle = "#f4f1de";
    ctx.font = "18px monospace";
    ctx.fillText(`ZONA: ${poi.zone.slice(0, 34)}`, 44, 548);
    ctx.fillStyle = "#4cc9f0";
    ctx.fillText(`PLAYER: ${nickname.toUpperCase()}`, 44, 580);
    ctx.fillStyle = "#38e54d";
    ctx.font = "15px monospace";
    ctx.fillText(
      `GPS CERTIFICATO: ${poi.lat.toFixed(5)} N, ${poi.lng.toFixed(5)} E`,
      44,
      612,
    );
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(
      `DATA: ${new Date().toLocaleDateString("it-IT")} • LILYBAEUM 8-BIT`,
      44,
      636,
    );

    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const takeLiveShot = () => {
    if (!videoRef.current) return;
    sound8bit.shutter();
    setCapturedPhoto(buildRetroCardDataUrl(videoRef.current));
    stopCamera();
  };

  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        sound8bit.shutter();
        setCapturedPhoto(buildRetroCardDataUrl(img));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSync = async () => {
    if (!capturedPhoto) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmitUnlock(capturedPhoto);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Errore salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const downloadCard = () => {
    if (!capturedPhoto) return;
    sound8bit.click();
    const a = document.createElement("a");
    a.href = capturedPhoto;
    a.download = `marsala-card-${poi.id}-${nickname}.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-end sm:items-center justify-center sm:p-3">
      <div className="nes-box-gold w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto p-4 safe-bottom">
        <div className="flex items-start justify-between gap-2 border-b-[3px] border-[#2e3d6b] pb-2.5 mb-2.5">
          <div>
            <span className="font-pixel text-[8px] text-[#4cc9f0]">
              {"★".repeat(poi.rarity)} {poi.zone}
            </span>
            <h2 className="font-pixel text-xs text-[#ffd166] mt-1 leading-snug">
              {poi.icon} {poi.name}
            </h2>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="nes-btn w-10 h-10 bg-[#ff4d6d] text-white text-[10px] shrink-0"
          >
            X
          </button>
        </div>

        <p className="text-xl text-[#f4f1de] leading-tight mb-2">
          {poi.shortDesc}
        </p>
        <p className="text-lg text-[#fde68a] bg-[#0b0e1a] border-2 border-[#ffd166]/40 p-2 mb-3 leading-snug">
          💡 {poi.trivia}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0b0e1a] border-[3px] border-[#2e3d6b] p-2.5 mb-3 text-lg">
          <span>
            🛰 Distanza:{" "}
            <strong className={isInRange ? "text-[#38e54d]" : "text-[#ff4d6d]"}>
              {distance !== null ? `${distance} m` : "Attesa GPS..."}
            </strong>
          </span>
          <span className="text-[#4cc9f0]">
            Raggio: {poi.unlockRadiusMeters}m • +{poi.xp} XP
          </span>
        </div>

        {cameraOpen && (
          <div className="mb-3 border-4 border-[#ffd166] bg-black relative">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#38e54d]/70 m-3" />
            <div className="p-2.5 flex justify-between items-center bg-[#141b33] gap-2">
              <label className="flex items-center gap-2 text-lg cursor-pointer text-[#ffd166]">
                <input
                  type="checkbox"
                  checked={pixelFilter}
                  onChange={(e) => setPixelFilter(e.target.checked)}
                />
                8-Bit
              </label>
              <button
                onClick={takeLiveShot}
                className="nes-btn px-4 py-2.5 bg-[#ff4d6d] text-white text-[10px]"
              >
                📸 SCATTA
              </button>
            </div>
          </div>
        )}

        {capturedPhoto && !cameraOpen && (
          <div className="mb-3 flex flex-col items-center">
            <img
              src={capturedPhoto}
              alt={poi.name}
              className="w-full max-w-[280px] border-4 border-[#ffd166] shadow-[4px_4px_0_#000]"
            />
            {existingUnlock && (
              <p className="text-base text-[#38e54d] mt-1.5">
                ✓ Sbloccata il{" "}
                {new Date(existingUnlock.unlockedAt).toLocaleString("it-IT")}
              </p>
            )}
          </div>
        )}

        {cameraError && (
          <p className="text-[#ffd166] text-lg mb-3 bg-[#2e1f05] p-2 border-2 border-[#ffd166]">
            {cameraError}
          </p>
        )}

        {submitError && (
          <p className="text-[#fecdd3] text-lg mb-3 bg-[#4c0519] p-2 border-2 border-[#ff4d6d]">
            ⚠ {submitError}
          </p>
        )}

        {existingUnlock ? (
          <div className="flex gap-2">
            <button
              onClick={downloadCard}
              className="nes-btn flex-1 min-h-[48px] bg-[#ffd166] text-black text-[10px]"
            >
              ⬇ SCARICA CARD
            </button>
            <button
              onClick={onClose}
              className="nes-btn px-4 min-h-[48px] bg-[#26335c] text-white text-[10px]"
            >
              CHIUDI
            </button>
          </div>
        ) : !isInRange ? (
          <div className="bg-[#3b0a18] border-[3px] border-[#ff4d6d] p-3 text-center">
            <p className="font-pixel text-[9px] text-[#ff4d6d] mb-1">
              🔒 ZONA NON RAGGIUNTA
            </p>
            <p className="text-lg text-[#ffe4e6] leading-snug">
              Avvicinati fisicamente a <strong>{poi.name}</strong> (entro{" "}
              {poi.unlockRadiusMeters}m) per scattare la Card e colorare questa
              zona di Marsala!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {!cameraOpen && (
              <>
                <label className="flex items-center justify-center gap-2 text-xl text-[#ffd166] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixelFilter}
                    onChange={(e) => setPixelFilter(e.target.checked)}
                  />
                  Filtro Pixel-Art 8-Bit
                </label>

                {/* Su smartphone il tasto fotocamera nativa è il più rapido e affidabile */}
                <label className="nes-btn w-full min-h-[52px] bg-[#38e54d] text-black text-[10px] text-center cursor-pointer flex items-center justify-center">
                  📱 SCATTA CON FOTOCAMERA TELEFONO
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileCapture}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={startLiveCamera}
                  className="nes-btn w-full min-h-[46px] bg-[#4cc9f0] text-black text-[9px]"
                >
                  📷 APRI MIRINO LIVE IN-APP
                </button>
              </>
            )}

            {capturedPhoto && !cameraOpen && (
              <button
                onClick={handleConfirmSync}
                disabled={saving}
                className="nes-btn w-full min-h-[52px] bg-[#ffd166] text-black text-[10px] disabled:opacity-50"
              >
                {saving ? "VERIFICA GPS..." : "★ SBLOCCA ZONA & COLORA MAPPA"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
