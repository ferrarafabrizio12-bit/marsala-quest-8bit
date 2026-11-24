export type AvatarGender = 'male' | 'female';
export type CosmeticSlot = 'hat' | 'glasses' | 'top' | 'bottom';

export interface AvatarConfig {
  gender: AvatarGender;
  hat: string;
  glasses: string;
  top: string;
  bottom: string;
}

export type CosmeticRequirement =
  | { type: 'default' }
  | { type: 'cards'; count: number }
  | { type: 'easter_egg'; eggId: string; eggTitle: string };

export interface CosmeticItem {
  id: string;
  slot: CosmeticSlot;
  name: string;
  description: string;
  previewColor: string;
  requirement: CosmeticRequirement;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: 'male',
  hat: 'hat-cap-red',
  glasses: 'glasses-none',
  top: 'top-explorer',
  bottom: 'bottom-jeans',
};

export const COSMETICS_CATALOG: CosmeticItem[] = [
  // ================= CAPPELLI (hat) =================
  {
    id: 'hat-none',
    slot: 'hat',
    name: 'Testa Scoperta',
    description: 'Nessun copricapo, capelli al vento.',
    previewColor: '#64748b',
    requirement: { type: 'default' },
  },
  {
    id: 'hat-cap-red',
    slot: 'hat',
    name: 'Cappellino Retro',
    description: 'Il classico berretto da esploratore 8-bit.',
    previewColor: '#ff4d6d',
    requirement: { type: 'default' },
  },
  {
    id: 'hat-paglia',
    slot: 'hat',
    name: 'Paglia del Salinaro',
    description: 'Cappello a tesa larga per il sole delle saline.',
    previewColor: '#eab308',
    requirement: { type: 'cards', count: 5 },
  },
  {
    id: 'hat-garibaldi',
    slot: 'hat',
    name: 'Kepi dei Mille',
    description: 'Storico berretto garibaldino dello sbarco 1860.',
    previewColor: '#dc2626',
    requirement: { type: 'easter_egg', eggId: 'sbarco-1860', eggTitle: 'Camicia Rossa 8-Bit' },
  },
  {
    id: 'hat-woodhouse',
    slot: 'hat',
    name: 'Cilindro di Woodhouse',
    description: 'Eleganza inglese del 1773 tra le botti di Marsala.',
    previewColor: '#1e293b',
    requirement: { type: 'easter_egg', eggId: 'woodhouse-1773', eggTitle: 'Segreto di Woodhouse' },
  },
  {
    id: 'hat-sibilla',
    slot: 'hat',
    name: 'Alloro della Sibilla',
    description: 'Corona profetica di Capo Boeo.',
    previewColor: '#22c55e',
    requirement: { type: 'easter_egg', eggId: 'oracolo-sibilla', eggTitle: 'Voce della Sibilla' },
  },
  {
    id: 'hat-punico',
    slot: 'hat',
    name: 'Elmo Cartaginese',
    description: 'Elmo con cresta rossa dei marinai della Nave Punica.',
    previewColor: '#d97706',
    requirement: { type: 'easter_egg', eggId: 'nave-punica', eggTitle: 'Rotta di Cartagine' },
  },
  {
    id: 'hat-corona-lilibeo',
    slot: 'hat',
    name: 'Corona Turrita d’Oro',
    description: 'Emblema supremo per chi ha completato tutta Marsala.',
    previewColor: '#ffd166',
    requirement: { type: 'cards', count: 20 },
  },

  // ================= OCCHIALI (glasses) =================
  {
    id: 'glasses-none',
    slot: 'glasses',
    name: 'Nessun Occhiale',
    description: 'Sguardo libero su Lilibeo.',
    previewColor: '#64748b',
    requirement: { type: 'default' },
  },
  {
    id: 'glasses-pixel',
    slot: 'glasses',
    name: 'Occhiali 8-Bit',
    description: 'Montatura nera pixelata stile arcade.',
    previewColor: '#0f172a',
    requirement: { type: 'cards', count: 1 },
  },
  {
    id: 'glasses-gameboy',
    slot: 'glasses',
    name: 'Visore Game Boy ’89',
    description: 'Lenti verde fosforo da vero retrogamer.',
    previewColor: '#84cc16',
    requirement: { type: 'easter_egg', eggId: 'konami-gameboy', eggTitle: 'Nostalgico 1989' },
  },
  {
    id: 'glasses-sunset',
    slot: 'glasses',
    name: 'Lenti Rosa Stagnone',
    description: 'Riflettono i tramonti infuocati sulle saline.',
    previewColor: '#fb7185',
    requirement: {
      type: 'easter_egg',
      eggId: 'tramonto-stagnone',
      eggTitle: 'Cacciatore di Tramonti',
    },
  },
  {
    id: 'glasses-neon',
    slot: 'glasses',
    name: 'Visore Neon Arcade',
    description: 'Lenti ciano fosforescenti per la notte di Lilibeo.',
    previewColor: '#22d3ee',
    requirement: { type: 'easter_egg', eggId: 'notte-lilibeo', eggTitle: 'Notte di Lilibeo' },
  },

  // ================= MAGLIE (top) =================
  {
    id: 'top-explorer',
    slot: 'top',
    name: 'Maglia Azzurra',
    description: 'Divisa base dell’esploratore marsalese.',
    previewColor: '#4cc9f0',
    requirement: { type: 'default' },
  },
  {
    id: 'top-sole',
    slot: 'top',
    name: 'T-Shirt Giallo Sole',
    description: 'Perfetta per passeggiare sul Lungomare Boeo.',
    previewColor: '#facc15',
    requirement: { type: 'default' },
  },
  {
    id: 'top-garibaldi',
    slot: 'top',
    name: 'Camicia Rossa 1860',
    description: 'Iconica giubba rossa con fazzoletto al collo.',
    previewColor: '#ef4444',
    requirement: { type: 'easter_egg', eggId: 'sbarco-1860', eggTitle: 'Camicia Rossa 8-Bit' },
  },
  {
    id: 'top-cantiniere',
    slot: 'top',
    name: 'Gilet del Cantiniere',
    description: 'Camicia bianca e gilet bordeaux delle cantine storiche.',
    previewColor: '#881337',
    requirement: { type: 'easter_egg', eggId: 'woodhouse-1773', eggTitle: 'Segreto di Woodhouse' },
  },
  {
    id: 'top-kite',
    slot: 'top',
    name: 'Muta Maestrale',
    description: 'Muta da kitesurf blu e verde fluo dello Stagnone.',
    previewColor: '#10b981',
    requirement: { type: 'easter_egg', eggId: 'vento-stagnone', eggTitle: 'Maestro del Maestrale' },
  },
  {
    id: 'top-cassaro',
    slot: 'top',
    name: 'Tunica del Cassaro',
    description: 'Veste viola e oro del custode del Centro Storico.',
    previewColor: '#7c3aed',
    requirement: { type: 'easter_egg', eggId: 'custode-cassaro', eggTitle: 'Custode del Cassaro' },
  },
  {
    id: 'top-oro',
    slot: 'top',
    name: 'Giacca Oro Tramonto',
    description: 'Riservata agli esploratori veterani di Marsala.',
    previewColor: '#f59e0b',
    requirement: { type: 'cards', count: 15 },
  },

  // ================= PANTALONI (bottom) =================
  {
    id: 'bottom-jeans',
    slot: 'bottom',
    name: 'Jeans Classici',
    description: 'Comodi per camminare da Capo Boeo a Birgi.',
    previewColor: '#1d4ed8',
    requirement: { type: 'default' },
  },
  {
    id: 'bottom-shorts',
    slot: 'bottom',
    name: 'Pantaloncini Mare',
    description: 'Stile estivo da Lido Signorino.',
    previewColor: '#0ea5e9',
    requirement: { type: 'default' },
  },
  {
    id: 'bottom-cargo',
    slot: 'bottom',
    name: 'Cargo Esploratore',
    description: 'Tasconi pronti per custodire le Card.',
    previewColor: '#65a30d',
    requirement: { type: 'cards', count: 3 },
  },
  {
    id: 'bottom-garibaldi',
    slot: 'bottom',
    name: 'Pantaloni dei Mille',
    description: 'Grigio-azzurri con banda laterale storica.',
    previewColor: '#475569',
    requirement: { type: 'cards', count: 8 },
  },
  {
    id: 'bottom-punico',
    slot: 'bottom',
    name: 'Calzari Fenici',
    description: 'Tunica corta e sandali degli antichi navigatori.',
    previewColor: '#b45309',
    requirement: { type: 'cards', count: 12 },
  },
  {
    id: 'bottom-oro',
    slot: 'bottom',
    name: 'Gambali d’Oro Lilibeo',
    description: 'Armatura leggendaria del completamento 100%.',
    previewColor: '#ffd166',
    requirement: { type: 'cards', count: 20 },
  },
];

