import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import {
  activateUserPrestige,
  addEasterEgg,
  claimDailyBountyReward,
  createUser,
  findUserById,
  findUserByUsername,
  getLeaderboardRows,
  getUserEasterEggs,
  getUserUnlocks,
  initDb,
  isNicknameTaken,
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
  getTitleById,
  getUnlockedCosmeticIds,
  isTitleUnlocked,
  sanitizeAvatarConfig,
  sanitizeTitleId,
} from "../shared/cosmetics.js";

const app = express();
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT) || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

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

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "marsala-quest-8bit-api" });
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { username, nickname, password, gender } = req.body as {
      username?: string;
      nickname?: string;
      password?: string;
      gender?: string;
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
    const initialAvatar = {
      ...DEFAULT_AVATAR,
      gender: gender === "female" ? ("female" as const) : ("male" as const),
    };

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

// --- EQUIPAGGIA TITOLO SOTTO IL NICKNAME ---
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

// --- ATTIVA MODALITÀ PRESTIGIO (NEW GAME+) ---
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

      const unlocks = await getUserUnlocks(user.id);
      if (Object.keys(unlocks).length < MARSALA_POIS.length) {
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
      res
        .status(500)
        .json({ error: "Errore durante l’attivazione del Prestigio." });
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

      const existingUnlocks = await getUserUnlocks(user.id);
      const prevUnlock = existingUnlocks[poi.id];

      // Edizione Golden Hour / Notturna (da orario Italia o tema attivo)
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
        photoDataUrl,
        lat,
        lng,
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
  .then(() => {
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
