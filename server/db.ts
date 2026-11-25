import "dotenv/config";
import { Pool } from "pg";
import {
  type AvatarConfig,
  DEFAULT_AVATAR,
  DEFAULT_SUPERUSER_OVERRIDES,
  DEFAULT_TITLE_ID,
  type SuperuserOverrides,
  sanitizeAvatarConfig,
  sanitizeSuperuserOverrides,
  sanitizeTitleId,
} from "../shared/cosmetics.js";
import type { CardEdition } from "../shared/pois.js";

export interface UserRecord {
  id: string;
  username: string;
  nickname: string;
  passwordHash: string;
  avatar: AvatarConfig;
  title: string;
  prestige: number;
  bonusXp: number;
  bountyStreak: number;
  lastBountyDate: string | null;
  isSuperuser: boolean;
  superuserOverrides: SuperuserOverrides;
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
  isHolo: boolean;
  edition: CardEdition;
}

export interface LeaderboardRow {
  userId: string;
  nickname: string;
  avatar: AvatarConfig;
  title: string;
  prestige: number;
  bonusXp: number;
  bountyStreak: number;
  unlockedCount: number;
  poiXp: number;
  easterEggs: string[];
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL mancante nelle variabili d’ambiente.");
}

const isLocalDb =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

export const pool = new Pool({
  connectionString,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 10000,
});

const DEFAULT_AVATAR_JSON = JSON.stringify(DEFAULT_AVATAR);
const DEFAULT_OVERRIDES_JSON = JSON.stringify(DEFAULT_SUPERUSER_OVERRIDES);

function sanitizeEdition(raw: unknown): CardEdition {
  if (raw === "golden_hour" || raw === "night") return raw;
  return "standard";
}

function mapUserRow(r: Record<string, unknown>): UserRecord {
  return {
    id: String(r.id),
    username: String(r.username),
    nickname: String(r.nickname),
    passwordHash: String(r.password_hash),
    avatar: sanitizeAvatarConfig(r.avatar_config),
    title: sanitizeTitleId(r.equipped_title),
    prestige: Number(r.prestige || 0),
    bonusXp: Number(r.bonus_xp || 0),
    bountyStreak: Number(r.bounty_streak || 0),
    lastBountyDate: r.last_bounty_date ? String(r.last_bounty_date) : null,
    isSuperuser: Boolean(r.is_superuser),
    superuserOverrides: sanitizeSuperuserOverrides(r.superuser_overrides),
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_config JSONB NOT NULL DEFAULT '${DEFAULT_AVATAR_JSON}'::jsonb,
      equipped_title TEXT NOT NULL DEFAULT '${DEFAULT_TITLE_ID}',
      prestige INTEGER NOT NULL DEFAULT 0,
      bonus_xp INTEGER NOT NULL DEFAULT 0,
      bounty_streak INTEGER NOT NULL DEFAULT 0,
      last_bounty_date TEXT,
      is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
      superuser_overrides JSONB NOT NULL DEFAULT '${DEFAULT_OVERRIDES_JSON}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_config JSONB NOT NULL DEFAULT '${DEFAULT_AVATAR_JSON}'::jsonb,
      ADD COLUMN IF NOT EXISTS equipped_title TEXT NOT NULL DEFAULT '${DEFAULT_TITLE_ID}',
      ADD COLUMN IF NOT EXISTS prestige INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bonus_xp INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bounty_streak INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_bounty_date TEXT,
      ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS superuser_overrides JSONB NOT NULL DEFAULT '${DEFAULT_OVERRIDES_JSON}'::jsonb;

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
      is_holo BOOLEAN NOT NULL DEFAULT FALSE,
      edition TEXT NOT NULL DEFAULT 'standard',
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, poi_id)
    );

    ALTER TABLE unlocks
      ADD COLUMN IF NOT EXISTS is_holo BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS edition TEXT NOT NULL DEFAULT 'standard';

    CREATE TABLE IF NOT EXISTS easter_eggs (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      egg_id TEXT NOT NULL,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, egg_id)
    );
  `);
}

export async function ensureSuperuser(
  id: string,
  username: string,
  nickname: string,
  passwordHash: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO users (id, username, nickname, password_hash, avatar_config, equipped_title, is_superuser)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, TRUE)
     ON CONFLICT (username)
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       is_superuser = TRUE`,
    [
      id,
      username,
      nickname,
      passwordHash,
      DEFAULT_AVATAR_JSON,
      DEFAULT_TITLE_ID,
    ],
  );
}

const USER_COLUMNS = `id, username, nickname, password_hash, avatar_config, equipped_title, prestige, bonus_xp, bounty_streak, last_bounty_date, is_superuser, superuser_overrides, created_at`;