export function isCosmeticUnlocked(
  item: CosmeticItem,
  unlockedCardsCount: number,
  easterEggs: string[]
): boolean {
  if (item.requirement.type === 'default') return true;
  if (item.requirement.type === 'cards') return unlockedCardsCount >= item.requirement.count;
  return easterEggs.includes(item.requirement.eggId);
}

export function getUnlockedCosmeticIds(
  unlockedCardsCount: number,
  easterEggs: string[]
): string[] {
  return COSMETICS_CATALOG.filter((item) =>
    isCosmeticUnlocked(item, unlockedCardsCount, easterEggs)
  ).map((item) => item.id);
}

export function getRequirementLabel(req: CosmeticRequirement): string {
  if (req.type === 'default') return 'Disponibile subito';
  if (req.type === 'cards') {
    return req.count === 1 ? 'Sblocca 1 Card' : `Sblocca ${req.count} Card`;
  }
  return `Segreto: ${req.eggTitle}`;
}

export function sanitizeAvatarConfig(raw: unknown): AvatarConfig {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Partial<AvatarConfig>;
  const validForSlot = (slot: CosmeticSlot, id: unknown, fallback: string): string => {
    if (typeof id !== 'string') return fallback;
    const exists = COSMETICS_CATALOG.some((c) => c.slot === slot && c.id === id);
    return exists ? id : fallback;
  };

  return {
    gender: input.gender === 'female' ? 'female' : 'male',
    hat: validForSlot('hat', input.hat, DEFAULT_AVATAR.hat),
    glasses: validForSlot('glasses', input.glasses, DEFAULT_AVATAR.glasses),
    top: validForSlot('top', input.top, DEFAULT_AVATAR.top),
    bottom: validForSlot('bottom', input.bottom, DEFAULT_AVATAR.bottom),
  };
}