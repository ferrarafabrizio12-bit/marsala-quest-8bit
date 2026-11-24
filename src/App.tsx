import React, { useCallback, useEffect, useRef, useState } from "react";
import { EASTER_EGGS, MARSALA_POIS, type PoiDefinition } from "../shared/pois";
import { api, getStoredToken, setStoredToken } from "./services/api";
import { useRealGps } from "./hooks/useRealGps";
import { isStagnoneSunsetHour, useKonamiCode } from "./hooks/useEasterEggs";
import { sound8bit } from "./utils/sound8bit";
import { AuthScreen } from "./components/AuthScreen";
import { MarsalaFogMap } from "./components/MarsalaFogMap";
import { CameraCardModal } from "./components/CameraCardModal";
import { LilibeoMedalModal } from "./components/LilibeoMedalModal";
import {
  BottomDock,
  DexModal,
  HudBar,
  LeaderboardModal,
} from "./components/HudAndDex";
import type {
  LeaderboardEntry,
  RetroTheme,
  UnlockData,
  UserProfile,
} from "./types/game";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [booting, setBooting] = useState(true);
  const [slowBoot, setSlowBoot] = useState(false);
  const [unlocks, setUnlocks] = useState<Record<string, UnlockData>>({});
  const [easterEggs, setEasterEggs] = useState<string[]>([]);
  const [totalXp, setTotalXp] = useState(0);

  const [selectedPoi, setSelectedPoi] = useState<PoiDefinition | null>(null);
  const [justSyncedPoiId, setJustSyncedPoiId] = useState<string | null>(null);
  const [showDex, setShowDex] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showMedal, setShowMedal] = useState(false);

  const [theme, setTheme] = useState<RetroTheme>("default");
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showShips1860, setShowShips1860] = useState(false);
  const [sibillaDialog, setSibillaDialog] = useState(false);

  const titleTapsRef = useRef(0);
  const skyTapsRef = useRef(0);
  const radarTapsRef = useRef(0);

  const gps = useRealGps(Boolean(user));
  const unlockedCount = Object.keys(unlocks).length;
  const isCompleted = unlockedCount >= MARSALA_POIS.length;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 4500);
  }, []);

  const loadProgress = useCallback(async () => {
    const timer = setTimeout(() => setSlowBoot(true), 3000);
    try {
      const data = await api.getProgress();
      setUser(data.user);
      setUnlocks(data.unlocks);
      setEasterEggs(data.easterEggs);
      setTotalXp(data.totalXp);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      clearTimeout(timer);
      setSlowBoot(false);
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    if (getStoredToken()) void loadProgress();
    else setBooting(false);
  }, [loadProgress]);

  const triggerEasterEgg = useCallback(
    async (eggId: string) => {
      if (!user) return;
      sound8bit.easterEgg();
      try {
        const res = await api.claimEasterEgg(eggId);
        setEasterEggs(res.easterEggs);
        setTotalXp(res.totalXp);
        const def = EASTER_EGGS.find((e) => e.id === eggId);
        if (def) {
          showToast(
            res.isNew
              ? `🎉 SEGRETO: ${def.badge} ${def.title} (+${def.xp} XP)!`
              : `${def.badge} ${def.title} attivo!`,
          );
        }
      } catch {
        // Ignora se offline
      }
    },
    [user, showToast],
  );

  const activateGameBoy = useCallback(() => {
    setTheme((prev) => (prev === "gameboy" ? "default" : "gameboy"));
    void triggerEasterEgg("konami-gameboy");
  }, [triggerEasterEgg]);

  useKonamiCode(activateGameBoy);

  useEffect(() => {
    if (
      user &&
      isStagnoneSunsetHour() &&
      !easterEggs.includes("tramonto-stagnone")
    ) {
      setTheme("sunset");
      void triggerEasterEgg("tramonto-stagnone");
    }
  }, [user, easterEggs, triggerEasterEgg]);

  const handleToggleMute = () => {
    const next = !muted;
    sound8bit.muted = next;
    setMuted(next);
    if (!next) sound8bit.click();
  };

  const handleToggleCrt = () => {
    sound8bit.click();
    setCrtEnabled((prev) => !prev);
  };

  const handleTitleTap = () => {
    titleTapsRef.current += 1;
    if (titleTapsRef.current >= 7) {
      titleTapsRef.current = 0;
      activateGameBoy();
    }
  };

  const handleSkyTap = () => {
    sound8bit.click();
    skyTapsRef.current += 1;
    if (skyTapsRef.current >= 3) {
      skyTapsRef.current = 0;
      setTheme((prev) => (prev === "sunset" ? "default" : "sunset"));
      void triggerEasterEgg("tramonto-stagnone");
    }
  };

  const handleRadarTap = () => {
    sound8bit.click();
    if (gps.status !== "LOCKED") {
      gps.retry();
      return;
    }
    radarTapsRef.current += 1;
    if (radarTapsRef.current >= 5) {
      radarTapsRef.current = 0;
      setSibillaDialog(true);
      void triggerEasterEgg("oracolo-sibilla");
    }
  };

  const handleTrigger1860 = () => {
    setShowDex(false);
    setShowShips1860(true);
    void triggerEasterEgg("sbarco-1860");
    setTimeout(() => setShowShips1860(false), 6800);
  };

  const handleUnlockSubmit = async (photoDataUrl: string) => {
    if (!selectedPoi || gps.lat === null || gps.lng === null) return;
    const res = await api.unlockPoi({
      poiId: selectedPoi.id,
      lat: gps.lat,
      lng: gps.lng,
      accuracy: gps.accuracy || 0,
      photoDataUrl,
    });

    const nextUnlocks = { ...unlocks, [selectedPoi.id]: res.unlock };
    setUnlocks(nextUnlocks);
    setEasterEggs(res.easterEggs);
    setTotalXp(res.totalXp);
    setSelectedPoi(null);

    sound8bit.syncViewpoint();
    setJustSyncedPoiId(selectedPoi.id);
    showToast(`★ ZONA COLORATA: ${selectedPoi.name} (+${selectedPoi.xp} XP)`);
    setTimeout(() => setJustSyncedPoiId(null), 1900);

    if (res.newlyUnlockedEgg === "woodhouse-1773") {
      setTimeout(() => {
        sound8bit.easterEgg();
        showToast("🥂 SEGRETO DI WOODHOUSE 1773 (+250 XP)!");
      }, 2100);
    }

    if (Object.keys(nextUnlocks).length >= MARSALA_POIS.length) {
      setTimeout(() => {
        sound8bit.victoryMedal();
        setShowMedal(true);
      }, 1900);
    }
  };

  const handleOpenLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data.leaderboard);
      setShowLeaderboard(true);
    } catch {
      showToast("Impossibile caricare gli High Scores.");
    }
  };

  const handleLogout = () => {
    sound8bit.click();
    setStoredToken(null);
    setUser(null);
    setUnlocks({});
    setEasterEggs([]);
    setTotalXp(0);
    setTheme("default");
  };

  if (booting) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center p-6 text-center bg-[#0b0e1a] gap-3">
        <p className="font-pixel text-xs text-[#ffd166]">
          CARICAMENTO LILIBEO...
        </p>
        {slowBoot && (
          <p className="text-xl text-[#4cc9f0] max-w-xs">
            Risveglio del server in corso (al primo accesso su Render può
            impiegare 20–30 secondi).
          </p>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(u) => {
          setUser(u);
          void loadProgress();
        }}
      />
    );
  }

  const themeClass =
    theme === "gameboy"
      ? "theme-gameboy"
      : theme === "sunset"
        ? "theme-sunset"
        : "";

  return (
    <main
      className={`relative w-screen h-[100dvh] overflow-hidden ${themeClass}`}
    >
      <HudBar
        user={user}
        unlockedCount={unlockedCount}
        totalXp={totalXp}
        gps={gps}
        onTitleTap={handleTitleTap}
        onSkyTap={handleSkyTap}
        onRadarTap={handleRadarTap}
      />

      <MarsalaFogMap
        gps={gps}
        unlocks={unlocks}
        justSyncedPoiId={justSyncedPoiId}
        onSelectPoi={setSelectedPoi}
      />

      <BottomDock
        unlockedCount={unlockedCount}
        isCompleted={isCompleted}
        crtEnabled={crtEnabled}
        muted={muted}
        onOpenDex={() => setShowDex(true)}
        onOpenLeaderboard={() => void handleOpenLeaderboard()}
        onOpenMedal={() => setShowMedal(true)}
        onToggleCrt={handleToggleCrt}
        onToggleMute={handleToggleMute}
        onLogout={handleLogout}
      />

      {crtEnabled && (
        <div className="fixed inset-0 z-[500] pointer-events-none crt-scanlines opacity-40" />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1100] nes-box-gold px-3.5 py-2 text-xl text-[#ffd166] text-center max-w-[92vw]">
          {toast}
        </div>
      )}

      {showShips1860 && (
        <div className="fixed bottom-32 left-0 z-[1150] pointer-events-none ship-sail flex items-center gap-4 nes-box-gold px-3.5 py-2">
          <span className="text-3xl">🚢</span>
          <span className="font-pixel text-[9px] text-[#ffd166]">
            11 MAGGIO 1860 • PIEMONTE &amp; LOMBARDO!
          </span>
          <span className="text-3xl">🚢</span>
        </div>
      )}

      {sibillaDialog && (
        <div className="fixed inset-0 z-[1150] bg-black/85 flex items-center justify-center p-4">
          <div className="nes-box-gold max-w-md p-5 text-center">
            <p className="text-5xl mb-2">🔮</p>
            <h3 className="font-pixel text-xs text-[#4cc9f0] mb-3">
              ORACOLO DELLA SIBILLA LILIBETANA
            </h3>
            <p className="text-2xl text-[#f4f1de] mb-4 leading-snug">
              &laquo;Chi percorre Capo Boeo fino alle acque rosa dello Stagnone
              risveglierà tutti i colori di Lilibeo, {user.nickname}.&raquo;
            </p>
            <button
              onClick={() => setSibillaDialog(false)}
              className="nes-btn px-5 py-2.5 bg-[#ffd166] text-black text-[10px]"
            >
              PROSEGUI
            </button>
          </div>
        </div>
      )}

      {selectedPoi && (
        <CameraCardModal
          poi={selectedPoi}
          nickname={user.nickname}
          gps={gps}
          existingUnlock={unlocks[selectedPoi.id]}
          onClose={() => setSelectedPoi(null)}
          onSubmitUnlock={handleUnlockSubmit}
        />
      )}

      {showDex && (
        <DexModal
          unlocks={unlocks}
          easterEggs={easterEggs}
          onSelectPoi={setSelectedPoi}
          onTrigger1860={handleTrigger1860}
          onClose={() => setShowDex(false)}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          entries={leaderboard}
          currentNickname={user.nickname}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {showMedal && (
        <LilibeoMedalModal
          nickname={user.nickname}
          totalXp={totalXp}
          easterEggCount={easterEggs.length}
          onClose={() => setShowMedal(false)}
        />
      )}
    </main>
  );
}
