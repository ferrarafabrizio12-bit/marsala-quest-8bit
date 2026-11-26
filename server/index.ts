import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import {
  type FeedbackCategoryRecord,
  activateUserPrestige,
  addEasterEgg,
  claimDailyBountyReward,
  clearAllEasterEggs,
  createFeedback,
  createUser,
  deleteAllUnlocks,
  deleteFeedback,
  deleteUnlock,
  ensureSuperuser,
  findUserById,
  findUserByUsername,
  getAllFeedbacks,
  getLeaderboardRows,
  getUserEasterEggs,
  getUserUnlocks,
  initDb,
  isNicknameTaken,
  markOnboardingCompleted,
  removeEasterEgg,
  setAllEasterEggs,
  setFeedbackRead,
  touchUserLastFeedback,
  updateSuperuserOverrides,
  updateUserAvatar,
  updateUserNickname,
  updateUserTitle,
  upsertUnlock,
  type UserRecord,
} from "./db.js";
import {
  type CardEdition,
  EASTER_EGGS,
  MARSALA_POIS,
  getCurrentCardEdition,
  getDailyBountyPoiId,
  getEffectiveUnlockRadius,
  getItalyDateString,
  haversineMeters,
} from "../shared/pois.js";
import {
  DEFAULT_AVATAR,
  MAX_PRESTIGE,
  getTitleById,
  getUnlockedCosmeticIds,
  isTitleUnlocked,
  sanitizeAvatarConfig,
  sanitizeSuperuserOverrides,
  sanitizeTitleId,
} from "../shared/cosmetics.js";

