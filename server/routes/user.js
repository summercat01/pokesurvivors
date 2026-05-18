import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/user/:id — 유저 레코드 조회
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

// POST /api/user/:id — 유저 레코드 저장 (upsert)
router.post('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    total_gold = 0,
    best_wave  = 0,
    best_kills = 0,
    best_time  = 0,
    best_stage = 1,
    rank_stage = 1,
    rank_time  = 0,
    upgrades   = {},
  } = req.body;

  console.log(`[user POST] id=${id} rank_stage=${rank_stage} rank_time=${rank_time} best_time=${best_time}`);
  try {
    await pool.query(
      `INSERT INTO user_records
         (user_id, total_gold, best_wave, best_kills, best_time,
          best_stage, rank_stage, rank_time, upgrades, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         total_gold = EXCLUDED.total_gold,
         best_wave  = EXCLUDED.best_wave,
         best_kills = EXCLUDED.best_kills,
         best_time  = EXCLUDED.best_time,
         best_stage = EXCLUDED.best_stage,
         rank_stage = EXCLUDED.rank_stage,
         rank_time  = EXCLUDED.rank_time,
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
