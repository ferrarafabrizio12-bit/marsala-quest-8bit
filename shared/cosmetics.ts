export type AvatarGender = "male" | "female";
export type CosmeticSlot = "hat" | "glasses" | "top" | "bottom";

export interface AvatarConfig {
  gender: AvatarGender;
  hat: string;
  glasses: string;
  top: string;
  bottom: string;
}

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

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: "male",
  hat: "hat-cap-red",
  glasses: "glasses-none",
  top: "top-explorer",
  bottom: "bottom-jeans",
};

export const COSMETICS_CATALOG: CosmeticItem[] = [
  // ================= CAPPELLI (hat) =================
  {
    id: "hat-none",
    slot: "hat",
    name: "Testa Scoperta",
    description: "Nessun copricapo, capelli al vento.",
    previewColor: "#64748b",
    requirement: { type: "default" },
  },
  {
    id: "hat-cap-red",
    slot: "hat",
    name: "Cappellino Retro",
    description: "Il classico berretto da esploratore 8-bit.",
    previewColor: "#ff4d6d",
    requirement: { type: "default" },
  },
  {
    id: "hat-paglia",
    slot: "hat",
    name: "Paglia del Salinaro",
    description: "Cappello a tesa larga per il sole delle saline.",
    previewColor: "#eab308",
    requirement: { type: "cards", count: 5 },
  },
  {
    id: "hat-garibaldi",
    slot: "hat",
    name: "Kepi dei Mille",
    description: "Storico berretto garibaldino dello sbarco 1860.",
    previewColor: "#dc2626",
    requirement: {
      type: "easter_egg",
      eggId: "sbarco-1860",
      eggTitle: "Camicia Rossa 8-Bit",
    },
  },
  {
    id: "hat-woodhouse",
    slot: "hat",
    name: "Cilindro di Woodhouse",
    description: "Eleganza inglese del 1773 tra le botti di Marsala.",
    previewColor: "#1e293b",
    requirement: {
      type: "easter_egg",
      eggId: "woodhouse-1773",
      eggTitle: "Segreto di Woodhouse",
    },
  },
  {
    id: "hat-sibilla",
    slot: "hat",
    name: "Alloro della Sibilla",
    description: "Corona profetica di Capo Boeo.",
    previewColor: "#22c55e",
    requirement: {
      type: "easter_egg",
      eggId: "oracolo-sibilla",
      eggTitle: "Voce della Sibilla",
    },
  },
  {
    id: "hat-punico",
    slot: "hat",
    name: "Elmo Cartaginese",
    description: "Elmo con cresta rossa dei marinai della Nave Punica.",
    previewColor: "#d97706",
    requirement: {
      type: "easter_egg",
      eggId: "nave-punica",
      eggTitle: "Rotta di Cartagine",
    },
  },
  {
    id: "hat-corona-lilibeo",
    slot: "hat",
    name: "Corona Turrita d’Oro",
    description: "Emblema supremo per chi ha completato tutta Marsala.",
    previewColor: "#ffd166",
    requirement: { type: "cards", count: 20 },
  },

  // ================= OCCHIALI (glasses) =================
  {
    id: "glasses-none",
    slot: "glasses",
    name: "Nessun Occhiale",
    description: "Sguardo libero su Lilibeo.",
    previewColor: "#64748b",
    requirement: { type: "default" },
  },
  {
    id: "glasses-pixel",
    slot: "glasses",
    name: "Occhiali 8-Bit",
    description: "Montatura nera pixelata stile arcade.",
    previewColor: "#0f172a",
    requirement: { type: "cards", count: 1 },
  },
  {
    id: "glasses-gameboy",
    slot: "glasses",
    name: "Visore Game Boy ’89",
    description: "Lenti verde fosforo da vero retrogamer.",
    previewColor: "#84cc16",
    requirement: {
      type: "easter_egg",
      eggId: "konami-gameboy",
      eggTitle: "Nostalgico 1989",
    },
  },
  {
    id: "glasses-sunset",
    slot: "glasses",
    name: "Lenti Rosa Stagnone",
    description: "Riflettono i tramonti infuocati sulle saline.",
    previewColor: "#fb7185",
    requirement: {
      type: "easter_egg",
      eggId: "tramonto-stagnone",
      eggTitle: "Cacciatore di Tramonti",
    },
  },
  {
    id: "glasses-neon",
    slot: "glasses",
    name: "Visore Neon Arcade",
    description: "Lenti ciano fosforescenti per la notte di Lilibeo.",
    previewColor: "#22d3ee",
    requirement: {
      type: "easter_egg",
      eggId: "notte-lilibeo",
      eggTitle: "Notte di Lilibeo",
    },
  },
  {
    id: "glasses-holo",
    slot: "glasses",
    name: "Visore Olografico ★1",
    description: "Lenti prismatiche riservate ai veterani del New Game+.",
    previewColor: "#e879f9",
    requirement: { type: "prestige", level: 1 },
  },

  // ================= MAGLIE (top) =================
  {
    id: "top-explorer",
    slot: "top",
    name: "Maglia Azzurra",
    description: "Divisa base dell’esploratore marsalese.",
    previewColor: "#4cc9f0",
    requirement: { type: "default" },
  },
  {
    id: "top-sole",
    slot: "top",
    name: "T-Shirt Giallo Sole",
    description: "Perfetta per passeggiare sul Lungomare Boeo.",
    previewColor: "#facc15",
    requirement: { type: "default" },
  },
  {
    id: "top-garibaldi",
    slot: "top",
    name: "Camicia Rossa 1860",
    description: "Iconica giubba rossa con fazzoletto al collo.",
    previewColor: "#ef4444",
    requirement: {
      type: "easter_egg",
      eggId: "sbarco-1860",
      eggTitle: "Camicia Rossa 8-Bit",
    },
  },
  {
    id: "top-cantiniere",
    slot: "top",
    name: "Gilet del Cantiniere",
    description: "Camicia bianca e gilet bordeaux delle cantine storiche.",
    previewColor: "#881337",
    requirement: {
      type: "easter_egg",
      eggId: "woodhouse-1773",
      eggTitle: "Segreto di Woodhouse",
    },
  },
  {
    id: "top-kite",
    slot: "top",
    name: "Muta Maestrale",
    description: "Muta da kitesurf blu e verde fluo dello Stagnone.",
    previewColor: "#10b981",
    requirement: {
      type: "easter_egg",
      eggId: "vento-stagnone",
      eggTitle: "Maestro del Maestrale",
    },
  },
  {
    id: "top-cassaro",
    slot: "top",
    name: "Tunica del Cassaro",
    description: "Veste viola e oro del custode del Centro Storico.",
    previewColor: "#7c3aed",
    requirement: {
      type: "easter_egg",
      eggId: "custode-cassaro",
      eggTitle: "Custode del Cassaro",
    },
  },
  {
    id: "top-oro",
    slot: "top",
    name: "Giacca Oro Tramonto",
    description: "Riservata agli esploratori veterani di Marsala.",
    previewColor: "#f59e0b",
    requirement: { type: "cards", count: 15 },
  },
  {
    id: "top-prestige-cape",
    slot: "top",
    name: "Mantello Lilibeo ★1",
    description:
      "Manto reale con spallacci d’oro per chi ha completato Marsala.",
    previewColor: "#c026d3",
    requirement: { type: "prestige", level: 1 },
  },

  // ================= PANTALONI (bottom) =================
  {
    id: "bottom-jeans",
    slot: "bottom",
    name: "Jeans Classici",
    description: "Comodi per camminare da Capo Boeo a Birgi.",
    previewColor: "#1d4ed8",
    requirement: { type: "default" },
  },
  {
    id: "bottom-shorts",
    slot: "bottom",
    name: "Pantaloncini Mare",
    description: "Stile estivo da Lido Signorino.",
    previewColor: "#0ea5e9",
    requirement: { type: "default" },
  },
  {
    id: "bottom-cargo",
    slot: "bottom",
    name: "Cargo Esploratore",
    description: "Tasconi pronti per custodire le Card.",
    previewColor: "#65a30d",
    requirement: { type: "cards", count: 3 },
  },
  {
    id: "bottom-garibaldi",
    slot: "bottom",
    name: "Pantaloni dei Mille",
    description: "Grigio-azzurri con banda laterale storica.",
    previewColor: "#475569",
    requirement: { type: "cards", count: 8 },
  },
  {
    id: "bottom-punico",
    slot: "bottom",
    name: "Calzari Fenici",
    description: "Tunica corta e sandali degli antichi navigatori.",
    previewColor: "#b45309",
    requirement: { type: "cards", count: 12 },
  },
  {
    id: "bottom-oro",
    slot: "bottom",
    name: "Gambali d’Oro Lilibeo",
    description: "Armatura leggendaria del completamento 100%.",
    previewColor: "#ffd166",
    requirement: { type: "cards", count: 20 },
  },
];