const app = express();
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT) || 3001;
const IS_PROD = process.env.NODE_ENV === "production";
const FEEDBACK_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (IS_PROD ? "" : "dev-only-lilibeo-secret-not-for-prod");

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET è obbligatoria in produzione.");
}

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const isLocalNetworkOrigin = (origin: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
    origin,
  );

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, "");
      const isAllowed = allowedOrigins.includes(normalized);
      const isLocal = !IS_PROD && isLocalNetworkOrigin(normalized);
      const isVercel = normalized.endsWith(".vercel.app");

      if (isAllowed || isLocal || isVercel) {
        return callback(null, true);
      }
      return callback(new Error(`Origine non consentita da CORS: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "8mb" }));

interface AuthRequest extends Request {
  userId?: string;
}

function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token mancante. Effettua il login." });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res
      .status(401)
      .json({ error: "Sessione scaduta. Effettua di nuovo il login." });
  }
}

function computeEggXp(easterEggs: string[]): number {
  return easterEggs.reduce((sum, id) => {
    const found = EASTER_EGGS.find((e) => e.id === id);
    return sum + (found ? found.xp : 0);
  }, 0);
}

function computeTotalXp(
  unlocks: Record<string, { xpEarned: number }>,
  easterEggs: string[],
  bonusXp = 0,
): number {
  const poiXp = Object.values(unlocks).reduce((sum, u) => sum + u.xpEarned, 0);
  return bonusXp + poiXp + computeEggXp(easterEggs);
}

function serializeUser(u: UserRecord) {
  return {
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    avatar: u.avatar,
    title: u.title,
    prestige: u.prestige,
    bountyStreak: u.bountyStreak,
    lastBountyDate: u.lastBountyDate,
    isSuperuser: u.isSuperuser,
    superuserOverrides: u.superuserOverrides,
    onboardingCompleted: u.onboardingCompleted,
  };
}

function buildDailyBounty(u: UserRecord) {
  const today = getItalyDateString();
  const poiId = getDailyBountyPoiId(today);
  const completedToday = u.lastBountyDate === today;
  const nextStreakIfClaimed = completedToday
    ? u.bountyStreak
    : u.bountyStreak + 1;
  return {
    poiId,
    date: today,
    completedToday,
    bonusXp: nextStreakIfClaimed >= 3 ? 150 : 100,
  };
}

function getFeedbackCooldownStatus(u: UserRecord): {
  canSubmit: boolean;
  nextAllowedAt: string | null;
  remainingMs: number;
} {
  if (u.isSuperuser || !u.lastFeedbackAt) {
    return { canSubmit: true, nextAllowedAt: null, remainingMs: 0 };
  }
  const lastMs = new Date(u.lastFeedbackAt).getTime();
  if (!Number.isFinite(lastMs)) {
    return { canSubmit: true, nextAllowedAt: null, remainingMs: 0 };
  }
  const nextMs = lastMs + FEEDBACK_COOLDOWN_MS;
  const remainingMs = Math.max(0, nextMs - Date.now());
  if (remainingMs <= 0) {
    return { canSubmit: true, nextAllowedAt: null, remainingMs: 0 };
  }
  return {
    canSubmit: false,
    nextAllowedAt: new Date(nextMs).toISOString(),
    remainingMs,
  };
}

function formatCooldownItalian(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSvgFallbackCard(
  poi: (typeof MARSALA_POIS)[number],
  nickname: string,
  isHolo: boolean,
): string {
  const border = isHolo ? "#e879f9" : "#ffd166";
  const safeName = escapeXml(poi.name.slice(0, 28));
  const safeZone = escapeXml(poi.zone.slice(0, 38));
  const safeDesc = escapeXml(poi.shortDesc.slice(0, 52));
  const safeNick = escapeXml(nickname);
  const safeIcon = escapeXml(poi.icon);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="780" viewBox="0 0 540 780">
    <rect width="540" height="780" fill="#0b0e1a"/>
    <rect x="8" y="8" width="524" height="764" fill="none" stroke="${border}" stroke-width="14"/>
    <rect x="22" y="22" width="496" height="736" fill="none" stroke="#4cc9f0" stroke-width="4"/>
    <text x="36" y="56" fill="${border}" font-family="monospace" font-size="18" font-weight="bold">MARSALA-DEX CARD</text>
    <rect x="36" y="74" width="468" height="340" fill="#1e1b4b" stroke="#f4f1de" stroke-width="4"/>
    <circle cx="420" cy="150" r="32" fill="#ffd166"/>
    <text x="270" y="265" text-anchor="middle" font-size="92">${safeIcon}</text>
    <text x="36" y="458" fill="#ffd166" font-family="monospace" font-size="22" font-weight="bold">${safeName}</text>
    <text x="36" y="486" fill="#4cc9f0" font-family="monospace" font-size="17">${safeZone}</text>
    <text x="36" y="530" fill="#f4f1de" font-family="monospace" font-size="14">${safeDesc}</text>
    <text x="36" y="680" fill="#e2e8f0" font-family="monospace" font-size="16">PLAYER: ${safeNick}</text>
    <text x="36" y="710" fill="#94a3b8" font-family="monospace" font-size="15">GPS: ${poi.lat.toFixed(5)}, ${poi.lng.toFixed(5)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// --- CACHE & PROXY TASSELLI OPENSTREETMAP PER CARTOLINA DI VIAGGIO ---
const tileCache = new Map<string, { buf: Buffer; contentType: string }>();

function isValidMarsalaTile(z: number, x: number, y: number): boolean {
  if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y))
    return false;
  if (z < 10 || z > 16) return false;
  const n = Math.pow(2, z);
  if (x < 0 || x >= n || y < 0 || y >= n) return false;

  const tileLng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const tileLat = (latRad * 180) / Math.PI;

  return (
    tileLng >= 11.8 && tileLng <= 13.0 && tileLat >= 37.4 && tileLat <= 38.2
  );
}

function isValidImageBuffer(buf: Buffer): boolean {
  if (buf.length < 100) return false;
  const isPng =
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  return isPng || isJpeg;
}

function setTileHeaders(res: Response, contentType: string): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Vary", "Origin");
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=3600");
}

app.get("/api/map-tile/:z/:x/:yPng", async (req: Request, res: Response) => {
  const z = Number(req.params.z);
  const x = Number(req.params.x);
  const y = Number(String(req.params.yPng || "").replace(/\.png$/i, ""));

  if (!isValidMarsalaTile(z, x, y)) {
    res.status(400).json({ error: "Coordinate tassello fuori area Marsala." });
    return;
  }

  const key = `osm-v4:${z}/${x}/${y}`;
  const cached = tileCache.get(key);
  if (cached) {
    setTileHeaders(res, cached.contentType);
    res.send(cached.buf);
    return;
  }

  const sources = [
    `https://tile.openstreetmap.de/${z}/${x}/${y}.png`,
    `https://a.tile.openstreetmap.fr/osmfr/${z}/${x}/${y}.png`,
    `https://b.tile.openstreetmap.fr/osmfr/${z}/${x}/${y}.png`,
    `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
    `https://tile.opentopomap.org/${z}/${x}/${y}.png`,
  ];

  for (const url of sources) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const upstream = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "MarsalaQuest8Bit/1.0 (https://marsala-quest-8bit.vercel.app)",
          Accept: "image/png,image/jpeg,image/*;q=0.9",
        },
      });
      clearTimeout(timer);

      if (!upstream.ok) continue;
      const contentType = upstream.headers.get("content-type") || "image/png";
      if (!contentType.startsWith("image/")) continue;

      const arrBuf = await upstream.arrayBuffer();
      const buf = Buffer.from(arrBuf);
      if (!isValidImageBuffer(buf)) continue;

      if (tileCache.size >= 500) {
        const firstKey = tileCache.keys().next().value;
        if (firstKey) tileCache.delete(firstKey);
      }
      tileCache.set(key, { buf, contentType });

      setTileHeaders(res, contentType);
      res.send(buf);
      return;
    } catch {
      // Prova il server OSM successivo
    }
  }

  res.status(502).json({ error: "Tassello mappa non disponibile." });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "marsala-quest-8bit-api" });
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const {
      username,
      nickname,
      password,
      gender,
      skinTone,
      hairColor,
      hairStyle,
      beard,
    } = req.body as {
      username?: string;
      nickname?: string;
      password?: string;
      gender?: string;
      skinTone?: string;
      hairColor?: string;
      hairStyle?: string;
      beard?: string;
    };

    const cleanUser = (username || "").trim().toLowerCase();
    const cleanNick = (nickname || "").trim();

    if (cleanUser.length < 3 || cleanUser.length > 30) {
      res.status(400).json({ error: "Username tra 3 e 30 caratteri." });
      return;
    }
    if (cleanNick.length < 2 || cleanNick.length > 20) {
      res.status(400).json({ error: "Nickname tra 2 e 20 caratteri." });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: "Password minimo 6 caratteri." });
      return;
    }

    if (await findUserByUsername(cleanUser)) {
      res.status(409).json({ error: "Username già registrato." });
      return;
    }
    if (await isNicknameTaken(cleanNick)) {
      res
        .status(409)
        .json({ error: "Nickname già scelto da un altro player." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const initialAvatar = sanitizeAvatarConfig({
      ...DEFAULT_AVATAR,
      gender,
      skinTone,
      hairColor,
      hairStyle,
      beard,
      hat: "hat-none",
    });

    const user = await createUser({
      id: crypto.randomUUID(),
      username: cleanUser,
      nickname: cleanNick,
      passwordHash,
      avatar: initialAvatar,
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.status(201).json({
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    res.status(500).json({ error: "Errore interno durante la registrazione." });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };
    const cleanUser = (username || "").trim().toLowerCase();

    const user = await findUserByUsername(cleanUser);
    if (
      !user ||
      !password ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      res.status(401).json({ error: "Username o password non validi." });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    res.status(500).json({ error: "Errore interno durante il login." });
  }
});

app.patch(
  "/api/auth/onboarding-complete",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      await markOnboardingCompleted(req.userId!);
      res.json({ onboardingCompleted: true });
    } catch (err) {
      console.error("[ONBOARDING COMPLETE ERROR]", err);
      res.status(500).json({ error: "Errore salvataggio stato tutorial." });
    }
  },
);

app.get(
  "/api/progress",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "Utente non trovato." });
        return;
      }
      const [unlocks, easterEggs] = await Promise.all([
        getUserUnlocks(user.id),
        getUserEasterEggs(user.id),
      ]);
      res.json({
        user: serializeUser(user),
        unlocks,
        easterEggs,
        dailyBounty: buildDailyBounty(user),
        totalXp: computeTotalXp(unlocks, easterEggs, user.bonusXp),
      });
    } catch (err) {
      console.error("[GET PROGRESS ERROR]", err);
      res.status(500).json({ error: "Impossibile caricare i progressi." });
    }
  },
);

