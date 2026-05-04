import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/leaderboard — 상위 50명
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         ROW_NUMBER() OVER (ORDER BY r.rank_stage DESC, r.rank_time DESC) AS rank,
         p.nickname,
         r.rank_stage AS best_stage,
         r.rank_time  AS best_time
       FROM user_records r
       JOIN players p ON p.id = r.user_id
       ORDER BY r.rank_stage DESC, r.rank_time DESC
       LIMIT 50`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[leaderboard]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
