import type { AvatarConfig } from '../../shared/cosmetics';

export interface UserProfile {
  id: string;
  username: string;
  nickname: string;
  avatar: AvatarConfig;
}

export interface UnlockData {
  poiId: string;
  photoDataUrl: string;
  unlockedAt: string;
  lat: number;
  lng: number;
  accuracy: number;
  xpEarned: number;
}

export interface LeaderboardEntry {
  nickname: string;
  avatar: AvatarConfig;
  unlockedCount: number;
  percent: number;
  easterEggCount: number;
  totalXp: number;
}

export type RetroTheme = 'default' | 'gameboy' | 'sunset' | 'night';