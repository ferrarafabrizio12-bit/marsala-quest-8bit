import React, { useMemo, useState } from "react";
import {
  type AvatarConfig,
  type AvatarGender,
  BEARD_STYLES,
  COSMETICS_CATALOG,
  type CosmeticSlot,
  DEFAULT_AVATAR,
  DEFAULT_SUPERUSER_OVERRIDES,
  DEFAULT_TITLE_ID,
  HAIR_COLORS,
  HAIR_STYLES,
  PLAYER_TITLES,
  SKIN_TONES,
  type SuperuserOverrides,
  getRequirementLabel,
  getTitleById,
  getTitleRequirementLabel,
  isCosmeticUnlocked,
  isCosmeticVisible,
  isTitleUnlocked,
  isTitleVisible,
} from "../../shared/cosmetics";
import { sound8bit } from "../utils/sound8bit";
import { PixelAvatar } from "./PixelAvatar";

interface AvatarWardrobeModalProps {
  avatar: AvatarConfig;
  titleId: string;
  nickname: string;
  isSuperuser?: boolean;
  superuserOverrides?: SuperuserOverrides;
  unlockedCardsCount: number;
  easterEggs: string[];
  prestige: number;
  bountyStreak: number;
  editionsOwned: string[];
  onSave: (nextAvatar: AvatarConfig) => Promise<void>;
  onSaveTitle: (nextTitleId: string) => Promise<void>;
  onSaveSuperuserOverrides?: (
    nextOverrides: SuperuserOverrides,
    nextAvatar: AvatarConfig,
    nextTitle: string,
  ) => Promise<void>;
  onClose: () => void;
}

const SLOTS: { id: CosmeticSlot; label: string }[] = [
  { id: "hat", label: "CAPPELLO" },
  { id: "glasses", label: "OCCHIALI" },
  { id: "top", label: "MAGLIA" },
  { id: "bottom", label: "PANTALONI" },
];