app.patch(
  "/api/auth/nickname",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const cleanNick = (
        (req.body as { nickname?: string }).nickname || ""
      ).trim();
      if (cleanNick.length < 2 || cleanNick.length > 20) {
        res.status(400).json({ error: "Nickname tra 2 e 20 caratteri." });
        return;
      }
      if (await isNicknameTaken(cleanNick, req.userId!)) {
        res.status(409).json({ error: "Nickname già utilizzato." });
        return;
      }
      await updateUserNickname(req.userId!, cleanNick);
      res.json({ nickname: cleanNick });
    } catch (err) {
      console.error("[UPDATE NICKNAME ERROR]", err);
      res.status(500).json({ error: "Errore aggiornamento nickname." });
    }
  },
);

app.patch(
  "/api/auth/avatar",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "Utente non trovato." });
        return;
      }

      const candidate = sanitizeAvatarConfig(req.body);
      const [unlocks, easterEggs] = await Promise.all([
        getUserUnlocks(req.userId!),
        getUserEasterEggs(req.userId!),
      ]);

      const unlockedSet = new Set(
        getUnlockedCosmeticIds(
          Object.keys(unlocks).length,
          easterEggs,
          user.prestige,
          user.superuserOverrides,
          user.isSuperuser,
        ),
      );

      const chosen = [
        candidate.hat,
        candidate.glasses,
        candidate.top,
        candidate.bottom,
      ];
      if (!chosen.every((id) => unlockedSet.has(id))) {
        res.status(403).json({
          error:
            "Uno o più indumenti selezionati non sono ancora stati sbloccati!",
        });
        return;
      }

      await updateUserAvatar(req.userId!, candidate);
      res.json({ avatar: candidate });
    } catch (err) {
      console.error("[UPDATE AVATAR ERROR]", err);
      res
        .status(500)
        .json({ error: "Errore durante il salvataggio del look." });
    }
  },
);

