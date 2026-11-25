import {
  type AvatarConfig,
  sanitizeAvatarConfig,
} from "../../shared/cosmetics";

const COLS = 16;
const ROWS = 20;

const SKIN = "#f6c29f";
const SKIN_SHADE = "#dc9b72";
const HAIR_MALE = "#4a2c18";
const HAIR_FEMALE = "#6b3410";
const EYE = "#0f172a";
const BOOT = "#1e293b";
const BOOT_SOLE = "#090d16";

export function buildAvatarPixelGrid(
  rawAvatar: AvatarConfig,
): (string | null)[][] {
  const avatar = sanitizeAvatarConfig(rawAvatar);
  const grid: (string | null)[][] = Array.from({ length: ROWS }, () =>
    Array<string | null>(COLS).fill(null),
  );

  const setPx = (x: number, y: number, color: string) => {
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      grid[y][x] = color;
    }
  };

  const fillRect = (
    x0: number,
    y0: number,
    w: number,
    h: number,
    color: string,
  ) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        setPx(x, y, color);
      }
    }
  };

  const isFemale = avatar.gender === "female";
  const hairColor = isFemale ? HAIR_FEMALE : HAIR_MALE;

  // 1. TESTA & CAPELLI BASE
  fillRect(5, 4, 6, 5, SKIN);
  fillRect(5, 8, 6, 1, SKIN_SHADE); // mento
  setPx(6, 6, EYE);
  setPx(9, 6, EYE);

  // Capelli laterali / lunghi
  setPx(4, 5, hairColor);
  setPx(11, 5, hairColor);
  if (isFemale) {
    fillRect(3, 5, 2, 6, hairColor);
    fillRect(11, 5, 2, 6, hairColor);
  } else {
    setPx(4, 6, hairColor);
    setPx(11, 6, hairColor);
  }

  // 2. CAPPELLI (righe 0..4)
  switch (avatar.hat) {
    case "hat-cap-red": {
      fillRect(5, 1, 6, 1, "#ef4444");
      fillRect(4, 2, 8, 2, "#ef4444");
      fillRect(7, 2, 2, 1, "#ffffff"); // stemma bianco
      fillRect(4, 4, 10, 1, "#b91c1c"); // visiera sporgente a destra
      break;
    }
    case "hat-straw": {
      fillRect(5, 1, 6, 2, "#fde047");
      fillRect(5, 3, 6, 1, "#dc2626"); // nastro rosso
      fillRect(2, 4, 12, 1, "#eab308"); // tesa larga di paglia
      break;
    }
    case "hat-sailor": {
      fillRect(4, 1, 8, 2, "#f8fafc");
      fillRect(7, 2, 2, 1, "#facc15"); // ancora oro
      fillRect(4, 3, 8, 1, "#1e3a8a"); // fascia blu marina
      fillRect(4, 4, 9, 1, "#0f172a"); // visiera scura
      break;
    }
    case "hat-beret-red": {
      fillRect(4, 1, 8, 1, "#dc2626");
      fillRect(3, 2, 9, 2, "#b91c1c");
      setPx(5, 2, "#ffd166"); // fregio garibaldino
      fillRect(4, 4, 8, 1, "#7f1d1d");
      break;
    }
    case "hat-punic-helm": {
      fillRect(6, 0, 4, 1, "#38bdf8"); // cresta fenicia
      fillRect(5, 1, 6, 1, "#0284c7");
      fillRect(4, 2, 8, 2, "#d97706"); // calotta bronzo
      fillRect(4, 4, 8, 1, "#b45309");
      setPx(4, 5, "#b45309"); // paraguance
      setPx(11, 5, "#b45309");
      break;
    }
    case "hat-bandana-kite": {
      fillRect(5, 2, 6, 2, hairColor);
      fillRect(4, 4, 8, 1, "#10b981"); // fascia smeraldo
      setPx(2, 4, "#34d399"); // nodo svolazzante
      setPx(3, 5, "#059669");
      break;
    }
    case "hat-crown-gold": {
      setPx(4, 1, "#ffd166");
      fillRect(7, 1, 2, 1, "#ffd166");
      setPx(11, 1, "#ffd166");
      fillRect(4, 2, 8, 2, "#f59e0b");
      setPx(6, 2, "#ef4444"); // rubino
      setPx(9, 2, "#38bdf8"); // zaffiro
      fillRect(4, 4, 8, 1, "#b45309");
      break;
    }
    case "hat-none":
    default: {
      fillRect(5, 2, 6, 2, hairColor);
      fillRect(4, 3, 8, 1, hairColor);
      setPx(6, 4, hairColor);
      setPx(9, 4, hairColor);
      break;
    }
  }

  // 3. OCCHIALI & VISORI (righe 6..7)
  switch (avatar.glasses) {
    case "glasses-pixel": {
      fillRect(5, 6, 3, 2, "#090d16");
      fillRect(8, 6, 3, 2, "#090d16");
      setPx(5, 6, "#94a3b8");
      setPx(8, 6, "#94a3b8");
      break;
    }
    case "glasses-aviator": {
      fillRect(5, 6, 3, 2, "#1e293b");
      fillRect(8, 6, 3, 2, "#1e293b");
      setPx(7, 6, "#facc15"); // ponte oro
      setPx(8, 6, "#facc15");
      break;
    }
    case "glasses-sunset": {
      fillRect(5, 6, 3, 2, "#f97316");
      fillRect(8, 6, 3, 2, "#fb923c");
      setPx(7, 6, "#ffd166");
      setPx(8, 6, "#ffd166");
      break;
    }
    case "glasses-neon": {
      fillRect(4, 6, 8, 2, "#22d3ee");
      fillRect(5, 6, 6, 1, "#cffafe");
      break;
    }
    case "glasses-monocle": {
      fillRect(8, 6, 3, 2, "#fef08a");
      setPx(9, 6, EYE);
      setPx(11, 7, "#eab308"); // catenella oro
      setPx(11, 8, "#eab308");
      setPx(11, 9, "#eab308");
      break;
    }
    case "glasses-gameboy": {
      fillRect(5, 6, 3, 2, "#365314");
      fillRect(8, 6, 3, 2, "#365314");
      setPx(6, 6, "#a3e635");
      setPx(9, 6, "#a3e635");
      break;
    }
    case "glasses-none":
    default:
      break;
  }

  // 4. COLLO (riga 9)
  fillRect(6, 9, 4, 1, SKIN_SHADE);

  // 5. MAGLIE, GIUBBE & ARMATURE (righe 10..14)
  let sleeveColor = "#2563eb";
  switch (avatar.top) {
    case "top-striped-sailor": {
      sleeveColor = "#f8fafc";
      fillRect(4, 10, 8, 5, "#f8fafc");
      fillRect(4, 11, 8, 1, "#1d4ed8");
      fillRect(4, 13, 8, 1, "#1d4ed8");
      break;
    }
    case "top-linen-white": {
      sleeveColor = "#f1f5f9";
      fillRect(4, 10, 8, 5, "#f1f5f9");
      fillRect(7, 10, 2, 2, SKIN); // colletto aperto
      fillRect(4, 14, 8, 1, "#cbd5e1");
      break;
    }
    case "top-garibaldi": {
      sleeveColor = "#b91c1c";
      fillRect(4, 10, 8, 5, "#dc2626");
      fillRect(7, 10, 2, 5, "#991b1b");
      setPx(7, 11, "#ffd166");
      setPx(7, 13, "#ffd166");
      break;
    }
    case "top-winemaker": {
      sleeveColor = "#fef3c7";
      fillRect(4, 10, 8, 5, "#fef3c7");
      fillRect(5, 11, 6, 4, "#78350f"); // grembiule marrone
      fillRect(5, 10, 1, 1, "#78350f");
      fillRect(10, 10, 1, 1, "#78350f");
      break;
    }
    case "top-kitesurf": {
      sleeveColor = "#0f172a";
      fillRect(4, 10, 8, 5, "#0f172a");
      fillRect(5, 10, 6, 4, "#10b981");
      fillRect(7, 10, 2, 5, "#22d3ee");
      break;
    }
    case "top-cassaro": {
      sleeveColor = "#6d28d9";
      fillRect(4, 10, 8, 5, "#7c3aed");
      fillRect(7, 10, 2, 5, "#ffd166");
      fillRect(4, 10, 8, 1, "#f59e0b");
      break;
    }
    case "top-holo": {
      sleeveColor = "#c026d3";
      fillRect(4, 10, 8, 5, "#e879f9");
      fillRect(5, 11, 6, 3, "#38bdf8");
      fillRect(7, 11, 2, 2, "#ffd166");
      break;
    }
    case "top-explorer":
    default: {
      sleeveColor = "#1d4ed8";
      fillRect(4, 10, 8, 5, "#2563eb");
      fillRect(7, 10, 2, 5, "#60a5fa");
      setPx(5, 12, "#ffd166");
      setPx(10, 12, "#ffd166");
      break;
    }
  }

  // Braccia & mani
  fillRect(2, 10, 2, 4, sleeveColor);
  fillRect(12, 10, 2, 4, sleeveColor);
  fillRect(2, 14, 2, 1, SKIN);
  fillRect(12, 14, 2, 1, SKIN);

  // 6. PANTALONI & TUNICHE (righe 15..18)
  switch (avatar.bottom) {
    case "bottom-shorts-sand": {
      fillRect(4, 15, 8, 2, "#d6b88d");
      fillRect(5, 17, 2, 2, SKIN); // gambe scoperte
      fillRect(9, 17, 2, 2, SKIN);
      break;
    }
    case "bottom-cargo": {
      fillRect(4, 15, 8, 1, "#3f6212");
      fillRect(4, 16, 3, 3, "#4d7c0f");
      fillRect(9, 16, 3, 3, "#4d7c0f");
      setPx(4, 17, "#84cc16"); // tasche laterali
      setPx(11, 17, "#84cc16");
      break;
    }
    case "bottom-punic": {
      fillRect(4, 15, 8, 1, "#ffd166"); // cintura dorata fenicia
      fillRect(4, 16, 8, 3, "#0284c7");
      fillRect(7, 17, 2, 2, "#38bdf8");
      break;
    }
    case "bottom-sibilla": {
      fillRect(4, 15, 8, 4, "#7e22ce");
      fillRect(4, 18, 8, 1, "#ffd166"); // bordo dorato
      break;
    }
    case "bottom-gameboy": {
      fillRect(4, 15, 8, 1, "#365314");
      fillRect(4, 16, 3, 3, "#4d7c0f");
      fillRect(9, 16, 3, 3, "#4d7c0f");
      break;
    }
    case "bottom-gold-greaves": {
      fillRect(4, 15, 8, 1, "#b45309");
      fillRect(4, 16, 3, 3, "#f59e0b");
      fillRect(9, 16, 3, 3, "#f59e0b");
      setPx(5, 17, "#fef08a");
      setPx(10, 17, "#fef08a");
      break;
    }
    case "bottom-jeans":
    default: {
      fillRect(4, 15, 8, 1, "#1e3a8a");
      fillRect(4, 16, 3, 3, "#1d4ed8");
      fillRect(9, 16, 3, 3, "#1d4ed8");
      break;
    }
  }

  // 7. SCARPONCINI (riga 19)
  fillRect(4, 19, 3, 1, BOOT);
  fillRect(9, 19, 3, 1, BOOT);
  setPx(4, 19, BOOT_SOLE);
  setPx(11, 19, BOOT_SOLE);

  return grid;
}

export function renderAvatarSvgString(
  avatar: AvatarConfig,
  width = 36,
  height = 45,
): string {
  const grid = buildAvatarPixelGrid(avatar);
  const rects: string[] = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const fill = grid[y][x];
      if (fill) {
        rects.push(
          `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`,
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${COLS} ${ROWS}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
}
