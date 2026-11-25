import React, { useState } from "react";
import {
  EASTER_EGGS,
  MARSALA_POIS,
  type PoiDefinition,
  haversineMeters,
} from "../../shared/pois";
import { getTitleById } from "../../shared/cosmetics";
import type { RealGpsState } from "../hooks/useRealGps";
import type {
  DailyBountyInfo,
  LeaderboardEntry,
  UnlockData,
  UserProfile,
} from "../types/game";
import { sound8bit } from "../utils/sound8bit";
import { PixelAvatar } from "./PixelAvatar";

interface HudBarProps {
  user: UserProfile;
  unlockedCount: number;
  totalXp: number;
  dailyBounty: DailyBountyInfo | null;
  gps: RealGpsState;
  onTitleTap: () => void;
  onSkyTap: () => void;
  onRadarTap: () => void;
  onProgressTap: () => void;
  onSelectBountyPoi: (poi: PoiDefinition) => void;
}

export const HudBar: React.FC<HudBarProps> = ({
  user,
  unlockedCount,
  totalXp,
  dailyBounty,
  gps,
  onTitleTap,
  onSkyTap,
  onRadarTap,
  onProgressTap,
  onSelectBountyPoi,
}) => {
  const percent = Math.round((unlockedCount / MARSALA_POIS.length) * 100);
  const bountyPoi = dailyBounty
    ? MARSALA_POIS.find((p) => p.id === dailyBounty.poiId)
    : undefined;
  const userTitle = getTitleById(user.title);

  const gpsColor =
    gps.status === "LOCKED"
      ? "text-[#38e54d]"
      : gps.status === "SEARCHING"
        ? "text-[#ffd166]"
        : "text-[#ff4d6d]";

  return (
    <header className="absolute top-0 left-0 right-0 z-[700] pointer-events-none px-2 safe-top flex flex-col gap-1.5">
      <div className="nes-box pointer-events-auto px-2 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onTitleTap}
            className="flex items-center gap-2 text-left focus:outline-none min-w-0"
          >
            <img
              src="/Marsala-Quest-8bit-ico.png"
              alt="Logo"
              className="w-9 h-9 border-2 border-[#ffd166] shrink-0"
              style={{ imageRendering: "pixelated" }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-pixel text-[9px] sm:text-[11px] text-[#ffd166] truncate">
                  {user.nickname}
                </span>
                {user.prestige > 0 && (
                  <span className="bg-[#a21caf] border border-[#f0abfc] px-1 font-pixel text-[7px] text-white shrink-0">
                    ★P{user.prestige}
                  </span>
                )}
              </div>
              <span className="text-base text-[#cbd5e1] leading-none block truncate">
                {userTitle.icon} {userTitle.label}
              </span>
              <span className="text-lg text-[#4cc9f0] leading-none block truncate">
                <strong className="text-[#38e54d]">{totalXp} XP</strong>
                {user.bountyStreak > 0 && (
                  <strong className="text-[#f0abfc] ml-1.5">
                    🔥{user.bountyStreak}d
                  </strong>
                )}
              </span>
            </div>
          </button>

          <button
            onClick={onSkyTap}
            className="nes-btn w-9 h-9 bg-[#26335c] flex items-center justify-center text-base shrink-0"
            title="Cielo di Marsala"
          >
            🌅
          </button>
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

      {/* Barra progresso (4 tap = Notte di Lilibeo) */}
      <button
        type="button"
        onClick={onProgressTap}
        className="nes-box pointer-events-auto px-2.5 py-1 flex items-center gap-2 w-full text-left"
      >
        <span className="font-pixel text-[7px] sm:text-[8px] text-[#ffd166] whitespace-nowrap">
          {unlockedCount}/{MARSALA_POIS.length} ({percent}%)
        </span>
        <div className="flex-1 h-2.5 bg-[#090d18] border-2 border-[#f4f1de]">
          <div
            className={`h-full transition-all duration-700 ${
              user.prestige > 0 ? "bg-[#e879f9]" : "bg-[#38e54d]"
            }`}
            style={{
              width: `${percent}%`,
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 3px, transparent 3px, transparent 8px)",
            }}
          />
        </div>
      </button>

      {/* Pillola compatta Obiettivo del Giorno */}
      {dailyBounty && bountyPoi && (
        <button
          type="button"
          onClick={() => {
            sound8bit.click();
            onSelectBountyPoi(bountyPoi);
          }}
          className={`pointer-events-auto px-2.5 py-1 border-[2px] flex items-center justify-between gap-2 text-left shadow-[2px_2px_0_#000] ${
            dailyBounty.completedToday
              ? "bg-[#102a1d]/95 border-[#38e54d]"
              : "bg-[#2a153d]/95 border-[#e879f9]"
          }`}
        >
          <span className="font-pixel text-[7px] text-[#f0abfc] truncate">
            {dailyBounty.completedToday
              ? `✅ BOUNTY OGGI COMPLETATO: ${bountyPoi.name}`
              : `🎯 OGGI: ${bountyPoi.name} (+${dailyBounty.bonusXp} XP)`}
          </span>
          <span className="font-pixel text-[7px] text-[#ffd166] shrink-0">
            APRI ▶
          </span>
        </button>
      )}

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
  topSlot?: React.ReactNode;
  unlockedCount: number;
  prestige: number;
  isCompleted: boolean;
  crtEnabled: boolean;
  muted: boolean;
  onOpenDex: () => void;
  onOpenWardrobe: () => void;
  onOpenLeaderboard: () => void;
  onOpenMedal: () => void;
  onOpenPrestigeConfirm: () => void;
  onToggleCrt: () => void;
  onToggleMute: () => void;
  onLogout: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  topSlot,
  unlockedCount,
  prestige,
  isCompleted,
  crtEnabled,
  muted,
  onOpenDex,
  onOpenWardrobe,
  onOpenLeaderboard,
  onOpenMedal,
  onOpenPrestigeConfirm,
  onToggleCrt,
  onToggleMute,
  onLogout,
}) => (
  <nav className="fixed bottom-0 left-0 right-0 z-[700] pointer-events-none px-1.5 safe-bottom">
    <div className="max-w-xl mx-auto pointer-events-auto flex flex-col gap-1.5">
      {topSlot}

      {(isCompleted || prestige > 0) && (
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              sound8bit.victoryMedal();
              onOpenMedal();
            }}
            className="nes-btn flex-1 py-2 bg-[#ffd166] text-black text-[8px]"
          >
            🏅 MEDAGLIA LILIBEO
          </button>

          {isCompleted && (
            <button
              onClick={() => {
                sound8bit.easterEgg();
                onOpenPrestigeConfirm();
              }}
              className="nes-btn flex-1 py-2 bg-[#c026d3] text-white text-[8px]"
            >
              ⚡ NEW GAME+ (★P{prestige + 1})
            </button>
          )}
        </div>
      )}

      <div className="nes-box p-1 grid grid-cols-6 gap-1">
        <button
          onClick={() => {
            sound8bit.click();
            onOpenDex();
          }}
          className="nes-btn min-h-[48px] bg-[#ffd166] text-black flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-sm leading-none">📖</span>
          <span className="text-[6px]">DEX {unlockedCount}</span>
        </button>

        <button
          onClick={() => {
            sound8bit.click();
            onOpenWardrobe();
          }}
          className="nes-btn min-h-[48px] bg-[#a855f7] text-white flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-sm leading-none">👕</span>
          <span className="text-[6px]">LOOK</span>
        </button>

        <button
          onClick={() => {
            sound8bit.click();
            onOpenLeaderboard();
          }}
          className="nes-btn min-h-[48px] bg-[#4cc9f0] text-black flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-sm leading-none">🏆</span>
          <span className="text-[6px]">TOP</span>
        </button>

        <button
          onClick={onToggleMute}
          className="nes-btn min-h-[48px] bg-[#26335c] text-white flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-sm leading-none">{muted ? "🔇" : "🔊"}</span>
          <span className="text-[6px]">AUDIO</span>
        </button>

        <button
          onClick={onToggleCrt}
          className={`nes-btn min-h-[48px] flex flex-col items-center justify-center gap-0.5 ${
            crtEnabled
              ? "bg-[#38e54d] text-black"
              : "bg-[#26335c] text-slate-300"
          }`}
        >
          <span className="text-sm leading-none">📺</span>
          <span className="text-[6px]">CRT</span>
        </button>

        <button
          onClick={onLogout}
          className="nes-btn min-h-[48px] bg-[#ff4d6d] text-white flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-sm leading-none">🚪</span>
          <span className="text-[6px]">EXIT</span>
        </button>
      </div>
    </div>
  </nav>
);

