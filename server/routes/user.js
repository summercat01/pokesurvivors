import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── 검증 상수 ──────────────────────────────────────────
const MAX_STAGE = 17;
const MAX_TIME  = 1_800_000; // 30분 (ms) — 15분 게임 + 보스 여유
const MAX_GOLD  = 100_000_000;
const MAX_KILLS = 200_000;
const MAX_WAVE  = 500;
const MAX_UPG_LEVEL = 20;

function clampInt(val, min, max, fallback = 0) {
  const n = Math.round(Number(val));
  return isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
}

function sanitizeUpgrades(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result = {};
  for (const [key, val] of Object.entries(raw)) {
    if (typeof key !== 'string' || key.length > 64) continue;
    const level = clampInt(val, 0, MAX_UPG_LEVEL, 0);
    result[key] = level;
  }
  return result;
}

// GET /api/user/:id — 유저 레코드 조회 (공개)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT user_id, total_gold, best_wave, best_kills, best_time,
              best_stage, rank_stage, rank_time, upgrades
       FROM user_records WHERE user_id = $1`,
      [id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: '레코드 없음' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[user GET]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// POST /api/user/:id — 유저 레코드 저장 (인증 필요, 본인만)
router.post('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  // 본인 계정만 수정 가능
  if (req.user.userId !== id) {
    return res.status(403).json({ error: '권한이 없습니다' });
  }

  // 값 검증 및 클램핑
  const total_gold = clampInt(req.body.total_gold, 0, MAX_GOLD);
  const best_wave  = clampInt(req.body.best_wave,  0, MAX_WAVE);
  const best_kills = clampInt(req.body.best_kills, 0, MAX_KILLS);
  const best_time  = clampInt(req.body.best_time,  0, MAX_TIME);
  const best_stage = clampInt(req.body.best_stage, 1, MAX_STAGE, 1);
  const rank_stage = clampInt(req.body.rank_stage, 1, MAX_STAGE, 1);
  const rank_time  = clampInt(req.body.rank_time,  0, MAX_TIME);
  const upgrades   = sanitizeUpgrades(req.body.upgrades);

  console.log(`[user POST] id=${id} rank_stage=${rank_stage} rank_time=${rank_time}`);

  try {
    await pool.query(
      `INSERT INTO user_records
         (user_id, total_gold, best_wave, best_kills, best_time,
          best_stage, rank_stage, rank_time, upgrades, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         total_gold = EXCLUDED.total_gold,
         best_wave  = GREATEST(user_records.best_wave,  EXCLUDED.best_wave),
         best_kills = GREATEST(user_records.best_kills, EXCLUDED.best_kills),
         best_time  = GREATEST(user_records.best_time,  EXCLUDED.best_time),
         best_stage = GREATEST(user_records.best_stage, EXCLUDED.best_stage),
         rank_stage = GREATEST(user_records.rank_stage, EXCLUDED.rank_stage),
         rank_time  = CASE
           WHEN EXCLUDED.rank_stage > user_records.rank_stage THEN EXCLUDED.rank_time
           ELSE GREATEST(user_records.rank_time, EXCLUDED.rank_time)
         END,
         upgrades   = EXCLUDED.upgrades,
         updated_at = NOW()`,
      [id, total_gold, best_wave, best_kills, best_time,
       best_stage, rank_stage, rank_time, JSON.stringify(upgrades)],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[user POST]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
