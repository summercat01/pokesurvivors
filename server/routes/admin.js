import { Router } from 'express';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// 모든 admin 라우트에 requireAdmin 적용
router.use(requireAdmin);

// GET /api/admin/verify — 어드민 토큰 유효성 확인
router.get('/verify', (_req, res) => {
  res.json({ ok: true });
});

// GET /api/admin/community — 전체 글 목록 (신고수 포함, 삭제 글도 포함)
router.get('/community', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.user_id, p.nickname, p.content, p.created_at,
              p.deleted_at, p.deleted_by,
              COUNT(r.id)::int AS report_count
       FROM community_posts p
       LEFT JOIN community_reports r ON r.post_id = p.id
       GROUP BY p.id
       ORDER BY report_count DESC, p.created_at DESC
       LIMIT 200`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[admin community GET]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /api/admin/reports — 신고 목록
router.get('/reports', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.post_id, r.reporter_id, r.reason, r.created_at,
              p.nickname AS post_author, p.content AS post_content, p.deleted_at
       FROM community_reports r
       JOIN community_posts p ON p.id = r.post_id
       ORDER BY r.created_at DESC
       LIMIT 200`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[admin reports GET]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// DELETE /api/admin/community/:id — 강제 삭제
router.delete('/community/:id', async (req, res) => {
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: '잘못된 요청' });

  try {
    await pool.query(
      `UPDATE community_posts SET deleted_at = NOW(), deleted_by = 'admin' WHERE id = $1`,
      [postId],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin community DELETE]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// DELETE /api/admin/report/:id — 신고 기각 (신고 레코드 삭제)
router.delete('/report/:id', async (req, res) => {
  const reportId = parseInt(req.params.id);
  if (isNaN(reportId)) return res.status(400).json({ error: '잘못된 요청' });

  try {
    await pool.query(`DELETE FROM community_reports WHERE id = $1`, [reportId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin report DELETE]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /api/admin/inquiries — 문의 목록
router.get('/inquiries', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, nickname, category, content, created_at
       FROM inquiries
       ORDER BY created_at DESC
       LIMIT 500`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[admin inquiries GET]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// POST /api/admin/ban/:userId — 유저 밴
router.post('/ban/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query(
      `UPDATE players SET banned_at = NOW() WHERE id = $1`, [userId],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin ban]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// POST /api/admin/unban/:userId — 밴 해제
router.post('/unban/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query(
      `UPDATE players SET banned_at = NULL WHERE id = $1`, [userId],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin unban]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /api/admin/users — 유저 목록 (검색용)
router.get('/users', async (req, res) => {
  const q = (req.query.q || '').toString().trim().slice(0, 50);
  try {
    const result = await pool.query(
      `SELECT id, username, nickname, is_admin, banned_at, created_at
       FROM players
       WHERE ($1 = '' OR username ILIKE $2 OR nickname ILIKE $2)
       ORDER BY created_at DESC
       LIMIT 50`,
      [q, `%${q}%`],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[admin users GET]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
