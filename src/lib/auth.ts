import { api } from './api';

export interface PlayerSession {
  id:       string;
  username: string;
  nickname: string;
}

const SESSION_KEY = 'pkmn_session';

// ── 세션 (localStorage 기반) ───────────────────────
let _session: PlayerSession | null = null;

export function getCurrentUser(): PlayerSession | null {
  if (_session) return _session;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { _session = JSON.parse(raw); } catch { _session = null; }
  return _session;
}

export function getUsername(): string {
  return getCurrentUser()?.username ?? '';
}

export function getNickname(): string {
  return getCurrentUser()?.nickname ?? '';
}

function saveSession(user: PlayerSession) {
  _session = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

// ── 회원가입 ──────────────────────────────────────
export async function signUp(username: string, password: string, nickname: string): Promise<PlayerSession> {
  const user = await api.post<PlayerSession>('/auth/signup', { username, password, nickname });
  saveSession(user);
  return user;
}

// ── 로그인 ────────────────────────────────────────
export async function signIn(username: string, password: string): Promise<PlayerSession> {
  const user = await api.post<PlayerSession>('/auth/login', { username, password });
  saveSession(user);
  return user;
}

// ── 로그아웃 ──────────────────────────────────────
export function signOut() {
  _session = null;
  localStorage.removeItem(SESSION_KEY);
}
