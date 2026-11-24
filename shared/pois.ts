export type PoiCategory =
  | "CENTRO_STORICO"
  | "ARCHEOLOGIA"
  | "CANTINE"
  | "STAGNONE_NORD"
  | "COSTA_SUD";

export interface PoiDefinition {
  id: string;
  name: string;
  zone: string;
  category: PoiCategory;
  rarity?: 1 | 2 | 3;
  lat: number;
  lng: number;
  /** Raggio reale entro cui il GPS consente lo scatto foto (metri) */
  unlockRadiusMeters: number;
  /** Raggio di mappa colorata sbloccata in stile Assassin's Creed (metri) */
  fogRevealRadiusMeters: number;
  xp: number;
  icon: string;
  shortDesc: string;
  trivia: string;
}

export interface EasterEggDefinition {
  id: string;
  title: string;
  hint: string;
  description: string;
  xp: number;
  badge: string;
}

export const MARSALA_CENTER: [number, number] = [37.805, 12.448];

export const MARSALA_BOUNDS: [[number, number], [number, number]] = [
  [37.715, 12.375], // Sud-Ovest
  [37.935, 12.565], // Nord-Est
];

export const MARSALA_POIS: PoiDefinition[] = [
  // --- CENTRO STORICO ---
  {
    id: "chiesa-madre",
    name: "Chiesa Madre (Duomo)",
    zone: "Piazza della Repubblica",
    category: "CENTRO_STORICO",
    lat: 37.7982,
    lng: 12.4375,
    unlockRadiusMeters: 120,
    fogRevealRadiusMeters: 1700,
    xp: 200,
    icon: "⛪",
    shortDesc: "Cattedrale dedicata a San Tommaso di Canterbury.",
    trivia:
      "Unica chiesa madre in Sicilia dedicata al martire inglese Thomas Becket (1176).",
  },
  {
    id: "porta-garibaldi",
    name: "Porta Garibaldi",
    zone: "Via Garibaldi",
    category: "CENTRO_STORICO",
    lat: 37.7955,
    lng: 12.4366,
    unlockRadiusMeters: 110,
    fogRevealRadiusMeters: 1500,
    xp: 150,
    icon: "🏛️",
    shortDesc: "Antica Porta di Mare del 1685.",
    trivia: "Da qui entrò Giuseppe Garibaldi con i Mille l’11 maggio 1860.",
  },
  {
    id: "porta-nuova",
    name: "Porta Nuova",
    zone: "Piazza della Vittoria",
    category: "CENTRO_STORICO",
    lat: 37.8012,
    lng: 12.4342,
    unlockRadiusMeters: 110,
    fogRevealRadiusMeters: 1600,
    xp: 150,
    icon: "⛩️",
    shortDesc: "Ingresso storico verso Capo Boeo.",
    trivia:
      "Riedificata nel 1790, segna l’antico asse viario decumano verso il mare.",
  },
  {
    id: "antico-mercato",
    name: "Antico Mercato del Pesce",
    zone: "Piazza Matteotti",
    category: "CENTRO_STORICO",
    lat: 37.7966,
    lng: 12.4369,
    unlockRadiusMeters: 100,
    fogRevealRadiusMeters: 1400,
    xp: 140,
    icon: "🐟",
    shortDesc: "Cuore popolare di giorno, movida di sera.",
    trivia:
      "Un tempo loggia ittica ottocentesca, oggi simbolo della vita cittadina.",
  },
  {
    id: "complesso-san-pietro",
    name: "Complesso di San Pietro",
    zone: "Via L. Anselmi Correale",
    category: "CENTRO_STORICO",
    lat: 37.7995,
    lng: 12.4397,
    unlockRadiusMeters: 110,
    fogRevealRadiusMeters: 1500,
    xp: 150,
    icon: "📜",
    shortDesc: "Ex monastero benedettino e museo civico.",
    trivia:
      "Custodisce il Museo Garibaldino e splendidi chiostri cinquecenteschi.",
  },
  {
    id: "villa-cavallotti",
    name: "Villa Cavallotti",
    zone: "Viale Isonzo / Bastione Velasco",
    category: "CENTRO_STORICO",
    lat: 37.8007,
    lng: 12.4418,
    unlockRadiusMeters: 140,
    fogRevealRadiusMeters: 1900,
    xp: 140,
    icon: "🌴",
    shortDesc: "Giardino storico sul bastione spagnolo.",
    trivia:
      "Costruita sopra le fortificazioni cinquecentesche volute da Carlo V.",
  },
  {
    id: "santuario-cava",
    name: "Santuario Madonna della Cava",
    zone: "Via XIX Luglio",
    category: "CENTRO_STORICO",
    lat: 37.7977,
    lng: 12.4478,
    unlockRadiusMeters: 130,
    fogRevealRadiusMeters: 2300,
    xp: 170,
    icon: "🕯️",
    shortDesc: "Chiesa ipogea della Patrona di Marsala.",
    trivia:
      "Il simulacro della Madonna fu ritrovato nel 1518 dentro una grotta tufacea.",
  },

  // --- ARCHEOLOGIA & PORTO ---
  {
    id: "monumento-mille",
    name: "Monumento ai Mille",
    zone: "Lungomare Boeo / Porto",
    category: "ARCHEOLOGIA",
    lat: 37.7916,
    lng: 12.4344,
    unlockRadiusMeters: 150,
    fogRevealRadiusMeters: 2200,
    xp: 200,
    icon: "⚓",
    shortDesc: "Monumento sullo sbarco del 1860.",
    trivia:
      "Affacciato sul porto dove approdarono i piroscafi Piemonte e Lombardo.",
  },
  {
    id: "baglio-anselmi",
    name: "Museo Baglio Anselmi",
    zone: "Lungomare Boeo 30",
    category: "ARCHEOLOGIA",
    lat: 37.8015,
    lng: 12.4268,
    unlockRadiusMeters: 160,
    fogRevealRadiusMeters: 2400,
    xp: 220,
    icon: "⛵",
    shortDesc: "Casa della leggendaria Nave Punica.",
    trivia:
      "Ospita l’unica nave da guerra cartaginese del III sec. a.C. giunta fino a noi.",
  },
  {
    id: "capo-boeo",
    name: "Parco di Lilibeo & Capo Boeo",
    zone: "Punta estrema occidentale",
    category: "ARCHEOLOGIA",
    lat: 37.8034,
    lng: 12.4293,
    unlockRadiusMeters: 180,
    fogRevealRadiusMeters: 2600,
    xp: 220,
    icon: "🏺",
    shortDesc: "Antica Lilybaeum e Grotta della Sibilla.",
    trivia:
      "È il punto più occidentale della Sicilia: qui i Fenici fondarono Lilibeo nel 397 a.C.",
  },

  // --- CANTINE STORICHE ---
  {
    id: "cantine-florio",
    name: "Cantine Florio",
    zone: "Via Vincenzo Florio",
    category: "CANTINE",
    lat: 37.7862,
    lng: 12.447,
    unlockRadiusMeters: 170,
    fogRevealRadiusMeters: 2500,
    xp: 190,
    icon: "🍷",
    shortDesc: "Bottaie monumentali fondate nel 1833.",
    trivia:
      "Le bottaie lunghe 165 metri respirano l’aria salmastra del mare a pochi passi.",
  },
  {
    id: "cantine-pellegrino",
    name: "Cantine Pellegrino",
    zone: "Lungomare Battaglia delle Egadi",
    category: "CANTINE",
    lat: 37.7928,
    lng: 12.442,
    unlockRadiusMeters: 150,
    fogRevealRadiusMeters: 1900,
    xp: 170,
    icon: "🍇",
    shortDesc: "Storica cantina marsalese dal 1880.",
    trivia:
      "Custodisce anche un prezioso museo di carretti siciliani e reperti punici.",
  },
  {
    id: "cantine-donnafugata",
    name: "Cantine Donnafugata",
    zone: "Via Sebastiano Lipari",
    category: "CANTINE",
    lat: 37.794,
    lng: 12.4494,
    unlockRadiusMeters: 160,
    fogRevealRadiusMeters: 2200,
    xp: 170,
    icon: "🍾",
    shortDesc: "Eccellenza vitivinicola siciliana.",
    trivia: "Il nome richiama il romanzo Il Gattopardo di Tomasi di Lampedusa.",
  },

  // --- STAGNONE & ZONA NORD ---
  {
    id: "saline-genna",
    name: "Saline Genna",
    zone: "Lungomare dello Stagnone",
    category: "STAGNONE_NORD",
    lat: 37.8403,
    lng: 12.4658,
    unlockRadiusMeters: 200,
    fogRevealRadiusMeters: 3400,
    xp: 210,
    icon: "🌅",
    shortDesc: "Vasche di sale e tramonti infuocati.",
    trivia:
      "Lo specchio d’acqua riflette le Isole Egadi tingendosi di rosa e oro al tramonto.",
  },
  {
    id: "mulino-infersa",
    name: "Saline Ettore e Infersa",
    zone: "Contrada Ettore Infersa / Imbarcadero Mozia",
    category: "STAGNONE_NORD",
    lat: 37.8755,
    lng: 12.4733,
    unlockRadiusMeters: 250,
    fogRevealRadiusMeters: 4200,
    xp: 250,
    icon: "🌬️",
    shortDesc: "Mulino a vento del XVI sec. davanti a Mozia.",
    trivia:
      "Le sue pale macinavano il sale marino raccolto a mano nella Riserva dello Stagnone.",
  },
  {
    id: "torre-san-teodoro",
    name: "Torre & Laguna di San Teodoro",
    zone: "Birgi / Estremo Nord Marsala",
    category: "STAGNONE_NORD",
    lat: 37.9042,
    lng: 12.4655,
    unlockRadiusMeters: 260,
    fogRevealRadiusMeters: 4500,
    xp: 240,
    icon: "🏰",
    shortDesc: "Torre costiera e ingresso nord allo Stagnone.",
    trivia:
      "Con la bassa marea si può camminare su una lingua di sabbia verso l’Isola Lunga.",
  },

  // --- COSTA SUD & ENTROTERRA ---
  {
    id: "lido-signorino",
    name: "Lido Signorino & Costa Sud",
    zone: "Lungomare Sud Marsala",
    category: "COSTA_SUD",
    lat: 37.7568,
    lng: 12.4735,
    unlockRadiusMeters: 260,
    fogRevealRadiusMeters: 4600,
    xp: 200,
    icon: "🏖️",
    shortDesc: "Le spiagge dorate del versante meridionale.",
    trivia:
      "Famosa per i fondali bassi e cristallini amati da generazioni di marsalesi.",
  },
  {
    id: "strasatti-vigneti",
    name: "Contrada Strasatti & Vigneti",
    zone: "Entroterra Marsalese",
    category: "COSTA_SUD",
    lat: 37.7622,
    lng: 12.518,
    unlockRadiusMeters: 300,
    fogRevealRadiusMeters: 5200,
    xp: 200,
    icon: "🌿",
    shortDesc: "Cuore agricolo tra bagli e vigneti di Grillo.",
    trivia:
      "Il territorio comunale di Marsala è uno dei più estesi e vitati d’Italia.",
  },
];

