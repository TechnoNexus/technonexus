-- ============================================================
-- TechnoNexus — Supabase Schema (Full)
-- Run in Supabase SQL Editor → New Query
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. USER PROFILES
--    Created automatically on sign-up via trigger.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  avatar_url  TEXT,
  bio         TEXT,
  push_token  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile (push_token, etc.)
CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Auto-create a blank profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 2. USER GAMES (Nexus Vault — already exists, adding RLS)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_games (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_title  TEXT NOT NULL,
  config_json JSONB NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 3. GAME SESSIONS
--    One row per completed multiplayer round in AI Forge.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  host_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  game_title   TEXT NOT NULL,
  game_type    TEXT NOT NULL,                    -- 'performance' | 'text' | 'quiz'
  player_count SMALLINT DEFAULT 1,
  results      JSONB NOT NULL DEFAULT '[]',      -- [{ name, score, judgeComment }]
  verdict      JSONB                             -- { roundSummary, mvpVerdict, bottleneckVerdict }
);

-- ────────────────────────────────────────────────────────────
-- 4. GLOBAL LEADERBOARD
--    Aggregated wins & sessions per named player (cross-game).
--    Upserted from the client on round completion.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_name  TEXT NOT NULL UNIQUE,
  wins         INTEGER DEFAULT 0 NOT NULL,
  total_games  INTEGER DEFAULT 0 NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Helper function: upsert a win for a player
CREATE OR REPLACE FUNCTION public.record_win(p_name TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.leaderboard (player_name, wins, total_games, updated_at)
  VALUES (p_name, 1, 1, now())
  ON CONFLICT (player_name) DO UPDATE
    SET wins        = leaderboard.wins + 1,
        total_games = leaderboard.total_games + 1,
        updated_at  = now();
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- user_profiles: public read, owner write
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_public_read"
  ON public.user_profiles FOR SELECT USING (true);

CREATE POLICY "profiles_owner_update"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- user_games: owner read/write only
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_owner_select"
  ON public.user_games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "games_owner_insert"
  ON public.user_games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "games_owner_update"
  ON public.user_games FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "games_owner_delete"
  ON public.user_games FOR DELETE
  USING (auth.uid() = user_id);

-- game_sessions: public read (anyone can see match history), host insert only
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_public_read"
  ON public.game_sessions FOR SELECT USING (true);

CREATE POLICY "sessions_host_insert"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id OR host_id IS NULL);

-- leaderboard: public read, anyone can upsert via record_game()
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboard_public_read"
  ON public.leaderboard FOR SELECT USING (true);

CREATE POLICY "leaderboard_anon_upsert"
  ON public.leaderboard FOR INSERT WITH CHECK (true);

CREATE POLICY "leaderboard_anon_update"
  ON public.leaderboard FOR UPDATE USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_games_user_id    ON public.user_games (user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_host_id ON public.game_sessions (host_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_wins       ON public.leaderboard (wins DESC);
st_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_wins       ON public.leaderboard (wins DESC);
