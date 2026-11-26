export type AvatarGender = "male" | "female";
export type CosmeticSlot = "hat" | "glasses" | "top" | "bottom";

export type SkinToneId = "light" | "medium" | "tan" | "deep";
export type HairColorId = "brown" | "black" | "blonde" | "red" | "gray";
export type HairStyleId = "short" | "spiky" | "curly" | "long" | "bald";
export type BeardStyleId = "none" | "stubble" | "goatee" | "mustache" | "full";

export const MAX_PRESTIGE = 5;
export const TOTAL_MARSALA_POIS = 20;

export interface SkinToneOption {
  id: SkinToneId;
  label: string;
  color: string;
  shade: string;
}

export interface HairColorOption {
  id: HairColorId;
  label: string;
  color: string;
  shade: string;
}

export interface HairStyleOption {
  id: HairStyleId;
  label: string;
}

export interface BeardStyleOption {
  id: BeardStyleId;
  label: string;
}

export const SKIN_TONES: SkinToneOption[] = [
  { id: "light", label: "Chiara", color: "#f6c29f", shade: "#dc9b72" },
  { id: "medium", label: "Mediterranea", color: "#e0a376", shade: "#be7d50" },
  { id: "tan", label: "Ambrata", color: "#b6784b", shade: "#8f5831" },
  { id: "deep", label: "Scura", color: "#6e4226", shade: "#4c2b16" },
];

export const HAIR_COLORS: HairColorOption[] = [
  { id: "brown", label: "Castano", color: "#5c3317", shade: "#3c1f0c" },
  { id: "black", label: "Nero", color: "#1f2430", shade: "#0d1017" },
  { id: "blonde", label: "Biondo", color: "#eab308", shade: "#b8860b" },
  { id: "red", label: "Rosso", color: "#c2410c", shade: "#9a3412" },
  { id: "gray", label: "Grigio", color: "#cbd5e1", shade: "#94a3b8" },
];

export const HAIR_STYLES: HairStyleOption[] = [
  { id: "short", label: "Corti" },
  { id: "spiky", label: "Ciuffo" },
  { id: "curly", label: "Ricci" },
  { id: "long", label: "Lunghi" },
  { id: "bald", label: "Rasati" },
];

export const BEARD_STYLES: BeardStyleOption[] = [
  { id: "none", label: "Nessuna" },
  { id: "stubble", label: "Corta" },
  { id: "goatee", label: "Pizzetto" },
  { id: "mustache", label: "Baffi" },
  { id: "full", label: "Folta" },
];

export interface AvatarConfig {
  gender: AvatarGender;
  skinTone: SkinToneId;
  hairColor: HairColorId;
  hairStyle: HairStyleId;
  beard: BeardStyleId;
  hat: string;
  glasses: string;
  top: string;
  bottom: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: "male",
  skinTone: "light",
  hairColor: "brown",
  hairStyle: "short",
  beard: "none",
  hat: "hat-cap-red",
  glasses: "glasses-none",
  top: "top-explorer",
  bottom: "bottom-jeans",
};

export type CosmeticRequirement =
  | { type: "default" }
  | { type: "cards"; count: number }
  | { type: "easter_egg"; eggId: string; eggTitle: string }
  | { type: "prestige"; level: number }
  | { type: "prestige_complete"; level: number }
  | { type: "superuser" };

export interface CosmeticItem {
  id: string;
  slot: CosmeticSlot;
  name: string;
  description: string;
  previewColor: string;
  requirement: CosmeticRequirement;
}

