import type { AvatarConfig } from '../../shared/cosmetics';

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

const SKIN = '#ffcdb2';
const SKIN_SHADE = '#e5989b';

function getBottomRects(bottomId: string): PixelRect[] {
  switch (bottomId) {
    case 'bottom-shorts':
      return [
        { x: 4, y: 14, w: 8, h: 1, fill: '#0284c7' },
        { x: 4, y: 15, w: 3, h: 2, fill: '#0ea5e9' },
        { x: 9, y: 15, w: 3, h: 2, fill: '#0ea5e9' },
        { x: 5, y: 17, w: 2, h: 1, fill: SKIN },
        { x: 9, y: 17, w: 2, h: 1, fill: SKIN },
        { x: 4, y: 18, w: 3, h: 2, fill: '#f8fafc' },
        { x: 9, y: 18, w: 3, h: 2, fill: '#f8fafc' },
      ];
    case 'bottom-cargo':
      return [
        { x: 4, y: 14, w: 8, h: 1, fill: '#3f6212' },
        { x: 4, y: 15, w: 3, h: 3, fill: '#65a30d' },
        { x: 9, y: 15, w: 3, h: 3, fill: '#65a30d' },
        { x: 4, y: 16, w: 1, h: 1, fill: '#4d7c0f' },
        { x: 11, y: 16, w: 1, h: 1, fill: '#4d7c0f' },
        { x: 4, y: 18, w: 3, h: 2, fill: '#451a03' },
        { x: 9, y: 18, w: 3, h: 2, fill: '#451a03' },
      ];
    case 'bottom-garibaldi':
      return [
        { x: 4, y: 14, w: 8, h: 1, fill: '#1e293b' },
        { x: 4, y: 15, w: 3, h: 3, fill: '#64748b' },
        { x: 9, y: 15, w: 3, h: 3, fill: '#64748b' },
        { x: 4, y: 15, w: 1, h: 3, fill: '#dc2626' },
        { x: 11, y: 15, w: 1, h: 3, fill: '#dc2626' },
        { x: 4, y: 18, w: 3, h: 2, fill: '#0f172a' },
        { x: 9, y: 18, w: 3, h: 2, fill: '#0f172a' },
      ];
    case 'bottom-punico':
      return [
        { x: 4, y: 14, w: 8, h: 2, fill: '#fef3c7' },
        { x: 4, y: 15, w: 8, h: 1, fill: '#b45309' },
        { x: 5, y: 16, w: 2, h: 2, fill: SKIN },
        { x: 9, y: 16, w: 2, h: 2, fill: SKIN },
        { x: 4, y: 18, w: 3, h: 2, fill: '#92400e' },
        { x: 9, y: 18, w: 3, h: 2, fill: '#92400e' },
        { x: 5, y: 18, w: 1, h: 1, fill: '#ffd166' },
        { x: 10, y: 18, w: 1, h: 1, fill: '#ffd166' },
      ];
    case 'bottom-oro':
      return [
        { x: 4, y: 14, w: 8, h: 1, fill: '#b45309' },
        { x: 7, y: 14, w: 2, h: 1, fill: '#fef08a' },
        { x: 4, y: 15, w: 3, h: 3, fill: '#f59e0b' },
        { x: 9, y: 15, w: 3, h: 3, fill: '#f59e0b' },
        { x: 5, y: 15, w: 1, h: 2, fill: '#fef08a' },
        { x: 10, y: 15, w: 1, h: 2, fill: '#fef08a' },
        { x: 4, y: 18, w: 3, h: 2, fill: '#78350f' },
        { x: 9, y: 18, w: 3, h: 2, fill: '#78350f' },
      ];
    case 'bottom-jeans':
    default:
      return [
        { x: 4, y: 14, w: 8, h: 1, fill: '#1e3a8a' },
        { x: 4, y: 15, w: 3, h: 3, fill: '#2563eb' },
        { x: 9, y: 15, w: 3, h: 3, fill: '#2563eb' },
        { x: 4, y: 18, w: 3, h: 2, fill: '#0f172a' },
        { x: 9, y: 18, w: 3, h: 2, fill: '#0f172a' },
      ];
  }
}