export const EASTER_EGGS: EasterEggDefinition[] = [
  {
    id: "konami-gameboy",
    title: "Nostalgico 1989",
    hint: "Codice leggendario su tastiera (↑↑↓↓←→←→BA) oppure tocca 7 volte il logo/titolo.",
    description: "Modalità monocromatica Game Boy originale attivata!",
    xp: 150,
    badge: "🕹️",
  },
  {
    id: "sbarco-1860",
    title: "Camicia Rossa 8-Bit",
    hint: "Digita l’anno dello sbarco nella barra ricerca della Marsala-Dex.",
    description:
      "11 Maggio 1860: Piemonte e Lombardo solcano il mare di Marsala!",
    xp: 150,
    badge: "🚢",
  },
  {
    id: "woodhouse-1773",
    title: "Segreto di Woodhouse",
    hint: "Sincronizza tutte e 3 le Cantine Storiche di Marsala.",
    description:
      "Hai riscoperto la ricetta del leggendario Marsala Superiore 1773!",
    xp: 250,
    badge: "🥂",
  },
  {
    id: "tramonto-stagnone",
    title: "Cacciatore di Tramonti",
    hint: "Gioca al tramonto (18:00–20:30) oppure tocca 3 volte l’icona del sole 🌅.",
    description: "Palette Tramonto Rosa dello Stagnone sbloccata!",
    xp: 100,
    badge: "🌇",
  },
  {
    id: "oracolo-sibilla",
    title: "Voce della Sibilla",
    hint: "Tocca 5 volte il badge GPS nell’HUD mentre il segnale è agganciato.",
    description: "La Sibilla Lilibetana ha pronunciato la sua profezia per te.",
    xp: 200,
    badge: "🔮",
  },
  {
    id: "nave-punica",
    title: "Rotta di Cartagine",
    hint: "Digita l’anno di fondazione di Lilibeo (o il suo nome antico) nella Marsala-Dex.",
    description:
      "397 a.C.: la leggendaria Nave Punica torna a solcare le acque di Capo Boeo!",
    xp: 150,
    badge: "⛵",
  },
  {
    id: "vento-stagnone",
    title: "Maestro del Maestrale",
    hint: "Tocca 5 volte il tasto mappa intera 🗺️ sulla destra.",
    description:
      "Il vento dello Stagnone gonfia gli aquiloni da kitesurf sopra la laguna!",
    xp: 150,
    badge: "🪁",
  },
  {
    id: "notte-lilibeo",
    title: "Notte di Lilibeo",
    hint: "Esplora tra le 22:00 e le 05:00 oppure tocca 4 volte la barra di progresso.",
    description: "Palette Notte Neon Arcade attivata sulla mappa di Marsala!",
    xp: 120,
    badge: "🌙",
  },
  {
    id: "custode-cassaro",
    title: "Custode del Cassaro",
    hint: "Sblocca tutti e 7 i punti di interesse del Centro Storico di Marsala.",
    description:
      "Hai illuminato ogni pietra dell’antico cuore storico di Marsala!",
    xp: 300,
    badge: "🏛️",
  },
];

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