export const COSMETICS_CATALOG: CosmeticItem[] = [
  // --- CAPPELLI (8 pubblici + 1 esclusivo SU) ---
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
    description: "Il classico berretto rosso con visiera da esploratore 8-bit.",
    previewColor: "#ef4444",
    requirement: { type: "default" },
  },
  {
    id: "hat-straw",
    slot: "hat",
    name: "Cappello di Paglia",
    description: "Ampia tesa dorata con nastro rosso per il sole delle Saline.",
    previewColor: "#facc15",
    requirement: { type: "cards", count: 2 },
  },
  {
    id: "hat-sailor",
    slot: "hat",
    name: "Cappello da Marinaio",
    description: "Berretto bianco della marineria del Porto di Marsala.",
    previewColor: "#f8fafc",
    requirement: { type: "cards", count: 5 },
  },
  {
    id: "hat-beret-red",
    slot: "hat",
    name: "Berretto Garibaldino",
    description: "Storico copricapo dei Mille sbarcati l’11 Maggio 1860.",
    previewColor: "#dc2626",
    requirement: {
      type: "easter_egg",
      eggId: "sbarco-1860",
      eggTitle: "11 Maggio 1860",
    },
  },
  {
    id: "hat-punic-helm",
    slot: "hat",
    name: "Elmo Punico di Mozia",
    description:
      "Elmo in bronzo con cresta azzurra degli antichi navigatori fenici.",
    previewColor: "#d97706",
    requirement: {
      type: "easter_egg",
      eggId: "nave-punica",
      eggTitle: "Nave Punica 397 a.C.",
    },
  },
  {
    id: "hat-bandana-kite",
    slot: "hat",
    name: "Fascia Maestrale",
    description:
      "Bandana sportiva smeraldo per cavalcare il vento allo Stagnone.",
    previewColor: "#10b981",
    requirement: {
      type: "easter_egg",
      eggId: "vento-stagnone",
      eggTitle: "Vento dello Stagnone",
    },
  },
  {
    id: "hat-crown-gold",
    slot: "hat",
    name: "Corona di Lilibeo ★",
    description: "Corona d’oro con gemme riservata alle leggende Prestigio.",
    previewColor: "#ffd166",
    requirement: { type: "prestige", level: 1 },
  },
  {
    id: "hat-su-crown",
    slot: "hat",
    name: "Corona del Creatore ⚡",
    description:
      "Corona ossidiana e oro massiccio con gemma cremisi del fondatore.",
    previewColor: "#ff0054",
    requirement: { type: "superuser" },
  },

  // --- OCCHIALI & VISORI (7 pubblici + 1 esclusivo SU) ---
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
    requirement: { type: "cards", count: 1 },
  },
  {
    id: "glasses-aviator",
    slot: "glasses",
    name: "Occhiali Aviator Oro",
    description: "Lenti scure specchiate con ponte dorato per il lungomare.",
    previewColor: "#ca8a04",
    requirement: { type: "cards", count: 4 },
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
    description: "Visore ciano luminoso per le esplorazioni notturne.",
    previewColor: "#38bdf8",
    requirement: {
      type: "easter_egg",
      eggId: "notte-lilibeo",
      eggTitle: "Notte di Lilibeo",
    },
  },
  {
    id: "glasses-monocle",
    slot: "glasses",
    name: "Monocolo del Cantiniere",
    description: "Monocolo d’oro ottocentesco dei maestri del vino Marsala.",
    previewColor: "#eab308",
    requirement: {
      type: "easter_egg",
      eggId: "woodhouse-1773",
      eggTitle: "Cantina Woodhouse 1773",
    },
  },
  {
    id: "glasses-gameboy",
    slot: "glasses",
    name: "Visore Fosforo DMG-01",
    description: "Lenti verde matrice anni ’89.",
    previewColor: "#65a30d",
    requirement: {
      type: "easter_egg",
      eggId: "konami-gameboy",
      eggTitle: "Modalità Game Boy",
    },
  },
  {
    id: "glasses-su-matrix",
    slot: "glasses",
    name: "Visore Architetto ⚡",
    description: "Visore cibernetico cremisi-oro del Creatore Supremo.",
    previewColor: "#ff0054",
    requirement: { type: "superuser" },
  },

  // --- MAGLIE & GIUBBE (9 pubbliche incl. ★5 MAX + 1 esclusiva SU) ---
  {
    id: "top-explorer",
    slot: "top",
    name: "Giacca Esploratore",
    description: "Divisa blu cobalto ufficiale per mappare Marsala.",
    previewColor: "#2563eb",
    requirement: { type: "default" },
  },
  {
    id: "top-striped-sailor",
    slot: "top",
    name: "Maglia Marinara",
    description: "T-shirt a righe bianche e blu della costa marsalese.",
    previewColor: "#0284c7",
    requirement: { type: "default" },
  },
  {
    id: "top-linen-white",
    slot: "top",
    name: "Camicia di Lino Bianca",
    description: "Fresca camicia estiva per passeggiare lungo il Cassaro.",
    previewColor: "#f1f5f9",
    requirement: { type: "cards", count: 3 },
  },
  {
    id: "top-garibaldi",
    slot: "top",
    name: "Camicia Rossa 1860",
    description: "La leggendaria giubba dei Mille con bottoni dorati.",
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
    description: "Abito nobile viola con bordi dorati del centro storico.",
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
  {
    id: "top-imperatore-lilibeo",
    slot: "top",
    name: "Manto Imperiale ★5",
    description:
      "Veste leggendaria oro, cremisi e diamante per chi completa il Prestigio ★5.",
    previewColor: "#38bdf8",
    requirement: { type: "prestige_complete", level: MAX_PRESTIGE },
  },
  {
    id: "top-su-architect",
    slot: "top",
    name: "Mantello del Creatore ⚡",
    description:
      "Corazza ossidiana con mantello cremisi e sigillo fulmine del fondatore.",
    previewColor: "#ff0054",
    requirement: { type: "superuser" },
  },

  // --- PANTALONI & TUNICHE (7 pubblici + 1 esclusivo SU) ---
  {
    id: "bottom-jeans",
    slot: "bottom",
    name: "Jeans Classici",
    description: "Comodi per camminare dal porto fino alle saline.",
    previewColor: "#1d4ed8",
    requirement: { type: "default" },
  },
  {
    id: "bottom-shorts-sand",
    slot: "bottom",
    name: "Bermuda Sabbia",
    description: "Pantaloncini leggeri color sabbia per le giornate di sole.",
    previewColor: "#d6b88d",
    requirement: { type: "default" },
  },
  {
    id: "bottom-cargo",
    slot: "bottom",
    name: "Pantaloni Cargo Lilibeo",
    description: "Multitasche verde oliva per custodire le Trading Card.",
    previewColor: "#4d7c0f",
    requirement: { type: "cards", count: 6 },
  },
  {
    id: "bottom-punic",
    slot: "bottom",
    name: "Tunica Punica 397 a.C.",
    description:
      "Veste azzurra con fascia d’oro dei navigatori fenici di Mozia.",
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
    description: "Stoffa mistica viola dell’antro di Capo Boeo.",
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
  {
    id: "bottom-gold-greaves",
    slot: "bottom",
    name: "Gambali Regali ★",
    description: "Schinieri dorati riservati alle leggende Prestigio.",
    previewColor: "#f59e0b",
    requirement: { type: "prestige", level: 1 },
  },
  {
    id: "bottom-su-architect",
    slot: "bottom",
    name: "Gambali del Creatore ⚡",
    description:
      "Gambali ossidiana con finiture cremisi e oro massiccio del fondatore.",
    previewColor: "#ff0054",
    requirement: { type: "superuser" },
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

export function hasCompletedMaxPrestige(
  prestige: number,
  unlockedCardsCount: number,
): boolean {
  return prestige >= MAX_PRESTIGE && unlockedCardsCount >= TOTAL_MARSALA_POIS;
}

export function isCosmeticVisible(
  item: CosmeticItem,
  isSuperuser = false,
): boolean {
  if (item.requirement.type === "superuser") return isSuperuser;
  return true;
}

export function sanitizeAvatarConfig(raw: unknown): AvatarConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_AVATAR };
  }
  const obj = raw as Record<string, unknown>;
  const gender: AvatarGender = obj.gender === "female" ? "female" : "male";

  const skinTone: SkinToneId =
    typeof obj.skinTone === "string" &&
    SKIN_TONES.some((s) => s.id === obj.skinTone)
      ? (obj.skinTone as SkinToneId)
      : DEFAULT_AVATAR.skinTone;

  const hairColor: HairColorId =
    typeof obj.hairColor === "string" &&
    HAIR_COLORS.some((c) => c.id === obj.hairColor)
      ? (obj.hairColor as HairColorId)
      : DEFAULT_AVATAR.hairColor;

  const defaultStyleForGender: HairStyleId =
    gender === "female" ? "long" : "short";
  const hairStyle: HairStyleId =
    typeof obj.hairStyle === "string" &&
    HAIR_STYLES.some((h) => h.id === obj.hairStyle)
      ? (obj.hairStyle as HairStyleId)
      : defaultStyleForGender;

  const beard: BeardStyleId =
    gender === "male" &&
    typeof obj.beard === "string" &&
    BEARD_STYLES.some((b) => b.id === obj.beard)
      ? (obj.beard as BeardStyleId)
      : "none";

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
    gender,
    skinTone,
    hairColor,
    hairStyle,
    beard,
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
  if (req.type === "prestige_complete") {
    return `Completa 20/20 al Prestigio ★${req.level}`;
  }
  if (req.type === "superuser") return "Esclusiva Creatore Supremo ⚡";
  return `Segreto: ${req.eggTitle}`;
}