function getTopRects(topId: string): PixelRect[] {
  const hands: PixelRect[] = [
    { x: 3, y: 13, w: 1, h: 1, fill: SKIN },
    { x: 12, y: 13, w: 1, h: 1, fill: SKIN },
    { x: 7, y: 9, w: 2, h: 1, fill: SKIN },
  ];

  switch (topId) {
    case 'top-sole':
      return [
        { x: 4, y: 9, w: 8, h: 5, fill: '#facc15' },
        { x: 3, y: 9, w: 1, h: 3, fill: '#eab308' },
        { x: 12, y: 9, w: 1, h: 3, fill: '#eab308' },
        { x: 3, y: 12, w: 1, h: 1, fill: SKIN },
        { x: 12, y: 12, w: 1, h: 1, fill: SKIN },
        { x: 6, y: 11, w: 4, h: 1, fill: '#ea580c' },
        ...hands,
      ];
    case 'top-garibaldi':
      return [
        { x: 4, y: 9, w: 8, h: 5, fill: '#dc2626' },
        { x: 3, y: 9, w: 1, h: 4, fill: '#b91c1c' },
        { x: 12, y: 9, w: 1, h: 4, fill: '#b91c1c' },
        // Fazzoletto al collo + bottoni dorati
        { x: 6, y: 9, w: 4, h: 2, fill: '#1e293b' },
        { x: 7, y: 11, w: 2, h: 1, fill: '#ffd166' },
        { x: 7, y: 13, w: 2, h: 1, fill: '#ffd166' },
        ...hands,
      ];
    case 'top-cantiniere':
      return [
        { x: 4, y: 9, w: 8, h: 5, fill: '#881337' },
        { x: 3, y: 9, w: 1, h: 4, fill: '#f8fafc' },
        { x: 12, y: 9, w: 1, h: 4, fill: '#f8fafc' },
        { x: 6, y: 9, w: 4, h: 2, fill: '#f8fafc' },
        { x: 7, y: 10, w: 2, h: 1, fill: '#0f172a' },
        { x: 7, y: 12, w: 2, h: 1, fill: '#ffd166' },
        ...hands,
      ];
    case 'top-kite':
      return [
        { x: 4, y: 9, w: 8, h: 5, fill: '#0f172a' },
        { x: 3, y: 9, w: 1, h: 4, fill: '#06b6d4' },
        { x: 12, y: 9, w: 1, h: 4, fill: '#06b6d4' },
        { x: 5, y: 10, w: 6, h: 1, fill: '#38e54d' },
        { x: 6, y: 12, w: 4, h: 1, fill: '#06b6d4' },
        ...hands,
      ];
    case 'top-cassaro':
      return [
        { x: 4, y: 9, w: 8, h: 5, fill: '#6d28d9' },
        { x: 3, y: 9, w: 1, h: 4, fill: '#5b21b6' },
        { x: 12, y: 9, w: 1, h: 4, fill: '#5b21b6' },
        { x: 7, y: 9, w: 2, h: 5, fill: '#ffd166' },
        ...hands,
      ];
    case 'top-oro':
      return [
        { x: 4, y: 9, w: 8, h: 5, fill: '#f59e0b' },
        { x: 3, y: 9, w: 1, h: 4, fill: '#d97706' },
        { x: 12, y: 9, w: 1, h: 4, fill: '#d97706' },
        { x: 6, y: 10, w: 4, h: 3, fill: '#fef08a' },
        { x: 7, y: 11, w: 2, h: 1, fill: '#b91c1c' },
        ...hands,
      ];
      case 'top-prestige-cape':
    return [
      { x: 3, y: 9, w: 1, h: 5, fill: '#a21caf' },
      { x: 12, y: 9, w: 1, h: 5, fill: '#a21caf' },
      { x: 4, y: 9, w: 8, h: 5, fill: '#c026d3' },
      { x: 3, y: 9, w: 2, h: 1, fill: '#ffd166' },
      { x: 11, y: 9, w: 2, h: 1, fill: '#ffd166' },
      { x: 7, y: 9, w: 2, h: 5, fill: '#fef08a' },
      ...hands,
    ];
    case 'top-explorer':
    default:
      return [
        { x: 4, y: 9, w: 8, h: 5, fill: '#4cc9f0' },
        { x: 3, y: 9, w: 1, h: 4, fill: '#38bdf8' },
        { x: 12, y: 9, w: 1, h: 4, fill: '#38bdf8' },
        { x: 5, y: 11, w: 6, h: 1, fill: '#0284c7' },
        ...hands,
      ];
  }
}

