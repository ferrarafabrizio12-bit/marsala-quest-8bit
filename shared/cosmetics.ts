export type AvatarGender = "male" | "female";
export type CosmeticSlot = "hat" | "glasses" | "top" | "bottom";

export interface AvatarConfig {
  gender: AvatarGender;
  hat: string;
  glasses: string;
  top: string;
  bottom: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: "male",
  hat: "hat-cap-red",
  glasses: "glasses-none",
  top: "top-explorer",
  bottom: "bottom-jeans",
};

export type CosmeticRequirement =
  | { type: "default" }
  | { type: "cards"; count: number }
  | { type: "easter_egg"; eggId: string; eggTitle: string }
  | { type: "prestige"; level: number };

export interface CosmeticItem {
  id: string;
  slot: CosmeticSlot;
  name: string;
  description: string;
  previewColor: string;
  requirement: CosmeticRequirement;
}

export const COSMETICS_CATALOG: CosmeticItem[] = [
  // --- CAPPELLI ---
  {
    id: "hat-none",
    slot: "hat",
    name: "Capelli Naturali",
    description: "Nessun copricapo, stile libero.",
    previewColor: "#6b4423",
    requirement: { type: "default" },
  },
  {
    id: "hat-cap-red",
    slot: "hat",
    name: "Berretto Lilibeo",
    description: "Il classico berretto rosso da esploratore 8-bit.",
    previewColor: "#ef4444",
    requirement: { type: "default" },
  },
  {
    id: "hat-straw",
    slot: "hat",
    name: "Cappello di Paglia",
    description: "Perfetto per camminare sotto il sole delle Saline.",
    previewColor: "#facc15",
    requirement: { type: "cards", count: 3 },
  },
  {
    id: "hat-beret-red",
    slot: "hat",
    name: "Berretto Garibaldino",
    description: "Storico copricapo dei Mille sbarcati nel 1860.",
    previewColor: "#dc2626",
    requirement: {
      type: "easter_egg",
      eggId: "sbarco-1860",
      eggTitle: "11 Maggio 1860",
    },
  },
  {
    id: "hat-crown-gold",
    slot: "hat",
    name: "Corona di Lilibeo ★",
    description: "Corona d’oro riservata alle leggende Prestigio.",
    previewColor: "#ffd166",
    requirement: { type: "prestige", level: 1 },
  },

  // --- OCCHIALI ---
  {
    id: "glasses-none",
    slot: "glasses",
    name: "Nessun Occhiale",
    description: "Sguardo limpido sul Mediterraneo.",
    previewColor: "#94a3b8",
    requirement: { type: "default" },
  },
  {
    id: "glasses-pixel",
    slot: "glasses",
    name: "Occhiali Pixel 8-Bit",
    description: "Montatura nera squadrata ad alto contrasto.",
    previewColor: "#1e293b",
    requirement: { type: "cards", count: 2 },
  },
  {
    id: "glasses-sunset",
    slot: "glasses",
    name: "Lenti Tramonto Stagnone",
    description: "Riflesso ambrato dei mulini al calar del sole.",
    previewColor: "#f97316",
    requirement: {
      type: "easter_egg",
      eggId: "tramonto-stagnone",
      eggTitle: "Tramonto allo Stagnone",
    },
  },
  {
    id: "glasses-neon",
    slot: "glasses",
    name: "Visore Notte Neon",
    description: "Lenti ciano luminose per le esplorazioni notturne.",
    previewColor: "#38bdf8",
    requirement: {
      type: "easter_egg",
      eggId: "notte-lilibeo",
      eggTitle: "Notte di Lilibeo",
    },
  },

  // --- MAGLIE ---
  {
    id: "top-explorer",
    slot: "top",
    name: "Giacca Esploratore",
    description: "Divisa ufficiale per mappare Marsala.",
    previewColor: "#2563eb",
    requirement: { type: "default" },
  },
  {
    id: "top-garibaldi",
    slot: "top",
    name: "Camicia Rossa 1860",
    description: "La leggendaria giubba dei Mille di Garibaldi.",
    previewColor: "#b91c1c",
    requirement: {
      type: "easter_egg",
      eggId: "sbarco-1860",
      eggTitle: "11 Maggio 1860",
    },
  },
  {
    id: "top-winemaker",
    slot: "top",
    name: "Grembiule Cantiniere",
    description: "Tenuta storica delle antiche baglie del vino Marsala.",
    previewColor: "#78350f",
    requirement: {
      type: "easter_egg",
      eggId: "woodhouse-1773",
      eggTitle: "Cantina Woodhouse 1773",
    },
  },
  {
    id: "top-kitesurf",
    slot: "top",
    name: "Muta Kitesurf Stagnone",
    description: "Muta tecnica per cavalcare il Maestrale in laguna.",
    previewColor: "#10b981",
    requirement: {
      type: "easter_egg",
      eggId: "vento-stagnone",
      eggTitle: "Vento dello Stagnone",
    },
  },
  {
    id: "top-cassaro",
    slot: "top",
    name: "Mantello del Cassaro",
    description: "Abito nobile del centro storico di Marsala.",
    previewColor: "#7c3aed",
    requirement: {
      type: "easter_egg",
      eggId: "custode-cassaro",
      eggTitle: "Custode del Cassaro",
    },
  },
  {
    id: "top-holo",
    slot: "top",
    name: "Armatura Olografica ★",
    description: "Corazza iridescente per campioni New Game+.",
    previewColor: "#e879f9",
    requirement: { type: "prestige", level: 1 },
  },

  // --- PANTALONI ---
  {
    id: "bottom-jeans",
    slot: "bottom",
    name: "Jeans Classici",
    description: "Comodi per camminare dal porto fino alle saline.",
    previewColor: "#1d4ed8",
    requirement: { type: "default" },
  },
  {
    id: "bottom-cargo",
    slot: "bottom",
    name: "Pantaloni Cargo Lilibeo",
    description: "Multitasche per custodire le Trading Card.",
    previewColor: "#4d7c0f",
    requirement: { type: "cards", count: 4 },
  },
  {
    id: "bottom-punic",
    slot: "bottom",
    name: "Tunica Punica 397 a.C.",
    description: "Veste degli antichi navigatori fenici di Mozia.",
    previewColor: "#0284c7",
    requirement: {
      type: "easter_egg",
      eggId: "nave-punica",
      eggTitle: "Nave Punica 397 a.C.",
    },
  },
  {
    id: "bottom-sibilla",
    slot: "bottom",
    name: "Veste della Sibilla",
    description: "Stoffa mistica dell’antro di Capo Boeo.",
    previewColor: "#9333ea",
    requirement: {
      type: "easter_egg",
      eggId: "oracolo-sibilla",
      eggTitle: "Oracolo della Sibilla",
    },
  },
  {
    id: "bottom-gameboy",
    slot: "bottom",
    name: "Pantaloni DMG-01",
    description: "Colorazione verde fosforo anni ’89.",
    previewColor: "#65a30d",
    requirement: {
      type: "easter_egg",
      eggId: "konami-gameboy",
      eggTitle: "Modalità Game Boy",
    },
  },
];

