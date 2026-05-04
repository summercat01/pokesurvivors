-- Pokemon Survivors DB 스키마
-- 실행: psql -U postgres -d pokesurv -f schema.sql

CREATE TABLE IF NOT EXISTS players (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname      VARCHAR(50) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_records (
  user_id     UUID    PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  total_gold  BIGINT  DEFAULT 0,
  best_wave   INT     DEFAULT 0,
  best_kills  INT     DEFAULT 0,
  best_time   BIGINT  DEFAULT 0,
  best_stage  INT     DEFAULT 1,
  rank_stage  INT     DEFAULT 1,
  rank_time   BIGINT  DEFAULT 0,
  upgrades    JSONB   DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 랭킹 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_user_records_rank
  ON user_records (rank_stage DESC, rank_time DESC);
