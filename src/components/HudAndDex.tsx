import React, { useState } from "react";
import {
  EASTER_EGGS,
  MARSALA_POIS,
  type PoiDefinition,
} from "../../shared/pois";
import type { RealGpsState } from "../hooks/useRealGps";
import type { LeaderboardEntry, UnlockData, UserProfile } from "../types/game";
import { sound8bit } from "../utils/sound8bit";

interface HudBarProps {
  user: UserProfile;
  unlockedCount: number;
  totalXp: number;
  gps: RealGpsState;
  onTitleTap: () => void;
  onSkyTap: () => void;
  onRadarTap: () => void;
}

export const HudBar: React.FC<HudBarProps> = ({
  user,
  unlockedCount,
  totalXp,
  gps,
  onTitleTap,
  onSkyTap,
  onRadarTap,
}) => {
  const percent = Math.round((unlockedCount / MARSALA_POIS.length) * 100);
  const gpsColor =
    gps.status === "LOCKED"
      ? "text-[#38e54d]"
      : gps.status === "SEARCHING"
        ? "text-[#ffd166]"
        : "text-[#ff4d6d]";

  return (
    <header className="absolute top-0 left-0 right-0 z-[700] pointer-events-none px-2 safe-top flex flex-col gap-1.5">
      {/* Riga compatta superiore: max visibilità sulla mappa */}
      <div className="nes-box pointer-events-auto px-2.5 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onTitleTap}
            className="flex items-center gap-2 text-left focus:outline-none min-w-0"
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="w-9 h-9 border-2 border-[#ffd166] shrink-0"
              style={{ imageRendering: "pixelated" }}
            />
            <div className="min-w-0">
              <span className="font-pixel text-[9px] sm:text-[11px] text-[#ffd166] block truncate">
                MARSALA 8-BIT
              </span>
              <span className="text-lg sm:text-xl text-[#4cc9f0] leading-none block truncate">
                👾 {user.nickname} •{" "}
                <strong className="text-[#38e54d]">{totalXp} XP</strong>
              </span>
            </div>
          </button>
          ...
        </div>

        <button
          onClick={onRadarTap}
          className="bg-[#0b0e1a] border-2 border-[#4cc9f0] px-2 py-1 text-base sm:text-lg shrink-0"
        >
          <span className={gpsColor}>
            {gps.status === "LOCKED"
              ? `🛰 ±${gps.accuracy}m`
              : gps.status === "SEARCHING"
                ? "🛰 GPS..."
                : "⚠ NO GPS"}
          </span>
        </button>
      </div>

      {/* Barra progresso sottile */}
      <div className="nes-box pointer-events-auto px-2.5 py-1 flex items-center gap-2">
        <span className="font-pixel text-[7px] sm:text-[8px] text-[#ffd166] whitespace-nowrap">
          {unlockedCount}/{MARSALA_POIS.length} ({percent}%)
        </span>
        <div className="flex-1 h-2.5 bg-[#090d18] border-2 border-[#f4f1de]">
          <div
            className="h-full bg-[#38e54d] transition-all duration-700"
            style={{
              width: `${percent}%`,
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 3px, transparent 3px, transparent 8px)",
            }}
          />
        </div>
      </div>

      {/* Banner errore GPS con tasto RIPROVA a portata di dito */}
      {gps.errorMessage && (
        <div className="pointer-events-auto bg-[#4c0519] border-[3px] border-[#ff4d6d] px-2.5 py-1.5 flex items-center justify-between gap-2">
          <span className="text-base sm:text-lg text-[#ffe4e6] leading-tight">
            ⚠ {gps.errorMessage}
          </span>
          <button
            onClick={() => {
              sound8bit.click();
              gps.retry();
            }}
            className="nes-btn px-2 py-1.5 bg-[#ffd166] text-black text-[8px] shrink-0"
          >
            RIPROVA
          </button>
        </div>
      )}
    </header>
  );
};

