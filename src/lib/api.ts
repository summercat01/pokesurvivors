/**
 * 자체 서버 API 래퍼
 * 개발 시 Vite 프록시(/api → localhost:3002) 통해 요청
 * 프로덕션 시 동일 오리진(/api) 요청
 */

const BASE = '/api';
export const TOKEN_KEY = 'pkmn_token';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });

  const data = await res.json();

  // 토큰 만료 시 세션 초기화
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('pkmn_session');
  }

  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),
};
