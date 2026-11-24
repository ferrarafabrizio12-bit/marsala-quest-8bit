export type PoiCategory =
  | 'CENTRO_STORICO'
  | 'ARCHEOLOGIA'
  | 'CANTINE'
  | 'STAGNONE_NORD'
  | 'COSTA_SUD';

export interface PoiDefinition {
  id: string;
  name: string;
  zone: string;
  category: PoiCategory;
  rarity: 1 | 2 | 3;
  lat: number;
  lng: number;
  /** Raggio reale entro cui il GPS abilita lo scatto foto (metri) */
  unlockRadiusMeters: number;
  /** Raggio di mappa che si colora attorno al POI sbloccato (metri) */
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

export const MARSALA_CENTER: [number, number] = [37.7995, 12.434];

export const MARSALA_BOUNDS: [[number, number], [number, number]] = [
  [37.705, 12.375],
  [37.935, 12.565],
];

export const MARSALA_POIS: PoiDefinition[] = [
  // ================= CENTRO STORICO (7) =================
  {
    id: 'chiesa-madre',
    name: 'Chiesa Madre (Duomo)',
    zone: 'Piazza della Repubblica',
    category: 'CENTRO_STORICO',
    rarity: 3,
    lat: 37.79909,
    lng: 12.43432,
    unlockRadiusMeters: 100,
    fogRevealRadiusMeters: 750,
    xp: 200,
    icon: '⛪',
    shortDesc: 'Cattedrale dedicata a San Tommaso di Canterbury.',
    trivia: 'Unica chiesa madre in Sicilia intitolata al martire inglese Thomas Becket (1176).',
  },
  {
    id: 'porta-garibaldi',
    name: 'Porta Garibaldi',
    zone: 'Piazza Mercato / Via Garibaldi',
    category: 'CENTRO_STORICO',
    rarity: 2,
    lat: 37.79774,
    lng: 12.43335,
    unlockRadiusMeters: 90,
    fogRevealRadiusMeters: 650,
    xp: 160,
    icon: '🏛️',
    shortDesc: 'Antica Porta di Mare del 1685.',
    trivia: 'Varcata da Giuseppe Garibaldi con i Mille l’11 maggio 1860.',
  },
  {
    id: 'antico-mercato',
    name: 'Antico Mercato del Pesce',
    zone: 'Piazza Mercato',
    category: 'CENTRO_STORICO',
    rarity: 2,
    lat: 37.79802,
    lng: 12.43368,
    unlockRadiusMeters: 85,
    fogRevealRadiusMeters: 550,
    xp: 150,
    icon: '🐟',
    shortDesc: 'Loggia storica: mercato di giorno, movida di sera.',
    trivia: 'Subito dentro Porta Garibaldi, conserva la struttura ottocentesca a portici.',
  },
  {
    id: 'complesso-san-pietro',
    name: 'Complesso di San Pietro',
    zone: 'Via L. Anselmi Correale, 12',
    category: 'CENTRO_STORICO',
    rarity: 2,
    lat: 37.80039,
    lng: 12.43496,
    unlockRadiusMeters: 95,
    fogRevealRadiusMeters: 700,
    xp: 160,
    icon: '📜',
    shortDesc: 'Ex monastero benedettino e Museo Civico.',
    trivia: 'Ospita il Museo Garibaldino e chiostri cinquecenteschi nel cuore del centro.',
  },
  {
    id: 'porta-nuova',
    name: 'Porta Nuova',
    zone: 'Via XI Maggio, 6 / Piazza della Vittoria',
    category: 'CENTRO_STORICO',
    rarity: 2,
    lat: 37.80112,
    lng: 12.43218,
    unlockRadiusMeters: 95,
    fogRevealRadiusMeters: 650,
    xp: 160,
    icon: '⛩️',
    shortDesc: 'Storica porta occidentale verso Capo Boeo.',
    trivia: 'Riedificata nel 1790 lungo il tracciato dell’antico decumano di Lilibeo.',
  },
  {
    id: 'teatro-impero',
    name: 'Teatro Impero',
    zone: 'Viale Vittorio Veneto / Piazza della Vittoria',
    category: 'CENTRO_STORICO',
    rarity: 1,
    lat: 37.80176,
    lng: 12.43088,
    unlockRadiusMeters: 100,
    fogRevealRadiusMeters: 650,
    xp: 140,
    icon: '🎭',
    shortDesc: 'Storico teatro cittadino affacciato su Piazza della Vittoria.',
    trivia: 'Punto di riferimento culturale di Marsala inaugurato negli anni Trenta.',
  },
  {
    id: 'villa-cavallotti',
    name: 'Villa Cavallotti',
    zone: 'Viale Cesare Battisti',
    category: 'CENTRO_STORICO',
    rarity: 2,
    lat: 37.80318,
    lng: 12.43334,
    unlockRadiusMeters: 130,
    fogRevealRadiusMeters: 900,
    xp: 150,
    icon: '🌴',
    shortDesc: 'Giardino storico sul Bastione Velasco.',
    trivia: 'Sorge sopra le fortificazioni cinquecentesche spagnole volute da Carlo V.',
  },

  // ================= PORTO & CAPO BOEO (3) =================
  {
    id: 'monumento-mille',
    name: 'Monumento ai Mille',
    zone: 'Piazza Unità d’Italia / Via Col. Maltese',
    category: 'ARCHEOLOGIA',
    rarity: 3,
    lat: 37.79564,
    lng: 12.43130,
    unlockRadiusMeters: 120,
    fogRevealRadiusMeters: 1100,
    xp: 200,
    icon: '⚓',
    shortDesc: 'Monumento sullo sbarco garibaldino del 1860.',
    trivia: 'Rivolto al porto dove attraccarono i piroscafi Piemonte e Lombardo.',
  },
  {
    id: 'san-giovanni-boeo',
    name: 'San Giovanni al Boeo & Sibilla',
    zone: 'Parco Archeologico di Capo Boeo',
    category: 'ARCHEOLOGIA',
    rarity: 3,
    lat: 37.80071,
    lng: 12.42828,
    unlockRadiusMeters: 120,
    fogRevealRadiusMeters: 1000,
    xp: 220,
    icon: '🏺',
    shortDesc: 'Chiesa sopra la leggendaria Grotta della Sibilla.',
    trivia: 'Nel sottosuolo sgorga la fonte pagana della Sibilla Lilibetana.',
  },
  {
    id: 'baglio-anselmi',
    name: 'Museo Baglio Anselmi',
    zone: 'Lungomare Boeo, 30',
    category: 'ARCHEOLOGIA',
    rarity: 3,
    lat: 37.80140,
    lng: 12.42670,
    unlockRadiusMeters: 130,
    fogRevealRadiusMeters: 1200,
    xp: 240,
    icon: '⛵',
    shortDesc: 'Casa della leggendaria Nave Punica del III sec. a.C.',
    trivia: 'Custodisce l’unica nave da guerra cartaginese arrivata fino a noi.',
  },

  // ================= CANTINE STORICHE (3) =================
  {
    id: 'cantine-florio',
    name: 'Cantine Florio',
    zone: 'Via Vincenzo Florio, 1',
    category: 'CANTINE',
    rarity: 3,
    lat: 37.78640,
    lng: 12.44519,
    unlockRadiusMeters: 150,
    fogRevealRadiusMeters: 1500,
    xp: 200,
    icon: '🍷',
    shortDesc: 'Bottaie monumentali fondate nel 1833.',
    trivia: 'Le bottaie lunghe 165 metri respirano l’aria salmastra del mare vicino.',
  },
  {
    id: 'cantine-donnafugata',
    name: 'Cantine Donnafugata',
    zone: 'Via Sebastiano Lipari, 18',
    category: 'CANTINE',
    rarity: 2,
    lat: 37.78806,
    lng: 12.44666,
    unlockRadiusMeters: 140,
    fogRevealRadiusMeters: 1300,
    xp: 180,
    icon: '🍾',
    shortDesc: 'Storiche cantine della famiglia Rallo.',
    trivia: 'Il nome omaggia Il Gattopardo di Giuseppe Tomasi di Lampedusa.',
  },
  {
    id: 'cantine-pellegrino',
    name: 'Cantine Pellegrino 1880',
    zone: 'Via del Fante, 39',
    category: 'CANTINE',
    rarity: 2,
    lat: 37.80696,
    lng: 12.43946,
    unlockRadiusMeters: 150,
    fogRevealRadiusMeters: 1500,
    xp: 180,
    icon: '🍇',
    shortDesc: 'Cantina storica marsalese fondata nel 1880.',
    trivia: 'Oltre alle botti storiche ospita una collezione di carretti siciliani.',
  },

  // ================= STAGNONE & ZONA NORD (5) =================
  {
    id: 'saline-genna',
    name: 'Saline Genna',
    zone: 'Contrada Dammusello, 628',
    category: 'STAGNONE_NORD',
    rarity: 2,
    lat: 37.83300,
    lng: 12.46150,
    unlockRadiusMeters: 220,
    fogRevealRadiusMeters: 2200,
    xp: 210,
    icon: '🌅',
    shortDesc: 'Vasche di sale e tramonti infuocati sullo Stagnone.',
    trivia: 'Uno dei punti più fotografati della costa occidentale siciliana.',
  },
  {
    id: 'imbarcadero-mozia',
    name: 'Imbarcadero Storico Mozia',
    zone: 'Contrada Spagnola',
    category: 'STAGNONE_NORD',
    rarity: 2,
    lat: 37.85647,
    lng: 12.47776,
    unlockRadiusMeters: 180,
    fogRevealRadiusMeters: 2400,
    xp: 210,
    icon: '🚤',
    shortDesc: 'Molo storico verso l’Isola di San Pantaleo.',
    trivia: 'Da qui salpano le barche a fondo piatto che attraversano la laguna bassa.',
  },
  {
    id: 'mulino-infersa',
    name: 'Saline Ettore e Infersa',
    zone: 'Contrada Ettore Infersa',
    category: 'STAGNONE_NORD',
    rarity: 3,
    lat: 37.86237,
    lng: 12.48495,
    unlockRadiusMeters: 200,
    fogRevealRadiusMeters: 2800,
    xp: 250,
    icon: '🌬️',
    shortDesc: 'Iconico mulino a vento del XVI secolo tra le saline.',
    trivia: 'Le sue pale macinavano il sale marino raccolto a mano nello Stagnone.',
  },
  {
    id: 'isola-mozia',
    name: 'Isola di Mozia (Museo Whitaker)',
    zone: 'Isola di San Pantaleo • Stagnone',
    category: 'STAGNONE_NORD',
    rarity: 3,
    lat: 37.86644,
    lng: 12.46815,
    unlockRadiusMeters: 300,
    fogRevealRadiusMeters: 3000,
    xp: 300,
    icon: '🗿',
    shortDesc: 'Antica città fenicia e casa del Giovane di Mozia.',
    trivia: 'Fondata dai Fenici nell’VIII sec. a.C.: i suoi esuli fondarono poi Lilibeo.',
  },
  {
    id: 'torre-san-teodoro',
    name: 'Torre & Tonnara di San Teodoro',
    zone: 'Birgi / Estremo Nord Marsala',
    category: 'STAGNONE_NORD',
    rarity: 3,
    lat: 37.90126,
    lng: 12.46558,
    unlockRadiusMeters: 240,
    fogRevealRadiusMeters: 3800,
    xp: 250,
    icon: '🏰',
    shortDesc: 'Antica tonnara e ingresso nord alla laguna.',
    trivia: 'Con la bassa marea si può guadare a piedi fino all’Isola Lunga.',
  },

  // ================= COSTA SUD & ENTROTERRA (2) =================
  {
    id: 'lido-signorino',
    name: 'Lido Signorino',
    zone: 'Contrada Fossarunza, 297',
    category: 'COSTA_SUD',
    rarity: 2,
    lat: 37.73720,
    lng: 12.47200,
    unlockRadiusMeters: 250,
    fogRevealRadiusMeters: 3800,
    xp: 200,
    icon: '🏖️',
    shortDesc: 'Spiagge dorate e mare cristallino del versante sud.',
    trivia: 'Cuore dell’estate marsalese lungo il litorale meridionale.',
  },
  {
    id: 'strasatti',
    name: 'Strasatti & Terre del Grillo',
    zone: 'Contrada Strasatti',
    category: 'COSTA_SUD',
    rarity: 2,
    lat: 37.72583,
    lng: 12.51500,
    unlockRadiusMeters: 280,
    fogRevealRadiusMeters: 4200,
    xp: 200,
    icon: '🌿',
    shortDesc: 'Storica borgata agricola tra bagli e vigneti.',
    trivia: 'Marsala è uno dei comuni più estesi e vitati dell’intera Italia.',
  },
];

export const EASTER_EGGS: EasterEggDefinition[] = [
  {
    id: 'konami-gameboy',
    title: 'Nostalgico 1989',
    hint: 'Codice leggendario su tastiera (↑↑↓↓←→←→BA) oppure tocca 7 volte il logo/titolo.',
    description: 'Modalità monocromatica Game Boy originale attivata!',
    xp: 150,
    badge: '🕹️',
  },
  {
    id: 'sbarco-1860',
    title: 'Camicia Rossa 8-Bit',
    hint: 'Digita l’anno dello sbarco nella barra ricerca della Marsala-Dex.',
    description: '11 Maggio 1860: Piemonte e Lombardo solcano il mare di Marsala!',
    xp: 150,
    badge: '🚢',
  },
  {
    id: 'woodhouse-1773',
    title: 'Segreto di Woodhouse',
    hint: 'Sincronizza tutte e 3 le Cantine Storiche di Marsala.',
    description: 'Hai riscoperto la ricetta del leggendario Marsala Superiore 1773!',
    xp: 250,
    badge: '🥂',
  },
  {
    id: 'tramonto-stagnone',
    title: 'Cacciatore di Tramonti',
    hint: 'Gioca al tramonto (18:00–20:30) oppure tocca 3 volte l’icona del sole 🌅.',
    description: 'Palette Tramonto Rosa dello Stagnone sbloccata!',
    xp: 100,
    badge: '🌇',
  },
  {
    id: 'oracolo-sibilla',
    title: 'Voce della Sibilla',
    hint: 'Tocca 5 volte il badge GPS nell’HUD mentre il segnale è agganciato.',
    description: 'La Sibilla Lilibetana ha pronunciato la sua profezia per te.',
    xp: 200,
    badge: '🔮',
  },
  {
    id: 'nave-punica',
    title: 'Rotta di Cartagine',
    hint: 'Digita l’anno di fondazione di Lilibeo (o il suo nome antico) nella Marsala-Dex.',
    description: '397 a.C.: la leggendaria Nave Punica torna a solcare le acque di Capo Boeo!',
    xp: 150,
    badge: '⛵',
  },
  {
    id: 'vento-stagnone',
    title: 'Maestro del Maestrale',
    hint: 'Tocca 5 volte il tasto mappa intera 🗺️ sulla destra.',
    description: 'Il vento dello Stagnone gonfia gli aquiloni da kitesurf sopra la laguna!',
    xp: 150,
    badge: '🪁',
  },
  {
    id: 'notte-lilibeo',
    title: 'Notte di Lilibeo',
    hint: 'Esplora tra le 22:00 e le 05:00 oppure tocca 4 volte la barra di progresso.',
    description: 'Palette Notte Neon Arcade attivata sulla mappa di Marsala!',
    xp: 120,
    badge: '🌙',
  },
  {
    id: 'custode-cassaro',
    title: 'Custode del Cassaro',
    hint: 'Sblocca tutti e 7 i punti di interesse del Centro Storico di Marsala.',
    description: 'Hai illuminato ogni pietra dell’antico cuore storico di Marsala!',
    xp: 300,
    badge: '🏛️',
  },
];

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
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

/** Restituisce la data corrente in Italia nel formato YYYY-MM-DD */
export function getItalyDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Seleziona in modo deterministico lo stesso POI del giorno per tutti i giocatori */
export function getDailyBountyPoiId(dateStr: string = getItalyDateString()): string {
  let hash = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    hash ^= dateStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % MARSALA_POIS.length;
  return MARSALA_POIS[index].id;
}

/** In Modalità Prestigio il raggio GPS richiesto diventa più impegnativo */
export function getEffectiveUnlockRadius(poi: PoiDefinition, prestige: number): number {
  if (prestige <= 0) return poi.unlockRadiusMeters;
  return Math.max(35, Math.round(poi.unlockRadiusMeters * 0.45));
}