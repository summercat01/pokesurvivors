import express from 'express';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import leaderboardRouter from './routes/leaderboard.js';

dotenv.config({ path: new URL('../.env.server', import.meta.url).pathname });

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// ── Rate limiting ─────────────────────────────────────
// 로그인/가입: 1분에 10회
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

// 일반 API: 1분에 120회
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다.' },
});

// ── API 라우터 ────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/user', apiLimiter, userRouter);
app.use('/api/leaderboard', apiLimiter, leaderboardRouter);

// 정적 파일 서빙 (Vite 빌드 결과물)
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback — 모든 경로를 index.html로
app.get('/{*path}', (_req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[server] pokesurv running on port ${PORT}`);
});
