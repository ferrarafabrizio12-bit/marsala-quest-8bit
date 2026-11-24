import 'dotenv/config';
import { Pool } from 'pg';
import {
  type AvatarConfig,
  DEFAULT_AVATAR,
  sanitizeAvatarConfig,
} from '../shared/cosmetics.js';

export interface UserRecord {
  id: string;
  username: string;
  nickname: string;
  passwordHash: string;
  avatar: AvatarConfig;
  createdAt: string;
}

export interface UnlockRecord {
  poiId: string;
  photoDataUrl: string;
  unlockedAt: string;
  lat: number;
  lng: number;
  accuracy: number;
  xpEarned: number;
}

export interface LeaderboardRow {
  userId: string;
  nickname: string;
  avatar: AvatarConfig;
  unlockedCount: number;
  poiXp: number;
  easterEggs: string[];
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL mancante nelle variabili d’ambiente.');
}

const isLocalDb =
  connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

export const pool = new Pool({
  connectionString,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 10000,
});

const DEFAULT_AVATAR_JSON = JSON.stringify(DEFAULT_AVATAR);

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_config JSONB NOT NULL DEFAULT '${DEFAULT_AVATAR_JSON}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_config JSONB NOT NULL DEFAULT '${DEFAULT_AVATAR_JSON}'::jsonb;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname_lower
      ON users (LOWER(nickname));

    CREATE TABLE IF NOT EXISTS unlocks (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      poi_id TEXT NOT NULL,
      photo_data_url TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      accuracy INTEGER NOT NULL DEFAULT 0,
      xp_earned INTEGER NOT NULL,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, poi_id)
    );

    CREATE TABLE IF NOT EXISTS easter_eggs (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      egg_id TEXT NOT NULL,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, egg_id)
    );
  `);
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const { rows } = await pool.query(
    `SELECT id, username, nickname, password_hash, avatar_config, created_at
     FROM users WHERE username = $1`,
    [username]
  );
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    username: r.username,
    nickname: r.nickname,
    passwordHash: r.password_hash,
    avatar: sanitizeAvatarConfig(r.avatar_config),
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const { rows } = await pool.query(
    `SELECT id, username, nickname, password_hash, avatar_config, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    username: r.username,
    nickname: r.nickname,
    passwordHash: r.password_hash,
    avatar: sanitizeAvatarConfig(r.avatar_config),
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function isNicknameTaken(nickname: string, excludeUserId?: string): Promise<boolean> {
  const { rows } = excludeUserId
    ? await pool.query(
        `SELECT 1 FROM users WHERE LOWER(nickname) = LOWER($1) AND id <> $2 LIMIT 1`,
        [nickname, excludeUserId]
      )
    : await pool.query(`SELECT 1 FROM users WHERE LOWER(nickname) = LOWER($1) LIMIT 1`, [nickname]);
  return rows.length > 0;
}

