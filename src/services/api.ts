import type {
  AvatarConfig,
  AvatarGender,
  BeardStyleId,
  HairColorId,
  HairStyleId,
  SkinToneId,
  SuperuserOverrides,
} from "../../shared/cosmetics";
import type {
  DailyBountyInfo,
  FeedbackCategory,
  FeedbackItem,
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
    skinTone: SkinToneId;
    hairColor: HairColorId;
    hairStyle: HairStyleId;
    beard: BeardStyleId;
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

  completeOnboarding: () =>
    request<{ onboardingCompleted: boolean }>("/auth/onboarding-complete", {
      method: "PATCH",
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

  updateSuperuserOverrides: (payload: {
    overrides: SuperuserOverrides;
    avatar?: AvatarConfig;
    title?: string;
  }) =>
    request<{ user: UserProfile }>("/auth/superuser-overrides", {
      method: "PATCH",
      body: JSON.stringify(payload),
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

  unlockAllPois: () =>
    request<{
      user: UserProfile;
      unlocks: Record<string, UnlockData>;
      easterEggs: string[];
      dailyBounty: DailyBountyInfo;
      totalXp: number;
    }>("/progress/unlock-all", {
      method: "POST",
    }),

  lockPoi: (payload: { poiId?: string; all?: boolean }) =>
    request<{
      user: UserProfile;
      unlocks: Record<string, UnlockData>;
      easterEggs: string[];
      dailyBounty: DailyBountyInfo;
      totalXp: number;
    }>("/progress/lock", {
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

  adminEasterEgg: (payload: {
    action: "unlock" | "lock" | "unlock_all" | "lock_all";
    eggId?: string;
  }) =>
    request<{ easterEggs: string[]; totalXp: number }>(
      "/progress/easter-egg/admin",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  getFeedbackStatus: () =>
    request<{
      canSubmit: boolean;
      nextAllowedAt: string | null;
      remainingMs: number;
    }>("/feedback/status"),

  submitFeedback: (payload: { category: FeedbackCategory; message: string }) =>
    request<{ ok: boolean; nextAllowedAt: string | null; remainingMs: number }>(
      "/feedback",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  getAdminFeedbacks: () =>
    request<{ feedbacks: FeedbackItem[] }>("/admin/feedbacks"),

  setFeedbackRead: (id: string, isRead: boolean) =>
    request<{ ok: boolean }>(
      `/admin/feedbacks/${encodeURIComponent(id)}/read`,
      {
        method: "PATCH",
        body: JSON.stringify({ isRead }),
      },
    ),

  deleteFeedback: (id: string) =>
    request<{ ok: boolean }>(`/admin/feedbacks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  getLeaderboard: () =>
    request<{ leaderboard: LeaderboardEntry[] }>("/leaderboard"),
};