export interface SuperuserOverrides {
  unlockedCosmetics: string[];
  lockedCosmetics: string[];
  unlockedTitles: string[];
  lockedTitles: string[];
}

export const DEFAULT_SUPERUSER_OVERRIDES: SuperuserOverrides = {
  unlockedCosmetics: [],
  lockedCosmetics: [],
  unlockedTitles: [],
  lockedTitles: [],
};

export function sanitizeAvatarConfig(raw: unknown): AvatarConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_AVATAR };
  }
  const obj = raw as Record<string, unknown>;
  const validBySlot = (
    slot: CosmeticSlot,
    id: unknown,
    fallback: string,
  ): string => {
    if (
      typeof id === "string" &&
      COSMETICS_CATALOG.some((item) => item.slot === slot && item.id === id)
    ) {
      return id;
    }
    return fallback;
  };

  return {
    gender: obj.gender === "female" ? "female" : "male",
    hat: validBySlot("hat", obj.hat, DEFAULT_AVATAR.hat),
    glasses: validBySlot("glasses", obj.glasses, DEFAULT_AVATAR.glasses),
    top: validBySlot("top", obj.top, DEFAULT_AVATAR.top),
    bottom: validBySlot("bottom", obj.bottom, DEFAULT_AVATAR.bottom),
  };
}

export function getRequirementLabel(req: CosmeticRequirement): string {
  if (req.type === "default") return "Disponibile subito";
  if (req.type === "cards") return `Sblocca ${req.count} Card`;
  if (req.type === "prestige") return `Attiva Prestigio ★${req.level}`;
  return `Segreto: ${req.eggTitle}`;
}

export function isCosmeticUnlocked(
  item: CosmeticItem,
  unlockedCardsCount: number,
  easterEggs: string[],
  prestige = 0,
  overrides?: SuperuserOverrides,
): boolean {
  if (overrides?.lockedCosmetics.includes(item.id)) return false;
  if (overrides?.unlockedCosmetics.includes(item.id)) return true;

  const effectiveCards = prestige > 0 ? 20 : unlockedCardsCount;
  const req = item.requirement;
  if (req.type === "default") return true;
  if (req.type === "cards") return effectiveCards >= req.count;
  if (req.type === "prestige") return prestige >= req.level;
  return easterEggs.includes(req.eggId);
}

export function getUnlockedCosmeticIds(
  unlockedCardsCount: number,
  easterEggs: string[],
  prestige = 0,
  overrides?: SuperuserOverrides,
): string[] {
  return COSMETICS_CATALOG.filter((item) =>
    isCosmeticUnlocked(
      item,
      unlockedCardsCount,
      easterEggs,
      prestige,
      overrides,
    ),
  ).map((item) => item.id);
}

export type TitleRequirement =
  | { type: "default" }
  | { type: "cards"; count: number }
  | { type: "easter_egg"; eggId: string; eggTitle: string }
  | { type: "streak"; days: number }
  | { type: "edition"; edition: "golden_hour" | "night" }
  | { type: "prestige"; level: number };

export interface PlayerTitle {
  id: string;
  label: string;
  icon: string;
  description: string;
  requirement: TitleRequirement;
}

