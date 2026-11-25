import type { AvatarConfig, AvatarGender } from "../../shared/cosmetics";
import type {
  DailyBountyInfo,
  LeaderboardEntry,
  RetroTheme,
  UnlockData,
  UserProfile,
} from "../types/game";

const TOKEN_KEY = "marsala_quest_jwt";
const API_BASE = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Errore HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  register: (payload: {
    username: string;
    nickname: string;
    password: string;
    gender: AvatarGender;
  }) =>
    request<{ token: string; user: UserProfile }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { username: string; password: string }) =>
    request<{ token: string; user: UserProfile }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateNickname: (nickname: string) =>
    request<{ nickname: string }>("/auth/nickname", {
      method: "PATCH",
      body: JSON.stringify({ nickname }),
    }),

  updateAvatar: (avatar: AvatarConfig) =>
    request<{ avatar: AvatarConfig }>("/auth/avatar", {
      method: "PATCH",
      body: JSON.stringify(avatar),
    }),

  updateTitle: (titleId: string) =>
    request<{ title: string }>("/auth/title", {
      method: "PATCH",
      body: JSON.stringify({ titleId }),
    }),

  getProgress: () =>
    request<{
      user: UserProfile;
      unlocks: Record<string, UnlockData>;
      easterEggs: string[];
      dailyBounty: DailyBountyInfo;
      totalXp: number;
    }>("/progress"),

  activatePrestige: () =>
    request<{
      user: UserProfile;
      unlocks: Record<string, UnlockData>;
      easterEggs: string[];
      dailyBounty: DailyBountyInfo;
      totalXp: number;
    }>("/progress/prestige", {
      method: "POST",
    }),

  unlockPoi: (payload: {
    poiId: string;
    lat: number | null;
    lng: number | null;
    accuracy: number;
    photoDataUrl: string;
    requestedEdition?: RetroTheme;
  }) =>
    request<{
      unlock: UnlockData;
      user: UserProfile;
      easterEggs: string[];
      newlyUnlockedEggs: string[];
      editionBonusXp: number;
      bountyClaimedNow: boolean;
      bountyXpAwarded: number;
      dailyBounty: DailyBountyInfo;
      totalXp: number;
    }>("/progress/unlock", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  claimEasterEgg: (eggId: string) =>
    request<{ isNew: boolean; easterEggs: string[]; totalXp: number }>(
      "/progress/easter-egg",
      {
        method: "POST",
        body: JSON.stringify({ eggId }),
      },
    ),

  getLeaderboard: () =>
    request<{ leaderboard: LeaderboardEntry[] }>("/leaderboard"),
};