app.patch(
  "/api/auth/title",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "Utente non trovato." });
        return;
      }

      const titleId = sanitizeTitleId(
        (req.body as { titleId?: string }).titleId,
      );
      const titleDef = getTitleById(titleId);

      const [unlocks, easterEggs] = await Promise.all([
        getUserUnlocks(user.id),
        getUserEasterEggs(user.id),
      ]);

      const editionsOwned = Object.values(unlocks).map((u) => u.edition);
      const allowed = isTitleUnlocked(titleDef, {
        unlockedCardsCount: Object.keys(unlocks).length,
        easterEggs,
        prestige: user.prestige,
        bountyStreak: user.bountyStreak,
        editionsOwned,
        overrides: user.superuserOverrides,
        isSuperuser: user.isSuperuser,
      });

      if (!allowed) {
        res
          .status(403)
          .json({ error: "Non hai ancora sbloccato questo titolo!" });
        return;
      }

      await updateUserTitle(user.id, titleDef.id);
      res.json({ title: titleDef.id });
    } catch (err) {
      console.error("[UPDATE TITLE ERROR]", err);
      res.status(500).json({ error: "Errore aggiornamento titolo." });
    }
  },
);

app.patch(
  "/api/auth/superuser-overrides",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user || !user.isSuperuser) {
        res
          .status(403)
          .json({ error: "Solo il Superuser può modificare questi permessi." });
        return;
      }

      const body = req.body as {
        overrides?: unknown;
        avatar?: unknown;
        title?: unknown;
      };

      const nextOverrides = sanitizeSuperuserOverrides(body.overrides);
      await updateSuperuserOverrides(user.id, nextOverrides);

      if (body.avatar) {
        const nextAvatar = sanitizeAvatarConfig(body.avatar);
        await updateUserAvatar(user.id, nextAvatar);
      }

      if (typeof body.title === "string") {
        const nextTitle = sanitizeTitleId(body.title);
        await updateUserTitle(user.id, nextTitle);
      }

      const fresh = (await findUserById(user.id))!;
      res.json({ user: serializeUser(fresh) });
    } catch (err) {
      console.error("[SUPERUSER OVERRIDES ERROR]", err);
      res.status(500).json({ error: "Errore salvataggio override Superuser." });
    }
  },
);

