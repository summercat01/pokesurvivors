import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) console.warn('[auth] JWT_SECRET 미설정 — .env.server에 추가하세요');

export function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  try {
    req.user = jwt.verify(header.slice(7), SECRET);
    next();
  } catch {
    return res.status(401).json({ error: '세션이 만료되었습니다. 다시 로그인해주세요.' });
  }
}

export function requireAdmin(req, res, next) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  try {
    const payload = jwt.verify(header.slice(7), SECRET);
    if (!payload.isAdmin) {
      return res.status(403).json({ error: '관리자 권한이 없습니다' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: '세션이 만료되었습니다. 다시 로그인해주세요.' });
  }
}

export function signToken(userId, username, isAdmin = false) {
  return jwt.sign({ userId, username, isAdmin }, SECRET, { expiresIn: '30d' });
}