export const DEFAULT_TITLE_ID = "title-novizio";

export const PLAYER_TITLES: PlayerTitle[] = [
  {
    id: "title-novizio",
    label: "Esploratore di Lilibeo",
    icon: "🧭",
    description: "Titolo iniziale per ogni avventuriero di Marsala.",
    requirement: { type: "default" },
  },
  {
    id: "title-centro",
    label: "Custode del Cassaro",
    icon: "🏛️",
    description: "Illumina almeno 5 luoghi storici della città.",
    requirement: { type: "cards", count: 5 },
  },
  {
    id: "title-golden",
    label: "Cacciatore di Tramonti",
    icon: "🌅",
    description: "Scatta una Card in Edizione Golden Hour (17:00–20:00).",
    requirement: { type: "edition", edition: "golden_hour" },
  },
  {
    id: "title-notturno",
    label: "Viandante Notturno",
    icon: "🌙",
    description: "Scatta una Card in Edizione Notturna (20:00–06:00).",
    requirement: { type: "edition", edition: "night" },
  },
  {
    id: "title-fiamma",
    label: "Fiamma Eterna",
    icon: "🔥",
    description: "Raggiungi una serie di 3 giorni consecutivi di Daily Bounty.",
    requirement: { type: "streak", days: 3 },
  },
  {
    id: "title-stagnone",
    label: "Signore dello Stagnone",
    icon: "🦩",
    description: "Conquista almeno 12 luoghi tra costa, saline e cantine.",
    requirement: { type: "cards", count: 12 },
  },
  {
    id: "title-garibaldino",
    label: "Eroe dei Mille",
    icon: "⚔️",
    description: "Scopri il segreto dello Sbarco dell’11 Maggio 1860.",
    requirement: {
      type: "easter_egg",
      eggId: "sbarco-1860",
      eggTitle: "11 Maggio 1860",
    },
  },
  {
    id: "title-leggenda",
    label: "Leggenda di Marsala ★",
    icon: "👑",
    description: "Completa tutta la mappa e attiva il Prestigio ★1.",
    requirement: { type: "prestige", level: 1 },
  },
];

export function sanitizeTitleId(raw: unknown): string {
  if (typeof raw === "string" && PLAYER_TITLES.some((t) => t.id === raw)) {
    return raw;
  }
  return DEFAULT_TITLE_ID;
}

export function getTitleById(titleId: string): PlayerTitle {
  return PLAYER_TITLES.find((t) => t.id === titleId) || PLAYER_TITLES[0];
}

export function isTitleUnlocked(
  title: PlayerTitle,
  ctx: {
    unlockedCardsCount: number;
    easterEggs: string[];
    prestige: number;
    bountyStreak: number;
    editionsOwned: string[];
    overrides?: SuperuserOverrides;
  },
): boolean {
  if (ctx.overrides?.lockedTitles.includes(title.id)) return false;
  if (ctx.overrides?.unlockedTitles.includes(title.id)) return true;

  const effectiveCards = ctx.prestige > 0 ? 20 : ctx.unlockedCardsCount;
  const req = title.requirement;
  if (req.type === "default") return true;
  if (req.type === "cards") return effectiveCards >= req.count;
  if (req.type === "prestige") return ctx.prestige >= req.level;
  if (req.type === "streak") return ctx.bountyStreak >= req.days;
  if (req.type === "edition") return ctx.editionsOwned.includes(req.edition);
  return ctx.easterEggs.includes(req.eggId);
}

export function getTitleRequirementLabel(req: TitleRequirement): string {
  if (req.type === "default") return "Disponibile subito";
  if (req.type === "cards") return `Sblocca ${req.count} Card`;
  if (req.type === "prestige") return `Attiva Prestigio ★${req.level}`;
  if (req.type === "streak") return `Streak Bounty ${req.days} giorni`;
  if (req.type === "edition") {
    return req.edition === "golden_hour"
      ? "1 Card Golden Hour (17:00–20:00)"
      : "1 Card Notturna (20:00–06:00)";
  }
  return `Segreto: ${req.eggTitle}`;
}

export function sanitizeSuperuserOverrides(raw: unknown): SuperuserOverrides {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SUPERUSER_OVERRIDES };
  }
  const obj = raw as Record<string, unknown>;
  const validCosmeticIds = new Set(COSMETICS_CATALOG.map((c) => c.id));
  const validTitleIds = new Set(PLAYER_TITLES.map((t) => t.id));

  const filterStrings = (arr: unknown, allowed: Set<string>): string[] =>
    Array.isArray(arr)
      ? Array.from(
          new Set(
            arr.filter(
              (v): v is string => typeof v === "string" && allowed.has(v),
            ),
          ),
        )
      : [];

  return {
    unlockedCosmetics: filterStrings(obj.unlockedCosmetics, validCosmeticIds),
    lockedCosmetics: filterStrings(obj.lockedCosmetics, validCosmeticIds),
    unlockedTitles: filterStrings(obj.unlockedTitles, validTitleIds),
    lockedTitles: filterStrings(obj.lockedTitles, validTitleIds),
  };
}