app.post(
  "/api/progress/prestige",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "Utente non trovato." });
        return;
      }

      if (user.prestige >= MAX_PRESTIGE) {
        res.status(400).json({
          error: `Hai già raggiunto il livello massimo di Prestigio (★P${MAX_PRESTIGE})!`,
        });
        return;
      }

      const unlocks = await getUserUnlocks(user.id);
      if (
        !user.isSuperuser &&
        Object.keys(unlocks).length < MARSALA_POIS.length
      ) {
        res.status(403).json({
          error: `Devi prima completare tutti i ${MARSALA_POIS.length} luoghi di Marsala per attivare il Prestigio!`,
        });
        return;
      }

      const updatedUser = await activateUserPrestige(user.id);
      const easterEggs = await getUserEasterEggs(user.id);

      res.json({
        user: serializeUser(updatedUser),
        unlocks: {},
        easterEggs,
        dailyBounty: buildDailyBounty(updatedUser),
        totalXp: computeTotalXp({}, easterEggs, updatedUser.bonusXp),
      });
    } catch (err) {
      console.error("[PRESTIGE ERROR]", err);
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : "Errore durante l’attivazione del Prestigio.",
      });
    }
  },
);

app.post(
  "/api/progress/unlock",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "Utente non trovato." });
        return;
      }

      const { poiId, lat, lng, accuracy, photoDataUrl, requestedEdition } =
        req.body as {
          poiId?: string;
          lat?: number;
          lng?: number;
          accuracy?: number;
          photoDataUrl?: string;
          requestedEdition?: string;
        };

      const poi = MARSALA_POIS.find((p) => p.id === poiId);
      if (!poi) {
        res.status(404).json({ error: "Punto di interesse non valido." });
        return;
      }

      if (!user.isSuperuser) {
        if (typeof lat !== "number" || typeof lng !== "number") {
          res.status(400).json({ error: "Coordinate GPS reali obbligatorie." });
          return;
        }
        if (!photoDataUrl || !photoDataUrl.startsWith("data:image/")) {
          res
            .status(400)
            .json({ error: "Foto obbligatoria per sbloccare la Card." });
          return;
        }

        const requiredRadius = getEffectiveUnlockRadius(poi, user.prestige);
        const gpsMargin = Math.min(Math.max(accuracy || 0, 0), 45);
        const distance = haversineMeters(lat, lng, poi.lat, poi.lng);

        if (distance > requiredRadius + gpsMargin) {
          res.status(403).json({
            error: `Sei a ${Math.round(distance)}m da ${poi.name}. Avvicinati entro ${requiredRadius}m!`,
            distance: Math.round(distance),
          });
          return;
        }
      }

      const effectiveLat = typeof lat === "number" ? lat : poi.lat;
      const effectiveLng = typeof lng === "number" ? lng : poi.lng;
      const effectivePhoto =
        photoDataUrl && photoDataUrl.startsWith("data:image/")
          ? photoDataUrl
          : buildSvgFallbackCard(poi, user.nickname, user.prestige > 0);

      const existingUnlocks = await getUserUnlocks(user.id);
      const prevUnlock = existingUnlocks[poi.id];

      const serverEdition = getCurrentCardEdition(requestedEdition);
      const edition: CardEdition = serverEdition;

      const baseXp =
        user.prestige > 0
          ? Math.round(poi.xp * (1 + user.prestige * 0.25))
          : poi.xp;
      const isNewSpecialEdition =
        edition !== "standard" &&
        (!prevUnlock || prevUnlock.edition !== edition);
      const editionBonusXp = isNewSpecialEdition ? 50 : 0;
      const earnedXp =
        Math.max(prevUnlock?.xpEarned || 0, baseXp) + editionBonusXp;
      const isHolo = user.prestige > 0;

      const unlock = await upsertUnlock(user.id, {
        poiId: poi.id,
        photoDataUrl: effectivePhoto,
        lat: effectiveLat,
        lng: effectiveLng,
        accuracy: Math.round(accuracy || 0),
        xpEarned: earnedXp,
        isHolo,
        edition,
      });

      const todayStr = getItalyDateString();
      const yesterdayStr = getItalyDateString(new Date(Date.now() - 86400000));
      const dailyBountyId = getDailyBountyPoiId(todayStr);

      let bountyResult = {
        claimedNow: false,
        bountyXpAwarded: 0,
        bountyStreak: user.bountyStreak,
        bonusXp: user.bonusXp,
      };

      if (poi.id === dailyBountyId) {
        bountyResult = await claimDailyBountyReward(
          user.id,
          todayStr,
          yesterdayStr,
        );
      }

      const unlocks = await getUserUnlocks(user.id);
      const newlyUnlockedEggs: string[] = [];

      const wineries = [
        "cantine-florio",
        "cantine-pellegrino",
        "cantine-donnafugata",
      ];
      if (wineries.every((id) => Boolean(unlocks[id]))) {
        const added = await addEasterEgg(user.id, "woodhouse-1773");
        if (added) newlyUnlockedEggs.push("woodhouse-1773");
      }

      const centroIds = MARSALA_POIS.filter(
        (p) => p.category === "CENTRO_STORICO",
      ).map((p) => p.id);
      if (centroIds.every((id) => Boolean(unlocks[id]))) {
        const added = await addEasterEgg(user.id, "custode-cassaro");
        if (added) newlyUnlockedEggs.push("custode-cassaro");
      }

      const [easterEggs, freshUser] = await Promise.all([
        getUserEasterEggs(user.id),
        findUserById(user.id),
      ]);
      const currentUser = freshUser || user;

      res.json({
        unlock,
        user: serializeUser(currentUser),
        easterEggs,
        newlyUnlockedEggs,
        editionBonusXp,
        bountyClaimedNow: bountyResult.claimedNow,
        bountyXpAwarded: bountyResult.bountyXpAwarded,
        dailyBounty: buildDailyBounty(currentUser),
        totalXp: computeTotalXp(unlocks, easterEggs, currentUser.bonusXp),
      });
    } catch (err) {
      console.error("[UNLOCK ERROR]", err);
      res
        .status(500)
        .json({ error: "Errore durante il salvataggio della Card." });
    }
  },
);

