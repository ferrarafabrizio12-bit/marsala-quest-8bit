export interface UserProfile {
  id: string;
  username: string;
  nickname: string;
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
  unlockedCount: number;
  percent: number;
  easterEggCount: number;
  totalXp: number;
}

export type RetroTheme = "default" | "gameboy" | "sunset";
