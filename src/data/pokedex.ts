const KEY = 'pkmn_defeated_ids';

let _cache: Set<string> | null = null;

/** 처치한 포켓몬 ID Set 반환 (3자리 0-패딩 문자열, e.g. '025') */
export function getDefeatedIds(): Set<string> {
  if (_cache) return _cache;
  const raw = localStorage.getItem(KEY) ?? '';
  _cache = raw ? new Set(raw.split(',').filter(Boolean)) : new Set();
  return _cache;
}

/** 포켓몬 ID를 처치 기록에 추가 (이미 있으면 무시) */
export function recordDefeatedId(id: string): void {
  const set = getDefeatedIds();
  if (set.has(id)) return;
  set.add(id);
  localStorage.setItem(KEY, [...set].join(','));
}
