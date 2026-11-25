import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  EASTER_EGGS,
  MARSALA_POIS,
  type PoiDefinition,
  getDailyBountyPoiId,
  getItalyDateString,
} from "../shared/pois";
import {
  type AvatarConfig,
  COSMETICS_CATALOG,
  getTitleById,
} from "../shared/cosmetics";
import { api, getStoredToken, setStoredToken } from "./services/api";
import { useRealGps } from "./hooks/useRealGps";
import {
  isLilibeoNightHour,
  isStagnoneSunsetHour,
  useKonamiCode,
} from "./hooks/useEasterEggs";
import { type WalkingRouteData, fetchWalkingRoute } from "./utils/walkingRoute";
import { sound8bit } from "./utils/sound8bit";
import { AuthScreen } from "./components/AuthScreen";
import { MarsalaFogMap } from "./components/MarsalaFogMap";
import { CameraCardModal } from "./components/CameraCardModal";
import { LilibeoMedalModal } from "./components/LilibeoMedalModal";
import { AvatarWardrobeModal } from "./components/AvatarWardrobeModal";
import { WayfinderCompass } from "./components/WayfinderCompass";
import { TravelPostcardModal } from "./components/TravelPostcardModal";
import {
  BottomDock,
  DexModal,
  HudBar,
  LeaderboardModal,
} from "./components/HudAndDex";
import type {
  DailyBountyInfo,
  LeaderboardEntry,
  RetroTheme,
  UnlockData,
  UserProfile,
} from "./types/game";