interface BottomDockProps {
  unlockedCount: number;
  isCompleted: boolean;
  crtEnabled: boolean;
  muted: boolean;
  onOpenDex: () => void;
  onOpenLeaderboard: () => void;
  onOpenMedal: () => void;
  onToggleCrt: () => void;
  onToggleMute: () => void;
  onLogout: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  unlockedCount,
  isCompleted,
  crtEnabled,
  muted,
  onOpenDex,
  onOpenLeaderboard,
  onOpenMedal,
  onToggleCrt,
  onToggleMute,
  onLogout,
}) => (
  <nav className="fixed bottom-0 left-0 right-0 z-[700] pointer-events-none px-2 safe-bottom">
    <div className="max-w-xl mx-auto pointer-events-auto flex flex-col gap-2">
      {isCompleted && (
        <button
          onClick={() => {
            sound8bit.victoryMedal();
            onOpenMedal();
          }}
          className="nes-btn w-full py-2.5 bg-[#ffd166] text-black text-[9px]"
        >
          🏅 APRI LA MEDAGLIA D&apos;ORO DI LILIBEO
        </button>
      )}

      <div className="nes-box p-1.5 grid grid-cols-5 gap-1.5">
        <button
          onClick={() => {
            sound8bit.click();
            onOpenDex();
          }}
          className="nes-btn min-h-[48px] bg-[#ffd166] text-black flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-base leading-none">📖</span>
          <span className="text-[7px]">DEX {unlockedCount}</span>
        </button>

        <button
          onClick={() => {
            sound8bit.click();
            onOpenLeaderboard();
          }}
          className="nes-btn min-h-[48px] bg-[#4cc9f0] text-black flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-base leading-none">🏆</span>
          <span className="text-[7px]">TOP</span>
        </button>

        <button
          onClick={onToggleMute}
          className="nes-btn min-h-[48px] bg-[#26335c] text-white flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-base leading-none">{muted ? "🔇" : "🔊"}</span>
          <span className="text-[7px]">AUDIO</span>
        </button>

        <button
          onClick={onToggleCrt}
          className={`nes-btn min-h-[48px] flex flex-col items-center justify-center gap-0.5 ${
            crtEnabled
              ? "bg-[#38e54d] text-black"
              : "bg-[#26335c] text-slate-300"
          }`}
        >
          <span className="text-base leading-none">📺</span>
          <span className="text-[7px]">CRT</span>
        </button>

        <button
          onClick={onLogout}
          className="nes-btn min-h-[48px] bg-[#ff4d6d] text-white flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-base leading-none">🚪</span>
          <span className="text-[7px]">EXIT</span>
        </button>
      </div>
    </div>
  </nav>
);

interface DexModalProps {
  unlocks: Record<string, UnlockData>;
  easterEggs: string[];
  onSelectPoi: (poi: PoiDefinition) => void;
  onTrigger1860: () => void;
  onClose: () => void;
}

