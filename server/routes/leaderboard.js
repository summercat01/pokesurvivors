import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/leaderboard?page=1&limit=20
router.get('/', async (req, res) => {
  const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * limit;

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT
           ROW_NUMBER() OVER (ORDER BY r.rank_stage DESC, r.rank_time DESC) AS rank,
           p.nickname,
           r.rank_stage AS best_stage,
           r.rank_time  AS best_time
         FROM user_records r
         JOIN players p ON p.id = r.user_id
         ORDER BY r.rank_stage DESC, r.rank_time DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      pool.query(
        `SELECT COUNT(*) FROM user_records r JOIN players p ON p.id = r.user_id`,
      ),
    ]);

    res.json({
      entries: dataRes.rows,
      total:   parseInt(countRes.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error('[leaderboard]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
