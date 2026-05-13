export type Lang = 'ko' | 'en';

const STORAGE_KEY = 'pokesurv_lang';

function detect(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'ko' || saved === 'en') return saved;
  return navigator.language.startsWith('ko') ? 'ko' : 'en';
}

let current: Lang = detect();

export function getLang(): Lang { return current; }

export function setLang(lang: Lang): void {
  current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
}

/** 현재 언어에 따라 한국어/영어 문자열 반환 */
export function t(ko: string, en: string): string {
  return current === 'ko' ? ko : en;
}