app.post(
  "/api/progress/unlock-all",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user || !user.isSuperuser) {
        res.status(403).json({ error: "Azione riservata al Superuser." });
        return;
      }

      const existing = await getUserUnlocks(user.id);
      const isHolo = user.prestige > 0;

      for (const poi of MARSALA_POIS) {
        if (existing[poi.id]) continue;
        const baseXp =
          user.prestige > 0
            ? Math.round(poi.xp * (1 + user.prestige * 0.25))
            : poi.xp;
        await upsertUnlock(user.id, {
          poiId: poi.id,
          photoDataUrl: buildSvgFallbackCard(poi, user.nickname, isHolo),
          lat: poi.lat,
          lng: poi.lng,
          accuracy: 5,
          xpEarned: baseXp,
          isHolo,
          edition: "standard",
        });
      }

      const [unlocks, easterEggs] = await Promise.all([
        getUserUnlocks(user.id),
        getUserEasterEggs(user.id),
      ]);

      res.json({
        user: serializeUser(user),
        unlocks,
        easterEggs,
        dailyBounty: buildDailyBounty(user),
        totalXp: computeTotalXp(unlocks, easterEggs, user.bonusXp),
      });
    } catch (err) {
      console.error("[UNLOCK ALL ERROR]", err);
      res.status(500).json({ error: "Errore sblocco massivo POI." });
    }
  },
);

app.post(
  "/api/progress/lock",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user || !user.isSuperuser) {
        res.status(403).json({ error: "Azione riservata al Superuser." });
        return;
      }

      const { poiId, all } = req.body as { poiId?: string; all?: boolean };
      if (all) {
        await deleteAllUnlocks(user.id);
      } else if (poiId) {
        await deleteUnlock(user.id, poiId);
      }

      const [unlocks, easterEggs] = await Promise.all([
        getUserUnlocks(user.id),
        getUserEasterEggs(user.id),
      ]);

      res.json({
        user: serializeUser(user),
        unlocks,
        easterEggs,
        dailyBounty: buildDailyBounty(user),
        totalXp: computeTotalXp(unlocks, easterEggs, user.bonusXp),
      });
    } catch (err) {
      console.error("[LOCK POI ERROR]", err);
      res.status(500).json({ error: "Errore rollback Card/territorio." });
    }
  },
);

