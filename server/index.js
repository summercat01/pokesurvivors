import express from 'express';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import leaderboardRouter from './routes/leaderboard.js';
import communityRouter from './routes/community.js';
import inquiryRouter from './routes/inquiry.js';
import adminRouter from './routes/admin.js';

dotenv.config({ path: new URL('../.env.server', import.meta.url).pathname });

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());
app.set('trust proxy', 1); // Cloudflare Tunnel / 리버스 프록시 신뢰

// ── Rate limiting ─────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다.' },
});

const communityLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

// ── API 라우터 ────────────────────────────────────────
app.use('/api/auth',      authLimiter,      authRouter);
app.use('/api/user',      apiLimiter,       userRouter);
app.use('/api/leaderboard', apiLimiter,     leaderboardRouter);
app.use('/api/community', communityLimiter, communityRouter);
app.use('/api/inquiry',   communityLimiter, inquiryRouter);
app.use('/api/admin',     apiLimiter,       adminRouter);

// ── 어드민 페이지 ─────────────────────────────────────
app.get('/admin', (_req, res) => {
  res.sendFile(join(__dirname, '../admin/index.html'));
});

// 정적 파일 서빙 (Vite 빌드 결과물)
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback — 모든 경로를 index.html로
app.get('/{*path}', (_req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`[server] pokesurv running on port ${PORT}`);
});