function getGlassesRects(glassesId: string): PixelRect[] {
  switch (glassesId) {
    case 'glasses-pixel':
      return [
        { x: 4, y: 6, w: 8, h: 1, fill: '#000000' },
        { x: 5, y: 6, w: 2, h: 2, fill: '#000000' },
        { x: 9, y: 6, w: 2, h: 2, fill: '#000000' },
        { x: 5, y: 6, w: 1, h: 1, fill: '#ffffff' },
        { x: 9, y: 6, w: 1, h: 1, fill: '#ffffff' },
      ];
    case 'glasses-gameboy':
      return [
        { x: 4, y: 5, w: 8, h: 3, fill: '#1e293b' },
        { x: 5, y: 6, w: 6, h: 1, fill: '#a3e635' },
        { x: 6, y: 6, w: 1, h: 1, fill: '#ecfccb' },
      ];
    case 'glasses-sunset':
      return [
        { x: 4, y: 6, w: 8, h: 1, fill: '#ffd166' },
        { x: 5, y: 6, w: 2, h: 2, fill: '#fb7185' },
        { x: 9, y: 6, w: 2, h: 2, fill: '#fb7185' },
        { x: 5, y: 6, w: 1, h: 1, fill: '#fde047' },
        { x: 9, y: 6, w: 1, h: 1, fill: '#fde047' },
      ];
    case 'glasses-neon':
      return [
        { x: 4, y: 5, w: 8, h: 3, fill: '#0f172a' },
        { x: 5, y: 6, w: 2, h: 1, fill: '#22d3ee' },
        { x: 9, y: 6, w: 2, h: 1, fill: '#f43f5e' },
        { x: 7, y: 6, w: 2, h: 1, fill: '#a855f7' },
      ];
      case 'glasses-holo':
    return [
      { x: 4, y: 5, w: 8, h: 3, fill: '#f0abfc' },
      { x: 5, y: 6, w: 2, h: 1, fill: '#38bdf8' },
      { x: 7, y: 6, w: 2, h: 1, fill: '#fef08a' },
      { x: 9, y: 6, w: 2, h: 1, fill: '#f43f5e' },
    ];
    case 'glasses-none':
    default:
      return [];
  }
}