interface DexModalProps {
  unlocks: Record<string, UnlockData>;
  easterEggs: string[];
  dailyBounty: DailyBountyInfo | null;
  bountyStreak: number;
  gps: RealGpsState;
  onSelectPoi: (poi: PoiDefinition) => void;
  onOpenPostcard: () => void;
  onTrigger1860: () => void;
  onTriggerPunic: () => void;
  onClose: () => void;
}

export const DexModal: React.FC<DexModalProps> = ({
  unlocks,
  easterEggs,
  dailyBounty,
  bountyStreak,
  gps,
  onSelectPoi,
  onOpenPostcard,
  onTrigger1860,
  onTriggerPunic,
  onClose,
}) => {
  const [tab, setTab] = useState<"pois" | "eggs">("pois");
  const [query, setQuery] = useState("");
  const [sortByNearest, setSortByNearest] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(false);

  const bountyPoi = dailyBounty
    ? MARSALA_POIS.find((p) => p.id === dailyBounty.poiId)
    : undefined;

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const cleaned = val.trim().toLowerCase();
    if (cleaned === "1860") {
      onTrigger1860();
    } else if (
      cleaned === "397" ||
      cleaned === "lilibeo" ||
      cleaned === "lilybaeum"
    ) {
      onTriggerPunic();
    }
  };

  const withDistance = MARSALA_POIS.map((p) => ({
    poi: p,
    distance:
      gps.lat !== null && gps.lng !== null
        ? Math.round(haversineMeters(gps.lat, gps.lng, p.lat, p.lng))
        : null,
  }));

  const filtered = withDistance
    .filter(({ poi }) => {
      if (onlyMissing && unlocks[poi.id]) return false;
      return (
        poi.name.toLowerCase().includes(query.toLowerCase()) ||
        poi.zone.toLowerCase().includes(query.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (!sortByNearest) return 0;
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-end sm:items-center justify-center sm:p-3">
      <div className="nes-box w-full sm:max-w-2xl h-[86dvh] sm:h-auto sm:max-h-[86dvh] flex flex-col p-3.5 safe-bottom">
        <div className="flex justify-between items-center border-b-[3px] border-[#2e3d6b] pb-2.5 mb-2.5 gap-1.5">
          <div className="flex gap-1.5 flex-1">
            <button
              onClick={() => {
                sound8bit.click();
                setTab("pois");
              }}
              className={`nes-btn flex-1 py-2 text-[7px] sm:text-[9px] ${
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
              className={`nes-btn flex-1 py-2 text-[7px] sm:text-[9px] ${
                tab === "eggs"
                  ? "bg-[#38e54d] text-black"
                  : "bg-[#26335c] text-slate-300"
              }`}
            >
              SEGRETI ({easterEggs.length}/{EASTER_EGGS.length})
            </button>
            <button
              onClick={() => {
                sound8bit.click();
                onClose();
                onOpenPostcard();
              }}
              className="nes-btn px-2.5 py-2 bg-[#4cc9f0] text-black text-[7px] sm:text-[8px] shrink-0"
              title="Genera Cartolina di Viaggio 8-Bit"
            >
              📮 CARTOLINA
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
            {/* Box Obiettivo del Giorno */}
            {dailyBounty && bountyPoi && (
              <button
                type="button"
                onClick={() => {
                  sound8bit.click();
                  onClose();
                  onSelectPoi(bountyPoi);
                }}
                className="mb-2 w-full text-left border-[3px] border-[#e879f9] bg-[#2a153d] p-2 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="font-pixel text-[8px] text-[#f0abfc] block">
                    🎯 OBIETTIVO DEL GIORNO • STREAK 🔥{bountyStreak}d
                  </span>
                  <span className="text-xl text-white font-bold truncate block">
                    {bountyPoi.icon} {bountyPoi.name}
                  </span>
                </div>
                <span className="font-pixel text-[8px] px-2 py-1 bg-[#ffd166] text-black shrink-0">
                  {dailyBounty.completedToday
                    ? "✓ FATTO"
                    : `+${dailyBounty.bonusXp} XP`}
                </span>
              </button>
            )}

            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Cerca luogo di Marsala (o un anno storico...)"
              className="w-full mb-2 bg-[#090d18] border-[3px] border-[#4cc9f0] px-3 py-1.5 text-xl text-white outline-none focus:border-[#ffd166]"
            />

            {/* Filtri rapidi: Più vicini + Solo mancanti */}
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              <button
                type="button"
                onClick={() => {
                  sound8bit.click();
                  setSortByNearest((prev) => !prev);
                }}
                className={`nes-btn py-1.5 text-[7px] sm:text-[8px] ${
                  sortByNearest
                    ? "bg-[#4cc9f0] text-black"
                    : "bg-[#26335c] text-slate-300"
                }`}
              >
                📍 PIÙ VICINI A ME: {sortByNearest ? "ON" : "OFF"}
              </button>
              <button
                type="button"
                onClick={() => {
                  sound8bit.click();
                  setOnlyMissing((prev) => !prev);
                }}
                className={`nes-btn py-1.5 text-[7px] sm:text-[8px] ${
                  onlyMissing
                    ? "bg-[#ffd166] text-black"
                    : "bg-[#26335c] text-slate-300"
                }`}
              >
                ❓ SOLO MANCANTI: {onlyMissing ? "ON" : "OFF"}
              </button>
            </div>

            <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
              {filtered.map(({ poi, distance }) => {
                const u = unlocks[poi.id];
                const isBounty = dailyBounty?.poiId === poi.id;
                return (
                  <button
                    key={poi.id}
                    onClick={() => {
                      sound8bit.click();
                      onClose();
                      onSelectPoi(poi);
                    }}
                    className={`text-left border-[3px] p-2.5 active:scale-[0.99] transition ${
                      u?.isHolo
                        ? "holo-card bg-[#25173d]"
                        : u
                          ? "border-[#ffd166] bg-[#1e294d]"
                          : isBounty
                            ? "border-[#e879f9] bg-[#231433]"
                            : "border-[#2e3d6b] bg-[#0d1324] opacity-90"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-1">
                      <span className="font-pixel text-[8px] text-[#ffd166] leading-snug">
                        {isBounty ? "🎯 " : ""}
                        {poi.icon} {poi.name}
                      </span>
                      <span className="text-base text-[#38e54d] whitespace-nowrap">
                        +{u ? u.xpEarned : poi.xp}XP
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-base text-[#94a3b8] truncate">
                        {poi.zone}
                        {distance !== null ? ` • ${distance}m` : ""}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {u?.edition === "golden_hour" && (
                          <span className="font-pixel text-[7px] text-[#fbbf24]">
                            🌅
                          </span>
                        )}
                        {u?.edition === "night" && (
                          <span className="font-pixel text-[7px] text-[#38bdf8]">
                            🌙
                          </span>
                        )}
                        {u?.isHolo && (
                          <span className="font-pixel text-[7px] text-[#f0abfc]">
                            ✦ HOLO
                          </span>
                        )}
                      </div>
                    </div>
                    {u ? (
                      <img
                        src={u.photoDataUrl}
                        alt={poi.name}
                        className="mt-2 w-full h-40 object-contain bg-[#0b0e1a] border-2 border-[#ffd166]"
                      />
                    ) : (
                      <div className="mt-2 h-12 bg-black/50 border-2 border-dashed border-[#334155] flex items-center justify-center text-[#94a3b8] text-lg">
                        ? Tocca per bussola e foto
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
    <div className="nes-box-gold w-full sm:max-w-lg max-h-[82dvh] flex flex-col p-4 safe-bottom">
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
        {entries.map((e, i) => {
          const titleObj = getTitleById(e.title);
          return (
            <div
              key={e.nickname}
              className={`flex items-center justify-between p-2 border-[3px] text-xl gap-2 ${
                e.nickname === currentNickname
                  ? "border-[#ffd166] bg-[#2c2142]"
                  : "border-[#2e3d6b] bg-[#0d1324]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-pixel text-[9px] text-[#4cc9f0] shrink-0">
                  #{i + 1}
                </span>
                <div className="w-9 h-11 bg-[#141b33] border-2 border-black flex items-center justify-center shrink-0">
                  <PixelAvatar avatar={e.avatar} size={26} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold truncate leading-none">
                      {e.nickname}
                    </span>
                    {e.prestige > 0 && (
                      <span className="bg-[#a21caf] px-1 font-pixel text-[7px] text-white shrink-0">
                        ★P{e.prestige}
                      </span>
                    )}
                  </div>
                  <span className="text-[#ffd166] text-base leading-none block truncate">
                    {titleObj.icon} {titleObj.label}
                  </span>
                  <span className="text-[#94a3b8] text-base leading-none">
                    {e.unlockedCount}/20 ({e.percent}%)
                    {e.bountyStreak > 0 ? ` • 🔥${e.bountyStreak}d` : ""}
                  </span>
                </div>
              </div>
              <span className="font-pixel text-[9px] text-[#38e54d] shrink-0">
                {e.totalXp} XP
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
