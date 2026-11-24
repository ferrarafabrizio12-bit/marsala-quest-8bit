import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import {
  addEasterEgg,
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
  upsertUnlock,
} from './db.js';
import { EASTER_EGGS, MARSALA_POIS, haversineMeters } from '../shared/pois.js';
import {
  DEFAULT_AVATAR,
  getUnlockedCosmeticIds,
  sanitizeAvatarConfig,
} from '../shared/cosmetics.js';

const app = express();
app.set('trust proxy', 1);

const PORT = Number(process.env.PORT) || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

const JWT_SECRET =
  process.env.JWT_SECRET || (IS_PROD ? '' : 'dev-only-lilibeo-secret-not-for-prod');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET è obbligatoria in produzione.');
}

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const isLocalNetworkOrigin = (origin: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
    origin
  );

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, '');
      const isAllowed = allowedOrigins.includes(normalized);
      const isLocal = !IS_PROD && isLocalNetworkOrigin(normalized);
      const isVercel = normalized.endsWith('.vercel.app');

      if (isAllowed || isLocal || isVercel) {
        return callback(null, true);
      }
      return callback(new Error(`Origine non consentita da CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '8mb' }));

interface AuthRequest extends Request {
  userId?: string;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token mancante. Effettua il login.' });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Sessione scaduta. Effettua di nuovo il login.' });
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
  easterEggs: string[]
): number {
  const poiXp = Object.values(unlocks).reduce((sum, u) => sum + u.xpEarned, 0);
  return poiXp + computeEggXp(easterEggs);
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'marsala-quest-8bit-api' });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, nickname, password, gender } = req.body as {
      username?: string;
      nickname?: string;
      password?: string;
      gender?: string;
    };

    const cleanUser = (username || '').trim().toLowerCase();
    const cleanNick = (nickname || '').trim();

    if (cleanUser.length < 3 || cleanUser.length > 30) {
      res.status(400).json({ error: 'Username tra 3 e 30 caratteri.' });
      return;
    }
    if (cleanNick.length < 2 || cleanNick.length > 20) {
      res.status(400).json({ error: 'Nickname tra 2 e 20 caratteri.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password minimo 6 caratteri.' });
      return;
    }

    if (await findUserByUsername(cleanUser)) {
      res.status(409).json({ error: 'Username già registrato.' });
      return;
    }
    if (await isNicknameTaken(cleanNick)) {
      res.status(409).json({ error: 'Nickname già scelto da un altro player.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const initialAvatar = {
      ...DEFAULT_AVATAR,
      gender: gender === 'female' ? ('female' as const) : ('male' as const),
    };

    const user = await createUser({
      id: crypto.randomUUID(),
      username: cleanUser,
      nickname: cleanNick,
      passwordHash,
      avatar: initialAvatar,
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ error: 'Errore interno durante la registrazione.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };
    const cleanUser = (username || '').trim().toLowerCase();

    const user = await findUserByUsername(cleanUser);
    if (!user || !password || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Username o password non validi.' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Errore interno durante il login.' });
  }
});

app.get('/api/progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'Utente non trovato.' });
      return;
    }
    const [unlocks, easterEggs] = await Promise.all([
      getUserUnlocks(user.id),
      getUserEasterEggs(user.id),
    ]);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
      unlocks,
      easterEggs,
      totalXp: computeTotalXp(unlocks, easterEggs),
    });
  } catch (err) {
    console.error('[GET PROGRESS ERROR]', err);
    res.status(500).json({ error: 'Impossibile caricare i progressi.' });
  }
});

app.patch('/api/auth/nickname', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cleanNick = ((req.body as { nickname?: string }).nickname || '').trim();
    if (cleanNick.length < 2 || cleanNick.length > 20) {
      res.status(400).json({ error: 'Nickname tra 2 e 20 caratteri.' });
      return;
    }
    if (await isNicknameTaken(cleanNick, req.userId!)) {
      res.status(409).json({ error: 'Nickname già utilizzato.' });
      return;
    }
    await updateUserNickname(req.userId!, cleanNick);
    res.json({ nickname: cleanNick });
  } catch (err) {
    console.error('[UPDATE NICKNAME ERROR]', err);
    res.status(500).json({ error: 'Errore aggiornamento nickname.' });
  }
});

// --- AGGIORNA AVATAR & COSMETICS (con verifica sblocchi lato server) ---
app.patch('/api/auth/avatar', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const candidate = sanitizeAvatarConfig(req.body);
    const [unlocks, easterEggs] = await Promise.all([
      getUserUnlocks(req.userId!),
      getUserEasterEggs(req.userId!),
    ]);

    const unlockedSet = new Set(
      getUnlockedCosmeticIds(Object.keys(unlocks).length, easterEggs)
    );

    const chosen = [candidate.hat, candidate.glasses, candidate.top, candidate.bottom];
    if (!chosen.every((id) => unlockedSet.has(id))) {
      res.status(403).json({
        error: 'Uno o più indumenti selezionati non sono ancora stati sbloccati!',
      });
      return;
    }

    await updateUserAvatar(req.userId!, candidate);
    res.json({ avatar: candidate });
  } catch (err) {
    console.error('[UPDATE AVATAR ERROR]', err);
    res.status(500).json({ error: 'Errore durante il salvataggio del look.' });
  }
});

app.post('/api/progress/unlock', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { poiId, lat, lng, accuracy, photoDataUrl } = req.body as {
      poiId?: string;
      lat?: number;
      lng?: number;
      accuracy?: number;
      photoDataUrl?: string;
    };

    const poi = MARSALA_POIS.find((p) => p.id === poiId);
    if (!poi) {
      res.status(404).json({ error: 'Punto di interesse non valido.' });
      return;
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      res.status(400).json({ error: 'Coordinate GPS reali obbligatorie.' });
      return;
    }
    if (!photoDataUrl || !photoDataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'Foto obbligatoria per sbloccare la Card.' });
      return;
    }

    const gpsMargin = Math.min(Math.max(accuracy || 0, 0), 45);
    const distance = haversineMeters(lat, lng, poi.lat, poi.lng);

    if (distance > poi.unlockRadiusMeters + gpsMargin) {
      res.status(403).json({
        error: `Sei a ${Math.round(distance)}m da ${poi.name}. Avvicinati entro ${poi.unlockRadiusMeters}m!`,
        distance: Math.round(distance),
      });
      return;
    }

    const unlock = await upsertUnlock(req.userId!, {
      poiId: poi.id,
      photoDataUrl,
      lat,
      lng,
      accuracy: Math.round(accuracy || 0),
      xpEarned: poi.xp,
    });

    const unlocks = await getUserUnlocks(req.userId!);
    const newlyUnlockedEggs: string[] = [];

    const wineries = ['cantine-florio', 'cantine-pellegrino', 'cantine-donnafugata'];
    if (wineries.every((id) => Boolean(unlocks[id]))) {
      const added = await addEasterEgg(req.userId!, 'woodhouse-1773');
      if (added) newlyUnlockedEggs.push('woodhouse-1773');
    }

    const centroIds = MARSALA_POIS.filter((p) => p.category === 'CENTRO_STORICO').map((p) => p.id);
    if (centroIds.every((id) => Boolean(unlocks[id]))) {
      const added = await addEasterEgg(req.userId!, 'custode-cassaro');
      if (added) newlyUnlockedEggs.push('custode-cassaro');
    }

    const easterEggs = await getUserEasterEggs(req.userId!);
    res.json({
      unlock,
      easterEggs,
      newlyUnlockedEggs,
      totalXp: computeTotalXp(unlocks, easterEggs),
    });
  } catch (err) {
    console.error('[UNLOCK ERROR]', err);
    res.status(500).json({ error: 'Errore durante il salvataggio della Card.' });
  }
});

app.post('/api/progress/easter-egg', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { eggId } = req.body as { eggId?: string };
    const egg = EASTER_EGGS.find((e) => e.id === eggId);
    if (!egg) {
      res.status(404).json({ error: 'Easter egg inesistente.' });
      return;
    }

    const isNew = await addEasterEgg(req.userId!, egg.id);
    const [unlocks, easterEggs] = await Promise.all([
      getUserUnlocks(req.userId!),
      getUserEasterEggs(req.userId!),
    ]);
    res.json({
      isNew,
      egg,
      easterEggs,
      totalXp: computeTotalXp(unlocks, easterEggs),
    });
  } catch (err) {
    console.error('[EASTER EGG ERROR]', err);
    res.status(500).json({ error: 'Errore salvataggio segreto.' });
  }
});

app.get('/api/leaderboard', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await getLeaderboardRows();
    const leaderboard = rows
      .map((r) => ({
        nickname: r.nickname,
        avatar: r.avatar,
        unlockedCount: r.unlockedCount,
        percent: Math.round((r.unlockedCount / MARSALA_POIS.length) * 100),
        easterEggCount: r.easterEggs.length,
        totalXp: r.poiXp + computeEggXp(r.easterEggs),
      }))
      .sort((a, b) => b.totalXp - a.totalXp || b.unlockedCount - a.unlockedCount)
      .slice(0, 20);

    res.json({ leaderboard });
  } catch (err) {
    console.error('[LEADERBOARD ERROR]', err);
    res.status(500).json({ error: 'Errore caricamento classifica.' });
  }
});

console.log('[MARSALA QUEST 8-BIT API] Connessione a PostgreSQL in corso...');

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[MARSALA QUEST 8-BIT API] Attiva su porta ${PORT} (PostgreSQL OK)`);
    });
  })
  .catch((err) => {
    console.error('[FATAL] Errore connessione PostgreSQL:', err);
    process.exit(1);
  });