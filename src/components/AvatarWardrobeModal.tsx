import React, { useState } from "react";
import {
  type AvatarConfig,
  COSMETICS_CATALOG,
  type CosmeticSlot,
  PLAYER_TITLES,
  getRequirementLabel,
  getTitleById,
  getTitleRequirementLabel,
  isCosmeticUnlocked,
  isTitleUnlocked,
} from "../../shared/cosmetics";
import { sound8bit } from "../utils/sound8bit";
import { PixelAvatar } from "./PixelAvatar";

interface AvatarWardrobeModalProps {
  avatar: AvatarConfig;
  titleId: string;
  nickname: string;
  unlockedCardsCount: number;
  easterEggs: string[];
  prestige: number;
  bountyStreak: number;
  editionsOwned: string[];
  onSave: (nextAvatar: AvatarConfig) => Promise<void>;
  onSaveTitle: (nextTitleId: string) => Promise<void>;
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
  unlockedCardsCount,
  easterEggs,
  prestige,
  bountyStreak,
  editionsOwned,
  onSave,
  onSaveTitle,
  onClose,
}) => {
  const [section, setSection] = useState<"clothes" | "titles">("clothes");
  const [draft, setDraft] = useState<AvatarConfig>(avatar);
  const [draftTitle, setDraftTitle] = useState<string>(titleId);
  const [activeSlot, setActiveSlot] = useState<CosmeticSlot>("hat");
  const [saving, setSaving] = useState(false);

  const previewTitle = getTitleById(draftTitle);
  const slotItems = COSMETICS_CATALOG.filter(
    (item) => item.slot === activeSlot,
  );

  const handleSaveAll = async () => {
    sound8bit.click();
    setSaving(true);
    try {
      await onSave(draft);
      if (draftTitle !== titleId) {
        await onSaveTitle(draftTitle);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] bg-black/85 flex items-end sm:items-center justify-center sm:p-3">
      <div className="nes-box-gold w-full sm:max-w-lg max-h-[88dvh] flex flex-col p-4 safe-bottom">
        {/* Header */}
        <div className="flex justify-between items-center border-b-[3px] border-[#2e3d6b] pb-2.5 mb-3">
          <h3 className="font-pixel text-[10px] sm:text-xs text-[#ffd166]">
            👕 ARMADIO &amp; TITOLI
          </h3>
          <button
            onClick={onClose}
            className="nes-btn w-10 h-10 bg-[#ff4d6d] text-white text-[10px]"
          >
            X
          </button>
        </div>

        {/* Anteprima Avatar + Nickname + Titolo */}
        <div className="bg-[#090d18] border-[3px] border-[#4cc9f0] p-3 mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-16 h-20 bg-[#141b33] border-2 border-[#ffd166] flex items-center justify-center shrink-0">
              <PixelAvatar avatar={draft} size={52} />
            </div>
            <div className="min-w-0">
              <p className="font-pixel text-[10px] text-white truncate">
                {nickname}
              </p>
              <p className="text-lg text-[#ffd166] leading-tight truncate">
                {previewTitle.icon} {previewTitle.label}
              </p>
              <div className="flex gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound8bit.click();
                    setDraft((d) => ({ ...d, gender: "male" }));
                  }}
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
                  onClick={() => {
                    sound8bit.click();
                    setDraft((d) => ({ ...d, gender: "female" }));
                  }}
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

        {/* Selettore Sezione: VESTITI vs TITOLI */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => {
              sound8bit.click();
              setSection("clothes");
            }}
            className={`nes-btn py-2 text-[8px] ${
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
            className={`nes-btn py-2 text-[8px] ${
              section === "titles"
                ? "bg-[#ffd166] text-black"
                : "bg-[#26335c] text-slate-300"
            }`}
          >
            🏷️ TITOLI ({PLAYER_TITLES.length})
          </button>
        </div>

        {section === "clothes" ? (
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
                );
                const equipped = draft[activeSlot] === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => {
                      sound8bit.click();
                      setDraft((d) => ({ ...d, [activeSlot]: item.id }));
                    }}
                    className={`w-full text-left border-[3px] p-2.5 flex items-center justify-between gap-2 ${
                      equipped
                        ? "border-[#38e54d] bg-[#102a1d]"
                        : unlocked
                          ? "border-[#2e3d6b] bg-[#0d1324]"
                          : "border-[#1e293b] bg-[#090d18] opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-6 h-6 border-2 border-black shrink-0"
                        style={{ backgroundColor: item.previewColor }}
                      />
                      <div className="min-w-0">
                        <p className="font-pixel text-[8px] text-[#ffd166] truncate">
                          {item.name}
                        </p>
                        <p className="text-lg text-slate-300 leading-tight truncate">
                          {unlocked
                            ? item.description
                            : `🔒 ${getRequirementLabel(item.requirement)}`}
                        </p>
                      </div>
                    </div>
                    <span className="font-pixel text-[7px] text-[#38e54d] shrink-0">
                      {equipped ? "✓ INDOSSO" : unlocked ? "METTI" : "🔒"}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="overflow-y-auto space-y-2 pr-1 flex-1">
            {PLAYER_TITLES.map((t) => {
              const unlocked = isTitleUnlocked(t, {
                unlockedCardsCount,
                easterEggs,
                prestige,
                bountyStreak,
                editionsOwned,
              });
              const equipped = draftTitle === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    sound8bit.click();
                    setDraftTitle(t.id);
                  }}
                  className={`w-full text-left border-[3px] p-2.5 flex items-center justify-between gap-2 ${
                    equipped
                      ? "border-[#ffd166] bg-[#2a1f3d]"
                      : unlocked
                        ? "border-[#2e3d6b] bg-[#0d1324]"
                        : "border-[#1e293b] bg-[#090d18] opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-pixel text-[8px] text-[#ffd166] truncate">
                      {t.icon} {t.label}
                    </p>
                    <p className="text-lg text-slate-300 leading-tight">
                      {unlocked
                        ? t.description
                        : `🔒 ${getTitleRequirementLabel(t.requirement)}`}
                    </p>
                  </div>
                  <span className="font-pixel text-[7px] text-[#38e54d] shrink-0">
                    {equipped ? "✓ ATTIVO" : unlocked ? "USA" : "🔒"}
                  </span>
                </button>
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
          {saving ? "SALVATAGGIO..." : "💾 SALVA LOOK & TITOLO"}
        </button>
      </div>
    </div>
  );
};