export async function findUserByUsername(
  username: string,
): Promise<UserRecord | null> {
  const { rows } = await pool.query(
    `SELECT ${USER_COLUMNS} FROM users WHERE username = $1`,
    [username],
  );
  return rows[0] ? mapUserRow(rows[0]) : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const { rows } = await pool.query(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] ? mapUserRow(rows[0]) : null;
}

export async function isNicknameTaken(
  nickname: string,
  excludeUserId?: string,
): Promise<boolean> {
  const { rows } = excludeUserId
    ? await pool.query(
        `SELECT 1 FROM users WHERE LOWER(nickname) = LOWER($1) AND id <> $2 LIMIT 1`,
        [nickname, excludeUserId],
      )
    : await pool.query(
        `SELECT 1 FROM users WHERE LOWER(nickname) = LOWER($1) LIMIT 1`,
        [nickname],
      );
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
    `INSERT INTO users (id, username, nickname, password_hash, avatar_config, equipped_title)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)
     RETURNING ${USER_COLUMNS}`,
    [
      user.id,
      user.username,
      user.nickname,
      user.passwordHash,
      JSON.stringify(user.avatar),
      DEFAULT_TITLE_ID,
    ],
  );
  return mapUserRow(rows[0]);
}

export async function updateUserNickname(
  userId: string,
  nickname: string,
): Promise<void> {
  await pool.query(`UPDATE users SET nickname = $1 WHERE id = $2`, [
    nickname,
    userId,
  ]);
}

export async function updateUserAvatar(
  userId: string,
  avatar: AvatarConfig,
): Promise<void> {
  await pool.query(`UPDATE users SET avatar_config = $1::jsonb WHERE id = $2`, [
    JSON.stringify(avatar),
    userId,
  ]);
}

export async function updateUserTitle(
  userId: string,
  titleId: string,
): Promise<void> {
  await pool.query(`UPDATE users SET equipped_title = $1 WHERE id = $2`, [
    titleId,
    userId,
  ]);
}

export async function updateSuperuserOverrides(
  userId: string,
  overrides: SuperuserOverrides,
): Promise<void> {
  await pool.query(
    `UPDATE users SET superuser_overrides = $1::jsonb WHERE id = $2`,
    [JSON.stringify(overrides), userId],
  );
}

export async function getUserUnlocks(
  userId: string,
): Promise<Record<string, UnlockRecord>> {
  const { rows } = await pool.query(
    `SELECT poi_id, photo_data_url, lat, lng, accuracy, xp_earned, is_holo, edition, unlocked_at
     FROM unlocks WHERE user_id = $1`,
    [userId],
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
      isHolo: Boolean(r.is_holo),
      edition: sanitizeEdition(r.edition),
      unlockedAt: new Date(r.unlocked_at).toISOString(),
    };
  }
  return map;
}