export function isCosmeticUnlocked(
  item: CosmeticItem,
  unlockedCardsCount: number,
  easterEggs: string[],
  prestige = 0,
): boolean {
  const effectiveCards = prestige > 0 ? 20 : unlockedCardsCount;
  if (item.requirement.type === "default") return true;
  if (item.requirement.type === "cards")
    return effectiveCards >= item.requirement.count;
  if (item.requirement.type === "prestige")
    return prestige >= item.requirement.level;
  return easterEggs.includes(item.requirement.eggId);
}

export function getUnlockedCosmeticIds(
  unlockedCardsCount: number,
  easterEggs: string[],
  prestige = 0,
): string[] {
  return COSMETICS_CATALOG.filter((item) =>
    isCosmeticUnlocked(item, unlockedCardsCount, easterEggs, prestige),
  ).map((item) => item.id);
}

export function getRequirementLabel(req: CosmeticRequirement): string {
  if (req.type === "default") return "Disponibile subito";
  if (req.type === "cards") {
    return req.count === 1 ? "Sblocca 1 Card" : `Sblocca ${req.count} Card`;
  }
  if (req.type === "prestige") {
    return `Attiva Prestigio ★${req.level}`;
  }
  return `Segreto: ${req.eggTitle}`;
}

export function sanitizeAvatarConfig(raw: unknown): AvatarConfig {
  const input = (
    raw && typeof raw === "object" ? raw : {}
  ) as Partial<AvatarConfig>;
  const validForSlot = (
    slot: CosmeticSlot,
    id: unknown,
    fallback: string,
  ): string => {
    if (typeof id !== "string") return fallback;
    const exists = COSMETICS_CATALOG.some(
      (c) => c.slot === slot && c.id === id,
    );
    return exists ? id : fallback;
  };

  return {
    gender: input.gender === "female" ? "female" : "male",
    hat: validForSlot("hat", input.hat, DEFAULT_AVATAR.hat),
    glasses: validForSlot("glasses", input.glasses, DEFAULT_AVATAR.glasses),
    top: validForSlot("top", input.top, DEFAULT_AVATAR.top),
    bottom: validForSlot("bottom", input.bottom, DEFAULT_AVATAR.bottom),
  };
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
  },
): boolean {
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
