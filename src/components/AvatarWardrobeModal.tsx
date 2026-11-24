import React, { useMemo, useState } from 'react';
import {
  type AvatarConfig,
  type CosmeticSlot,
  COSMETICS_CATALOG,
  getRequirementLabel,
  isCosmeticUnlocked,
} from '../../shared/cosmetics';
import { PixelAvatar } from './PixelAvatar';
import { sound8bit } from '../utils/sound8bit';

interface AvatarWardrobeModalProps {
  avatar: AvatarConfig;
  nickname: string;
  unlockedCardsCount: number;
  easterEggs: string[];
  onSave: (next: AvatarConfig) => Promise<void>;
  onClose: () => void;
}

const SLOT_TABS: { id: CosmeticSlot; label: string; icon: string }[] = [
  { id: 'hat', label: 'CAPPELLI', icon: '🧢' },
  { id: 'glasses', label: 'OCCHIALI', icon: '🕶️' },
  { id: 'top', label: 'MAGLIE', icon: '👕' },
  { id: 'bottom', label: 'PANTALONI', icon: '👖' },
];

export const AvatarWardrobeModal: React.FC<AvatarWardrobeModalProps> = ({
  avatar,
  nickname,
  unlockedCardsCount,
  easterEggs,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<AvatarConfig>(avatar);
  const [activeSlot, setActiveSlot] = useState<CosmeticSlot>('hat');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slotItems = useMemo(
    () => COSMETICS_CATALOG.filter((item) => item.slot === activeSlot),
    [activeSlot]
  );

  const unlockedTotal = useMemo(
    () =>
      COSMETICS_CATALOG.filter(
        (i) => i.requirement.type !== 'default' && isCosmeticUnlocked(i, unlockedCardsCount, easterEggs)
      ).length,
    [unlockedCardsCount, easterEggs]
  );

  const rewardTotal = useMemo(
    () => COSMETICS_CATALOG.filter((i) => i.requirement.type !== 'default').length,
    []
  );

  const handleSave = async () => {
    sound8bit.click();
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      sound8bit.syncViewpoint();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-end sm:items-center justify-center sm:p-3">
      <div className="nes-box-gold w-full sm:max-w-xl h-[88dvh] sm:h-auto sm:max-h-[88dvh] flex flex-col p-3.5 safe-bottom">
        {/* Header */}
        <div className="flex justify-between items-center border-b-[3px] border-[#2e3d6b] pb-2.5 mb-3">
          <div>
            <h3 className="font-pixel text-[10px] sm:text-xs text-[#ffd166]">
              👕 ARMADIO DI {nickname.toUpperCase()}
            </h3>
            <p className="text-lg text-[#4cc9f0] leading-none mt-1">
              Premi sbloccati: {unlockedTotal}/{rewardTotal}
            </p>
          </div>
          <button
            onClick={() => {
              sound8bit.click();
              onClose();
            }}
            className="nes-btn w-10 h-10 bg-[#ff4d6d] text-white text-[10px] shrink-0"
          >
            X
          </button>
        </div>

        {/* Anteprima live + selettore LUI / LEI */}
        <div className="bg-[#0b0e1a] border-[3px] border-[#2e3d6b] p-3 mb-3 flex items-center justify-around gap-3">
          <div className="bg-[#141b33] border-[3px] border-[#ffd166] px-5 py-2 flex flex-col items-center">
            <PixelAvatar avatar={draft} size={68} />
            <span className="font-pixel text-[8px] text-[#38e54d] mt-1">LIVE</span>
          </div>

          <div className="flex-1 max-w-[200px] space-y-2">
            <p className="font-pixel text-[8px] text-[#ffd166] text-center">STILE BASE</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sound8bit.click();
                  setDraft((prev) => ({ ...prev, gender: 'male' }));
                }}
                className={`nes-btn py-2.5 text-[9px] ${
                  draft.gender === 'male'
                    ? 'bg-[#4cc9f0] text-black'
                    : 'bg-[#26335c] text-slate-300'
                }`}
              >
                ♂ LUI
              </button>
              <button
                type="button"
                onClick={() => {
                  sound8bit.click();
                  setDraft((prev) => ({ ...prev, gender: 'female' }));
                }}
                className={`nes-btn py-2.5 text-[9px] ${
                  draft.gender === 'female'
                    ? 'bg-[#ff4d6d] text-white'
                    : 'bg-[#26335c] text-slate-300'
                }`}
              >
                ♀ LEI
              </button>
            </div>
            <p className="text-base text-slate-400 text-center leading-tight">
              Sblocca Card ed Easter Egg per ottenere nuovi capi a tema Marsala!
            </p>
          </div>
        </div>

        {/* Tab Categorie */}
        <div className="grid grid-cols-4 gap-1.5 mb-2.5">
          {SLOT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                sound8bit.click();
                setActiveSlot(t.id);
              }}
              className={`nes-btn py-2 flex flex-col items-center justify-center gap-0.5 ${
                activeSlot === t.id
                  ? 'bg-[#ffd166] text-black'
                  : 'bg-[#26335c] text-slate-300'
              }`}
            >
              <span className="text-sm leading-none">{t.icon}</span>
              <span className="text-[6px] sm:text-[7px]">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Griglia Indumenti */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
          {slotItems.map((item) => {
            const unlocked = isCosmeticUnlocked(item, unlockedCardsCount, easterEggs);
            const selected = draft[activeSlot] === item.id;
            const previewAvatar: AvatarConfig = { ...draft, [activeSlot]: item.id };

            return (
              <button
                key={item.id}
                type="button"
                disabled={!unlocked}
                onClick={() => {
                  sound8bit.click();
                  setDraft((prev) => ({ ...prev, [activeSlot]: item.id }));
                }}
                className={`text-left border-[3px] p-2 flex items-center gap-2.5 transition ${
                  selected
                    ? 'border-[#38e54d] bg-[#102a1d]'
                    : unlocked
                      ? 'border-[#2e3d6b] bg-[#0d1324] hover:border-[#ffd166]'
                      : 'border-[#1e293b] bg-[#090d18] opacity-65 cursor-not-allowed'
                }`}
              >
                <div className="w-11 h-14 bg-[#141b33] border-2 border-black flex items-center justify-center shrink-0 relative">
                  <PixelAvatar avatar={previewAvatar} size={32} />
                  {!unlocked && (
                    <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-base">
                      🔒
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-pixel text-[8px] text-[#ffd166] truncate">
                      {item.name}
                    </span>
                    {selected && (
                      <span className="font-pixel text-[7px] text-[#38e54d]">ON</span>
                    )}
                  </div>
                  <p className="text-base text-slate-300 leading-tight mt-0.5">
                    {item.description}
                  </p>
                  <p
                    className={`text-sm mt-0.5 ${
                      unlocked ? 'text-[#4cc9f0]' : 'text-[#ff4d6d]'
                    }`}
                  >
                    {unlocked ? '✓ Sbloccato' : `🔒 ${getRequirementLabel(item.requirement)}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-2 bg-[#4c0519] border-2 border-[#ff4d6d] px-2.5 py-1.5 text-lg text-[#fecdd3]">
            ⚠ {error}
          </p>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="nes-btn w-full mt-3 min-h-[48px] bg-[#38e54d] text-black text-[10px] disabled:opacity-50"
        >
          {saving ? 'SALVATAGGIO...' : '💾 SALVA LOOK SU MAPPA & CLASSIFICA'}
        </button>
      </div>
    </div>
  );
};