export const AvatarWardrobeModal: React.FC<AvatarWardrobeModalProps> = ({
  avatar,
  titleId,
  nickname,
  isSuperuser = false,
  superuserOverrides,
  unlockedCardsCount,
  easterEggs,
  prestige,
  bountyStreak,
  editionsOwned,
  onSave,
  onSaveTitle,
  onSaveSuperuserOverrides,
  onClose,
}) => {
  const [section, setSection] = useState<"appearance" | "clothes" | "titles">(
    "clothes",
  );
  const [draft, setDraft] = useState<AvatarConfig>(avatar);
  const [draftTitle, setDraftTitle] = useState<string>(titleId);
  const [overridesDraft, setOverridesDraft] = useState<SuperuserOverrides>(
    () => superuserOverrides ?? { ...DEFAULT_SUPERUSER_OVERRIDES },
  );
  const [activeSlot, setActiveSlot] = useState<CosmeticSlot>("hat");
  const [saving, setSaving] = useState(false);

  const previewTitle = getTitleById(draftTitle);

  const visibleCosmetics = useMemo(
    () =>
      COSMETICS_CATALOG.filter((item) => isCosmeticVisible(item, isSuperuser)),
    [isSuperuser],
  );

  const visibleTitles = useMemo(
    () => PLAYER_TITLES.filter((t) => isTitleVisible(t, isSuperuser)),
    [isSuperuser],
  );

  const slotItems = useMemo(
    () => visibleCosmetics.filter((item) => item.slot === activeSlot),
    [visibleCosmetics, activeSlot],
  );

  const handleGenderChange = (nextGender: AvatarGender) => {
    sound8bit.click();
    setDraft((d) => ({
      ...d,
      gender: nextGender,
      beard: nextGender === "female" ? "none" : d.beard,
    }));
  };

  const toggleCosmeticOverride = (
    itemId: string,
    slot: CosmeticSlot,
    currentlyUnlocked: boolean,
  ) => {
    sound8bit.click();
    setOverridesDraft((prev) => {
      if (currentlyUnlocked) {
        if (draft[slot] === itemId) {
          setDraft((d) => ({ ...d, [slot]: DEFAULT_AVATAR[slot] }));
        }
        return {
          ...prev,
          unlockedCosmetics: prev.unlockedCosmetics.filter(
            (id) => id !== itemId,
          ),
          lockedCosmetics: prev.lockedCosmetics.includes(itemId)
            ? prev.lockedCosmetics
            : [...prev.lockedCosmetics, itemId],
        };
      }
      return {
        ...prev,
        lockedCosmetics: prev.lockedCosmetics.filter((id) => id !== itemId),
        unlockedCosmetics: prev.unlockedCosmetics.includes(itemId)
          ? prev.unlockedCosmetics
          : [...prev.unlockedCosmetics, itemId],
      };
    });
  };

  const toggleTitleOverride = (tId: string, currentlyUnlocked: boolean) => {
    sound8bit.click();
    setOverridesDraft((prev) => {
      if (currentlyUnlocked) {
        if (draftTitle === tId) {
          setDraftTitle(DEFAULT_TITLE_ID);
        }
        return {
          ...prev,
          unlockedTitles: prev.unlockedTitles.filter((id) => id !== tId),
          lockedTitles: prev.lockedTitles.includes(tId)
            ? prev.lockedTitles
            : [...prev.lockedTitles, tId],
        };
      }
      return {
        ...prev,
        lockedTitles: prev.lockedTitles.filter((id) => id !== tId),
        unlockedTitles: prev.unlockedTitles.includes(tId)
          ? prev.unlockedTitles
          : [...prev.unlockedTitles, tId],
      };
    });
  };

  const handleUnlockAllCosmeticsAndTitles = () => {
    sound8bit.click();
    setOverridesDraft({
      unlockedCosmetics: visibleCosmetics.map((c) => c.id),
      lockedCosmetics: [],
      unlockedTitles: visibleTitles.map((t) => t.id),
      lockedTitles: [],
    });
  };

  const handleLockAllCosmeticsAndTitles = () => {
    sound8bit.click();
    setDraft((d) => ({
      ...DEFAULT_AVATAR,
      gender: d.gender,
      skinTone: d.skinTone,
      hairColor: d.hairColor,
      hairStyle: d.hairStyle,
      beard: d.gender === "male" ? d.beard : "none",
    }));
    setDraftTitle(DEFAULT_TITLE_ID);
    setOverridesDraft({
      unlockedCosmetics: [],
      lockedCosmetics: visibleCosmetics
        .filter((c) => c.requirement.type !== "default")
        .map((c) => c.id),
      unlockedTitles: [],
      lockedTitles: visibleTitles
        .filter((t) => t.requirement.type !== "default")
        .map((t) => t.id),
    });
  };

  const handleEquipFullCreatorSet = () => {
    sound8bit.easterEgg();
    setOverridesDraft((prev) => ({
      ...prev,
      lockedCosmetics: prev.lockedCosmetics.filter(
        (id) =>
          id !== "hat-su-crown" &&
          id !== "glasses-su-matrix" &&
          id !== "top-su-architect" &&
          id !== "bottom-su-architect",
      ),
      lockedTitles: prev.lockedTitles.filter((id) => id !== "title-creator-su"),
    }));
    setDraft((d) => ({
      ...d,
      hat: "hat-su-crown",
      glasses: "glasses-su-matrix",
      top: "top-su-architect",
      bottom: "bottom-su-architect",
    }));
    setDraftTitle("title-creator-su");
  };

  const handleSaveAll = async () => {
    sound8bit.click();
    setSaving(true);
    try {
      const normalizedDraft: AvatarConfig = {
        ...draft,
        beard: draft.gender === "male" ? draft.beard : "none",
      };
      if (isSuperuser && onSaveSuperuserOverrides) {
        await onSaveSuperuserOverrides(
          overridesDraft,
          normalizedDraft,
          draftTitle,
        );
      } else {
        await onSave(normalizedDraft);
        if (draftTitle !== titleId) {
          await onSaveTitle(draftTitle);
        }
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] bg-black/85 flex items-end sm:items-center justify-center sm:p-3">
      <div className="nes-box-gold w-full sm:max-w-lg max-h-[90dvh] flex flex-col p-4 safe-bottom">
        {/* Header */}
        <div className="flex justify-between items-center border-b-[3px] border-[#2e3d6b] pb-2.5 mb-3">
          <h3 className="font-pixel text-[10px] sm:text-xs text-[#ffd166]">
            👕 ARMADIO &amp; ASPETTO
          </h3>
          <button
            onClick={onClose}
            className="nes-btn w-10 h-10 bg-[#ff4d6d] text-white text-[10px]"
          >
            X
          </button>
        </div>

        {/* Anteprima Avatar + Nickname + Titolo */}
        <div className="bg-[#090d18] border-[3px] border-[#4cc9f0] p-3 mb-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-16 h-20 bg-[#141b33] border-2 border-[#ffd166] flex items-center justify-center shrink-0">
              <PixelAvatar avatar={draft} size={52} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-pixel text-[10px] text-white truncate">
                  {nickname}
                </p>
                {isSuperuser && (
                  <span className="bg-[#9f1239] border border-[#ffd166] px-1 font-pixel text-[6px] text-[#ffd166] shrink-0">
                    👑⚡ SUPREME
                  </span>
                )}
              </div>
              <p className="text-lg text-[#ffd166] leading-tight truncate">
                {previewTitle.icon} {previewTitle.label}
              </p>
              <div className="flex gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => handleGenderChange("male")}
                  className={`nes-btn px-2 py-1 text-[7px] ${
                    draft.gender === "male"
                      ? "bg-[#4cc9f0] text-black"
                      : "bg-[#26335c] text-white"
                  }`}
                >
                  ♂ LUI
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderChange("female")}
                  className={`nes-btn px-2 py-1 text-[7px] ${
                    draft.gender === "female"
                      ? "bg-[#f472b6] text-black"
                      : "bg-[#26335c] text-white"
                  }`}
                >
                  ♀ LEI
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra controlli rapidi Superuser */}
        {isSuperuser && (
          <div className="space-y-1.5 mb-2.5">
            <button
              type="button"
              onClick={handleEquipFullCreatorSet}
              className="nes-btn w-full py-1.5 bg-[#9f1239] text-[#ffd166] text-[7px] border-[#ffd166]"
            >
              👑⚡ INDOSSA SET COMPLETO DEL CREATORE + TITOLO
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleUnlockAllCosmeticsAndTitles}
                className="nes-btn py-1.5 bg-[#c026d3] text-white text-[7px]"
              >
                ⚡ SBLOCCA TUTTI I LOOK/TITOLI
              </button>
              <button
                type="button"
                onClick={handleLockAllCosmeticsAndTitles}
                className="nes-btn py-1.5 bg-[#be123c] text-white text-[7px]"
              >
                🔒 BLOCCA EXTRA (ROLLBACK)
              </button>
            </div>
          </div>
        )}

        {/* Selettore Sezione: ASPETTO vs VESTITI vs TITOLI */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => {
              sound8bit.click();
              setSection("appearance");
            }}
            className={`nes-btn py-2 text-[7px] sm:text-[8px] ${
              section === "appearance"
                ? "bg-[#4cc9f0] text-black"
                : "bg-[#26335c] text-slate-300"
            }`}
          >
            🧑 ASPETTO
          </button>
          <button
            type="button"
            onClick={() => {
              sound8bit.click();
              setSection("clothes");
            }}
            className={`nes-btn py-2 text-[7px] sm:text-[8px] ${
              section === "clothes"
                ? "bg-[#a855f7] text-white"
                : "bg-[#26335c] text-slate-300"
            }`}
          >
            👕 VESTITI
          </button>
          <button
            type="button"
            onClick={() => {
              sound8bit.click();
              setSection("titles");
            }}
            className={`nes-btn py-2 text-[7px] sm:text-[8px] ${
              section === "titles"
                ? "bg-[#ffd166] text-black"
                : "bg-[#26335c] text-slate-300"
            }`}
          >
            🏷️ TITOLI
          </button>
        </div>

        {/* SEZIONE 1: ASPETTO BASE (sempre libero, senza achievement) */}
        {section === "appearance" && (
          <div className="overflow-y-auto space-y-3 pr-1 flex-1">
            {draft.hat !== "hat-none" && (
              <div className="bg-[#141b33] border-2 border-[#ffd166] p-2 flex items-center justify-between gap-2">
                <span className="text-lg text-[#fde68a] leading-tight">
                  Stai indossando un cappello: toglilo per vedere bene il taglio
                  di capelli!
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound8bit.click();
                    setDraft((d) => ({ ...d, hat: "hat-none" }));
                  }}
                  className="nes-btn px-2 py-1 bg-[#ffd166] text-black text-[7px] shrink-0"
                >
                  TOGLI
                </button>
              </div>
            )}

            {/* Carnagione */}
            <div className="bg-[#090d18] border-[3px] border-[#2e3d6b] p-2.5">
              <p className="font-pixel text-[8px] text-[#ffd166] mb-2">
                CARNAGIONE
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => {
                      sound8bit.click();
                      setDraft((d) => ({ ...d, skinTone: tone.id }));
                    }}
                    className={`border-2 py-2 px-1 flex flex-col items-center gap-1 transition ${
                      draft.skinTone === tone.id
                        ? "border-[#38e54d] bg-[#102a1d]"
                        : "border-[#2e3d6b] bg-[#141b33]"
                    }`}
                  >
                    <span
                      className="w-6 h-6 border-2 border-black"
                      style={{ backgroundColor: tone.color }}
                    />
                    <span className="text-base text-white leading-none">
                      {tone.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colore capelli */}
            <div className="bg-[#090d18] border-[3px] border-[#2e3d6b] p-2.5">
              <p className="font-pixel text-[8px] text-[#ffd166] mb-2">
                COLORE CAPELLI
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {HAIR_COLORS.map((hc) => (
                  <button
                    key={hc.id}
                    type="button"
                    onClick={() => {
                      sound8bit.click();
                      setDraft((d) => ({ ...d, hairColor: hc.id }));
                    }}
                    className={`border-2 py-1.5 px-1 flex flex-col items-center gap-1 transition ${
                      draft.hairColor === hc.id
                        ? "border-[#ffd166] bg-[#2a1f3d]"
                        : "border-[#2e3d6b] bg-[#141b33]"
                    }`}
                  >
                    <span
                      className="w-5 h-5 border-2 border-black"
                      style={{ backgroundColor: hc.color }}
                    />
                    <span className="text-sm text-white leading-none">
                      {hc.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stile capelli */}
            <div className="bg-[#090d18] border-[3px] border-[#2e3d6b] p-2.5">
              <p className="font-pixel text-[8px] text-[#ffd166] mb-2">
                STILE CAPELLI
              </p>
              <div className="grid grid-cols-5 gap-1">
                {HAIR_STYLES.map((hs) => (
                  <button
                    key={hs.id}
                    type="button"
                    onClick={() => {
                      sound8bit.click();
                      setDraft((d) => ({ ...d, hairStyle: hs.id }));
                    }}
                    className={`nes-btn py-2 text-[7px] ${
                      draft.hairStyle === hs.id
                        ? "bg-[#ffd166] text-black"
                        : "bg-[#26335c] text-slate-200"
                    }`}
                  >
                    {hs.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barba (solo profilo maschile, stesso colore dei capelli) */}
            {draft.gender === "male" && (
              <div className="bg-[#090d18] border-[3px] border-[#2e3d6b] p-2.5">
                <p className="font-pixel text-[8px] text-[#4cc9f0] mb-2">
                  STILE BARBA (STESSO COLORE CAPELLI)
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {BEARD_STYLES.map((bs) => (
                    <button
                      key={bs.id}
                      type="button"
                      onClick={() => {
                        sound8bit.click();
                        setDraft((d) => ({ ...d, beard: bs.id }));
                      }}
                      className={`nes-btn py-2 text-[7px] ${
                        draft.beard === bs.id
                          ? "bg-[#4cc9f0] text-black"
                          : "bg-[#26335c] text-slate-200"
                      }`}
                    >
                      {bs.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEZIONE 2: VESTITI & ACCESSORI */}
        {section === "clothes" && (
          <>
            <div className="grid grid-cols-4 gap-1 mb-2.5">
              {SLOTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    sound8bit.click();
                    setActiveSlot(s.id);
                  }}
                  className={`nes-btn py-1.5 text-[7px] ${
                    activeSlot === s.id
                      ? "bg-[#ffd166] text-black"
                      : "bg-[#26335c] text-slate-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {slotItems.map((item) => {
                const unlocked = isCosmeticUnlocked(
                  item,
                  unlockedCardsCount,
                  easterEggs,
                  prestige,
                  overridesDraft,
                  isSuperuser,
                );
                const equipped = draft[activeSlot] === item.id;
                const isDefaultItem = item.requirement.type === "default";
                const isCreatorExclusive =
                  item.requirement.type === "superuser";
                const isMaxPrestigeReward =
                  item.requirement.type === "prestige_complete";

                return (
                  <div
                    key={item.id}
                    className={`w-full border-[3px] p-2.5 flex items-center justify-between gap-2 ${
                      equipped
                        ? "border-[#38e54d] bg-[#102a1d]"
                        : isCreatorExclusive
                          ? "border-[#ff0054] bg-[#2a0a18]"
                          : isMaxPrestigeReward
                            ? "border-[#38bdf8] bg-[#0f2238]"
                            : unlocked
                              ? "border-[#2e3d6b] bg-[#0d1324]"
                              : "border-[#1e293b] bg-[#090d18] opacity-75"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        sound8bit.click();
                        setDraft((d) => ({ ...d, [activeSlot]: item.id }));
                      }}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                    >
                      <span
                        className="w-6 h-6 border-2 border-black shrink-0"
                        style={{ backgroundColor: item.previewColor }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-pixel text-[8px] text-[#ffd166] truncate">
                            {item.name}
                          </p>
                          {isCreatorExclusive && (
                            <span className="bg-[#ff0054] px-1 font-pixel text-[6px] text-white shrink-0">
                              SU
                            </span>
                          )}
                          {isMaxPrestigeReward && (
                            <span className="bg-[#0284c7] px-1 font-pixel text-[6px] text-white shrink-0">
                              ★5 MAX
                            </span>
                          )}
                        </div>
                        <p className="text-lg text-slate-300 leading-tight truncate">
                          {unlocked
                            ? item.description
                            : `🔒 ${getRequirementLabel(item.requirement)}`}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-pixel text-[7px] text-[#38e54d]">
                        {equipped ? "✓ INDOSSO" : unlocked ? "METTI" : "🔒"}
                      </span>

                      {isSuperuser && !isDefaultItem && (
                        <button
                          type="button"
                          onClick={() =>
                            toggleCosmeticOverride(
                              item.id,
                              activeSlot,
                              unlocked,
                            )
                          }
                          className={`nes-btn px-2 py-1 text-[7px] ${
                            unlocked
                              ? "bg-[#be123c] text-white"
                              : "bg-[#38e54d] text-black"
                          }`}
                        >
                          {unlocked ? "🔒 BLOCCA" : "🔓 SBLOCCA"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* SEZIONE 3: TITOLI */}
        {section === "titles" && (
          <div className="overflow-y-auto space-y-2 pr-1 flex-1">
            {visibleTitles.map((t) => {
              const unlocked = isTitleUnlocked(t, {
                unlockedCardsCount,
                easterEggs,
                prestige,
                bountyStreak,
                editionsOwned,
                overrides: overridesDraft,
                isSuperuser,
              });
              const equipped = draftTitle === t.id;
              const isDefaultTitle = t.requirement.type === "default";
              const isCreatorExclusive = t.requirement.type === "superuser";
              const isMaxPrestigeReward =
                t.requirement.type === "prestige_complete";

              return (
                <div
                  key={t.id}
                  className={`w-full border-[3px] p-2.5 flex items-center justify-between gap-2 ${
                    equipped
                      ? "border-[#ffd166] bg-[#2a1f3d]"
                      : isCreatorExclusive
                        ? "border-[#ff0054] bg-[#2a0a18]"
                        : isMaxPrestigeReward
                          ? "border-[#38bdf8] bg-[#0f2238]"
                          : unlocked
                            ? "border-[#2e3d6b] bg-[#0d1324]"
                            : "border-[#1e293b] bg-[#090d18] opacity-75"
                  }`}
                >
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => {
                      sound8bit.click();
                      setDraftTitle(t.id);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="font-pixel text-[8px] text-[#ffd166] truncate">
                        {t.icon} {t.label}
                      </p>
                      {isCreatorExclusive && (
                        <span className="bg-[#ff0054] px-1 font-pixel text-[6px] text-white shrink-0">
                          SU
                        </span>
                      )}
                      {isMaxPrestigeReward && (
                        <span className="bg-[#0284c7] px-1 font-pixel text-[6px] text-white shrink-0">
                          ★5 MAX
                        </span>
                      )}
                    </div>
                    <p className="text-lg text-slate-300 leading-tight">
                      {unlocked
                        ? t.description
                        : `🔒 ${getTitleRequirementLabel(t.requirement)}`}
                    </p>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-pixel text-[7px] text-[#38e54d]">
                      {equipped ? "✓ ATTIVO" : unlocked ? "USA" : "🔒"}
                    </span>

                    {isSuperuser && !isDefaultTitle && (
                      <button
                        type="button"
                        onClick={() => toggleTitleOverride(t.id, unlocked)}
                        className={`nes-btn px-2 py-1 text-[7px] ${
                          unlocked
                            ? "bg-[#be123c] text-white"
                            : "bg-[#38e54d] text-black"
                        }`}
                      >
                        {unlocked ? "🔒 BLOCCA" : "🔓 SBLOCCA"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSaveAll()}
          className="nes-btn w-full py-3 mt-3 bg-[#38e54d] text-black text-[9px]"
        >
          {saving ? "SALVATAGGIO..." : "💾 SALVA ASPETTO, LOOK & TITOLO"}
        </button>
      </div>
    </div>
  );
};
