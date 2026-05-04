import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';

const router = Router();

// POST /api/signup
router.post('/signup', async (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password || !nickname) {
    return res.status(400).json({ error: '필수 항목 누락' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO players (username, password_hash, nickname)
       VALUES ($1, $2, $3)
       RETURNING id, username, nickname`,
      [username, hash, nickname],
    );
    const user = result.rows[0];

    // 초기 레코드 생성
    await pool.query(
      `INSERT INTO user_records (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [user.id],
    );

    res.json({ id: user.id, username: user.username, nickname: user.nickname });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: '이미 사용 중인 아이디입니다' });
    }
    console.error('[signup]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '아이디/비밀번호를 입력하세요' });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, nickname, password_hash FROM players WHERE username = $1`,
      [username],
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다' });
    }

    // 레코드가 없으면 초기화
    await pool.query(
      `INSERT INTO user_records (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [user.id],
    );

    res.json({ id: user.id, username: user.username, nickname: user.nickname });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