app.post(
  "/api/progress/easter-egg",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "Utente non trovato." });
        return;
      }

      const { eggId } = req.body as { eggId?: string };
      const egg = EASTER_EGGS.find((e) => e.id === eggId);
      if (!egg) {
        res.status(404).json({ error: "Easter egg inesistente." });
        return;
      }

      const isNew = await addEasterEgg(user.id, egg.id);
      const [unlocks, easterEggs] = await Promise.all([
        getUserUnlocks(user.id),
        getUserEasterEggs(user.id),
      ]);
      res.json({
        isNew,
        egg,
        easterEggs,
        totalXp: computeTotalXp(unlocks, easterEggs, user.bonusXp),
      });
    } catch (err) {
      console.error("[EASTER EGG ERROR]", err);
      res.status(500).json({ error: "Errore salvataggio segreto." });
    }
  },
);

app.post(
  "/api/progress/easter-egg/admin",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user || !user.isSuperuser) {
        res.status(403).json({ error: "Azione riservata al Superuser." });
        return;
      }

      const { action, eggId } = req.body as {
        action?: "unlock" | "lock" | "unlock_all" | "lock_all";
        eggId?: string;
      };

      if (action === "unlock_all") {
        await setAllEasterEggs(
          user.id,
          EASTER_EGGS.map((e) => e.id),
        );
      } else if (action === "lock_all") {
        await clearAllEasterEggs(user.id);
      } else if (action === "unlock" && eggId) {
        await addEasterEgg(user.id, eggId);
      } else if (action === "lock" && eggId) {
        await removeEasterEgg(user.id, eggId);
      }

      const [unlocks, easterEggs] = await Promise.all([
        getUserUnlocks(user.id),
        getUserEasterEggs(user.id),
      ]);

      res.json({
        easterEggs,
        totalXp: computeTotalXp(unlocks, easterEggs, user.bonusXp),
      });
    } catch (err) {
      console.error("[ADMIN EASTER EGG ERROR]", err);
      res.status(500).json({ error: "Errore gestione segreti Superuser." });
    }
  },
);

// --- FEEDBACK UTENTI (Cooldown 12h per utenti standard, Inbox solo Superuser) ---
app.get(
  "/api/feedback/status",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "Utente non trovato." });
        return;
      }
      res.json(getFeedbackCooldownStatus(user));
    } catch (err) {
      console.error("[FEEDBACK STATUS ERROR]", err);
      res
        .status(500)
        .json({ error: "Impossibile verificare lo stato del feedback." });
    }
  },
);

app.post(
  "/api/feedback",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "Utente non trovato." });
        return;
      }

      const cooldown = getFeedbackCooldownStatus(user);
      if (!cooldown.canSubmit) {
        res.status(429).json({
          error: `Hai già inviato un feedback. Potrai inviarne un altro tra ${formatCooldownItalian(cooldown.remainingMs)}.`,
          nextAllowedAt: cooldown.nextAllowedAt,
          remainingMs: cooldown.remainingMs,
        });
        return;
      }

      const { category, message } = req.body as {
        category?: string;
        message?: string;
      };
      const cleanMsg = (message || "").trim();
      if (cleanMsg.length < 5) {
        res
          .status(400)
          .json({ error: "Scrivi almeno 5 caratteri per il tuo feedback." });
        return;
      }
      if (cleanMsg.length > 1000) {
        res.status(400).json({ error: "Massimo 1000 caratteri per feedback." });
        return;
      }

      const validCategory: FeedbackCategoryRecord =
        category === "bug" || category === "apprezzamento"
          ? category
          : "suggerimento";

      await createFeedback({
        id: crypto.randomUUID(),
        userId: user.id,
        nickname: user.nickname,
        category: validCategory,
        message: cleanMsg,
      });

      const sentAt = await touchUserLastFeedback(user.id);
      const nextAllowedAt = user.isSuperuser
        ? null
        : new Date(
            new Date(sentAt).getTime() + FEEDBACK_COOLDOWN_MS,
          ).toISOString();
      const remainingMs = user.isSuperuser ? 0 : FEEDBACK_COOLDOWN_MS;

      res.status(201).json({ ok: true, nextAllowedAt, remainingMs });
    } catch (err) {
      console.error("[CREATE FEEDBACK ERROR]", err);
      res
        .status(500)
        .json({ error: "Errore invio feedback. Riprova tra poco." });
    }
  },
);

