import express from 'express';
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

// API 라우터
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/leaderboard', leaderboardRouter);

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
