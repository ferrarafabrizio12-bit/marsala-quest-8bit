import type { AvatarConfig } from '../../shared/cosmetics';

export interface UserProfile {
  id: string;
  username: string;
  nickname: string;
  avatar: AvatarConfig;
  prestige: number;
  bountyStreak: number;
  lastBountyDate: string | null;
}

export interface UnlockData {
  poiId: string;
  photoDataUrl: string;
  unlockedAt: string;
  lat: number;
  lng: number;
  accuracy: number;
  xpEarned: number;
  isHolo: boolean;
}

export interface DailyBountyInfo {
  poiId: string;
  date: string;
  completedToday: boolean;
  bonusXp: number;
}

export interface LeaderboardEntry {
  nickname: string;
  avatar: AvatarConfig;
  prestige: number;
  bountyStreak: number;
  unlockedCount: number;
  percent: number;
  easterEggCount: number;
  totalXp: number;
}

export type RetroTheme = 'default' | 'gameboy' | 'sunset' | 'night';