export async function getUserEasterEggs(userId: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT egg_id FROM easter_eggs WHERE user_id = $1 ORDER BY unlocked_at ASC`,
    [userId],
  );
  return rows.map((r) => String(r.egg_id));
}

export async function upsertUnlock(
  userId: string,
  record: Omit<UnlockRecord, "unlockedAt">,
): Promise<UnlockRecord> {
  const { rows } = await pool.query(
    `INSERT INTO unlocks (user_id, poi_id, photo_data_url, lat, lng, accuracy, xp_earned, is_holo, edition)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, poi_id)
     DO UPDATE SET
       photo_data_url = EXCLUDED.photo_data_url,
       lat = EXCLUDED.lat,
       lng = EXCLUDED.lng,
       accuracy = EXCLUDED.accuracy,
       xp_earned = GREATEST(unlocks.xp_earned, EXCLUDED.xp_earned),
       is_holo = unlocks.is_holo OR EXCLUDED.is_holo,
       edition = CASE
         WHEN EXCLUDED.edition <> 'standard' THEN EXCLUDED.edition
         ELSE unlocks.edition
       END,
       unlocked_at = NOW()
     RETURNING poi_id, photo_data_url, lat, lng, accuracy, xp_earned, is_holo, edition, unlocked_at`,
    [
      userId,
      record.poiId,
      record.photoDataUrl,
      record.lat,
      record.lng,
      record.accuracy,
      record.xpEarned,
      record.isHolo,
      record.edition,
    ],
  );
  const r = rows[0];
  return {
    poiId: r.poi_id,
    photoDataUrl: r.photo_data_url,
    lat: Number(r.lat),
    lng: Number(r.lng),
    accuracy: Number(r.accuracy),
    xpEarned: Number(r.xp_earned),
    isHolo: Boolean(r.is_holo),
    edition: sanitizeEdition(r.edition),
    unlockedAt: new Date(r.unlocked_at).toISOString(),
  };
}

export async function deleteUnlock(
  userId: string,
  poiId: string,
): Promise<void> {
  await pool.query(`DELETE FROM unlocks WHERE user_id = $1 AND poi_id = $2`, [
    userId,
    poiId,
  ]);
}

export async function deleteAllUnlocks(userId: string): Promise<void> {
  await pool.query(`DELETE FROM unlocks WHERE user_id = $1`, [userId]);
}

export async function claimDailyBountyReward(
  userId: string,
  todayStr: string,
  yesterdayStr: string,
): Promise<{
  claimedNow: boolean;
  bountyXpAwarded: number;
  bountyStreak: number;
  bonusXp: number;
}> {
  const user = await findUserById(userId);
  if (!user) throw new Error("Utente non trovato.");

  if (user.lastBountyDate === todayStr) {
    return {
      claimedNow: false,
      bountyXpAwarded: 0,
      bountyStreak: user.bountyStreak,
      bonusXp: user.bonusXp,
    };
  }

  const nextStreak =
    user.lastBountyDate === yesterdayStr ? user.bountyStreak + 1 : 1;
  const bountyXpAwarded = nextStreak >= 3 ? 150 : 100;

  const { rows } = await pool.query(
    `UPDATE users
     SET bonus_xp = bonus_xp + $1,
         bounty_streak = $2,
         last_bounty_date = $3
     WHERE id = $4
     RETURNING bonus_xp, bounty_streak`,
    [bountyXpAwarded, nextStreak, todayStr, userId],
  );

  return {
    claimedNow: true,
    bountyXpAwarded,
    bountyStreak: Number(rows[0].bounty_streak),
    bonusXp: Number(rows[0].bonus_xp),
  };
}

export async function activateUserPrestige(
  userId: string,
): Promise<UserRecord> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sumRes = await client.query(
      `SELECT COALESCE(SUM(xp_earned), 0)::int AS current_poi_xp
       FROM unlocks WHERE user_id = $1`,
      [userId],
    );
    const bankedXp = Number(sumRes.rows[0]?.current_poi_xp || 0);

    await client.query(`DELETE FROM unlocks WHERE user_id = $1`, [userId]);

    const userRes = await client.query(
      `UPDATE users
       SET prestige = prestige + 1,
           bonus_xp = bonus_xp + $1
       WHERE id = $2
       RETURNING ${USER_COLUMNS}`,
      [bankedXp, userId],
    );

    await client.query("COMMIT");
    return mapUserRow(userRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function addEasterEgg(
  userId: string,
  eggId: string,
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `INSERT INTO easter_eggs (user_id, egg_id) VALUES ($1, $2)
     ON CONFLICT (user_id, egg_id) DO NOTHING`,
    [userId, eggId],
  );
  return (rowCount ?? 0) > 0;
}

export async function removeEasterEgg(
  userId: string,
  eggId: string,
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM easter_eggs WHERE user_id = $1 AND egg_id = $2`,
    [userId, eggId],
  );
  return (rowCount ?? 0) > 0;
}

export async function setAllEasterEggs(
  userId: string,
  eggIds: string[],
): Promise<void> {
  for (const eggId of eggIds) {
    await addEasterEgg(userId, eggId);
  }
}

export async function clearAllEasterEggs(userId: string): Promise<void> {
  await pool.query(`DELETE FROM easter_eggs WHERE user_id = $1`, [userId]);
}

export async function getLeaderboardRows(): Promise<LeaderboardRow[]> {
  const [usersRes, eggsRes] = await Promise.all([
    pool.query(`
      SELECT u.id AS user_id, u.nickname, u.avatar_config, u.equipped_title, u.prestige, u.bonus_xp, u.bounty_streak,
        COUNT(un.poi_id)::int AS unlocked_count,
        COALESCE(SUM(un.xp_earned), 0)::int AS poi_xp
      FROM users u
      LEFT JOIN unlocks un ON un.user_id = u.id
      GROUP BY u.id, u.nickname, u.avatar_config, u.equipped_title, u.prestige, u.bonus_xp, u.bounty_streak
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
    title: sanitizeTitleId(r.equipped_title),
    prestige: Number(r.prestige || 0),
    bonusXp: Number(r.bonus_xp || 0),
    bountyStreak: Number(r.bounty_streak || 0),
    unlockedCount: Number(r.unlocked_count),
    poiXp: Number(r.poi_xp),
    easterEggs: eggsByUser.get(r.user_id) || [],
  }));
}