export function isCosmeticUnlocked(
  item: CosmeticItem,
  unlockedCardsCount: number,
  easterEggs: string[],
  prestige = 0,
  overrides?: SuperuserOverrides,
  isSuperuser = false,
): boolean {
  if (item.requirement.type === "superuser") {
    if (!isSuperuser) return false;
    if (overrides?.lockedCosmetics.includes(item.id)) return false;
    return true;
  }

  if (overrides?.lockedCosmetics.includes(item.id)) return false;
  if (overrides?.unlockedCosmetics.includes(item.id)) return true;

  const effectiveCards = prestige > 0 ? TOTAL_MARSALA_POIS : unlockedCardsCount;
  const req = item.requirement;
  if (req.type === "default") return true;
  if (req.type === "cards") return effectiveCards >= req.count;
  if (req.type === "prestige") return prestige >= req.level;
  if (req.type === "prestige_complete") {
    return prestige >= req.level && unlockedCardsCount >= TOTAL_MARSALA_POIS;
  }
  return easterEggs.includes(req.eggId);
}

export function getUnlockedCosmeticIds(
  unlockedCardsCount: number,
  easterEggs: string[],
  prestige = 0,
  overrides?: SuperuserOverrides,
  isSuperuser = false,
): string[] {
  return COSMETICS_CATALOG.filter((item) =>
    isCosmeticUnlocked(
      item,
      unlockedCardsCount,
      easterEggs,
      prestige,
      overrides,
      isSuperuser,
    ),
  ).map((item) => item.id);
}