export const DexModal: React.FC<DexModalProps> = ({
  unlocks,
  easterEggs,
  onSelectPoi,
  onTrigger1860,
  onClose,
}) => {
  const [tab, setTab] = useState<"pois" | "eggs">("pois");
  const [query, setQuery] = useState("");

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.trim() === "1860") onTrigger1860();
  };

  const filtered = MARSALA_POIS.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.zone.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-end sm:items-center justify-center sm:p-3">
      <div className="nes-box w-full sm:max-w-2xl h-[86dvh] sm:h-auto sm:max-h-[86dvh] flex flex-col p-3.5 safe-bottom">
        <div className="flex justify-between items-center border-b-[3px] border-[#2e3d6b] pb-2.5 mb-2.5 gap-2">
          <div className="flex gap-1.5 flex-1">
            <button
              onClick={() => {
                sound8bit.click();
                setTab("pois");
              }}
              className={`nes-btn flex-1 py-2 text-[8px] sm:text-[9px] ${
                tab === "pois"
                  ? "bg-[#ffd166] text-black"
                  : "bg-[#26335c] text-slate-300"
              }`}
            >
              DEX ({Object.keys(unlocks).length}/{MARSALA_POIS.length})
            </button>
            <button
              onClick={() => {
                sound8bit.click();
                setTab("eggs");
              }}
              className={`nes-btn flex-1 py-2 text-[8px] sm:text-[9px] ${
                tab === "eggs"
                  ? "bg-[#38e54d] text-black"
                  : "bg-[#26335c] text-slate-300"
              }`}
            >
              SEGRETI ({easterEggs.length}/{EASTER_EGGS.length})
            </button>
          </div>
          <button
            onClick={onClose}
            className="nes-btn w-10 h-10 bg-[#ff4d6d] text-white text-[10px] shrink-0"
          >
            X
          </button>
        </div>

        {tab === "pois" ? (
          <>
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Cerca luogo di Marsala (o un anno storico...)"
              className="w-full mb-2.5 bg-[#090d18] border-[3px] border-[#4cc9f0] px-3 py-2 text-xl text-white outline-none focus:border-[#ffd166]"
            />
            <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
              {filtered.map((poi) => {
                const u = unlocks[poi.id];
                return (
                  <button
                    key={poi.id}
                    onClick={() => {
                      sound8bit.click();
                      onClose();
                      onSelectPoi(poi);
                    }}
                    className={`text-left border-[3px] p-2.5 active:scale-[0.99] transition ${
                      u
                        ? "border-[#ffd166] bg-[#1e294d]"
                        : "border-[#2e3d6b] bg-[#0d1324] opacity-90"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-1">
                      <span className="font-pixel text-[8px] text-[#ffd166] leading-snug">
                        {poi.icon} {poi.name}
                      </span>
                      <span className="text-base text-[#38e54d] whitespace-nowrap">
                        +{poi.xp}XP
                      </span>
                    </div>
                    <p className="text-base text-[#94a3b8]">{poi.zone}</p>
                    {u ? (
                      <img
                        src={u.photoDataUrl}
                        alt={poi.name}
                        className="mt-2 w-full h-40 object-contain bg-[#0b0e1a] border-2 border-[#ffd166]"
                      />
                    ) : (
                      <div className="mt-2 h-12 bg-black/50 border-2 border-dashed border-[#334155] flex items-center justify-center text-[#94a3b8] text-lg">
                        ? Tocca per distanza e foto
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="overflow-y-auto space-y-2.5 pr-1">
            {EASTER_EGGS.map((egg) => {
              const found = easterEggs.includes(egg.id);
              return (
                <div
                  key={egg.id}
                  className={`border-[3px] p-3 ${
                    found
                      ? "border-[#38e54d] bg-[#102a1d]"
                      : "border-[#2e3d6b] bg-[#0d1324]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-pixel text-[9px] text-[#ffd166]">
                      {found
                        ? `${egg.badge} ${egg.title}`
                        : "??? SEGRETO BLOCCATO"}
                    </span>
                    <span className="text-lg text-[#38e54d]">+{egg.xp} XP</span>
                  </div>
                  <p className="text-xl text-[#f4f1de] mt-1 leading-tight">
                    {found ? egg.description : `Indizio: ${egg.hint}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  currentNickname: string;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  currentNickname,
  onClose,
}) => (
  <div className="fixed inset-0 z-[1000] bg-black/85 flex items-end sm:items-center justify-center sm:p-3">
    <div className="nes-box-gold w-full sm:max-w-lg max-h-[80dvh] flex flex-col p-4 safe-bottom">
      <div className="flex justify-between items-center border-b-[3px] border-[#2e3d6b] pb-3 mb-3">
        <h3 className="font-pixel text-[10px] sm:text-xs text-[#ffd166]">
          🏆 HIGH SCORES • LILIBEO
        </h3>
        <button
          onClick={onClose}
          className="nes-btn w-10 h-10 bg-[#ff4d6d] text-white text-[10px]"
        >
          X
        </button>
      </div>
      <div className="overflow-y-auto space-y-2">
        {entries.map((e, i) => (
          <div
            key={e.nickname}
            className={`flex items-center justify-between p-2.5 border-[3px] text-xl ${
              e.nickname === currentNickname
                ? "border-[#ffd166] bg-[#2c2142]"
                : "border-[#2e3d6b] bg-[#0d1324]"
            }`}
          >
            <div className="truncate pr-2">
              <span className="font-pixel text-[9px] text-[#4cc9f0] mr-2">
                #{i + 1}
              </span>
              <span className="font-bold">{e.nickname}</span>
              <span className="text-[#94a3b8] text-base ml-1.5">
                ({e.percent}%)
              </span>
            </div>
            <span className="font-pixel text-[9px] text-[#38e54d] shrink-0">
              {e.totalXp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
