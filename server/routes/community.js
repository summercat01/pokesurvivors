import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const MAX_LEN = 300;

// GET /api/community?page=1 — 최신 글 목록 (삭제 안 된 것만)
router.get('/', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 30;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT id, user_id, nickname, content, created_at
       FROM community_posts
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM community_posts WHERE deleted_at IS NULL`,
    );
    res.json({
      posts: result.rows,
      total: parseInt(countRes.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error('[community GET]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// POST /api/community — 글 작성 (로그인 필요)
router.post('/', requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: '내용을 입력해주세요' });
  }
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({ error: '내용을 입력해주세요' });
  }
  if (trimmed.length > MAX_LEN) {
    return res.status(400).json({ error: `최대 ${MAX_LEN}자까지 입력 가능합니다` });
  }

  // 밴 여부 확인
  try {
    const banCheck = await pool.query(
      `SELECT banned_at FROM players WHERE id = $1`, [req.user.userId],
    );
    if (banCheck.rows[0]?.banned_at) {
      return res.status(403).json({ error: '이용이 정지된 계정입니다' });
    }
  } catch { /* players 조회 실패 시 통과 */ }

  // 닉네임 조회
  let nickname = req.user.username;
  try {
    const nickRes = await pool.query(
      `SELECT nickname FROM players WHERE id = $1`, [req.user.userId],
    );
    if (nickRes.rows[0]) nickname = nickRes.rows[0].nickname;
  } catch { /* 닉네임 조회 실패 시 username 사용 */ }

  try {
    const result = await pool.query(
      `INSERT INTO community_posts (user_id, nickname, content)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, nickname, content, created_at`,
      [req.user.userId, nickname, trimmed],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[community POST]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// DELETE /api/community/:id — 본인 글 삭제 (또는 어드민)
router.delete('/:id', requireAuth, async (req, res) => {
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: '잘못된 요청' });

  try {
    const postRes = await pool.query(
      `SELECT user_id, deleted_at FROM community_posts WHERE id = $1`, [postId],
    );
    const post = postRes.rows[0];
    if (!post) return res.status(404).json({ error: '글을 찾을 수 없습니다' });
    if (post.deleted_at) return res.status(404).json({ error: '이미 삭제된 글입니다' });

    const isOwner = String(post.user_id) === String(req.user.userId);
    const isAdmin = req.user.isAdmin === true;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: '삭제 권한이 없습니다' });
    }

    const deletedBy = isAdmin && !isOwner ? 'admin' : 'user';
    await pool.query(
      `UPDATE community_posts SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2`,
      [deletedBy, postId],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[community DELETE]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// POST /api/community/:id/report — 신고
router.post('/:id/report', requireAuth, async (req, res) => {
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: '잘못된 요청' });

  const { reason } = req.body;
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    return res.status(400).json({ error: '신고 사유를 입력해주세요' });
  }
  const trimmedReason = reason.trim().slice(0, 200);

  try {
    const postRes = await pool.query(
      `SELECT id, deleted_at FROM community_posts WHERE id = $1`, [postId],
    );
    if (!postRes.rows[0] || postRes.rows[0].deleted_at) {
      return res.status(404).json({ error: '글을 찾을 수 없습니다' });
    }

    await pool.query(
      `INSERT INTO community_reports (post_id, reporter_id, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, reporter_id) DO UPDATE SET reason = EXCLUDED.reason`,
      [postId, req.user.userId, trimmedReason],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[community REPORT]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
