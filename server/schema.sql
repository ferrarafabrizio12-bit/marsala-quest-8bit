CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_config JSONB NOT NULL DEFAULT '{"gender":"male","hat":"hat-cap-red","glasses":"glasses-none","top":"top-explorer","bottom":"bottom-jeans"}'::jsonb,
  equipped_title TEXT NOT NULL DEFAULT 'title-novizio',
  prestige INTEGER NOT NULL DEFAULT 0,
  bonus_xp INTEGER NOT NULL DEFAULT 0,
  bounty_streak INTEGER NOT NULL DEFAULT 0,
  last_bounty_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS easter_eggs (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  egg_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, egg_id)
);
