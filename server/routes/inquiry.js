import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const VALID_CATEGORIES = ['bug', 'update', 'other'];

// POST /api/inquiry — 문의 제출 (로그인 필요)
router.post('/', requireAuth, async (req, res) => {
  const { category, content } = req.body;

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: '카테고리를 선택해주세요' });
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: '내용을 입력해주세요' });
  }
  if (content.trim().length > 1000) {
    return res.status(400).json({ error: '최대 1000자까지 입력 가능합니다' });
  }

  // 닉네임 조회
  let nickname = req.user.username;
  try {
    const nickRes = await pool.query(
      `SELECT nickname FROM players WHERE id = $1`, [req.user.userId],
    );
    if (nickRes.rows[0]) nickname = nickRes.rows[0].nickname;
  } catch { /* 닉네임 조회 실패 시 username 사용 */ }

  try {
    await pool.query(
      `INSERT INTO inquiries (user_id, nickname, category, content)
       VALUES ($1, $2, $3, $4)`,
      [req.user.userId, nickname, category, content.trim()],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[inquiry POST]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