function getHatRects(hatId: string): PixelRect[] {
  switch (hatId) {
    case 'hat-cap-red':
      return [
        { x: 4, y: 1, w: 8, h: 2, fill: '#ff4d6d' },
        { x: 3, y: 3, w: 11, h: 1, fill: '#e11d48' },
        { x: 7, y: 2, w: 2, h: 1, fill: '#ffd166' },
      ];
    case 'hat-paglia':
      return [
        { x: 5, y: 1, w: 6, h: 2, fill: '#fde047' },
        { x: 5, y: 2, w: 6, h: 1, fill: '#b91c1c' },
        { x: 2, y: 3, w: 12, h: 1, fill: '#eab308' },
      ];
    case 'hat-garibaldi':
      return [
        { x: 4, y: 1, w: 8, h: 2, fill: '#dc2626' },
        { x: 4, y: 2, w: 8, h: 1, fill: '#ffd166' },
        { x: 3, y: 3, w: 10, h: 1, fill: '#111827' },
      ];
    case 'hat-woodhouse':
      return [
        { x: 5, y: 0, w: 6, h: 3, fill: '#1e293b' },
        { x: 5, y: 2, w: 6, h: 1, fill: '#b91c1c' },
        { x: 3, y: 3, w: 10, h: 1, fill: '#0f172a' },
      ];
    case 'hat-sibilla':
      return [
        { x: 4, y: 2, w: 2, h: 1, fill: '#22c55e' },
        { x: 10, y: 2, w: 2, h: 1, fill: '#22c55e' },
        { x: 5, y: 3, w: 6, h: 1, fill: '#4ade80' },
        { x: 7, y: 2, w: 2, h: 1, fill: '#ffd166' },
      ];
    case 'hat-punico':
      return [
        { x: 6, y: 0, w: 4, h: 1, fill: '#dc2626' },
        { x: 5, y: 1, w: 6, h: 1, fill: '#ef4444' },
        { x: 4, y: 2, w: 8, h: 2, fill: '#d97706' },
        { x: 6, y: 2, w: 4, h: 1, fill: '#fef08a' },
      ];
    case 'hat-corona-lilibeo':
      return [
        { x: 4, y: 1, w: 2, h: 1, fill: '#ffd166' },
        { x: 7, y: 1, w: 2, h: 1, fill: '#ffd166' },
        { x: 10, y: 1, w: 2, h: 1, fill: '#ffd166' },
        { x: 4, y: 2, w: 8, h: 2, fill: '#f59e0b' },
        { x: 7, y: 2, w: 2, h: 1, fill: '#ef4444' },
      ];
    case 'hat-none':
    default:
      return [];
  }
}

export function getAvatarPixelRects(avatar: AvatarConfig): PixelRect[] {
  const rects: PixelRect[] = [];
  const hairColor = avatar.gender === 'female' ? '#6b3e26' : '#3b2416';

  // 1. Capelli posteriori (per base Lei)
  if (avatar.gender === 'female') {
    rects.push(
      { x: 3, y: 4, w: 2, h: 7, fill: hairColor },
      { x: 11, y: 4, w: 2, h: 7, fill: hairColor }
    );
  }

  // 2. Pantaloni & scarpe
  rects.push(...getBottomRects(avatar.bottom));

  // 3. Maglia & braccia
  rects.push(...getTopRects(avatar.top));

  // 4. Viso
  rects.push(
    { x: 5, y: 4, w: 6, h: 5, fill: SKIN },
    { x: 6, y: 6, w: 1, h: 1, fill: '#111827' },
    { x: 9, y: 6, w: 1, h: 1, fill: '#111827' }
  );

  if (avatar.gender === 'female') {
    rects.push(
      { x: 5, y: 7, w: 1, h: 1, fill: SKIN_SHADE },
      { x: 10, y: 7, w: 1, h: 1, fill: SKIN_SHADE }
    );
  }

  // 5. Capelli frontali
  if (avatar.gender === 'female') {
    rects.push(
      { x: 4, y: 3, w: 8, h: 2, fill: hairColor },
      { x: 4, y: 4, w: 1, h: 4, fill: hairColor },
      { x: 11, y: 4, w: 1, h: 4, fill: hairColor }
    );
  } else {
    rects.push(
      { x: 4, y: 3, w: 8, h: 2, fill: hairColor },
      { x: 4, y: 5, w: 1, h: 1, fill: hairColor },
      { x: 11, y: 5, w: 1, h: 1, fill: hairColor }
    );
  }

  // 6. Occhiali
  rects.push(...getGlassesRects(avatar.glasses));

  // 7. Cappello
  rects.push(...getHatRects(avatar.hat));

  return rects;
}

export function renderAvatarSvgString(
  avatar: AvatarConfig,
  width = 34,
  height = 42
): string {
  const rects = getAvatarPixelRects(avatar)
    .map(
      (r) =>
        `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}" />`
    )
    .join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated; filter: drop-shadow(2px 2px 0 #000);">${rects}</svg>`;
}