export type TitleRequirement =
  | { type: "default" }
  | { type: "cards"; count: number }
  | { type: "easter_egg"; eggId: string; eggTitle: string }
  | { type: "streak"; days: number }
  | { type: "edition"; edition: "golden_hour" | "night" }
  | { type: "prestige"; level: number }
  | { type: "prestige_complete"; level: number }
  | { type: "superuser" };

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
  {
    id: "title-immortale",
    label: "Immortale di Lilibeo ★5",
    icon: "⚜️",
    description:
      "Completa al 100% (20/20) anche il livello massimo di Prestigio ★5.",
    requirement: { type: "prestige_complete", level: MAX_PRESTIGE },
  },
  {
    id: "title-creator-su",
    label: "Architetto di Lilibeo",
    icon: "⚡",
    description:
      "Titolo unico e riservato al Creatore Supremo di Marsala Quest 8-Bit.",
    requirement: { type: "superuser" },
  },
];

export function isTitleVisible(
  title: PlayerTitle,
  isSuperuser = false,
): boolean {
  if (title.requirement.type === "superuser") return isSuperuser;
  return true;
}

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
    isSuperuser?: boolean;
  },
): boolean {
  if (title.requirement.type === "superuser") {
    if (!ctx.isSuperuser) return false;
    if (ctx.overrides?.lockedTitles.includes(title.id)) return false;
    return true;
  }

  if (ctx.overrides?.lockedTitles.includes(title.id)) return false;
  if (ctx.overrides?.unlockedTitles.includes(title.id)) return true;

  const effectiveCards =
    ctx.prestige > 0 ? TOTAL_MARSALA_POIS : ctx.unlockedCardsCount;
  const req = title.requirement;
  if (req.type === "default") return true;
  if (req.type === "cards") return effectiveCards >= req.count;
  if (req.type === "prestige") return ctx.prestige >= req.level;
  if (req.type === "prestige_complete") {
    return (
      ctx.prestige >= req.level && ctx.unlockedCardsCount >= TOTAL_MARSALA_POIS
    );
  }
  if (req.type === "streak") return ctx.bountyStreak >= req.days;
  if (req.type === "edition") return ctx.editionsOwned.includes(req.edition);
  return ctx.easterEggs.includes(req.eggId);
}

export function getTitleRequirementLabel(req: TitleRequirement): string {
  if (req.type === "default") return "Disponibile subito";
  if (req.type === "cards") return `Sblocca ${req.count} Card`;
  if (req.type === "prestige") return `Attiva Prestigio ★${req.level}`;
  if (req.type === "prestige_complete") {
    return `Completa 20/20 al Prestigio ★${req.level}`;
  }
  if (req.type === "superuser") return "Esclusiva Creatore Supremo ⚡";
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
