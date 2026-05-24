import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/signup
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

    await pool.query(
      `INSERT INTO user_records (user_id, total_gold) VALUES ($1, 10000) ON CONFLICT DO NOTHING`,
      [user.id],
    );

    const token = signToken(user.id, user.username, false);
    res.json({ id: user.id, username: user.username, nickname: user.nickname, token });
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint && err.constraint.includes('nickname')) {
        return res.status(409).json({ error: 'users_nickname_unique' });
      }
      return res.status(409).json({ error: 'User already registered' });
    }
    console.error('[signup]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '아이디/비밀번호를 입력하세요' });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, nickname, password_hash, is_admin, banned_at FROM players WHERE username = $1`,
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

    if (user.banned_at) {
      return res.status(403).json({ error: '이용이 정지된 계정입니다. 운영자에게 문의하세요.' });
    }

    await pool.query(
      `INSERT INTO user_records (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [user.id],
    );

    const token = signToken(user.id, user.username, user.is_admin ?? false);
    res.json({ id: user.id, username: user.username, nickname: user.nickname, token });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