export async function createUser(user: {
  id: string;
  username: string;
  nickname: string;
  passwordHash: string;
  avatar: AvatarConfig;
}): Promise<UserRecord> {
  const { rows } = await pool.query(
    `INSERT INTO users (id, username, nickname, password_hash, avatar_config)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id, username, nickname, password_hash, avatar_config, created_at`,
    [user.id, user.username, user.nickname, user.passwordHash, JSON.stringify(user.avatar)]
  );
  const r = rows[0];
  return {
    id: r.id,
    username: r.username,
    nickname: r.nickname,
    passwordHash: r.password_hash,
    avatar: sanitizeAvatarConfig(r.avatar_config),
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function updateUserNickname(userId: string, nickname: string): Promise<void> {
  await pool.query(`UPDATE users SET nickname = $1 WHERE id = $2`, [nickname, userId]);
}

export async function updateUserAvatar(userId: string, avatar: AvatarConfig): Promise<void> {
  await pool.query(`UPDATE users SET avatar_config = $1::jsonb WHERE id = $2`, [
    JSON.stringify(avatar),
    userId,
  ]);
}

export async function getUserUnlocks(userId: string): Promise<Record<string, UnlockRecord>> {
  const { rows } = await pool.query(
    `SELECT poi_id, photo_data_url, lat, lng, accuracy, xp_earned, unlocked_at
     FROM unlocks WHERE user_id = $1`,
    [userId]
  );
  const map: Record<string, UnlockRecord> = {};
  for (const r of rows) {
    map[r.poi_id] = {
      poiId: r.poi_id,
      photoDataUrl: r.photo_data_url,
      lat: Number(r.lat),
      lng: Number(r.lng),
      accuracy: Number(r.accuracy),
      xpEarned: Number(r.xp_earned),
      unlockedAt: new Date(r.unlocked_at).toISOString(),
    };
  }
  return map;
}

export async function getUserEasterEggs(userId: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT egg_id FROM easter_eggs WHERE user_id = $1 ORDER BY unlocked_at ASC`,
    [userId]
  );
  return rows.map((r) => String(r.egg_id));
}

export async function upsertUnlock(
  userId: string,
  record: Omit<UnlockRecord, 'unlockedAt'>
): Promise<UnlockRecord> {
  const { rows } = await pool.query(
    `INSERT INTO unlocks (user_id, poi_id, photo_data_url, lat, lng, accuracy, xp_earned)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, poi_id)
     DO UPDATE SET
       photo_data_url = EXCLUDED.photo_data_url,
       lat = EXCLUDED.lat,
       lng = EXCLUDED.lng,
       accuracy = EXCLUDED.accuracy,
       xp_earned = EXCLUDED.xp_earned,
       unlocked_at = NOW()
     RETURNING poi_id, photo_data_url, lat, lng, accuracy, xp_earned, unlocked_at`,
    [
      userId,
      record.poiId,
      record.photoDataUrl,
      record.lat,
      record.lng,
      record.accuracy,
      record.xpEarned,
    ]
  );
  const r = rows[0];
  return {
    poiId: r.poi_id,
    photoDataUrl: r.photo_data_url,
    lat: Number(r.lat),
    lng: Number(r.lng),
    accuracy: Number(r.accuracy),
    xpEarned: Number(r.xp_earned),
    unlockedAt: new Date(r.unlocked_at).toISOString(),
  };
}

export async function addEasterEgg(userId: string, eggId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `INSERT INTO easter_eggs (user_id, egg_id) VALUES ($1, $2)
     ON CONFLICT (user_id, egg_id) DO NOTHING`,
    [userId, eggId]
  );
  return (rowCount ?? 0) > 0;
}

export async function getLeaderboardRows(): Promise<LeaderboardRow[]> {
  const [usersRes, eggsRes] = await Promise.all([
    pool.query(`
      SELECT u.id AS user_id, u.nickname, u.avatar_config,
        COUNT(un.poi_id)::int AS unlocked_count,
        COALESCE(SUM(un.xp_earned), 0)::int AS poi_xp
      FROM users u
      LEFT JOIN unlocks un ON un.user_id = u.id
      GROUP BY u.id, u.nickname, u.avatar_config
    `),
    pool.query(`SELECT user_id, egg_id FROM easter_eggs`),
  ]);

  const eggsByUser = new Map<string, string[]>();
  for (const row of eggsRes.rows) {
    const list = eggsByUser.get(row.user_id) || [];
    list.push(row.egg_id);
    eggsByUser.set(row.user_id, list);
  }

  return usersRes.rows.map((r) => ({
    userId: r.user_id,
    nickname: r.nickname,
    avatar: sanitizeAvatarConfig(r.avatar_config),
    unlockedCount: Number(r.unlocked_count),
    poiXp: Number(r.poi_xp),
    easterEggs: eggsByUser.get(r.user_id) || [],
  }));
}