app.get(
  "/api/admin/feedbacks",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user || !user.isSuperuser) {
        res.status(403).json({ error: "Accesso riservato al Superuser." });
        return;
      }
      const feedbacks = await getAllFeedbacks();
      res.json({ feedbacks });
    } catch (err) {
      console.error("[GET FEEDBACKS ERROR]", err);
      res.status(500).json({ error: "Errore caricamento feedback." });
    }
  },
);

app.patch(
  "/api/admin/feedbacks/:id/read",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user || !user.isSuperuser) {
        res.status(403).json({ error: "Accesso riservato al Superuser." });
        return;
      }
      const feedbackId = String(req.params.id || "");
      const isRead = Boolean((req.body as { isRead?: boolean }).isRead);
      await setFeedbackRead(feedbackId, isRead);
      res.json({ ok: true });
    } catch (err) {
      console.error("[UPDATE FEEDBACK READ ERROR]", err);
      res.status(500).json({ error: "Errore aggiornamento feedback." });
    }
  },
);

app.delete(
  "/api/admin/feedbacks/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user || !user.isSuperuser) {
        res.status(403).json({ error: "Accesso riservato al Superuser." });
        return;
      }
      const feedbackId = String(req.params.id || "");
      await deleteFeedback(feedbackId);
      res.json({ ok: true });
    } catch (err) {
      console.error("[DELETE FEEDBACK ERROR]", err);
      res.status(500).json({ error: "Errore eliminazione feedback." });
    }
  },
);

app.get(
  "/api/leaderboard",
  authMiddleware,
  async (_req: AuthRequest, res: Response) => {
    try {
      const rows = await getLeaderboardRows();
      const leaderboard = rows
        .map((r) => ({
          nickname: r.nickname,
          avatar: r.avatar,
          title: r.title,
          prestige: r.prestige,
          bountyStreak: r.bountyStreak,
          isSuperuser: r.isSuperuser,
          unlockedCount: r.unlockedCount,
          percent: Math.round((r.unlockedCount / MARSALA_POIS.length) * 100),
          easterEggCount: r.easterEggs.length,
          totalXp: r.bonusXp + r.poiXp + computeEggXp(r.easterEggs),
        }))
        .sort(
          (a, b) =>
            b.totalXp - a.totalXp ||
            b.prestige - a.prestige ||
            b.unlockedCount - a.unlockedCount,
        )
        .slice(0, 20);

      res.json({ leaderboard });
    } catch (err) {
      console.error("[LEADERBOARD ERROR]", err);
      res.status(500).json({ error: "Errore caricamento classifica." });
    }
  },
);

console.log("[MARSALA QUEST 8-BIT API] Connessione a PostgreSQL in corso...");

initDb()
  .then(async () => {
    const superUser = (process.env.SUPERUSER_USERNAME || "")
      .trim()
      .toLowerCase();
    const superNick = (process.env.SUPERUSER_NICKNAME || "Fabbro").trim();
    const superPass = process.env.SUPERUSER_PASSWORD || "";

    if (superUser && superPass) {
      const superHash = await bcrypt.hash(superPass, 10);
      await ensureSuperuser(
        "00000000-0000-4000-8000-000000000001",
        superUser,
        superNick,
        superHash,
      );
      console.log(
        `[MARSALA QUEST 8-BIT API] Superuser "${superUser}" sincronizzato da env.`,
      );
    }

    app.listen(PORT, () => {
      console.log(
        `[MARSALA QUEST 8-BIT API] Attiva su porta ${PORT} (PostgreSQL OK)`,
      );
    });
  })
  .catch((err) => {
    console.error("[FATAL] Errore connessione PostgreSQL:", err);
    process.exit(1);
  });