function buildFallbackDailyBounty(
  lastBountyDate?: string | null,
  bountyStreak = 0,
): DailyBountyInfo {
  const today = getItalyDateString();
  const completedToday = lastBountyDate === today;
  const nextStreak = completedToday ? bountyStreak : bountyStreak + 1;
  return {
    poiId: getDailyBountyPoiId(today),
    date: today,
    completedToday,
    bonusXp: nextStreak >= 3 ? 150 : 100,
  };
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [booting, setBooting] = useState(true);
  const [slowBoot, setSlowBoot] = useState(false);
  const [unlocks, setUnlocks] = useState<Record<string, UnlockData>>({});
  const [easterEggs, setEasterEggs] = useState<string[]>([]);
  const [dailyBounty, setDailyBounty] = useState<DailyBountyInfo>(() =>
    buildFallbackDailyBounty(),
  );
  const [totalXp, setTotalXp] = useState(0);

  const [selectedPoi, setSelectedPoi] = useState<PoiDefinition | null>(null);
  const [navTargetPoi, setNavTargetPoi] = useState<PoiDefinition | null>(null);
  const [walkingRoute, setWalkingRoute] = useState<WalkingRouteData | null>(
    null,
  );
  const [justSyncedPoiId, setJustSyncedPoiId] = useState<string | null>(null);
  const [showDex, setShowDex] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showPostcard, setShowPostcard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showMedal, setShowMedal] = useState(false);
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
  const [activatingPrestige, setActivatingPrestige] = useState(false);

  const [theme, setTheme] = useState<RetroTheme>("default");
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showShips1860, setShowShips1860] = useState(false);
  const [showPunicShip, setShowPunicShip] = useState(false);
  const [showStagnoneKites, setShowStagnoneKites] = useState(false);
  const [sibillaDialog, setSibillaDialog] = useState(false);

  const titleTapsRef = useRef(0);
  const skyTapsRef = useRef(0);
  const radarTapsRef = useRef(0);
  const progressTapsRef = useRef(0);
  const fitMapTapsRef = useRef(0);

  const gps = useRealGps(Boolean(user));
  const unlockedCount = Object.keys(unlocks).length;
  const isCompleted = unlockedCount >= MARSALA_POIS.length;
  const editionsOwned = Object.values(unlocks).map((u) => u.edition);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 4800);
  }, []);

  const loadProgress = useCallback(async () => {
    const timer = setTimeout(() => setSlowBoot(true), 3000);
    try {
      const data = await api.getProgress();
      setUser(data.user);
      setUnlocks(data.unlocks);
      setEasterEggs(data.easterEggs);
      setDailyBounty(
        data.dailyBounty ??
          buildFallbackDailyBounty(
            data.user.lastBountyDate,
            data.user.bountyStreak,
          ),
      );
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

  // Calcola il percorso pedonale lungo le strade verso il POI puntato da Guidami
  useEffect(() => {
    if (!navTargetPoi || gps.lat === null || gps.lng === null) {
      setWalkingRoute(null);
      return;
    }

    let cancelled = false;
    void fetchWalkingRoute(
      gps.lat,
      gps.lng,
      navTargetPoi.lat,
      navTargetPoi.lng,
    ).then((route) => {
      if (!cancelled) setWalkingRoute(route);
    });

    return () => {
      cancelled = true;
    };
  }, [navTargetPoi, gps.lat, gps.lng]);

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
          const rewardItems = COSMETICS_CATALOG.filter(
            (c) =>
              c.requirement.type === "easter_egg" &&
              c.requirement.eggId === eggId,
          );
          const rewardSuffix =
            res.isNew && rewardItems.length > 0
              ? ` • 👕 Sbloccato in LOOK: ${rewardItems.map((r) => r.name).join(" + ")}!`
              : "";
          showToast(
            res.isNew
              ? `🎉 SEGRETO: ${def.badge} ${def.title} (+${def.xp} XP)${rewardSuffix}`
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
    if (!user) return;
    if (isStagnoneSunsetHour() && !easterEggs.includes("tramonto-stagnone")) {
      setTheme("sunset");
      void triggerEasterEgg("tramonto-stagnone");
    } else if (isLilibeoNightHour() && !easterEggs.includes("notte-lilibeo")) {
      setTheme("night");
      void triggerEasterEgg("notte-lilibeo");
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

  const handleProgressTap = () => {
    sound8bit.click();
    progressTapsRef.current += 1;
    if (progressTapsRef.current >= 4) {
      progressTapsRef.current = 0;
      setTheme((prev) => (prev === "night" ? "default" : "night"));
      void triggerEasterEgg("notte-lilibeo");
    }
  };

  const handleFitMarsalaTap = () => {
    fitMapTapsRef.current += 1;
    if (fitMapTapsRef.current >= 5) {
      fitMapTapsRef.current = 0;
      setShowStagnoneKites(true);
      void triggerEasterEgg("vento-stagnone");
      setTimeout(() => setShowStagnoneKites(false), 6200);
    }
  };

  const handleRadarTap = () => {
    sound8bit.click();
    void gps.requestCompassPermission();
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

  const handleTriggerPunic = () => {
    setShowDex(false);
    setShowPunicShip(true);
    void triggerEasterEgg("nave-punica");
    setTimeout(() => setShowPunicShip(false), 6800);
  };

  const handleSaveAvatar = async (nextAvatar: AvatarConfig) => {
    const res = await api.updateAvatar(nextAvatar);
    setUser((prev) => (prev ? { ...prev, avatar: res.avatar } : prev));
    showToast("👕 Nuovo look salvato su mappa e classifica!");
  };

  const handleSaveTitle = async (nextTitleId: string) => {
    const res = await api.updateTitle(nextTitleId);
    const titleObj = getTitleById(res.title);
    setUser((prev) => (prev ? { ...prev, title: res.title } : prev));
    showToast(`🏷️ Titolo equipaggiato: ${titleObj.icon} ${titleObj.label}`);
  };

  const handleConfirmPrestige = async () => {
    setActivatingPrestige(true);
    try {
      const res = await api.activatePrestige();
      setUser(res.user);
      setUnlocks(res.unlocks);
      setEasterEggs(res.easterEggs);
      setDailyBounty(
        res.dailyBounty ??
          buildFallbackDailyBounty(
            res.user.lastBountyDate,
            res.user.bountyStreak,
          ),
      );
      setTotalXp(res.totalXp);
      setNavTargetPoi(null);
      setWalkingRoute(null);
      setShowPrestigeConfirm(false);
      sound8bit.victoryMedal();
      showToast(
        `⚡ PRESTIGIO ★${res.user.prestige} ATTIVATO! Card Olografiche & nuovi capi in LOOK!`,
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Errore attivazione Prestigio.",
      );
    } finally {
      setActivatingPrestige(false);
    }
  };

  const handleUnlockSubmit = async (photoDataUrl: string) => {
    if (!selectedPoi || gps.lat === null || gps.lng === null) return;
    const prevCount = Object.keys(unlocks).length;
    const res = await api.unlockPoi({
      poiId: selectedPoi.id,
      lat: gps.lat,
      lng: gps.lng,
      accuracy: gps.accuracy || 0,
      photoDataUrl,
      requestedEdition: theme,
    });

    const nextUnlocks = { ...unlocks, [selectedPoi.id]: res.unlock };
    const nextCount = Object.keys(nextUnlocks).length;
    setUser(res.user);
    setUnlocks(nextUnlocks);
    setEasterEggs(res.easterEggs);
    setDailyBounty(
      res.dailyBounty ??
        buildFallbackDailyBounty(
          res.user.lastBountyDate,
          res.user.bountyStreak,
        ),
    );
    setTotalXp(res.totalXp);
    if (navTargetPoi?.id === selectedPoi.id) {
      setNavTargetPoi(null);
      setWalkingRoute(null);
    }
    setSelectedPoi(null);

    sound8bit.syncViewpoint();
    setJustSyncedPoiId(selectedPoi.id);

    const cardCosmetic =
      nextCount > prevCount && res.user.prestige === 0
        ? COSMETICS_CATALOG.find(
            (c) =>
              c.requirement.type === "cards" &&
              c.requirement.count === nextCount,
          )
        : undefined;

    if (res.bountyClaimedNow) {
      showToast(
        `🎯 OBIETTIVO DEL GIORNO COMPLETATO (+${res.bountyXpAwarded} XP • Streak 🔥${res.user.bountyStreak}d)!`,
      );
    } else if (res.editionBonusXp > 0) {
      const edLabel =
        res.unlock.edition === "golden_hour"
          ? "🌅 GOLDEN HOUR"
          : "🌙 NIGHT EDITION";
      showToast(
        `${edLabel} SBLOCCATA: ${selectedPoi.name} (+${res.editionBonusXp} XP bonus)!`,
      );
    } else if (cardCosmetic) {
      showToast(
        `★ ZONA COLORATA: ${selectedPoi.name} • 👕 Sbloccato: ${cardCosmetic.name}!`,
      );
    } else {
      showToast(
        res.unlock.isHolo
          ? `✦ CARD HOLO: ${selectedPoi.name} (+${res.unlock.xpEarned} XP)`
          : `★ ZONA COLORATA: ${selectedPoi.name} (+${res.unlock.xpEarned} XP)`,
      );
    }

    setTimeout(() => setJustSyncedPoiId(null), 1900);

    (res.newlyUnlockedEggs || []).forEach((eggId, idx) => {
      const def = EASTER_EGGS.find((e) => e.id === eggId);
      if (def) {
        setTimeout(
          () => {
            sound8bit.easterEgg();
            showToast(
              `${def.badge} ${def.title.toUpperCase()} (+${def.xp} XP) • 👕 Nuovo capo!`,
            );
          },
          2100 + idx * 2400,
        );
      }
    });

    if (nextCount >= MARSALA_POIS.length) {
      setTimeout(() => {
        sound8bit.victoryMedal();
        setShowMedal(true);
      }, 2200);
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
    setDailyBounty(buildFallbackDailyBounty());
    setNavTargetPoi(null);
    setWalkingRoute(null);
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
        : theme === "night"
          ? "theme-night"
          : "";

  return (
    <main
      className={`relative w-screen h-[100dvh] overflow-hidden ${themeClass}`}
    >
      <HudBar
        user={user}
        unlockedCount={unlockedCount}
        totalXp={totalXp}
        dailyBounty={dailyBounty}
        gps={gps}
        onTitleTap={handleTitleTap}
        onSkyTap={handleSkyTap}
        onRadarTap={handleRadarTap}
        onProgressTap={handleProgressTap}
        onSelectBountyPoi={setSelectedPoi}
      />

      <MarsalaFogMap
        gps={gps}
        avatar={user.avatar}
        dailyBountyPoiId={dailyBounty.poiId}
        selectedPoi={selectedPoi}
        navTargetPoi={navTargetPoi}
        walkingRoute={walkingRoute}
        unlocks={unlocks}
        justSyncedPoiId={justSyncedPoiId}
        onSelectPoi={setSelectedPoi}
        onOpenWardrobe={() => setShowWardrobe(true)}
        onFitMarsalaTap={handleFitMarsalaTap}
      />

      <BottomDock
        topSlot={
          navTargetPoi && !selectedPoi ? (
            <WayfinderCompass
              targetPoi={navTargetPoi}
              walkingRoute={walkingRoute}
              gps={gps}
              prestige={user.prestige}
              onOpenPoi={(poi) => setSelectedPoi(poi)}
              onClearTarget={() => {
                setNavTargetPoi(null);
                setWalkingRoute(null);
              }}
            />
          ) : null
        }
        unlockedCount={unlockedCount}
        prestige={user.prestige}
        isCompleted={isCompleted}
        crtEnabled={crtEnabled}
        muted={muted}
        onOpenDex={() => setShowDex(true)}
        onOpenWardrobe={() => setShowWardrobe(true)}
        onOpenLeaderboard={() => void handleOpenLeaderboard()}
        onOpenMedal={() => setShowMedal(true)}
        onOpenPrestigeConfirm={() => setShowPrestigeConfirm(true)}
        onToggleCrt={handleToggleCrt}
        onToggleMute={handleToggleMute}
        onLogout={handleLogout}
      />

      {crtEnabled && (
        <div className="fixed inset-0 z-[500] pointer-events-none crt-scanlines opacity-40" />
      )}

      {toast && (
        <div className="fixed bottom-44 left-1/2 -translate-x-1/2 z-[1100] nes-box-gold px-3.5 py-2 text-xl text-[#ffd166] text-center max-w-[92vw]">
          {toast}
        </div>
      )}

      {showShips1860 && (
        <div className="fixed bottom-44 left-0 z-[1150] pointer-events-none ship-sail flex items-center gap-4 nes-box-gold px-3.5 py-2">
          <span className="text-3xl">🚢</span>
          <span className="font-pixel text-[9px] text-[#ffd166]">
            11 MAGGIO 1860 • PIEMONTE &amp; LOMBARDO!
          </span>
          <span className="text-3xl">🚢</span>
        </div>
      )}

      {showPunicShip && (
        <div className="fixed top-36 left-0 z-[1150] pointer-events-none punic-sail flex items-center gap-4 nes-box px-3.5 py-2">
          <span className="text-3xl">⛵</span>
          <span className="font-pixel text-[9px] text-[#4cc9f0]">
            397 A.C. • NAVE PUNICA VERSO CAPO BOEO!
          </span>
          <span className="text-3xl">🏺</span>
        </div>
      )}

      {showStagnoneKites && (
        <div className="fixed top-44 left-0 z-[1150] pointer-events-none kite-fly flex items-center gap-3 nes-box-gold px-3.5 py-2">
          <span className="text-3xl">🪁</span>
          <span className="font-pixel text-[9px] text-[#38e54d]">
            MAESTRALE 25 NODI • STAGNONE KITESURF!
          </span>
          <span className="text-3xl">🌊</span>
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

      {showPrestigeConfirm && (
        <div className="fixed inset-0 z-[1150] bg-black/85 flex items-center justify-center p-4">
          <div className="nes-box-gold holo-card max-w-md p-5 text-center">
            <p className="text-5xl mb-2">⚡</p>
            <h3 className="font-pixel text-xs text-[#f0abfc] mb-3">
              NEW GAME+ • PRESTIGIO ★{user.prestige + 1}
            </h3>
            <p className="text-xl text-[#f4f1de] mb-4 leading-snug">
              Hai illuminato tutta Marsala! Attivando il Prestigio:
              <br />• Conservi tutti gli <strong>XP</strong>, i{" "}
              <strong>vestiti</strong> e gli <strong>Easter Egg</strong>.
              <br />• La mappa torna grigia per una nuova sfida con{" "}
              <strong>raggio GPS stretto</strong>, <strong>+25% XP</strong> e{" "}
              <strong>Card Olografiche ✦</strong>!
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={activatingPrestige}
                onClick={() => setShowPrestigeConfirm(false)}
                className="nes-btn py-2.5 bg-[#26335c] text-white text-[9px]"
              >
                ANNULLA
              </button>
              <button
                type="button"
                disabled={activatingPrestige}
                onClick={() => void handleConfirmPrestige()}
                className="nes-btn py-2.5 bg-[#c026d3] text-white text-[9px]"
              >
                {activatingPrestige ? "ATTIVAZIONE..." : "★ AVVIA PRESTIGIO"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPoi && (
        <CameraCardModal
          poi={selectedPoi}
          nickname={user.nickname}
          prestige={user.prestige}
          theme={theme}
          isDailyBounty={dailyBounty.poiId === selectedPoi.id}
          bountyCompletedToday={dailyBounty.completedToday}
          bountyBonusXp={dailyBounty.bonusXp}
          gps={gps}
          existingUnlock={unlocks[selectedPoi.id]}
          onClose={() => setSelectedPoi(null)}
          onTrackWithCompass={(poi) => {
            void gps.requestCompassPermission();
            setNavTargetPoi(poi);
            setSelectedPoi(null);
            showToast(`🧭 Percorso stradale avviato verso ${poi.name}!`);
          }}
          onSubmitUnlock={handleUnlockSubmit}
        />
      )}

      {showWardrobe && (
        <AvatarWardrobeModal
          avatar={user.avatar}
          titleId={user.title}
          nickname={user.nickname}
          unlockedCardsCount={unlockedCount}
          easterEggs={easterEggs}
          prestige={user.prestige}
          bountyStreak={user.bountyStreak}
          editionsOwned={editionsOwned}
          onSave={handleSaveAvatar}
          onSaveTitle={handleSaveTitle}
          onClose={() => setShowWardrobe(false)}
        />
      )}

      {showDex && (
        <DexModal
          unlocks={unlocks}
          easterEggs={easterEggs}
          dailyBounty={dailyBounty}
          bountyStreak={user.bountyStreak}
          gps={gps}
          onSelectPoi={setSelectedPoi}
          onOpenPostcard={() => setShowPostcard(true)}
          onTrigger1860={handleTrigger1860}
          onTriggerPunic={handleTriggerPunic}
          onClose={() => setShowDex(false)}
        />
      )}

      {showPostcard && (
        <TravelPostcardModal
          user={user}
          unlocks={unlocks}
          easterEggsCount={easterEggs.length}
          totalXp={totalXp}
          onClose={() => setShowPostcard(false)}
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
